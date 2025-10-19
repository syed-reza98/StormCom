// src/types/index.ts

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'VIEWER';
export type StoreStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL_EXPIRED' | 'CLOSED';
export type ApiResponse<T> = {
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
};
export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
