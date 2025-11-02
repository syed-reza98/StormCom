/**
 * Authentication Type Definitions
 */

export interface SessionData {
  id?: string;
  userId?: string;
  email?: string;
  storeId?: string | null;
  role?: string;
  createdAt?: number;
  expiresAt?: number;
  lastAccessedAt?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  storeId?: string | null;
}

// Re-export for compatibility with existing code
export type Session = SessionData;
