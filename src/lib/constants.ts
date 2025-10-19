/**
 * Application Constants
 * 
 * Centralized constants for the application including RBAC permissions,
 * subscription plan limits, system configuration, and status values.
 * 
 * @module lib/constants
 */

// ============================================================================
// Re-export Prisma Enums for Type Safety
// ============================================================================

export {
  BillingCycle,
  OrderStatus,
  PaymentStatus,
  ShipmentStatus,
  RefundStatus,
  SyncStatus,
  ExternalPlatform,
} from '@prisma/client';

// ============================================================================
// PAGINATION & LIMITS
// ============================================================================

/**
 * Default pagination settings
 */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MIN_PAGE_SIZE = 1;

/**
 * Store limits and quotas
 */
export const STORE_LIMITS = {
  FREE: {
    products: 100,
    orders: 1000,
    storage: 500, // MB
  },
  STARTER: {
    products: 1000,
    orders: 10000,
    storage: 5000, // MB
  },
  PROFESSIONAL: {
    products: -1, // unlimited
    orders: -1,
    storage: 50000, // MB
  },
  ENTERPRISE: {
    products: -1,
    orders: -1,
    storage: -1, // unlimited
  },
} as const;

/**
 * Slug generation options
 */
export const SLUGIFY_OPTIONS = {
  lowercase: true,
  strict: true,
  trim: true,
} as const;

// ============================================================================
// RBAC: Permissions
// ============================================================================

/**
 * Granular permissions for role-based access control.
 * Format: resource.action (e.g., products.create, orders.view)
 */
