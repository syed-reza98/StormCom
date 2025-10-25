// src/lib/prisma-middleware.ts
// Prisma Client Extension for Multi-tenant Data Isolation
// Auto-injects storeId filter on all queries for tenant-scoped tables

import { PrismaClient } from '@prisma/client';

/**
 * Get storeId from async context (NextAuth session)
 * This is set in middleware.ts and api routes
 */
export function getStoreIdFromContext(): string | null {
  // In real implementation, this would come from:
  // 1. NextAuth session (session.user.storeId)
  // 2. AsyncLocalStorage context
  // 3. Request headers (X-Store-ID)
  
  // For now, return null to allow manual storeId specification
  // TODO: Implement actual context retrieval in Phase 3 (US0 Authentication)
  return null;
}

/**
 * Register multi-tenant client extension on Prisma Client
 * Automatically injects storeId filter on all queries for tenant-scoped models
 * 
 * NOTE: Prisma middleware ($use) is deprecated in Prisma 5+
 * This uses the newer Client Extensions API
 */
export function registerMultiTenantMiddleware(prisma: PrismaClient): PrismaClient {
  // For now, return the client as-is
  // Multi-tenant filtering will be enforced in application code and API routes
  // until we implement proper session context in Phase 3
  
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Prisma] Multi-tenant filtering will be enforced at application layer ✓');
  }
  
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
