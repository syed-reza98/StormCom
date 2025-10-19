#!/bin/bash

# Phase 1 Implementation Script for StormCom
# Implements tasks T001-T012d from specs/001-multi-tenant-ecommerce/tasks.md

set -e  # Exit on error

echo "==================================="
echo "Phase 1 Setup - StormCom"
echo "==================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        print_status 0 "Found: $1"
        return 0
    else
        print_status 1 "Missing: $1"
        return 1
    fi
}

echo "Checking existing files..."
echo ""

# Check existing files (T001-T006)
check_file ".env.example" && echo "  T001: ✅ Environment example file exists"
check_file "prisma/seed.ts" && echo "  T002: ✅ Prisma seed harness exists"
check_file "src/lib/prisma.ts" && echo "  T003/T003a: ✅ Prisma client singleton exists"
check_file "src/lib/auth.ts" && echo "  T004: ✅ NextAuth config exists"
check_file "src/lib/errors.ts" && echo "  T005: ✅ API error handler exists"
check_file "src/lib/response.ts" && echo "  T006: ✅ Response helper exists"

echo ""
echo "Creating remaining Phase 1 files..."
echo ""

# T007: Create Zod validation base helpers
echo "T007: Creating Zod validation helpers..."
mkdir -p src/lib/validation
cat > src/lib/validation/index.ts << 'EOF'
import { z } from 'zod';

/**
 * Common Zod validation schemas and helpers
 * Used across the application for consistent validation
 */

// Email validation
export const emailSchema = z.string().email('Invalid email address');

// Password validation (min 8 chars, uppercase, lowercase, number, special char)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Phone number validation
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number');

// URL validation
export const urlSchema = z.string().url('Invalid URL');

// CUID validation (Prisma default ID format)
export const cuidSchema = z.string().cuid('Invalid ID format');

// Date validation helpers
export const dateStringSchema = z.string().datetime('Invalid date format');
export const futureDateSchema = z.date().refine((date) => date > new Date(), {
  message: 'Date must be in the future',
});
export const pastDateSchema = z.date().refine((date) => date < new Date(), {
  message: 'Date must be in the past',
});

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(10),
});

// Sort order schema
export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc');

// Common field validations
export const nonEmptyStringSchema = z.string().min(1, 'This field is required');
export const optionalStringSchema = z.string().optional();

// Numeric validations
export const positiveNumberSchema = z.number().positive('Must be a positive number');
export const nonNegativeNumberSchema = z.number().nonnegative('Must be non-negative');

// Price validation (decimal with 2 decimal places)
export const priceSchema = z.number().nonnegative('Price must be non-negative').multipleOf(0.01);

// Slug validation (URL-safe string)
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens');

/**
 * Helper to create a validated enum schema
 */
export function createEnumSchema<T extends readonly string[]>(values: T, name: string) {
  return z.enum(values as [string, ...string[]], {
    errorMap: () => ({ message: `Invalid ${name}` }),
  });
}

/**
 * Helper to make all fields optional (for PATCH updates)
 */
export function makeOptional<T extends z.ZodTypeAny>(schema: T) {
  return schema.partial();
}

/**
 * Helper to strip unknown fields from input
 */
export function strictSchema<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).strict();
}
EOF
print_status $? "Created src/lib/validation/index.ts"

# T008: Add rate limit utility (Upstash)
echo "T008: Creating rate limit utility..."
mkdir -p src/lib
cat > src/lib/rate-limit.ts << 'EOF'
import { Redis } from '@upstash/redis';

/**
 * Rate limiting utility using Upstash Redis
 * Implements token bucket algorithm for tiered rate limiting
 */

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Rate limit tiers based on subscription plan
export const RATE_LIMITS = {
  FREE: {
    requests: 100, // requests per window
    window: 60, // seconds
  },
  STARTER: {
    requests: 500,
    window: 60,
  },
  PROFESSIONAL: {
    requests: 2000,
    window: 60,
  },
  ENTERPRISE: {
    requests: 10000,
    window: 60,
  },
} as const;

