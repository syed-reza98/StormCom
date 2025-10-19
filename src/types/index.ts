/**
 * Shared TypeScript Types
 * 
 * Centralized type definitions used across the application.
 * Re-exports Prisma enums and defines custom types for API responses,
 * authentication, permissions, and business domain models.
 * 
 * @module types
 */

// ============================================================================
// Prisma Client Types & Enums
// ============================================================================

export * from '@prisma/client';

// Re-export commonly used Prisma types for convenience
import type { Prisma } from '@prisma/client';
export type { Prisma };

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Represents a CUID string (25-character unique identifier).
 */
export type ID = string;

/**
 * Makes all properties of T nullable.
 */
export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

/**
 * Makes all properties of T optional and nullable.
 */
export type Optional<T> = {
  [P in keyof T]?: T[P] | null;
};

/**
 * Recursively makes all properties of T partial.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract keys from T that match type U.
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard successful API response wrapper.
 * 
 * @example
 * ```typescript
 * const response: ApiResponse<Product> = {
 *   data: { id: '123', name: 'Product' },
 *   message: 'Product created successfully'
 * };
 * ```
 */
/**
 * Standard success API response.
 * 
 * @example
 * ```typescript
 * const response: ApiResponse<Product> = {
 *   data: product,
 *   message: 'Product created successfully'
 * };
 * ```
 */
export interface ApiSuccessResponse<T = unknown> {
  data: T;
  message?: string;
}

/**
 * Standard error API response.
 * 
 * @example
 * ```typescript
 * const response: ApiErrorResponse = {
 *   error: {
 *     code: 'VALIDATION_ERROR',
 *     message: 'Invalid input provided',
 *     details: { field: ['Required'] }
 *   }
 * };
 * ```
 */
export interface ApiErrorResponse {
  error: ApiError;
}

/**
 * API response (success or error).
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Standard error object.
 * 
 * @example
 * ```typescript
 * const error: ApiError = {
 *   code: 'VALIDATION_ERROR',
 *   message: 'Invalid input provided',
 *   details: { field: ['Required'] }
 * };
 * ```
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  statusCode?: number;
}

/**
 * API error response wrapper.
 */
export interface ApiErrorResponse {
  error: ApiError;
}

/**
 * Pagination metadata for list responses.
 */
export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated data wrapper.
 * 
 * @example
 * ```typescript
 * const response: PaginatedData<Product> = {
 *   data: [product1, product2],
 *   meta: { page: 1, perPage: 10, total: 100, totalPages: 10 }
 * };
 * ```
 */
export interface PaginatedData<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Type guard to check if response is an error response.
 */
export function isApiError(response: unknown): response is ApiErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as ApiErrorResponse).error === 'object' &&
    'code' in (response as ApiErrorResponse).error &&
    'message' in (response as ApiErrorResponse).error
  );
}

/**
 * Type guard to check if response is paginated data.
 */
export function isPaginatedData<T>(response: unknown): response is PaginatedData<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'data' in response &&
    Array.isArray((response as PaginatedData<T>).data) &&
    'meta' in response &&
    typeof (response as PaginatedData<T>).meta === 'object'
  );
}

// ============================================================================
// Authentication & Authorization Types
// ============================================================================

/**
 * JWT token claims (extracted from NextAuth session).
 */
export interface UserClaims {
  sub: string; // User ID
  email: string;
  name: string;
  storeId?: string; // Current store context
  role?: string; // Role in current store
  permissions?: string[]; // Granular permissions
  exp: number; // Token expiration (Unix timestamp)
  iat: number; // Token issued at (Unix timestamp)
}

/**
 * Store-specific permission context.
 */
export interface StorePermissions {
  storeId: string;
  role: string;
  permissions: string[];
  planSlug?: string; // Subscription plan slug (for rate limiting)
}

/**
 * RBAC context for request processing.
 */
export interface RBACContext {
  userId?: string; // User ID (from JWT)
  storeId?: string; // Store ID (from request context)
  user: {
    id: string;
    email: string;
    name: string;
  };
  store: StorePermissions | null;
  userRole?: string; // User's role in the current store
  permissions?: string[]; // User's permissions (from JWT)
  isSuperAdmin: boolean;
}

/**
 * Session user object (from NextAuth).
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image?: string;
}

// ============================================================================
// Business Domain Types
// ============================================================================

/**
 * Product data transfer object (for API responses).
 */
export interface ProductData {
  id: ID;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  costPerItem: number | null;
  taxable: boolean;
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  variants?: ProductVariantData[];
  category?: CategoryData;
  brand?: BrandData;
}

/**
 * Product variant data transfer object.
 */
