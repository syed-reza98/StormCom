// tests/integration/helpers/database.ts
// Database setup and cleanup helpers for integration tests

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { randomBytes } from 'crypto';

let prisma: PrismaClient;
let testDatabaseUrl: string;

/**
 * Setup test database for integration tests
 * Creates a new SQLite database file for each test run
 */
export async function setupTestDatabase(): Promise<void> {
  // Generate unique database name for test isolation
  const testId = randomBytes(8).toString('hex');
  const dbPath = `./prisma/test-${testId}.db`;
  testDatabaseUrl = `file:${dbPath}`;
  
  // Set environment variable for test database
  process.env.DATABASE_URL = testDatabaseUrl;
  
  // Create new Prisma client instance
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: testDatabaseUrl,
      },
    },
  });
  
  // Run database migrations
  try {
    execSync('npx prisma db push --force-reset', {
      env: { ...process.env, DATABASE_URL: testDatabaseUrl },
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
  
  // Connect to database
  await prisma.$connect();
}

/**
 * Cleanup test database after tests complete
 * Disconnects and optionally removes the test database file
 */
export async function cleanupTestDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
  
  // Clean up test database file (optional - can be left for debugging)
  try {
    const fs = await import('fs');
    const path = testDatabaseUrl.replace('file:', '');
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
  } catch (error) {
    // Ignore cleanup errors in tests
    console.warn('Failed to cleanup test database file:', error);
  }
}

/**
 * Get the current Prisma client instance for tests
 * @returns PrismaClient instance connected to test database
 */
export function getTestPrismaClient(): PrismaClient {
  if (!prisma) {
    throw new Error('Test database not initialized. Call setupTestDatabase() first.');
  }
  return prisma;
}

/**
 * Reset test database to clean state between tests
 * Truncates all tables while preserving schema
 */
export async function resetTestDatabase(): Promise<void> {
  if (!prisma) {
    throw new Error('Test database not initialized. Call setupTestDatabase() first.');
  }
  
  // Get all table names from the database
  const tables = await prisma.$queryRaw<{ name: string }[]>`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    AND name NOT LIKE 'sqlite_%' 
    AND name NOT LIKE '_prisma_migrations'
  `;
  
  // Disable foreign key constraints temporarily
  await prisma.$executeRaw`PRAGMA foreign_keys = OFF`;
  
  // Truncate all tables
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${table.name}"`);
  }
  
  // Re-enable foreign key constraints
  await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
}

/**
 * Execute raw SQL query in test database
 * @param query SQL query to execute
 * @returns Query result
 */
export async function executeRawQuery(query: string): Promise<any> {
  if (!prisma) {
    throw new Error('Test database not initialized. Call setupTestDatabase() first.');
  }
  
  return await prisma.$queryRawUnsafe(query);
}

/**
 * Check if test database is properly connected
 * @returns boolean indicating connection status
 */
export async function isTestDatabaseConnected(): Promise<boolean> {
  if (!prisma) {
    return false;
  }
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Seed test database with minimal required data
 * Creates essential records for multi-tenant testing
 */
export async function seedTestDatabase(): Promise<void> {
  if (!prisma) {
    throw new Error('Test database not initialized. Call setupTestDatabase() first.');
  }
  
  // Create default store for testing
  const defaultStore = await prisma.store.create({
    data: {
      name: 'Test Store',
      slug: 'test-store',
      description: 'Default test store',
      email: 'test@example.com',
      currency: 'USD',
      timezone: 'UTC',
      locale: 'en',
    },
  });
  
  // Create default admin user
  const defaultUser = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      name: 'Test Admin',
      password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/6Btj6OgUu', // bcrypt hash of "password"
      role: 'STORE_ADMIN',
      storeId: defaultStore.id,
      emailVerified: true,
    },
  });
  
  return {
    store: defaultStore,
    user: defaultUser,
  } as any;
}

/**
 * Get database statistics for debugging
 * @returns Object with table row counts
 */
export async function getTestDatabaseStats(): Promise<Record<string, number>> {
  if (!prisma) {
    throw new Error('Test database not initialized. Call setupTestDatabase() first.');
  }
  
  const stats: Record<string, number> = {};
  
  // Count rows in major tables (using Prisma @map names from schema)
  const tables = [
    'stores',
    'users',
    'categories', 
    'products',
    'product_attributes',
    'product_attribute_values',
    'orders',
    'order_items',
    'customers',
    'brands',
  ];
  
  for (const table of tables) {
    try {
      const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${table}"`);
      stats[table] = (count as any)[0]?.count || 0;
    } catch (error) {
      // Table might not exist in current schema
      stats[table] = 0;
    }
  }
  
  return stats;
}

/**
 * Create transaction for test operations
 * @param operations Function containing database operations
 * @returns Promise resolving to operation result
 */
export async function withTestTransaction<T>(
  operations: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>) => Promise<T>
): Promise<T> {
  if (!prisma) {
    throw new Error('Test database not initialized. Call setupTestDatabase() first.');
  }
  
  return await prisma.$transaction(operations);
}

/**
 * Wait for database operations to complete
 * Useful for async operations in tests
 */
export async function waitForDatabaseOperations(): Promise<void> {
  if (!prisma) {
    return;
  }
  
  // Simple query to ensure all pending operations are complete
  await prisma.$queryRaw`SELECT 1`;
}