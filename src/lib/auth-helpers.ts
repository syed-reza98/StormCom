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
