import '@testing-library/jest-dom';
import { expect, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// One-time Prisma schema sync for integration tests that import db at top-level
beforeAll(async () => {
  try {
    // Ensure a default test DB is available before any tests import Prisma
    const defaultTestDb = 'file:./prisma/test-global.db';
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = defaultTestDb;
    }

    // Create prisma directory if missing
    const prismaDir = path.resolve(process.cwd(), 'prisma');
    if (!fs.existsSync(prismaDir)) {
      fs.mkdirSync(prismaDir, { recursive: true });
    }

    // Guard to avoid running multiple times
    if (!process.env.__PRISMA_PUSH_DONE__) {
      // Push schema without running generate to avoid Windows rename EPERM
      execSync('npx prisma db push --force-reset --skip-generate', {
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
        stdio: 'inherit',
      });
      process.env.__PRISMA_PUSH_DONE__ = 'true';
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Prisma test DB setup failed (tests may override per-suite):', e);
  }
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Extend Vitest matchers
expect.extend({});
