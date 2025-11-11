import { PrismaClient } from '@prisma/client';
import { mock, MockProxy } from 'jest-mock-extended';

// Create a mock of PrismaClient for testing (compatible with Vitest)
export type MockPrisma = MockProxy<PrismaClient>;

export const mockedPrisma: MockPrisma = mock<PrismaClient>();

export default mockedPrisma;
