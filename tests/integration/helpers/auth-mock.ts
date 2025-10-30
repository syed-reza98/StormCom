// tests/integration/helpers/auth-mock.ts
// Mock NextAuth getServerSession for integration tests

import { vi } from 'vitest';

/**
 * Mock NextAuth getServerSession to return a test session
 * This prevents "headers called outside request scope" errors in integration tests
 */
export function mockNextAuth(sessionData?: {
  userId?: string;
  storeId?: string;
  email?: string;
  role?: string;
} | null) {
  // Default session data
  const defaultSession = sessionData === null ? null : {
    user: {
      id: sessionData?.userId || 'test-user-id',
      email: sessionData?.email || 'test@example.com',
      name: 'Test User',
      role: sessionData?.role || 'STORE_ADMIN',
      storeId: sessionData?.storeId || 'test-store-id',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  // Mock next-auth module
  vi.mock('next-auth', async () => {
    const actual = await vi.importActual('next-auth');
    return {
      ...actual,
      getServerSession: vi.fn().mockResolvedValue(defaultSession),
    };
  });

  return defaultSession;
}

/**
 * Reset NextAuth mock to return null (unauthenticated)
 */
export function mockNextAuthUnauthenticated() {
  return mockNextAuth(null);
}

/**
 * Clear all NextAuth mocks
 */
export function clearNextAuthMock() {
  vi.clearAllMocks();
}
