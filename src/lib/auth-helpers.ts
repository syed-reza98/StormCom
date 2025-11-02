/**
 * Authentication Helper Functions
 */

import { SessionData } from '@/types';

/**
 * Verify user has required permissions
 */
export function checkPermissions(session: SessionData, requiredRole: string): boolean {
  // Basic role hierarchy
  const roles = ['USER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'];
  const userRoleIndex = roles.indexOf(session.role);
  const requiredRoleIndex = roles.indexOf(requiredRole);
  return userRoleIndex >= requiredRoleIndex;
}

/**
 * Validate session is not expired
 */
export function isSessionValid(session: SessionData): boolean {
  return Date.now() < session.expiresAt;
}

/**
 * Get user ID from session
 */
export function getUserIdFromSession(session: SessionData): string {
  return session.userId;
}

/**
 * Get store ID from session
 */
export function getStoreIdFromSession(session: SessionData): string | null {
  return session.storeId;
}

/**
 * Obtain a session from an incoming request.
 * This is a small helper used in tests and simple server-side handlers.
 * In production this should be implemented with NextAuth/getServerSession.
 */
export async function getSessionFromRequest(req: Request | { headers?: Record<string, string> } ): Promise<SessionData | null> {
  // Minimal implementation: try to read an authorization header with a serialized session
  try {
    const headers = (req as any).headers || {};
    const auth = headers['authorization'] || headers['Authorization'];
    if (!auth) return null;
    // Expecting 'Bearer <base64-json>' for tests; decode when present
    const parts = (auth as string).split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      try {
        const parsed = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8')) as SessionData;
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  } catch {
    return null;
  }
}
