/**
 * Database fixture utilities for E2E tests
 * 
 * Provides functions to reset database state and seed test data
 * ensuring test isolation and deterministic test execution.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Reset database to clean state
 * Deletes all data from all tables in reverse order of dependencies
 */
export async function resetDatabase(): Promise<void> {
  try {
    // Delete in reverse dependency order to avoid foreign key violations
    await prisma.$transaction([
      // Auth-related tables
      prisma.session.deleteMany(),
      prisma.mFABackupCode.deleteMany(),
      prisma.passwordHistory.deleteMany(),
      
      // Multi-tenant data tables (if exist)
      // await prisma.order.deleteMany(),
      // await prisma.product.deleteMany(),
      // await prisma.customer.deleteMany(),
      
      // Core tables
      prisma.store.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    console.log('✅ Database reset complete');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  }
}

/**
 * Seed database with minimal test data
 * Creates basic records needed for all tests
 */
export async function seedTestData(): Promise<void> {
  try {
    // Seed operations would go here if needed
    // Currently, individual tests create their own data for isolation
    console.log('✅ Database seed complete');
  } catch (error) {
    console.error('❌ Database seed failed:', error);
    throw error;
  }
}

/**
 * Clean up specific test data by identifier pattern
 * Useful for cleaning up after specific test suites
 */
export async function cleanupTestData(emailPattern: string): Promise<void> {
  try {
    // Find users matching test pattern
    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: emailPattern,
        },
      },
      select: { id: true },
    });

    const userIds = users.map(u => u.id);

    // Delete related data
    await prisma.$transaction([
      prisma.session.deleteMany({
        where: { userId: { in: userIds } },
      }),
      prisma.mFABackupCode.deleteMany({
        where: { userId: { in: userIds } },
      }),
      prisma.passwordHistory.deleteMany({
        where: { userId: { in: userIds } },
      }),
      prisma.user.deleteMany({
        where: { id: { in: userIds } },
      }),
    ]);

    console.log(`✅ Cleaned up test data for pattern: ${emailPattern}`);
  } catch (error) {
    console.error('❌ Test data cleanup failed:', error);
    throw error;
  }
}

/**
 * Disconnect Prisma client
 * Should be called in global teardown
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export { prisma };
