import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { prismaMock } from './mocks/prisma';

// Mock Prisma Client before any tests run
vi.mock('@/lib/db', () => ({
  db: prismaMock,
  prisma: prismaMock,
}));

// Mock Prisma (alternate import path)
vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Extend Vitest matchers
expect.extend({});
