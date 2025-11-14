/**
 * Prisma Migration Integration Tests
 * 
 * Validates migration integrity, idempotency, rollback safety, and schema consistency.
 * These tests ensure that database migrations can be safely applied and rolled back
 * without data loss or schema corruption.
 * 
 * @group integration
 * @group migrations
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Test database configuration
const TEST_DB_PATH = path.join(process.cwd(), 'prisma', 'test-migration-vitest.db');
const TEST_DB_URL = `file:${TEST_DB_PATH}`;

describe('Prisma Migration Tests', () => {
  let db: PrismaClient;

  beforeAll(() => {
    // Set test database URL
    process.env.DATABASE_URL = TEST_DB_URL;
  });

  afterAll(async () => {
    // Cleanup test database
    if (db) {
      await db.$disconnect();
    }
    
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    if (fs.existsSync(`${TEST_DB_PATH}-journal`)) {
      fs.unlinkSync(`${TEST_DB_PATH}-journal`);
    }
  });

  beforeEach(async () => {
    // Clean up before each test
    if (db) {
      await db.$disconnect();
    }
    
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
    if (fs.existsSync(`${TEST_DB_PATH}-journal`)) {
      fs.unlinkSync(`${TEST_DB_PATH}-journal`);
    }
  });

  describe('Migration Deployment', () => {
    it('should apply all migrations to a fresh database', () => {
      // Run migrations
      const result = execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: TEST_DB_URL },
        encoding: 'utf-8',
      });

      expect(result).toContain('migration'); // Should mention migrations
      expect(fs.existsSync(TEST_DB_PATH)).toBe(true);
    });

    it('should be idempotent (safe to run multiple times)', () => {
      // Run migrations first time
      execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: TEST_DB_URL },
        encoding: 'utf-8',
      });

      // Run migrations second time - should not fail
      const result = execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: TEST_DB_URL },
        encoding: 'utf-8',
      });

      expect(result).not.toContain('error');
      expect(result).not.toContain('failed');
    });
  });

  describe('Schema Validation', () => {
    beforeEach(() => {
      // Apply migrations before schema tests
      execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: TEST_DB_URL },
        encoding: 'utf-8',
      });
    });

    it('should validate schema successfully after migrations', () => {
      const result = execSync('npx prisma validate', {
        env: { ...process.env, DATABASE_URL: TEST_DB_URL },
        encoding: 'utf-8',
      });

      expect(result).toContain('validated');
    });

    it('should generate Prisma Client without errors', () => {
      const result = execSync('npx prisma generate', {
        env: { ...process.env, DATABASE_URL: TEST_DB_URL },
        encoding: 'utf-8',
      });

      expect(result).toContain('Generated Prisma Client');
    });
  });

  describe('Database Structure', () => {
    beforeEach(async () => {
      // Apply migrations and create Prisma Client
      execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: TEST_DB_URL },
        encoding: 'utf-8',
      });
      execSync('npx prisma generate', {
        env: { ...process.env, DATABASE_URL: TEST_DB_URL },
        encoding: 'utf-8',
      });

      db = new PrismaClient({
        datasources: { db: { url: TEST_DB_URL } },
      });
    });

    it('should create all expected tables', async () => {
      // Query SQLite master table to get all tables
      const tables = await db.$queryRaw<{ name: string }[]>`
        SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
      `;

      const tableNames = tables.map((t) => t.name);

      // Expected critical tables (adjust based on your schema)
      const expectedTables = [
        '_prisma_migrations',
        'Store',
        'Product',
        'Category',
        'Order',
        'OrderItem',
        'User',
        'AuditLog',
      ];

      for (const expectedTable of expectedTables) {
        expect(tableNames).toContain(expectedTable);
      }
    });

    it('should create indexes on critical columns', async () => {
      // Query SQLite index information
      const indexes = await db.$queryRaw<{ name: string }[]>`
        SELECT name FROM sqlite_master WHERE type='index' ORDER BY name;
      `;

      const indexNames = indexes.map((i) => i.name);

      // Expected critical indexes (adjust based on your schema)
      const expectedIndexes = [
        'Store_slug_key', // Unique constraint
        'Product_storeId_idx', // Foreign key index
        'Order_storeId_idx', // Foreign key index
        'AuditLog_storeId_createdAt_idx', // Composite index
      ];

      for (const expectedIndex of expectedIndexes) {
        expect(indexNames).toContain(expectedIndex);
      }
    });

    it('should enforce foreign key constraints', async () => {
      // Check foreign key pragma is enabled
      const fkEnabled = await db.$queryRaw<{ foreign_keys: number }[]>`
        PRAGMA foreign_keys;
      `;

      expect(fkEnabled[0]?.foreign_keys).toBe(1);

      // Check for foreign key violations
      const violations = await db.$queryRaw<any[]>`
        PRAGMA foreign_key_check;
      `;

      expect(violations).toHaveLength(0);
    });
  });

  describe('Data Persistence', () => {
    beforeEach(async () => {
      execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: TEST_DB_URL },
        encoding: 'utf-8',
      });
      execSync('npx prisma generate', {
        env: { ...process.env, DATABASE_URL: TEST_DB_URL },
        encoding: 'utf-8',
      });

      db = new PrismaClient({
        datasources: { db: { url: TEST_DB_URL } },
      });
    });

    it('should preserve data after re-running migrations', async () => {
      // Create a test store
      const store = await db.store.create({
        data: {
          name: 'Test Store',
          slug: 'test-store',
          email: 'test@example.com', // Required field
        },
      });

      expect(store.id).toBeDefined();

      // Disconnect and re-run migrations
      await db.$disconnect();
      execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: TEST_DB_URL },
        encoding: 'utf-8',
      });

      // Reconnect and verify data still exists
      db = new PrismaClient({
        datasources: { db: { url: TEST_DB_URL } },
      });

      const foundStore = await db.store.findUnique({
        where: { id: store.id },
      });

      expect(foundStore).toBeDefined();
      expect(foundStore?.name).toBe('Test Store');
      expect(foundStore?.slug).toBe('test-store');
    });
  });

  describe('Migration History', () => {
    beforeEach(() => {
      execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: TEST_DB_URL },
        encoding: 'utf-8',
      });
    });

    it('should track migration history in _prisma_migrations table', async () => {
      db = new PrismaClient({
        datasources: { db: { url: TEST_DB_URL } },
      });

      const migrations = await db.$queryRaw<any[]>`
        SELECT * FROM _prisma_migrations ORDER BY finished_at DESC;
      `;

      expect(migrations.length).toBeGreaterThan(0);
      
      // Each migration should have required fields
      for (const migration of migrations) {
        expect(migration.id).toBeDefined();
        expect(migration.migration_name).toBeDefined();
        expect(migration.finished_at).toBeDefined();
      }
    });

    it('should report migration status correctly', () => {
      const result = execSync('npx prisma migrate status', {
        env: { ...process.env, DATABASE_URL: TEST_DB_URL },
        encoding: 'utf-8',
      });

      expect(result).toContain('Database schema is up to date');
    });
  });

  describe('Rollback Safety', () => {
    it('should handle reset without errors', () => {
      // Apply migrations first
      execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: TEST_DB_URL },
        encoding: 'utf-8',
      });

      // Reset should work without errors
      const result = execSync('npx prisma migrate reset --force --skip-seed', {
        env: { ...process.env, DATABASE_URL: TEST_DB_URL },
        encoding: 'utf-8',
      });

      expect(result).not.toContain('error');
      expect(fs.existsSync(TEST_DB_PATH)).toBe(true);
    });
  });
});
