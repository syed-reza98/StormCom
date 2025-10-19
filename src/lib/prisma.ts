import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton with Multi-tenant Middleware
 *
 * Prevents multiple Prisma Client instances in development (hot reload)
 * and configures connection pooling for serverless environments.
 * 
 * Note: Multi-tenant isolation middleware is applied separately via context
 * in API routes using setTenantContext from middleware/tenantIsolation.ts
 *
 * @see https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 */

// Connection pool configuration for serverless (Vercel)
const connectionLimit = process.env.DATABASE_CONNECTION_LIMIT
  ? parseInt(process.env.DATABASE_CONNECTION_LIMIT, 10)
  : 5;

const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

/**
 * Graceful shutdown handler
 * Ensures database connections are closed properly
 */
async function disconnectPrisma() {
  await prisma.$disconnect();
}

// Register shutdown handlers
process.on('beforeExit', disconnectPrisma);
process.on('SIGINT', disconnectPrisma);
process.on('SIGTERM', disconnectPrisma);
