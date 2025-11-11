// Test fixtures helpers used across unit tests
import { Session, User } from '@/types';

export function buildUser(overrides?: Partial<User>): User {
  return {
    id: 'user_1',
    email: 'user@example.com',
    name: 'Test User',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as unknown as User;
}

export function buildSession(overrides?: Partial<Session>): Session {
  return {
    id: 'sess_1',
    userId: 'user_1',
    storeId: 'store_1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as unknown as Session;
}
