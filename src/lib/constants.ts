/**
 * Application-wide constants
 * Centralized location for all magic numbers and strings
 */

// User Roles
export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  STORE_OWNER: 'STORE_OWNER',
  STORE_ADMIN: 'STORE_ADMIN',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER',
} as const;

export const USER_ROLE_LABELS = {
  SUPER_ADMIN: 'Super Administrator',
  STORE_OWNER: 'Store Owner',
  STORE_ADMIN: 'Store Administrator',
  STAFF: 'Staff Member',
  CUSTOMER: 'Customer',
} as const;

// Order Statuses
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  CONFIRMED: 'CONFIRMED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

export const ORDER_STATUS_LABELS = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
} as const;

// Payment Statuses
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  STRIPE: 'STRIPE',
  SSLCOMMERZ: 'SSLCOMMERZ',
  BKASH: 'BKASH',
  CASH: 'CASH',
  OTHER: 'OTHER',
} as const;

// Product Statuses
export const PRODUCT_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

// Subscription Plans
export const PLAN_TIERS = {
  FREE: 'FREE',
  STARTER: 'STARTER',
  PROFESSIONAL: 'PROFESSIONAL',
  ENTERPRISE: 'ENTERPRISE',
} as const;

// Plan Limits
export const PLAN_LIMITS = {
  FREE: {
    products: 10,
    orders: 100,
    staff: 1,
    storage: 1, // GB
  },
  STARTER: {
    products: 100,
    orders: 1000,
    staff: 3,
    storage: 5, // GB
  },
  PROFESSIONAL: {
    products: 10000,
    orders: 100000,
    staff: 10,
    storage: 50, // GB
  },
  ENTERPRISE: {
    products: -1, // unlimited
    orders: -1, // unlimited
    staff: -1, // unlimited
    storage: 500, // GB
  },
} as const;

// File Upload Limits
export const FILE_LIMITS = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'text/plain'],
} as const;

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PER_PAGE: 10,
  MAX_PER_PAGE: 100,
} as const;

// Validation Limits
export const VALIDATION_LIMITS = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 255,
  DESCRIPTION_MAX_LENGTH: 5000,
  SKU_MAX_LENGTH: 50,
  SLUG_MAX_LENGTH: 100,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
} as const;

// Auto-cancel Order Timeout
export const ORDER_AUTO_CANCEL_MINUTES = 15;

// Plan Grace Period
export const PLAN_GRACE_PERIOD_SECONDS = 60;

// Low Stock Threshold
export const LOW_STOCK_THRESHOLD = 10;

// Session Timeouts
export const SESSION_TIMEOUTS = {
  IDLE_TIMEOUT_MINUTES: 30,
  MAX_SESSION_HOURS: 24,
} as const;

// Security Settings
export const SECURITY = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  PASSWORD_HISTORY_COUNT: 5,
  PASSWORD_HISTORY_RETENTION_DAYS: 730, // 2 years
  MFA_CODE_LENGTH: 6,
  MFA_CODE_EXPIRY_SECONDS: 300, // 5 minutes
} as const;

// API Rate Limits (per minute)
export const RATE_LIMITS = {
  FREE: 100,
  STARTER: 500,
  PROFESSIONAL: 2000,
  ENTERPRISE: 10000,
} as const;

// Cache TTLs (seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

// Email Templates
export const EMAIL_TEMPLATES = {
  ORDER_CONFIRMATION: 'order-confirmation',
  ORDER_SHIPPED: 'order-shipped',
  ORDER_DELIVERED: 'order-delivered',
  PAYMENT_RECEIVED: 'payment-received',
  PASSWORD_RESET: 'password-reset',
  WELCOME: 'welcome',
  LOW_STOCK_ALERT: 'low-stock-alert',
  PLAN_EXPIRATION: 'plan-expiration',
} as const;

// Feature Flags
export const FEATURES = {
  ENABLE_MFA: true,
  ENABLE_SSO: true,
  ENABLE_EXTERNAL_SYNC: true,
  ENABLE_POS: true,
  ENABLE_FLASH_SALES: true,
  ENABLE_ABANDONED_CART: true,
} as const;
