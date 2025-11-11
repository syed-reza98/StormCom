/**
 * Test Helper: Session Data Mocking
 * 
 * Provides utilities for creating valid SessionData mocks in tests
 */

import { SessionData } from '@/types';

/**
 * Create a valid SessionData object for testing
 */
export function createMockSession(overrides: Partial<SessionData> = {}): SessionData {
  const now = Date.now();
  
  return {
    id: 'test-session-id',
    userId: 'test-user-id',
    email: 'test@example.com',
    storeId: 'test-store-id',
    role: 'ADMIN',
    createdAt: now,
    expiresAt: now + 3600000, // 1 hour from now
    lastAccessedAt: now,
    ...overrides,
  };
}

/**
 * Create a customer session (no storeId)
 */
export function createCustomerSession(overrides: Partial<SessionData> = {}): SessionData {
  return createMockSession({
    role: 'CUSTOMER',
    storeId: null,
    ...overrides,
  });
}

/**
 * Create an admin session
 */
export function createAdminSession(overrides: Partial<SessionData> = {}): SessionData {
  return createMockSession({
    role: 'ADMIN',
    ...overrides,
  });
}

/**
 * Create a super admin session
 */
export function createSuperAdminSession(overrides: Partial<SessionData> = {}): SessionData {
  return createMockSession({
    role: 'SUPER_ADMIN',
    ...overrides,
  });
}
