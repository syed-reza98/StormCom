// tests/mocks/prisma.ts
// Deep mock of PrismaClient for unit testing
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { beforeEach } from 'vitest';

// Create deep mock of PrismaClient that supports .mockResolvedValue(), .mockRejectedValue(), etc.
// Remove the "as unknown as DeepMockProxy" assertion - it's redundant and causes type issues
export const prismaMock = mockDeep<PrismaClient>();

// Reset all mocks before each test to ensure test isolation
beforeEach(() => {
  mockReset(prismaMock);
});

// Default export for vi.mock usage
export default prismaMock;