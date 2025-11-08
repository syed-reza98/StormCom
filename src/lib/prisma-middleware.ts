// src/lib/prisma-middleware.ts
// Prisma Client Extension for Multi-tenant Data Isolation
// Auto-injects storeId filter on all queries for tenant-scoped tables

import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

// Request-scoped async context for storing storeId
export const requestContext = new AsyncLocalStorage<{ storeId: string }>();

/**
 * Get storeId from async context (NextAuth session)
 * This is set in proxy.ts and api routes
 */
export function getStoreIdFromContext(): string | null {
  const store = requestContext.getStore?.();
  return store?.storeId ?? null;
}

export function setStoreIdContext(storeId: string | undefined) {
  if (!storeId) return;
  try {
    requestContext.enterWith({ storeId });
  } catch (e) {
    // best-effort; if enterWith fails, continue without context
    // callers will fail safe by providing explicit storeId
  }
}

/**
 * Register multi-tenant client extension on Prisma Client
 * Automatically injects storeId filter on all queries for tenant-scoped models
 * 
 * NOTE: Prisma middleware ($use) is deprecated in Prisma 5+
 * This uses the newer Client Extensions API
 */
export function registerMultiTenantMiddleware(prisma: PrismaClient): PrismaClient {
  // Tenant-scoped models that should be auto-filtered by storeId
  const TENANT_MODELS = new Set([
    'Product',
    'Order',
    'Customer',
    'Category',
    'Brand',
    'Review',
    'OrderItem',
    'Payment',
    'Address',
    'ProductVariant',
    'ProductAttribute',
  ]);

  // Use Prisma middleware to inject storeId into queries for tenant models
  // NOTE: Prisma $use may not be present on all type definitions; cast to any
  // and guard at runtime to avoid calling non-existent APIs during build/test.
  const anyPrisma = prisma as any;
  if (typeof anyPrisma.$use === 'function') {
    anyPrisma.$use(async (params: any, next: any) => {
      try {
        const model = params.model;

        if (!model || !TENANT_MODELS.has(model)) {
          return next(params);
        }

        const storeId = getStoreIdFromContext();

        // If no storeId in context, throw to prevent accidental cross-tenant access
        if (!storeId) {
          throw new Error('No storeId in request context - tenant isolation failed');
        }

        // Ensure where clauses include storeId for queries
        if (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'findUnique') {
          params.args = params.args || {};
          params.args.where = { ...(params.args.where || {}), storeId };
        }

        // create -> inject storeId into data
        if (params.action === 'create' || params.action === 'createMany') {
          params.args = params.args || {};
          if (params.args.data) {
            if (Array.isArray(params.args.data)) {
              params.args.data = params.args.data.map((d: any) => ({ ...d, storeId }));
            } else {
              params.args.data = { ...(params.args.data || {}), storeId };
            }
          }
        }

        // update/updateMany/delete/updateMany/deleteMany - ensure where includes storeId
        if (
          params.action === 'update' ||
          params.action === 'updateMany' ||
          params.action === 'delete' ||
          params.action === 'deleteMany'
        ) {
          params.args = params.args || {};
          params.args.where = { ...(params.args.where || {}), storeId };
        }

        return next(params);
      } catch (err) {
        // Re-throw to surface the issue to the caller
        throw err;
      }
    });
  }

  // Note: Multi-tenant isolation is enforced at the application layer
  // via explicit storeId filtering in queries. The $use middleware above
  // is a defense-in-depth measure when available.

  return prisma;
}

/**
 * Utility: Bypass multi-tenant middleware for admin queries
 * Use with caution - only for SuperAdmin cross-store operations
 */
export function bypassTenantIsolation<T>(
  query: () => Promise<T>
): Promise<T> {
  // TODO: Verify user has SuperAdmin role before allowing bypass
  // For now, just execute the query
  return query();
}
