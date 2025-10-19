import { authConfig } from './auth';
import { setTenantContext } from './middleware/tenantIsolation';

/**
 * Request context helper
 * Extracts user and store information from session
 * Sets tenant context for multi-tenant isolation
 */

export interface RequestContext {
  user?: {
    id: string;
    email: string;
    name?: string | null;
    role: string;
  };
  storeId?: string;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
}

/**
 * Get request context from session
 * Use this in API routes and server components
 * 
 * Note: This is a simplified version for Phase 2 core
 * Full NextAuth integration will be completed in production
 */
export async function getRequestContext(): Promise<RequestContext> {
  // TODO: Implement proper session handling with NextAuth in production
  // For now, return unauthenticated context
  return {
    isAuthenticated: false,
    isSuperAdmin: false,
  };
}

/**
 * Require authentication
 * Throws error if user is not authenticated
 */
export async function requireAuth(): Promise<RequestContext> {
  const context = await getRequestContext();

  if (!context.isAuthenticated) {
    throw new Error('Unauthorized: Authentication required');
  }

  return context;
}

/**
 * Require specific role
 * Throws error if user doesn't have the required role
 */
export async function requireRole(role: string | string[]): Promise<RequestContext> {
  const context = await requireAuth();

  const roles = Array.isArray(role) ? role : [role];

  if (!roles.includes(context.user!.role)) {
    throw new Error(`Unauthorized: Required role ${roles.join(' or ')}`);
  }

  return context;
}

/**
 * Require store context
 * Throws error if user doesn't have an active store
 */
export async function requireStore(): Promise<RequestContext> {
  const context = await requireAuth();

  if (!context.storeId) {
    throw new Error('Unauthorized: Store context required');
  }

  return context;
}

/**
 * Require super admin
 * Throws error if user is not a super admin
 */
export async function requireSuperAdmin(): Promise<RequestContext> {
  const context = await requireAuth();

  if (!context.isSuperAdmin) {
    throw new Error('Unauthorized: Super admin access required');
  }

  return context;
}
