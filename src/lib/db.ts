// src/lib/db.ts
// Prisma Client Singleton with Connection Pooling and Multi-tenant Middleware
// CRITICAL: This is the ONLY way to access the database - never instantiate PrismaClient directly

import { PrismaClient } from '@prisma/client';
import { registerMultiTenantMiddleware } from './prisma-middleware';

// PrismaClient singleton/proxy
// In development we cache a real client globally to avoid recreation on hot reloads.
// In test (Vitest), we must respect per-test DATABASE_URL changes, so we create a
// dynamic proxy that instantiates a new client whenever the URL changes.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
const isTestEnv = Boolean(process.env.VITEST);
const shouldUseGlobalCache = process.env.NODE_ENV !== 'production' && !isTestEnv;

let realClient: PrismaClient | undefined = (shouldUseGlobalCache && globalForPrisma.prisma) || undefined;
let currentUrl: string | undefined;

function createClient(url: string | undefined): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: { db: { url } },
  });
  // Register multi-tenant middleware for automatic storeId filtering
  registerMultiTenantMiddleware(client);
  return client;
}

function getClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!isTestEnv) {
    // Dev/prod path: use (or create) a single cached client
    if (!realClient) {
      realClient = createClient(url);
      if (shouldUseGlobalCache) {
        globalForPrisma.prisma = realClient;
      }
    }
    return realClient;
  }

  // Test path: re-instantiate client if DATABASE_URL changed between tests
  if (!realClient || currentUrl !== url) {
    // Do not await disconnect to keep this synchronous; SQLite handles multiple handles fine in tests
    try { realClient?.$disconnect(); } catch { /* ignore */ }
    realClient = createClient(url);
    currentUrl = url;
  }
  return realClient;
}

// Create a dynamic proxy so consumers can import { db } or { prisma } and always
// operate on the correct underlying client (especially in tests).
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient() as any;
    const value = client[prop as keyof PrismaClient];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

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
