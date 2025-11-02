// src/lib/get-current-user.ts
// Server-side helper to get current authenticated user from session cookie
// Used in Server Components and API routes

import { cookies } from 'next/headers';
import { SessionService } from '@/services/session-service';
import { db } from '@/lib/db';

/**
 * Get current authenticated user from session cookie
 * Use this in Server Components instead of getServerSession
 * 
 * @returns User data with session info or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    // Get session token from cookie (must match login API cookie name: 'session-id')
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-id')?.value;

    if (!sessionToken) {
      return null;
    }

    // Validate session
    const session = await SessionService.getSession(sessionToken);

    if (!session) {
      return null;
    }

    // Fetch user data (excluding sensitive fields)
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        storeId: true,
        mfaEnabled: true,
        mfaMethod: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return null;
    }

    // Return user with session data
    return {
      ...user,
      sessionData: {
        mfaVerified: session.mfaVerified,
      },
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Get current user's storeId from session
 * Convenience helper for multi-tenant operations
 * 
 * @returns storeId or null if not authenticated or no store
 */
export async function getCurrentStoreId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.storeId || null;
}

/**
 * Require authentication - throws error if not authenticated
 * Use this when you want to enforce authentication in Server Components
 * 
 * @throws Error if not authenticated
 * @returns Authenticated user
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('UNAUTHORIZED: Authentication required');
  }
  
  return user;
}

/**
 * Require specific role - throws error if user doesn't have role
 * 
 * @param allowedRoles Array of allowed roles
 * @throws Error if not authenticated or insufficient permissions
 * @returns Authenticated user with required role
 */
export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`FORBIDDEN: Required role: ${allowedRoles.join(' or ')}`);
  }
  
  return user;
}