export interface ProductVariantData {
  id: ID;
  productId: ID;
  name: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  costPerItem: number | null;
  stockQuantity: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Category data transfer object.
 */
export interface CategoryData {
  id: ID;
  name: string;
  slug: string;
  description: string | null;
  parentId: ID | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Brand data transfer object.
 */
export interface BrandData {
  id: ID;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Order data transfer object.
 */
export interface OrderData {
  id: ID;
  orderNumber: string;
  customerId: ID | null;
  customerEmail: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItemData[];
  customer?: CustomerData;
  shipment?: ShipmentData;
}

/**
 * Order item data transfer object.
 */
export interface OrderItemData {
  id: ID;
  orderId: ID;
  productId: ID | null;
  variantId: ID | null;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Customer data transfer object.
 */
export interface CustomerData {
  id: ID;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  totalSpent: number;
  orderCount: number;
  lifetimeValue: number;
  createdAt: Date;
  updatedAt: Date;
  addresses?: AddressData[];
}

/**
 * Address data transfer object.
 */
export interface AddressData {
  id: ID;
  customerId: ID;
  firstName: string;
  lastName: string;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  province: string | null;
  country: string;
  postalCode: string;
  phone: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Shipment tracking data transfer object.
 */
export interface ShipmentData {
  id: ID;
  orderId: ID;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  status: string;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cart data transfer object.
 */
export interface CartData {
  id: ID;
  customerId: ID | null;
  sessionId: string | null;
  subtotal: number;
  total: number;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
  items?: CartItemData[];
}

/**
 * Cart item data transfer object.
 */
export interface CartItemData {
  id: ID;
  cartId: ID;
  productId: ID;
  variantId: ID | null;
  quantity: number;
  price: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
  product?: ProductData;
  variant?: ProductVariantData;
}

/**
 * Store data transfer object.
 */
export interface StoreData {
  id: ID;
  name: string;
  subdomain: string;
  customDomain: string | null;
  email: string;
  phone: string | null;
  currency: string;
  timezone: string;
  active: boolean;
  planId: ID;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Form Input Types
// ============================================================================

/**
 * Product create/update input.
 */
export interface ProductInput {
  name: string;
  slug: string;
  sku: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  costPerItem?: number;
  categoryId?: string;
  brandId?: string;
  taxable?: boolean;
  published?: boolean;
}

/**
 * Order create input.
 */
export interface OrderInput {
  customerEmail: string;
  customerId?: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    province?: string;
    country: string;
    postalCode: string;
    phone?: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    province?: string;
    country: string;
    postalCode: string;
    phone?: string;
  };
}

/**
 * Customer create/update input.
 */
export interface CustomerInput {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  taxExempt?: boolean;
  acceptsMarketing?: boolean;
}

// ============================================================================
// Analytics & Metrics Types
// ============================================================================

/**
 * Dashboard KPI metrics.
 */
export interface DashboardMetrics {
  revenue: {
    current: number;
    previous: number;
    change: number;
  };
  orders: {
    current: number;
    previous: number;
    change: number;
  };
  customers: {
    current: number;
    previous: number;
    change: number;
  };
  conversionRate: {
    current: number;
    previous: number;
    change: number;
  };
}

/**
 * Time series data point.
 */
export interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

/**
 * Report export format.
 */
export type ReportFormat = 'csv' | 'xlsx' | 'pdf';

// ============================================================================
// Webhook & Integration Types
// ============================================================================

/**
 * Webhook payload structure.
 */
export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: unknown;
  signature?: string;
}

/**
 * External platform sync status.
 */
export type SyncStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Platform integration credentials.
 */
export interface PlatformCredentials {
  platform: 'woocommerce' | 'shopify';
  apiUrl?: string;
  apiKey: string;
  apiSecret?: string;
  storeUrl?: string;
}

// ============================================================================
// File Upload Types
// ============================================================================

/**
 * File upload metadata.
 */
export interface FileUpload {
  filename: string;
  size: number;
  mimeType: string;
  url: string;
  createdAt: Date;
}

/**
 * Image variant sizes.
 */
export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'original';

// ============================================================================
// Notification Types
// ============================================================================

/**
 * Notification channel types.
 */
export type NotificationChannel = 'email' | 'sms' | 'push';

/**
 * Email template types.
 */
export type EmailTemplate =
  | 'order_confirmation'
  | 'order_shipped'
  | 'order_delivered'
  | 'payment_received'
  | 'refund_processed'
  | 'password_reset'
  | 'account_created'
  | 'low_stock_alert'
  | 'abandoned_cart'
  | 'newsletter';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Environment variable keys.
 */
export type EnvKey =
  | 'DATABASE_URL'
  | 'NEXTAUTH_URL'
  | 'NEXTAUTH_SECRET'
  | 'STRIPE_SECRET_KEY'
  | 'UPSTASH_REDIS_REST_URL'
  | 'UPSTASH_REDIS_REST_TOKEN'
  | 'RESEND_API_KEY'
  | 'INNGEST_EVENT_KEY'
  | 'SENTRY_DSN';

/**
 * Feature flags configuration.
 */
export interface FeatureFlags {
  hasAdvancedReports: boolean;
  hasPosAccess: boolean;
  hasApiAccess: boolean;
  hasCustomBranding: boolean;
  hasPrioritySupport: boolean;
  hasMultiCurrency: boolean;
  hasAdvancedShipping: boolean;
  hasAbandonedCartRecovery: boolean;
  hasEmailMarketing: boolean;
  hasLoyaltyPrograms: boolean;
}

// ============================================================================
// Exports
// ============================================================================

export default {};
