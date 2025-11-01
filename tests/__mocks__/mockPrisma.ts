import { createMock } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Provide a typed mocked Prisma client for tests to import
export const mockedPrisma = createMock<PrismaClient>();

export default mockedPrisma;
