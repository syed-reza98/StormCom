// src/lib/prisma.ts
// Prisma Client singleton for StormCom
// Prevents multiple Prisma Client instances in development (hot reload)

import { PrismaClient } from '@prisma/client';

// Global type declaration for development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Determine which Prisma client to export (real or test mock)
let client: PrismaClient;

if (process.env.NODE_ENV === 'test') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { prismaMock } = require('../../tests/mocks/prisma');
    client = prismaMock as unknown as PrismaClient;
  } catch (e) {
    // Fall back to real Prisma client if mock isn't available
    // eslint-disable-next-line no-console
    console.warn('prisma mock not found, falling back to real Prisma client for tests');
    client = global.prisma || new PrismaClient({ log: ['error'] });
  }
} else {
  client =
    global.prisma ||
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

  if (process.env.NODE_ENV !== 'production') {
    global.prisma = client;
  }
}

// Export as any in order to be flexible during tests where a mocked prisma
// with jest/vitest mock methods is used. In production this is a proper
// PrismaClient instance.
export const prisma: any = client;
