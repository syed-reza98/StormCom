// src/lib/constants.ts

export const ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'VIEWER'] as const;
export const STORE_STATUSES = ['ACTIVE', 'SUSPENDED', 'TRIAL_EXPIRED', 'CLOSED'] as const;
export const API_RATE_LIMITS = {
  Free: 60,
  Basic: 120,
  Pro: 300,
  Enterprise: 1000,
};
export const DEFAULT_PAGE_SIZE = 24;
export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'ar', 'zh', 'ja', 'ru', 'pt', 'it', 'nl', 'pl', 'tr', 'he'] as const;