export const PERMISSIONS = {
  // Stores (Multi-tenant)
  STORES: {
    CREATE: 'stores.create',
    VIEW: 'stores.view',
    UPDATE: 'stores.update',
    DELETE: 'stores.delete',
    MANAGE: 'stores.*',
  },

  // Products
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',
  PRODUCTS_PUBLISH: 'products.publish',
  PRODUCTS_IMPORT: 'products.import',
  PRODUCTS_EXPORT: 'products.export',
  PRODUCTS_MANAGE: 'products.*',

  // Orders
  ORDERS_CREATE: 'orders.create',
  ORDERS_VIEW: 'orders.view',
  ORDERS_UPDATE: 'orders.update',
  ORDERS_DELETE: 'orders.delete',
  ORDERS_CANCEL: 'orders.cancel',
  ORDERS_REFUND: 'orders.refund',
  ORDERS_EXPORT: 'orders.export',
  ORDERS_MANAGE: 'orders.*',

  // Customers
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_UPDATE: 'customers.update',
  CUSTOMERS_DELETE: 'customers.delete',
  CUSTOMERS_EXPORT: 'customers.export',
  CUSTOMERS_MANAGE: 'customers.*',

  // Inventory
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_ADJUST: 'inventory.adjust',
  INVENTORY_TRANSFER: 'inventory.transfer',
  INVENTORY_MANAGE: 'inventory.*',

  // Marketing
  MARKETING_CREATE: 'marketing.create',
  MARKETING_VIEW: 'marketing.view',
  MARKETING_UPDATE: 'marketing.update',
  MARKETING_DELETE: 'marketing.delete',
  MARKETING_MANAGE: 'marketing.*',

  // Content
  CONTENT_CREATE: 'content.create',
  CONTENT_VIEW: 'content.view',
  CONTENT_UPDATE: 'content.update',
  CONTENT_DELETE: 'content.delete',
  CONTENT_PUBLISH: 'content.publish',
  CONTENT_MANAGE: 'content.*',

  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.update',
  SETTINGS_MANAGE: 'settings.*',

  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  REPORTS_MANAGE: 'reports.*',

  // Users & Teams
  USERS_CREATE: 'users.create',
  USERS_VIEW: 'users.view',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_MANAGE: 'users.*',

  // POS
  POS_ACCESS: 'pos.access',
  POS_CHECKOUT: 'pos.checkout',
  POS_MANAGE: 'pos.*',

  // API Access
  API_ACCESS: 'api.access',
  API_MANAGE: 'api.*',

  // Super Admin
  SUPER_ADMIN: '*',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ============================================================================
// RBAC: Default Roles
// ============================================================================

/**
 * Default role definitions with permission mappings.
 */
export const DEFAULT_ROLES = {
  OWNER: {
    slug: 'OWNER',
    name: 'Store Owner',
    description: 'Full access to all store features',
    permissions: [PERMISSIONS.SUPER_ADMIN], // All permissions (*)
  },
  ADMIN: {
    slug: 'ADMIN',
    name: 'Administrator',
    description: 'Full access except billing and user management',
    permissions: [
      PERMISSIONS.PRODUCTS_MANAGE,
      PERMISSIONS.ORDERS_MANAGE,
      PERMISSIONS.CUSTOMERS_MANAGE,
      PERMISSIONS.INVENTORY_MANAGE,
      PERMISSIONS.MARKETING_MANAGE,
      PERMISSIONS.CONTENT_MANAGE,
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.REPORTS_MANAGE,
      PERMISSIONS.POS_MANAGE,
    ],
  },
  MANAGER: {
    slug: 'MANAGER',
    name: 'Manager',
    description: 'Manage products, orders, customers, and basic inventory',
    permissions: [
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.PRODUCTS_UPDATE,
      PERMISSIONS.PRODUCTS_PUBLISH,
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.ORDERS_UPDATE,
      PERMISSIONS.ORDERS_CANCEL,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CUSTOMERS_UPDATE,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.INVENTORY_ADJUST,
      PERMISSIONS.REPORTS_VIEW,
      PERMISSIONS.POS_CHECKOUT,
    ],
  },
  STAFF: {
    slug: 'STAFF',
    name: 'Staff',
    description: 'View products and orders, process POS transactions',
    permissions: [
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.POS_CHECKOUT,
    ],
  },
  VIEWER: {
    slug: 'VIEWER',
    name: 'Viewer',
    description: 'Read-only access to products, orders, and reports',
    permissions: [
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.REPORTS_VIEW,
    ],
  },
} as const;

export type RoleSlug = keyof typeof DEFAULT_ROLES;

/**
 * Role hierarchy for permission checking (higher number = more permissions).
 */
export const ROLE_HIERARCHY: Record<RoleSlug, number> = {
  OWNER: 5,
  ADMIN: 4,
  MANAGER: 3,
  STAFF: 2,
  VIEWER: 1,
};

/**
 * Super admin permissions (bypasses all checks).
 */
export const SUPER_ADMIN_PERMISSIONS = ['*'];

// ============================================================================
// Subscription: Plan Limits
// ============================================================================

/**
 * Plan limits for different subscription tiers.
 * These enforce usage constraints based on the store's active plan.
 */
export const PLAN_LIMITS = {
  FREE: {
    maxProducts: 50,
    maxOrders: 100, // per month
    maxStaff: 1,
    maxStorage: 1, // GB
    maxEmailsSent: 500, // per month
  },
  STARTER: {
    maxProducts: 500,
    maxOrders: 1000, // per month
    maxStaff: 5,
    maxStorage: 10, // GB
    maxEmailsSent: 5000, // per month
  },
  PROFESSIONAL: {
    maxProducts: 5000,
    maxOrders: 10000, // per month
    maxStaff: 20,
    maxStorage: 100, // GB
    maxEmailsSent: 50000, // per month
  },
  ENTERPRISE: {
    maxProducts: -1, // unlimited
    maxOrders: -1, // unlimited
    maxStaff: -1, // unlimited
    maxStorage: -1, // unlimited
    maxEmailsSent: -1, // unlimited
  },
} as const;

export type PlanSlug = keyof typeof PLAN_LIMITS;

// ============================================================================
// Subscription: API Rate Limits
// ============================================================================

/**
 * API rate limits per subscription plan (requests per minute).
 */
export const API_RATE_LIMITS: Record<PlanSlug, number> = {
  FREE: 60, // 1 req/second
  STARTER: 120, // 2 req/second
  PROFESSIONAL: 300, // 5 req/second
  ENTERPRISE: 1000, // 16.67 req/second
};

// ============================================================================
// Subscription: Feature Flags
// ============================================================================

/**
 * Feature availability per subscription plan.
 */
export const PLAN_FEATURES = {
  FREE: {
    hasAdvancedReports: false,
    hasPosAccess: false,
    hasApiAccess: false,
    hasCustomBranding: false,
    hasPrioritySupport: false,
    hasMultiCurrency: false,
    hasAdvancedShipping: false,
    hasAbandonedCartRecovery: false,
    hasEmailMarketing: false,
    hasLoyaltyPrograms: false,
  },
  STARTER: {
    hasAdvancedReports: true,
    hasPosAccess: false,
    hasApiAccess: false,
    hasCustomBranding: false,
    hasPrioritySupport: false,
    hasMultiCurrency: false,
    hasAdvancedShipping: true,
    hasAbandonedCartRecovery: true,
    hasEmailMarketing: true,
    hasLoyaltyPrograms: false,
  },
  PROFESSIONAL: {
    hasAdvancedReports: true,
    hasPosAccess: true,
    hasApiAccess: true,
    hasCustomBranding: true,
    hasPrioritySupport: false,
    hasMultiCurrency: true,
    hasAdvancedShipping: true,
    hasAbandonedCartRecovery: true,
    hasEmailMarketing: true,
    hasLoyaltyPrograms: true,
  },
  ENTERPRISE: {
    hasAdvancedReports: true,
    hasPosAccess: true,
    hasApiAccess: true,
    hasCustomBranding: true,
    hasPrioritySupport: true,
    hasMultiCurrency: true,
    hasAdvancedShipping: true,
    hasAbandonedCartRecovery: true,
    hasEmailMarketing: true,
    hasLoyaltyPrograms: true,
  },
} as const;

// ============================================================================
// System Limits
// ============================================================================

/**
 * File upload constraints.
 */
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 5, // 5MB per file
  MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5MB in bytes
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/csv', 'application/vnd.ms-excel'],
} as const;

