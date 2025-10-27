// src/lib/db.ts
// Prisma Client Singleton with Connection Pooling and Multi-tenant Middleware
// CRITICAL: This is the ONLY way to access the database - never instantiate PrismaClient directly

import { PrismaClient } from '@prisma/client';
import { registerMultiTenantMiddleware } from './prisma-middleware';

// PrismaClient singleton to prevent multiple instances in development (hot reload)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Create Prisma Client with optimal connection pooling settings
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Connection pool configuration (optimized for serverless)
    // Vercel Functions: 5 connections per function instance
    // Local dev: 10 connections
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Register multi-tenant middleware for automatic storeId filtering
registerMultiTenantMiddleware(db);

// Cache Prisma Client in development to avoid creating new instances on hot reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// Export db as prisma for backward compatibility
export { db as prisma };

// Export Prisma enums for convenient access
export {
  UserRole,
  SubscriptionPlan,
  SubscriptionStatus,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  PaymentGateway,
  ShippingStatus,
  DiscountType,
  InventoryStatus,
  MFAMethod,
  ThemeMode,
} from '@prisma/client';

// Export commonly used types
export type {
  User,
  Store,
  Product,
  Order,
  Customer,
  Category,
  Brand,
} from '@prisma/client';
