// src/lib/session-storage.ts
// Session Storage Layer for StormCom
// Uses Vercel KV (Upstash Redis) for production, in-memory Map for development

import { kv } from '@vercel/kv';

/**
 * Session data structure
 */
export interface SessionData {
  userId: string;
  email: string;
  role: string;
  storeId: string | null;
  createdAt: number;
  lastAccessedAt: number;
  expiresAt: number;
  mfaVerified?: boolean;
}

/**
 * In-memory session store for development
 */
const devSessionStore = new Map<string, SessionData>();

/**
 * Session configuration
 */
const SESSION_CONFIG = {
  maxAge: 12 * 60 * 60, // 12 hours
  idleTimeout: 7 * 24 * 60 * 60, // 7 days idle timeout
  prefix: 'session:', // Redis key prefix
};

/**
 * Check if Vercel KV is available (production)
 */
function isKVAvailable(): boolean {
  return !!(
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN
  );
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  if (isKVAvailable()) {
    // Production: Use Vercel KV
    try {
      const data = await kv.get<SessionData>(`${SESSION_CONFIG.prefix}${sessionId}`);
      
      if (!data) return null;

      // Check if session is expired
      if (data.expiresAt < Date.now()) {
        await deleteSession(sessionId);
        return null;
      }

      // Update last accessed time
      data.lastAccessedAt = Date.now();
      await kv.set(`${SESSION_CONFIG.prefix}${sessionId}`, data, {
        ex: SESSION_CONFIG.maxAge,
      });

      return data;
    } catch (error) {
      console.error('[Session] Failed to get session from KV:', error);
      return null;
    }
  } else {
    // Development: Use in-memory Map
    const session = devSessionStore.get(sessionId);
    
    if (!session) return null;

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      devSessionStore.delete(sessionId);
      return null;
    }

    // Update last accessed time
    session.lastAccessedAt = Date.now();
    return session;
  }
}

/**
 * Create or update a session
 */
export async function setSession(
  sessionId: string,
  data: Omit<SessionData, 'createdAt' | 'lastAccessedAt' | 'expiresAt'>
): Promise<void> {
  const now = Date.now();
  const sessionData: SessionData = {
    ...data,
    createdAt: now,
    lastAccessedAt: now,
    expiresAt: now + SESSION_CONFIG.maxAge * 1000,
  };

  if (isKVAvailable()) {
    // Production: Use Vercel KV
    try {
      await kv.set(`${SESSION_CONFIG.prefix}${sessionId}`, sessionData, {
        ex: SESSION_CONFIG.maxAge,
      });
    } catch (error) {
      console.error('[Session] Failed to set session in KV:', error);
      throw error;
    }
  } else {
    // Development: Use in-memory Map
    devSessionStore.set(sessionId, sessionData);
  }
}

/**
 * Update existing session (extends expiration)
 */
export async function updateSession(
  sessionId: string,
  updates: Partial<Omit<SessionData, 'userId' | 'createdAt'>>
): Promise<void> {
  const existingSession = await getSession(sessionId);
  
  if (!existingSession) {
    throw new Error('Session not found');
  }

  const now = Date.now();
  const updatedSession: SessionData = {
    ...existingSession,
    ...updates,
    lastAccessedAt: now,
    expiresAt: now + SESSION_CONFIG.maxAge * 1000,
  };

  if (isKVAvailable()) {
    // Production: Use Vercel KV
    try {
      await kv.set(`${SESSION_CONFIG.prefix}${sessionId}`, updatedSession, {
        ex: SESSION_CONFIG.maxAge,
      });
    } catch (error) {
      console.error('[Session] Failed to update session in KV:', error);
      throw error;
    }
  } else {
    // Development: Use in-memory Map
    devSessionStore.set(sessionId, updatedSession);
  }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  if (isKVAvailable()) {
    // Production: Use Vercel KV
    try {
      await kv.del(`${SESSION_CONFIG.prefix}${sessionId}`);
    } catch (error) {
      console.error('[Session] Failed to delete session from KV:', error);
      throw error;
    }
  } else {
    // Development: Use in-memory Map
    devSessionStore.delete(sessionId);
  }
}

/**
 * Delete all sessions for a user
 */
export async function deleteUserSessions(userId: string): Promise<void> {
  if (isKVAvailable()) {
    // Production: Use Vercel KV pattern scan
    try {
      const keys = await kv.keys(`${SESSION_CONFIG.prefix}*`);
      
      for (const key of keys) {
        const session = await kv.get<SessionData>(key);
        if (session?.userId === userId) {
          await kv.del(key);
        }
      }
    } catch (error) {
      console.error('[Session] Failed to delete user sessions from KV:', error);
      throw error;
    }
  } else {
    // Development: Use in-memory Map
    for (const [sessionId, session] of devSessionStore.entries()) {
      if (session.userId === userId) {
        devSessionStore.delete(sessionId);
      }
    }
  }
}

/**
 * Clean up expired sessions (run periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  let cleanedCount = 0;

  if (isKVAvailable()) {
    // Production: Vercel KV handles expiration automatically via TTL
    // No manual cleanup needed
    return 0;
  } else {
    // Development: Manual cleanup for in-memory Map
    const now = Date.now();
    
    for (const [sessionId, session] of devSessionStore.entries()) {
      if (session.expiresAt < now) {
        devSessionStore.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.warn(`[Session] Cleaned up ${cleanedCount} expired sessions`);
    }

    return cleanedCount;
  }
}

/**
 * Get all active sessions for a user (admin/debug only)
 */
export async function getUserSessions(userId: string): Promise<SessionData[]> {
  const sessions: SessionData[] = [];

  if (isKVAvailable()) {
    // Production: Use Vercel KV pattern scan
    try {
      const keys = await kv.keys(`${SESSION_CONFIG.prefix}*`);
      
      for (const key of keys) {
        const session = await kv.get<SessionData>(key);
        if (session?.userId === userId && session.expiresAt > Date.now()) {
          sessions.push(session);
        }
      }
    } catch (error) {
      console.error('[Session] Failed to get user sessions from KV:', error);
      throw error;
    }
  } else {
    // Development: Use in-memory Map
    const now = Date.now();
    
    for (const [_, session] of devSessionStore.entries()) {
      if (session.userId === userId && session.expiresAt > now) {
        sessions.push(session);
      }
    }
  }

  return sessions;
}

/**
 * Export session configuration for use in middleware
 */
export { SESSION_CONFIG };
