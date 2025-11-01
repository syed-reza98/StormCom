// src/lib/prisma.ts
// Prisma Client singleton for StormCom
// Prevents multiple Prisma Client instances in development (hot reload)

import { PrismaClient } from '@prisma/client';

// Global type declaration for development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Singleton instance
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
