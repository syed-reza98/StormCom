/**
 * Multi-tenant middleware for Prisma
 * Provides tenant context management for query filtering
 * 
 * Note: Manual filtering approach for Prisma Client v6+
 * Apply storeId filters explicitly in API routes using getTenantContext()
 */

export interface TenantContext {
  storeId?: string;
}

let currentTenantContext: TenantContext = {};

/**
 * Set the current tenant context for the request
 * This should be called early in the request lifecycle
 */
export function setTenantContext(context: TenantContext) {
  currentTenantContext = context;
}

/**
 * Clear the tenant context (call at end of request)
 */
export function clearTenantContext() {
  currentTenantContext = {};
}

/**
 * Get the current tenant context
 */
export function getTenantContext(): TenantContext {
  return currentTenantContext;
}

/**
 * Helper: Get where clause with tenant isolation
 * Use this to ensure all queries include storeId filter
 */
export function withTenantFilter<T extends Record<string, any>>(where: T = {} as T): T {
  const { storeId } = currentTenantContext;

  if (storeId && !where.storeId) {
    return { ...where, storeId } as T;
  }

  return where;
}

/**
 * Helper: Get where clause with soft delete filter
 * Excludes soft-deleted records (deletedAt IS NULL)
 */
export function withoutDeleted<T extends Record<string, any>>(where: T = {} as T): T {
  if (!('deletedAt' in where)) {
    return { ...where, deletedAt: null } as T;
  }

  return where;
}

/**
 * Helper: Combined tenant and soft delete filters
 * Use this for most queries to ensure proper isolation
 */
export function withTenantAndNotDeleted<T extends Record<string, any>>(where: T = {} as T): T {
  return withTenantFilter(withoutDeleted(where));
}