export type RateLimitTier = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

/**
 * Check rate limit for a given identifier and tier
 * @param identifier - Unique identifier (e.g., IP address, user ID, store ID)
 * @param tier - Rate limit tier based on subscription plan
 * @returns RateLimitResult with limit information
 */
export async function rateLimit(
  identifier: string,
  tier: RateLimitTier = 'FREE'
): Promise<RateLimitResult> {
  // If Redis is not configured, allow all requests (development mode)
  if (!redis) {
    console.warn('Rate limiting is disabled (Redis not configured)');
    return {
      success: true,
      limit: RATE_LIMITS[tier].requests,
      remaining: RATE_LIMITS[tier].requests,
      reset: Date.now() + RATE_LIMITS[tier].window * 1000,
    };
  }

  const limit = RATE_LIMITS[tier].requests;
  const window = RATE_LIMITS[tier].window;
  const key = `ratelimit:${tier}:${identifier}`;

  try {
    // Use Redis INCR with EXPIRE for atomic rate limiting
    const count = await redis.incr(key);
    
    if (count === 1) {
      // First request in window, set expiration
      await redis.expire(key, window);
    }

    const ttl = await redis.ttl(key);
    const reset = Date.now() + ttl * 1000;
    const remaining = Math.max(0, limit - count);

    return {
      success: count <= limit,
      limit,
      remaining,
      reset,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // On error, allow request but log the issue
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Date.now() + window * 1000,
    };
  }
}

/**
 * Middleware helper to check rate limit and return headers
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}

/**
 * Reset rate limit for a given identifier (admin function)
 */
export async function resetRateLimit(identifier: string, tier: RateLimitTier = 'FREE'): Promise<void> {
  if (!redis) return;
  
  const key = `ratelimit:${tier}:${identifier}`;
  await redis.del(key);
}
EOF
print_status $? "Created src/lib/rate-limit.ts"

# T009: Configure Tailwind + shadcn/ui base styles
echo "T009: Creating Tailwind configuration and globals.css..."
mkdir -p src/app
cat > src/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
EOF
print_status $? "Created src/app/globals.css"

cat > tailwind.config.ts << 'EOF'
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      screens: {
        xs: '475px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
EOF
print_status $? "Created tailwind.config.ts"

# T009a: Add dark mode support with theme toggle
echo "T009a: Creating theme toggle component..."
mkdir -p src/components
cat > src/components/theme-toggle.tsx << 'EOF'
'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

/**
 * Theme toggle component with dark mode support
 * Uses next-themes for theme management
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10"
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
EOF
print_status $? "Created src/components/theme-toggle.tsx"

# T010: Add shared types barrel
echo "T010: Creating shared types..."
mkdir -p src/types
cat > src/types/index.ts << 'EOF'
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
EOF
print_status $? "Created src/types/index.ts"

# T011: Add constants (roles, statuses, limits)
echo "T011: Creating constants..."
cat > src/lib/constants.ts << 'EOF'
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
EOF
print_status $? "Created src/lib/constants.ts"

# T012: Configure Sentry client/server initialization
echo "T012: Creating Sentry monitoring configuration..."
mkdir -p src/lib/monitoring
cat > src/lib/monitoring/sentry.ts << 'EOF'
import * as Sentry from '@sentry/nextjs';

/**
 * Sentry monitoring configuration
 * Provides error tracking, performance monitoring, and breadcrumbs
 */

// Check if Sentry is configured
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Initialize Sentry for client-side
 */
export function initSentryClient() {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    enabled: IS_PRODUCTION,
    tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: ['localhost', /^https:\/\/.*\.vercel\.app/],
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    beforeSend(event, hint) {
      // Filter out non-critical errors in development
      if (!IS_PRODUCTION && event.level === 'warning') {
        return null;
      }
      return event;
    },
  });
}

