// tests/integration/helpers/database.ts
// Database setup and cleanup helpers for integration tests

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { randomBytes } from 'crypto';
import { unlinkSync, existsSync } from 'fs';
import { getClient } from '../../../src/lib/db';

// Per-test-suite database tracking
const testDatabases = new Map<string, {
  url: string;
  prisma: PrismaClient;
  dbPath: string;
}>();

let currentTestSuiteId: string | null = null;

// Global cleanup on process exit
process.on('exit', cleanupAllDatabases);
process.on('SIGINT', cleanupAllDatabases);
process.on('SIGTERM', cleanupAllDatabases);

/**
 * Setup test database for integration tests
 * Creates a new SQLite database file for each test suite
 */
export async function setupTestDatabase(): Promise<void> {
  // Generate unique database name for test isolation
  const testId = randomBytes(8).toString('hex');
  const dbPath = `./prisma/test-${testId}.db`;
  const testDatabaseUrl = `file:${dbPath}`;
  
  // Set environment variable for test database
  process.env.DATABASE_URL = testDatabaseUrl;
  currentTestSuiteId = testId;
  
  // Create new Prisma client instance
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: testDatabaseUrl,
      },
    },
  });
  
  // Store database info for cleanup
  testDatabases.set(testId, {
    url: testDatabaseUrl,
    prisma,
    dbPath,
  });
  
  // Run database migrations
  try {
    // Important on Windows: skip client generation to avoid EPERM rename races
    execSync('npx prisma db push --force-reset --skip-generate', {
      env: { ...process.env, DATABASE_URL: testDatabaseUrl },
      stdio: 'pipe', // Reduce noise in test output
    });
  } catch (error) {
    console.error('Failed to setup test database:', error);
    // Clean up failed database
    await cleanupSpecificDatabase(testId);
    throw error;
  }
  
  // Connect to database
  await prisma.$connect();
}

/**
 * Cleanup test database after tests complete
 * Disconnects and removes the test database file
 */
export async function cleanupTestDatabase(): Promise<void> {
  if (currentTestSuiteId) {
    await cleanupSpecificDatabase(currentTestSuiteId);
    currentTestSuiteId = null;
  }
}

/**
 * Cleanup a specific test database by ID
 */
async function cleanupSpecificDatabase(testId: string): Promise<void> {
  const dbInfo = testDatabases.get(testId);
  if (dbInfo) {
    try {
      // Disconnect Prisma client
      await dbInfo.prisma.$disconnect();
    } catch (error) {
      console.warn('Failed to disconnect Prisma client:', error);
    }
    
    try {
      // Remove database file
      if (existsSync(dbInfo.dbPath)) {
        unlinkSync(dbInfo.dbPath);
      }
    } catch (error) {
      console.warn('Failed to remove test database file:', error);
    }
    
    // Remove from tracking
    testDatabases.delete(testId);
  }
}

/**
 * Get the current Prisma client instance for tests
 * Uses the dynamic client from lib/db to ensure proper isolation
 */
export function getTestPrismaClient(): PrismaClient {
  if (!currentTestSuiteId) {
    throw new Error('Test database not initialized. Call setupTestDatabase() first.');
  }
  
  // Use the dynamic client which respects DATABASE_URL changes
  return getClient();
}

/**
 * Reset test database to clean state between tests
 * Truncates all tables while preserving schema
 */
export async function resetTestDatabase(): Promise<void> {
  const prisma = getTestPrismaClient();
  
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
 */
export async function executeRawQuery(query: string): Promise<any> {
  const prisma = getTestPrismaClient();
  return await prisma.$queryRawUnsafe(query);
}

/**
 * Check if test database is properly connected
 */
export async function isTestDatabaseConnected(): Promise<boolean> {
  try {
    const prisma = getTestPrismaClient();
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
export async function seedTestDatabase(): Promise<{
  store: any;
  user: any;
}> {
  const prisma = getTestPrismaClient();
  
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
  };
}

/**
 * Get database statistics for debugging
 */
export async function getTestDatabaseStats(): Promise<Record<string, number>> {
  const prisma = getTestPrismaClient();
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
 */
export async function withTestTransaction<T>(
  operations: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>) => Promise<T>
): Promise<T> {
  const prisma = getTestPrismaClient();
  return await prisma.$transaction(operations);
}

/**
 * Wait for database operations to complete
 * Useful for async operations in tests
 */
export async function waitForDatabaseOperations(): Promise<void> {
  try {
    const prisma = getTestPrismaClient();
    // Simple query to ensure all pending operations are complete
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    // Ignore errors if database not initialized
  }
}

/**
 * Cleanup all test databases (for emergency cleanup)
 * Should not be needed in normal test runs
 */
export async function cleanupAllTestDatabases(): Promise<void> {
  const cleanupPromises = Array.from(testDatabases.keys()).map(cleanupSpecificDatabase);
  await Promise.allSettled(cleanupPromises);
  testDatabases.clear();
  currentTestSuiteId = null;
}

/**
 * Global cleanup function called on process exit
 */
function cleanupAllDatabases(): void {
  // Synchronous cleanup for process exit
  for (const [_testId, dbInfo] of testDatabases) {
    try {
      if (existsSync(dbInfo.dbPath)) {
        unlinkSync(dbInfo.dbPath);
      }
    } catch (error) {
      // Ignore cleanup errors on exit
    }
  }
  testDatabases.clear();
}