// src/services/session-service.ts
// Session Management Service: Create, Validate, Refresh, Revoke
// Implements FR-043 to FR-045 from spec.md

import {
  setSession as setSessionStorage,
  getSession as getSessionStorage,
  updateSession as updateSessionStorage,
  deleteSession as deleteSessionStorage,
  deleteUserSessions,
  type SessionData,
} from '@/lib/session-storage';
import { db } from '@/lib/db';
import { createAuditLog, AuditAction, AuditResource } from '@/lib/audit';
import crypto from 'crypto';

/**
 * Session configuration
 * - 12-hour maximum session age
 * - 7-day idle timeout
 * - Auto-refresh on activity
 */
const SESSION_CONFIG = {
  maxAge: 12 * 60 * 60 * 1000, // 12 hours in ms
  idleTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  refreshThreshold: 30 * 60 * 1000, // Refresh if < 30 minutes remaining
} as const;

/**
 * Create new session for user
 * Implements FR-043 (Session Creation)
 */
export async function createSession(data: {
  userId: string;
  email: string;
  role: string;
  storeId: string | null;
  mfaVerified: boolean;
  ipAddress?: string;
  userAgent?: string;
}): Promise<string> {
  // Verify user exists
  const user = await db.user.findUnique({
    where: { id: data.userId },
    select: { id: true },
  });

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  // Generate session ID
  const sessionId = crypto.randomBytes(32).toString('hex');

  // Create session in storage
  await setSessionStorage(sessionId, {
    userId: data.userId,
    email: data.email,
    role: data.role,
    storeId: data.storeId,
    mfaVerified: data.mfaVerified,
  });

  // Audit log
  await createAuditLog({
    userId: data.userId,
    action: AuditAction.LOGIN,
    resource: AuditResource.USER,
    resourceId: data.userId,
    metadata: { 
      email: data.email, 
      role: data.role,
      mfaVerified: data.mfaVerified,
    },
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  });

  return sessionId;
}

/**
 * Get and validate session
 * Implements FR-044 (Session Validation)
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  if (!sessionId) {
    return null;
  }

  // Get session from storage
  const session = await getSessionStorage(sessionId);

  if (!session) {
    return null;
  }

  // Verify user still exists
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, storeId: true },
  });

  if (!user) {
    // Session invalid - delete it
    await deleteSessionStorage(sessionId);
    return null;
  }

  // Check if user role/storeId changed (invalidate session if changed)
  if (user.role !== session.role || user.storeId !== session.storeId) {
    await deleteSessionStorage(sessionId);
    
    // Audit log - use generic LOGIN action for invalidation
    await createAuditLog({
      userId: session.userId,
      action: AuditAction.LOGOUT,
      resource: AuditResource.USER,
      resourceId: sessionId,
      metadata: { reason: 'role_or_store_changed' },
    });
    
    return null;
  }

  return session;
}

/**
 * Validate and refresh session
 * Implements FR-045 (Session Refresh)
 */
export async function validateAndRefreshSession(
  sessionId: string
): Promise<SessionData | null> {
  const session = await getSession(sessionId);

  if (!session) {
    return null;
  }

  // Check if session needs refresh
  const now = Date.now();
  const timeRemaining = session.expiresAt - now;

  if (timeRemaining < SESSION_CONFIG.refreshThreshold) {
    // Extend session by updating expiresAt
    await updateSessionStorage(sessionId, {
      expiresAt: now + SESSION_CONFIG.maxAge,
    });
    
    // Get updated session
    const extended = await getSessionStorage(sessionId);
    
    if (extended) {
      // Audit log - use generic LOGIN action for refresh
      await createAuditLog({
        userId: session.userId,
        action: AuditAction.LOGIN,
        resource: AuditResource.USER,
        resourceId: sessionId,
        metadata: { email: session.email, action: 'session_refreshed' },
      });
      
      return extended;
    }
  }

  return session;
}

/**
 * Delete session (logout)
 * Implements FR-037 (Logout)
 */
export async function deleteSession(
  sessionId: string,
  userId: string,
  ipAddress?: string
): Promise<void> {
  await deleteSessionStorage(sessionId);

  // Audit log
  await createAuditLog({
    userId,
    action: AuditAction.LOGOUT,
    resource: AuditResource.USER,
    resourceId: sessionId,
    metadata: {},
    ipAddress,
  });
}

/**
 * Delete all sessions for user
 * Implements FR-059B (Logout All Sessions)
 */
export async function deleteAllSessions(
  userId: string,
  ipAddress?: string
): Promise<{ deletedCount: number }> {
  await deleteUserSessions(userId);

  // Audit log - use generic LOGOUT action
  await createAuditLog({
    userId,
    action: AuditAction.LOGOUT,
    resource: AuditResource.USER,
    resourceId: userId,
    metadata: { action: 'all_sessions_deleted' },
    ipAddress,
  });

  // Return count as 0 since deleteUserSessions returns void
  return { deletedCount: 0 };
}

/**
 * Check if session is valid
 */
export async function isSessionValid(sessionId: string): Promise<boolean> {
  const session = await getSession(sessionId);
  return session !== null;
}

/**
 * Get user from session
 */
export async function getUserFromSession(sessionId: string): Promise<{
  id: string;
  email: string;
  role: string;
  storeId: string | null;
  mfaVerified?: boolean;
} | null> {
  const session = await getSession(sessionId);

  if (!session) {
    return null;
  }

  return {
    id: session.userId,
    email: session.email,
    role: session.role,
    storeId: session.storeId,
    mfaVerified: session.mfaVerified,
  };
}

/**
 * Update MFA verification status in session
 */
export async function updateMFAStatus(
  sessionId: string,
  mfaVerified: boolean
): Promise<boolean> {
  const session = await getSessionStorage(sessionId);

  if (!session) {
    return false;
  }

  // Update session with new MFA status
  const sessionId2 = crypto.randomBytes(32).toString('hex');
  await setSessionStorage(sessionId2, {
    ...session,
    mfaVerified,
  });

  // Delete old session
  await deleteSessionStorage(sessionId);

  // Audit log
  await createAuditLog({
    userId: session.userId,
    action: AuditAction.MFA_VERIFIED,
    resource: AuditResource.USER,
    resourceId: sessionId2,
    metadata: { mfaVerified },
  });

  return true;
}
