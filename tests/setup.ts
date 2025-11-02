import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock Prisma Client before any tests run
vi.mock('@/lib/db', () => {
  const { prismaMock } = require('./mocks/prisma');
  return {
    db: prismaMock,
    prisma: prismaMock,
  };
});

// Mock Prisma (alternate import path)
vi.mock('@/lib/prisma', () => {
  const { prismaMock } = require('./mocks/prisma');
  return {
    prisma: prismaMock,
    default: prismaMock,
  };
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Extend Vitest matchers
expect.extend({});
