import { PrismaClient } from '@prisma/client';
import { tenantIsolationExtension } from './middleware/tenantIsolation';

/**
 * Prisma Client Singleton
 *
 * Prevents multiple Prisma Client instances in development (hot reload)
 * and configures connection pooling for serverless environments.
 *
 * @see https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 */

const prismaClientSingleton = () => {
  const client = new PrismaClient({
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

  // Apply multi-tenant isolation extension
  return client.$extends(tenantIsolationExtension);
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