/**
 * Initialize Sentry for server-side
 */
export function initSentryServer() {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    enabled: IS_PRODUCTION,
    tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Prisma({ client: undefined }), // Will be configured later
    ],
    beforeSend(event, hint) {
      // Filter sensitive data
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });
}

/**
 * Add custom breadcrumb for multi-tenant context
 */
export function addTenantBreadcrumb(storeId: string, storeName?: string) {
  Sentry.addBreadcrumb({
    category: 'tenant',
    message: `Store context: ${storeName || storeId}`,
    level: 'info',
    data: { storeId, storeName },
  });
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(userId: string, email?: string, role?: string) {
  Sentry.setUser({
    id: userId,
    email,
    role,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Capture exception with additional context
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Add custom tags to events
 */
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

/**
 * Add custom context to events
 */
export function setContext(name: string, context: Record<string, any>) {
  Sentry.setContext(name, context);
}
EOF
print_status $? "Created src/lib/monitoring/sentry.ts"

# T012c: Add Sentry error boundary components
echo "T012c: Creating Sentry error boundary..."
cat > src/components/error-boundary.tsx << 'EOF'
'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * Error boundary component for catching and reporting React errors
 * Integrates with Sentry for error tracking
 */

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="w-full max-w-md space-y-4 text-center">
            <h1 className="text-4xl font-bold text-destructive">Oops!</h1>
            <p className="text-lg text-muted-foreground">
              Something went wrong. We've been notified and are working on it.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary for functional components
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      Sentry.captureException(error);
    }
  }, [error]);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, setError, resetError };
}
EOF
print_status $? "Created src/components/error-boundary.tsx"

# T012d: Configure Sentry source map upload
echo "T012d: Creating Sentry config..."
cat > sentry.config.js << 'EOF'
/**
 * Sentry configuration for source map upload
 * This file is used by @sentry/nextjs to configure Sentry
 */

module.exports = {
  // Automatically upload source maps during build
  automaticVercelMonitors: true,
  
  // Organization and project settings
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Auth token for uploading
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Silent mode (no console output during build)
  silent: true,
  
  // Hide source maps from public
  hideSourceMaps: true,
  
  // Disable Sentry SDK during build
  disableServerWebpackPlugin: process.env.NODE_ENV !== 'production',
  disableClientWebpackPlugin: process.env.NODE_ENV !== 'production',
  
  // Webpack plugin options
  widenClientFileUpload: true,
  transpileClientSDK: true,
};
EOF
print_status $? "Created sentry.config.js"

echo ""
echo "==================================="
echo "Phase 1 Implementation Complete!"
echo "==================================="
echo ""
echo "Summary:"
echo "- T001-T006: ✅ Already existed (verified)"
echo "- T007: ✅ Zod validation helpers"
echo "- T008: ✅ Rate limit utility"
echo "- T009: ✅ Tailwind config + globals.css"
echo "- T009a: ✅ Theme toggle component"
echo "- T009b: ✅ Responsive breakpoints (in tailwind.config.ts)"
echo "- T010: ✅ Shared types"
echo "- T011: ✅ Constants"
echo "- T012: ✅ Sentry monitoring"
echo "- T012a: ✅ Tenant breadcrumbs (in sentry.ts)"
echo "- T012b: ✅ Performance monitoring (in sentry.ts)"
echo "- T012c: ✅ Error boundary component"
echo "- T012d: ✅ Sentry source map config"
echo ""
echo "Next steps:"
echo "1. Install missing dependencies: npm install next-themes tailwindcss-animate"
echo "2. Run: npm run type-check"
echo "3. Update tasks.md to mark Phase 1 as complete"
echo ""
EOF
chmod +x /home/runner/work/StormCom/StormCom/implement-phase1.sh
print_status $? "Created implementation script"
