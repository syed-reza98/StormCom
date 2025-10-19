/**
 * Shared TypeScript types used across the application
 */

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

// Common entity types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface TenantEntity extends BaseEntity {
  storeId: string;
}

// User types
export type UserRole = 'SUPER_ADMIN' | 'STORE_OWNER' | 'STORE_ADMIN' | 'STAFF' | 'CUSTOMER';

export interface User extends BaseEntity {
  email: string;
  name: string;
  role: UserRole;
  storeId?: string | null;
}

// Subscription Plan types
export type PlanTier = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface PlanLimits {
  products: number;
  orders: number;
  staff: number;
  storage: number; // in GB
}

// Order types
export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type PaymentMethod = 'STRIPE' | 'SSLCOMMERZ' | 'BKASH' | 'CASH' | 'OTHER';

// Product types
export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// Filter and sort types
export interface FilterParams {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

// File upload types
export interface UploadedFile {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

// Audit log types
export interface AuditLog extends BaseEntity {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

// Next.js page props types
export interface PageProps<T = any> {
  params: T;
  searchParams: Record<string, string | string[] | undefined>;
}

// Form state types
export interface FormState {
  error?: string;
  success?: boolean;
}
