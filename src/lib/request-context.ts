/**
 * Request Context Helper
 * 
 * Extracts user session, store context, and permissions from JWT tokens.
 * Uses AsyncLocalStorage for request-scoped context management.
 * 
 * @module lib/request-context
 */

import { AsyncLocalStorage } from 'async_hooks';
import type { UserClaims, RBACContext, StorePermissions } from '../types';

// TODO: Import proper NextAuth v5 session helper when available
// For now, this provides the interface for request context management

// ============================================================================
// AsyncLocalStorage for Request-Scoped Context
// ============================================================================

/**
 * AsyncLocalStorage instance for storing request-scoped data.
 * Used by multi-tenant middleware to auto-inject storeId in Prisma queries.
 */
export const requestContextStorage = new AsyncLocalStorage<{
  storeId?: string;
  userId?: string;
  isSuperAdmin?: boolean;
}>();

/**
 * Get the current request context from AsyncLocalStorage.
 */
export function getStoredContext() {
  return requestContextStorage.getStore();
}

/**
 * Set request context in AsyncLocalStorage.
 * Called by API wrapper before processing requests.
 */
export function setRequestContext(context: {
  storeId?: string;
  userId?: string;
  isSuperAdmin?: boolean;
}) {
  return requestContextStorage.run(context, () => {
    // Context is now available for the duration of this request
  });
}

// ============================================================================
// JWT Claims Extraction
// ============================================================================

/**
 * Extract user claims from NextAuth session token.
 * 
 * @param _req - Request object (optional, uses session helper if not provided)
 * @returns User claims from JWT or null if not authenticated
 */
export async function extractUserClaims(_req?: Request): Promise<UserClaims | null> {
  // TODO: Integrate with NextAuth v5 session retrieval
  // For now, returns null - will be implemented when auth routes are set up
  return null;
}

// ============================================================================
// Request Context API
// ============================================================================

/**
 * Get full request context (user + store + permissions).
 * 
 * @param req - Request object
 * @returns Request context with user, store, and admin status
 * 
 * @example
 * ```typescript
 * const context = await getRequestContext(req);
 * if (!context.store) {
 *   return errorResponse('Store context required', 403);
 * }
 * // Use context.store.id, context.user.id, etc.
 * ```
 */
export async function getRequestContext(req?: Request): Promise<RBACContext> {
  const claims = await extractUserClaims(req);

  if (!claims) {
    return {
      user: {
        id: '',
        email: '',
        name: '',
      },
      store: null,
      isSuperAdmin: false,
    };
  }

  // Check if user is super admin
  const isSuperAdmin = claims.permissions?.includes('*') || false;

  // Extract store context
  const store: StorePermissions | null = claims.storeId
    ? {
        storeId: claims.storeId,
        role: claims.role || 'VIEWER',
        permissions: claims.permissions || [],
      }
    : null;

  return {
    user: {
      id: claims.sub,
      email: claims.email,
      name: claims.name,
    },
    store,
    isSuperAdmin,
  };
}

/**
 * Get current authenticated user (throws if not authenticated).
 * 
 * @param req - Request object
 * @returns User object
 * @throws {Error} If user is not authenticated
 * 
 * @example
 * ```typescript
 * const user = await requireUser(req);
 * console.log(user.id, user.email);
 * ```
 */
export async function requireUser(req?: Request): Promise<{
  id: string;
  email: string;
  name: string;
}> {
  const context = await getRequestContext(req);

  if (!context.user.id) {
    throw new Error('Authentication required');
  }

  return context.user;
}

/**
 * Get current store context (throws if no store context).
 * 
 * @param req - Request object
 * @returns Store permissions object
 * @throws {Error} If no store context is available
 * 
 * @example
 * ```typescript
 * const store = await requireStore(req);
 * console.log(store.storeId, store.role, store.permissions);
 * ```
 */
export async function requireStore(req?: Request): Promise<StorePermissions> {
  const context = await getRequestContext(req);

  if (!context.store) {
    throw new Error('Store context required');
  }

  return context.store;
}

/**
 * Check if current user is a super admin.
 * 
 * @param req - Request object
 * @returns True if user is super admin
 * 
 * @example
 * ```typescript
 * if (await isSuperAdmin(req)) {
 *   // Allow access to all stores
 * }
 * ```
 */
export async function isSuperAdmin(req?: Request): Promise<boolean> {
  const context = await getRequestContext(req);
  return context.isSuperAdmin;
}

/**
 * Get user permissions for the current store.
 * 
 * @param req - Request object
 * @returns Array of permission strings
 * 
 * @example
 * ```typescript
 * const permissions = await getPermissions(req);
 * if (permissions.includes('products.create')) {
 *   // User can create products
 * }
 * ```
 */
export async function getPermissions(req?: Request): Promise<string[]> {
  const context = await getRequestContext(req);

  if (context.isSuperAdmin) {
    return ['*']; // Super admin has all permissions
  }

  return context.store?.permissions || [];
}

/**
 * Get current store ID from context (for Prisma queries).
 * 
 * @param req - Request object
 * @returns Store ID or null if no store context
 * 
 * @example
 * ```typescript
 * const storeId = await getStoreId(req);
 * const products = await prisma.product.findMany({
 *   where: { storeId },
 * });
 * ```
 */
export async function getStoreId(req?: Request): Promise<string | null> {
  const context = await getRequestContext(req);
  return context.store?.storeId || null;
}

/**
 * Get current user ID from context.
 * 
 * @param req - Request object
 * @returns User ID or null if not authenticated
 * 
 * @example
 * ```typescript
 * const userId = await getUserId(req);
 * const profile = await prisma.user.findUnique({
 *   where: { id: userId },
 * });
 * ```
 */
export async function getUserId(req?: Request): Promise<string | null> {
  const context = await getRequestContext(req);
  return context.user.id || null;
}

// ============================================================================
// Helper for Multi-Tenant Middleware
// ============================================================================

/**
 * Initialize request context for multi-tenant middleware.
 * Stores storeId in AsyncLocalStorage for automatic injection in Prisma queries.
 * 
 * @param req - Request object
 * @returns Context object to store in AsyncLocalStorage
 */
export async function initializeRequestContext(req?: Request): Promise<{
  storeId?: string;
  userId?: string;
  isSuperAdmin?: boolean;
}> {
  const context = await getRequestContext(req);

  return {
    storeId: context.store?.storeId,
    userId: context.user.id || undefined,
    isSuperAdmin: context.isSuperAdmin,
  };
}