/**
 * Pagination defaults.
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PER_PAGE: 10,
  MAX_PER_PAGE: 100,
} as const;

/**
 * Session configuration.
 */
export const SESSION = {
  EXPIRY_DAYS: 30,
  EXPIRY_SECONDS: 30 * 24 * 60 * 60, // 30 days in seconds
  COOKIE_NAME: 'next-auth.session-token',
} as const;

/**
 * Order processing timeouts.
 */
export const ORDER = {
  AUTO_CANCEL_MINUTES: 15, // Auto-cancel unpaid orders after 15 minutes
  AUTO_CANCEL_SECONDS: 15 * 60, // 15 minutes in seconds
} as const;

/**
 * Subscription plan expiration grace period (CHK056).
 */
export const PLAN = {
  EXPIRATION_GRACE_SECONDS: 60, // 60-second grace period after plan expires
} as const;

/**
 * Password security requirements (CHK009).
 */
export const PASSWORD = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  HISTORY_COUNT: 5, // Prevent reuse of last 5 passwords
  HISTORY_RETENTION_DAYS: 730, // 2 years
  BCRYPT_COST_FACTOR: 12, // bcrypt hashing cost factor
} as const;

/**
 * Tax exemption configuration (CHK091).
 */
export const TAX_EXEMPTION = {
  EXPIRY_REMINDER_DAYS: 30, // Send reminder 30 days before expiration
  CERTIFICATE_MAX_SIZE_MB: 5, // Max certificate file size
  ALLOWED_CERTIFICATE_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
} as const;

/**
 * Email rate limiting.
 */
export const EMAIL = {
  MAX_RECIPIENTS_PER_CAMPAIGN: 10000, // Max recipients per newsletter campaign
  THROTTLE_MS: 100, // 100ms delay between emails (10 emails/second)
} as const;

/**
 * Search configuration.
 */
export const SEARCH = {
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 200,
  MAX_RESULTS: 100,
} as const;

/**
 * Cache TTL (Time To Live) in seconds.
 */
