import { Prisma } from '@prisma/client';
import { getStoredContext } from '../request-context';

/**
 * Models that are scoped to a specific store (tenant).
 * All queries on these models will automatically include the storeId filter.
 * 
 * These are models that have a direct storeId field in the schema.
 */
const TENANT_SCOPED_MODELS = new Set([
  'StoreSubscription',
  'Product',
  'Category',
  'Brand',
  'Attribute',
  'Customer',
  'Cart',
  'Order',
  'Coupon',
  'FlashSale',
  'NewsletterCampaign',
  'TaxRate',
  'TaxExemption',
  'Page',
  'Blog',
  'ExternalPlatformIntegration',
  'AuditLog',
  'ShippingZone',
  'PaymentGatewayConfig',
  'PosSession',
]);

/**
 * Models that are global (not scoped to a store).
 * These models are shared across all tenants or don't require tenant isolation.
 */
const GLOBAL_MODELS = new Set([
  'SubscriptionPlan',
  'Store',
  'User',
  'PasswordHistory',
  'UserStore',
  'Role',
  'Account',
  'Session',
  'VerificationToken',
  'Variant',
  'ProductCategory',
  'ProductAttribute',
  'Media',
  'ProductLabel',
  'InventoryAdjustment',
  'Address',
  'Wishlist',
  'OrderItem',
  'Payment',
  'ShippingRate',
  'Shipment',
  'Refund',
  'SyncQueue',
  'ProductReview',
]);

/**
 * Prisma query extension for multi-tenant isolation.
 * 
 * This extension automatically injects storeId filters into all queries
 * for tenant-scoped models, ensuring complete data isolation between stores.
 * 
 * Features:
 * - Auto-inject storeId in WHERE clauses for all read operations
 * - Auto-inject storeId in data for all write operations
 * - Skip global models (User, SubscriptionPlan, etc.)
 * - Bypass for super admin users
 * - Support for all Prisma operations (find, create, update, delete, etc.)
 * 
 * @see FR-095: Multi-tenant data isolation
 * @see NFR-002: Security - Tenant isolation at ORM level
 */
export const tenantIsolationExtension = Prisma.defineExtension({
  name: 'tenantIsolation',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }: any) {
        // Skip global models
        if (GLOBAL_MODELS.has(model)) {
          return query(args);
        }

        // Only apply to tenant-scoped models
        if (!TENANT_SCOPED_MODELS.has(model)) {
          return query(args);
        }

        // Get current request context
        const context = getStoredContext();
        
        // Skip if no context (e.g., seed scripts, background jobs)
        if (!context) {
          return query(args);
        }

        // Skip for super admin (they can query across all stores)
        if (context.isSuperAdmin) {
          return query(args);
        }

        const storeId = context.storeId;

        // Require storeId for tenant-scoped operations
        if (!storeId) {
          throw new Error(
            `Multi-tenant violation: Operation '${operation}' on model '${model}' requires storeId. ` +
            'Ensure the request is authenticated and belongs to a store.'
          );
        }

        // Inject storeId into operation based on type
        switch (operation) {
          case 'findUnique':
          case 'findUniqueOrThrow':
          case 'findFirst':
          case 'findFirstOrThrow':
          case 'findMany':
          case 'count':
          case 'aggregate':
          case 'groupBy':
            // Read operations - inject into WHERE clause
            return query({
              ...args,
              where: {
                ...(args.where || {}),
                storeId,
              },
            });

          case 'create':
            // Create - inject into data
            return query({
              ...args,
              data: {
                ...(args.data || {}),
                storeId,
              },
            });

          case 'createMany':
            // Bulk create - inject into each data item
            if (Array.isArray(args.data)) {
              return query({
                ...args,
                data: args.data.map((item: any) => ({
                  ...(item || {}),
                  storeId,
                })),
              });
            } else {
              return query({
                ...args,
                data: {
                  ...(args.data || {}),
                  storeId,
                },
              });
            }

          case 'update':
          case 'updateMany':
          case 'upsert':
            // Update/Upsert - inject into WHERE and CREATE data
            const updateArgs: any = {
              ...args,
              where: {
                ...(args.where || {}),
                storeId,
              },
            };

            // For upsert, also inject into create data
            if (operation === 'upsert' && updateArgs.create) {
              updateArgs.create = {
                ...(updateArgs.create || {}),
                storeId,
              };
            }

            return query(updateArgs);

          case 'delete':
          case 'deleteMany':
            // Delete - inject into WHERE clause
            return query({
              ...args,
              where: {
                ...(args.where || {}),
                storeId,
              },
            });

          default:
            // Unknown operation - pass through
            return query(args);
        }
      },
    },
  },
});

/**
 * Utility functions for checking model types
 */

export function isTenantScopedModel(modelName: string): boolean {
  return TENANT_SCOPED_MODELS.has(modelName);
}

export function isGlobalModel(modelName: string): boolean {
  return GLOBAL_MODELS.has(modelName);
}

export function getTenantScopedModels(): readonly string[] {
  return Array.from(TENANT_SCOPED_MODELS);
}

export function getGlobalModels(): readonly string[] {
  return Array.from(GLOBAL_MODELS);
}
