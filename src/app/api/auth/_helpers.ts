/**
 * Authentication Helper Functions
 * 
 * Provides utility functions for authentication operations
 * to be used across API routes and server components.
 * 
 * @module auth/_helpers
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import * as bcrypt from 'bcrypt';
import { AppError } from '@/lib/errors';

/**
 * Get the current authenticated session
 * 
 * @returns Session object or null if not authenticated
 * 
 * @example
 * const session = await getSession();
 * if (!session) {
 *   throw new AppError('UNAUTHORIZED', 'Not authenticated');
 * }
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Require authentication - throws error if not authenticated
 * 
 * @returns Session object
 * @throws {AppError} UNAUTHORIZED if not authenticated
 * 
 * @example
 * const session = await requireAuth();
 * const userId = session.user.id;
 */
export async function requireAuth() {
  const session = await getSession();
  
  if (!session || !session.user) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }
  
  return session;
}

/**
 * Require specific permission
 * 
 * @param permission - Permission slug (e.g., 'products.create')
 * @returns Session object
 * @throws {AppError} UNAUTHORIZED or FORBIDDEN if no permission
 * 
 * @example
 * const session = await requirePermission('products.create');
 */
export async function requirePermission(permission: string) {
  const session = await requireAuth();
  
  // Get active store from session
  const activeStoreId = session.user.activeStoreId;
  if (!activeStoreId) {
    throw new AppError('No active store selected', 403, 'FORBIDDEN');
  }
  
  // Find user's role for active store
  const activeStore = session.user.stores?.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any) => s.storeId === activeStoreId
  );
  
  if (!activeStore) {
    throw new AppError('No access to active store', 403, 'FORBIDDEN');
  }
  
  // Check if permission exists in role
  const permissions = activeStore.permissions as Record<string, boolean>;
  
  if (!permissions[permission]) {
    throw new AppError(
      `Missing required permission: ${permission}`,
      403,
      'FORBIDDEN'
    );
  }
  
  return session;
}

/**
 * Require super admin role
 * 
 * @returns Session object
 * @throws {AppError} FORBIDDEN if not super admin
 * 
 * @example
 * const session = await requireSuperAdmin();
 */
export async function requireSuperAdmin() {
  const session = await requireAuth();
  
  // Check if user has at least one super admin role
  const isSuperAdmin = session.user.stores?.some(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s: any) => s.roleName === 'Super Admin'
  );
  
  if (!isSuperAdmin) {
    throw new AppError('Super admin access required', 403, 'FORBIDDEN');
  }
  
  return session;
}

/**
 * Validate user password
 * 
 * @param userId - User ID
 * @param password - Plain text password to validate
 * @returns True if password is valid
 * 
 * @example
 * const isValid = await validatePassword(userId, 'password123');
 * if (!isValid) {
 *   throw new AppError('UNAUTHORIZED', 'Invalid password');
 * }
 */
export async function validatePassword(
  userId: string,
  password: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  
  if (!user || !user.password) {
    return false;
  }
  
  return await bcrypt.compare(password, user.password);
}

/**
 * Hash a password using bcrypt
 * 
 * @param password - Plain text password
 * @returns Hashed password
 * 
 * @example
 * const hashedPassword = await hashPassword('password123');
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // bcrypt cost factor (as per constitution)
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Check password against history to prevent reuse
 * 
 * @param userId - User ID
 * @param newPassword - New password to check
 * @param historyCount - Number of previous passwords to check (default: 5)
 * @returns True if password was used before
 * 
 * @example
 * const isReused = await isPasswordReused(userId, 'newPassword123');
 * if (isReused) {
 *   throw new AppError('VALIDATION_ERROR', 'Cannot reuse previous passwords');
 * }
 */
export async function isPasswordReused(
  userId: string,
  newPassword: string,
  historyCount: number = 5
): Promise<boolean> {
  const history = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: historyCount,
    select: { passwordHash: true },
  });
  
  for (const record of history) {
    const matches = await bcrypt.compare(newPassword, record.passwordHash);
    if (matches) {
      return true;
    }
  }
  
  return false;
}

/**
 * Add password to history
 * 
 * @param userId - User ID
 * @param hashedPassword - Hashed password to store
 * 
 * @example
 * await addPasswordToHistory(userId, hashedPassword);
 */
export async function addPasswordToHistory(
  userId: string,
  hashedPassword: string
): Promise<void> {
  await prisma.passwordHistory.create({
    data: {
      userId,
      passwordHash: hashedPassword,
    },
  });
  
  // Keep only last 5 passwords in history
  const history = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  
  if (history.length > 5) {
    const idsToDelete = history.slice(5).map((h) => h.id);
    await prisma.passwordHistory.deleteMany({
      where: { id: { in: idsToDelete } },
    });
  }
}

/**
 * Update user's last login timestamp and IP
 * 
 * @param userId - User ID
 * @param ipAddress - User's IP address (optional)
 * 
 * @example
 * await updateLastLogin(userId, req.headers['x-forwarded-for']);
 */
export async function updateLastLogin(
  userId: string,
  ipAddress?: string
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date(),
      ...(ipAddress && { lastLoginIp: ipAddress }),
    },
  });
}

/**
 * Invalidate all user sessions (force logout)
 * 
 * @param userId - User ID
 * 
 * @example
 * await invalidateUserSessions(userId);
 */
export async function invalidateUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

/**
 * Check if user account is active
 * 
 * @param userId - User ID
 * @returns True if account is active
 * 
 * @example
 * const isActive = await isUserActive(userId);
 * if (!isActive) {
 *   throw new AppError('FORBIDDEN', 'Account is not active');
 * }
 */
export async function isUserActive(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true },
  });
  
  return user?.status === 'ACTIVE';
}

/**
 * Get user's accessible stores
 * 
 * @param userId - User ID
 * @returns Array of stores the user has access to
 * 
 * @example
 * const stores = await getUserStores(userId);
 */
export async function getUserStores(userId: string) {
  return await prisma.userStore.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
        },
      },
      role: {
        select: {
          id: true,
          name: true,
          slug: true,
          permissions: true,
        },
      },
    },
  });
}

/**
 * Switch user's active store
 * 
 * @param userId - User ID
 * @param storeId - New active store ID
 * @throws {AppError} FORBIDDEN if user doesn't have access to store
 * 
 * @example
 * await switchActiveStore(userId, 'store_123');
 */
export async function switchActiveStore(
  userId: string,
  storeId: string
): Promise<void> {
  // Verify user has access to this store
  const userStore = await prisma.userStore.findUnique({
    where: {
      userId_storeId: { userId, storeId },
      isActive: true,
    },
  });
  
  if (!userStore) {
    throw new AppError('No access to this store', 403, 'FORBIDDEN');
  }
  
  // Update user's active store (stored in JWT token, requires re-login)
  // For immediate effect, would need to update JWT token manually
  // This is typically handled by re-authenticating
}

/**
 * Log authentication attempt for audit trail
 * 
 * @param params - Audit log parameters
 * 
 * @example
 * await logAuthAttempt({
 *   userId: 'user_123',
 *   action: 'LOGIN_SUCCESS',
 *   ipAddress: req.headers['x-forwarded-for'],
 *   userAgent: req.headers['user-agent'],
 * });
 */
export async function logAuthAttempt(params: {
  userId?: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
  storeId: string;
  actorEmail: string;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      actorEmail: params.actorEmail,
      action: params.action,
      entityType: 'User',
      entityId: params.userId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      storeId: params.storeId,
    },
  });
}