export const CACHE_TTL = {
  ANALYTICS: 5 * 60, // 5 minutes for analytics/reports
  PRODUCTS: 60, // 1 minute for product lists
  STORE_SETTINGS: 10 * 60, // 10 minutes for store settings
} as const;

// ============================================================================
// External Platform Integration
// ============================================================================

/**
 * Supported external platforms.
 */
export const PLATFORMS = {
  WOOCOMMERCE: 'woocommerce',
  SHOPIFY: 'shopify',
} as const;

export type Platform = (typeof PLATFORMS)[keyof typeof PLATFORMS];

/**
 * Sync queue retry configuration.
 */
export const SYNC = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 5000, // 5 seconds
  BATCH_SIZE: 100, // Process 100 items per batch
} as const;

// ============================================================================
// Error Codes
// ============================================================================

/**
 * Standard error codes for API responses.
 */
export const ERROR_CODES = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // Business Logic
  INSUFFICIENT_INVENTORY: 'INSUFFICIENT_INVENTORY',
  ORDER_CANNOT_BE_MODIFIED: 'ORDER_CANNOT_BE_MODIFIED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PLAN_LIMIT_REACHED: 'PLAN_LIMIT_REACHED',

  // Server
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ============================================================================
// HTTP Status Codes
// ============================================================================

/**
 * Standard HTTP status codes used in API responses.
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

// ============================================================================
// Environment Variables
// ============================================================================

/**
 * Required environment variable keys.
 */
export const ENV_KEYS = {
  DATABASE_URL: 'DATABASE_URL',
  NEXTAUTH_URL: 'NEXTAUTH_URL',
  NEXTAUTH_SECRET: 'NEXTAUTH_SECRET',
  STRIPE_SECRET_KEY: 'STRIPE_SECRET_KEY',
  SSLCOMMERZ_STORE_ID: 'SSLCOMMERZ_STORE_ID',
  SSLCOMMERZ_STORE_PASSWORD: 'SSLCOMMERZ_STORE_PASSWORD',
  UPSTASH_REDIS_REST_URL: 'UPSTASH_REDIS_REST_URL',
  UPSTASH_REDIS_REST_TOKEN: 'UPSTASH_REDIS_REST_TOKEN',
  RESEND_API_KEY: 'RESEND_API_KEY',
  INNGEST_EVENT_KEY: 'INNGEST_EVENT_KEY',
  SENTRY_DSN: 'SENTRY_DSN',
} as const;

// ============================================================================
// Date/Time Formats
// ============================================================================

/**
 * Standard date/time format strings.
 */
export const DATE_FORMATS = {
  SHORT_DATE: 'MMM d, yyyy', // e.g., Jan 1, 2024
  LONG_DATE: 'MMMM d, yyyy', // e.g., January 1, 2024
  SHORT_DATETIME: 'MMM d, yyyy h:mm a', // e.g., Jan 1, 2024 3:30 PM
  LONG_DATETIME: 'MMMM d, yyyy h:mm:ss a', // e.g., January 1, 2024 3:30:45 PM
  ISO_DATE: 'yyyy-MM-dd', // e.g., 2024-01-01
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", // e.g., 2024-01-01T15:30:45.000Z
} as const;

// ============================================================================
// Currency Codes (ISO 4217)
// ============================================================================

/**
 * Supported currency codes.
 */
export const CURRENCIES = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  BDT: 'BDT', // Bangladeshi Taka
  INR: 'INR',
  JPY: 'JPY',
  CAD: 'CAD',
  AUD: 'AUD',
} as const;

export type Currency = (typeof CURRENCIES)[keyof typeof CURRENCIES];

// ============================================================================
// Default Values
// ============================================================================

/**
 * System-wide default values.
 */
export const DEFAULTS = {
  CURRENCY: CURRENCIES.USD,
  TIMEZONE: 'UTC',
  LANGUAGE: 'en',
  COUNTRY: 'US',
  TAX_RATE: 0, // Default 0% tax
  SHIPPING_RATE: 0, // Default free shipping
} as const;
