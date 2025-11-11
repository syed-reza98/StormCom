// src/lib/validation.ts
// Centralized Zod validation schemas for StormCom
// Provides reusable validation logic with custom error messages

import { z } from 'zod';

/**
 * Email validation schema
 * RFC 5322 compliant email format
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase()
  .trim();

/**
 * Password validation schema
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    'Password must contain at least one special character'
  );

/**
 * Password strength validator
 * Returns detailed feedback for password requirements
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
} {
  const errors: string[] = [];
  let score = 0;

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  } else if (password.length >= 8) {
    score += 1;
  }
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character type checks
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong' = 'weak';
  if (score >= 7) strength = 'very-strong';
  else if (score >= 5) strength = 'strong';
  else if (score >= 4) strength = 'medium';

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Phone number validation schema
 * Supports international format with optional country code
 */
export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(
    /^\+?[1-9]\d{1,14}$/,
    'Phone number must be in international format (E.164)'
  )
  .optional();

/**
 * URL validation schema
 * Supports HTTP and HTTPS protocols
 */
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .regex(/^https?:\/\//, 'URL must use HTTP or HTTPS protocol');

/**
 * UUID validation schema (v4)
 */
export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format')
  .trim();

/**
 * CUID validation schema (Prisma default)
 */
export const cuidSchema = z
  .string()
  .min(25, 'Invalid CUID format')
  .max(25, 'Invalid CUID format')
  .regex(/^c[a-z0-9]{24}$/, 'Invalid CUID format')
  .trim();

/**
 * Pagination parameters validation
 */
export const paginationSchema = z.object({
  page: z
    .number()
    .int('Page must be an integer')
    .positive('Page must be positive')
    .default(1),
  perPage: z
    .number()
    .int('Per page must be an integer')
    .positive('Per page must be positive')
    .max(100, 'Per page cannot exceed 100')
    .default(10),
});

/**
 * Sort parameters validation
 */
export const sortSchema = z.object({
  sortBy: z.string().min(1, 'Sort field is required'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Date range validation
 */
export const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine(
  (data) => data.startDate <= data.endDate,
  'Start date must be before or equal to end date'
);

/**
 * Store name validation
 */
export const storeNameSchema = z
  .string()
  .min(1, 'Store name is required')
  .max(100, 'Store name must be less than 100 characters')
  .regex(
    /^[a-zA-Z0-9\s\-&']+$/,
    'Store name can only contain letters, numbers, spaces, hyphens, ampersands, and apostrophes'
  )
  .trim();

/**
 * Store slug validation
 */
export const storeSlugSchema = z
  .string()
  .min(1, 'Store slug is required')
  .max(50, 'Store slug must be less than 50 characters')
  .regex(
    /^[a-z0-9\-]+$/,
    'Store slug can only contain lowercase letters, numbers, and hyphens'
  )
  .trim();

/**
 * Product SKU validation
 */
export const skuSchema = z
  .string()
  .min(1, 'SKU is required')
  .max(50, 'SKU must be less than 50 characters')
  .regex(
    /^[A-Z0-9\-_]+$/,
    'SKU can only contain uppercase letters, numbers, hyphens, and underscores'
  )
  .trim();

/**
 * Price validation (in cents)
 */
export const priceSchema = z
  .number()
  .int('Price must be an integer (in cents)')
  .nonnegative('Price cannot be negative')
  .max(999999999, 'Price exceeds maximum value'); // $9,999,999.99

/**
 * Quantity validation
 */
export const quantitySchema = z
  .number()
  .int('Quantity must be an integer')
  .nonnegative('Quantity cannot be negative');

/**
 * User registration schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  phone: phoneSchema.optional(),
});

/**
 * User login schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  mfaCode: z
    .string()
    .regex(/^\d{6}$/, 'MFA code must be 6 digits')
    .optional(),
});

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

/**
 * Password reset schema
 */
export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

/**
 * Store creation schema
 */
export const createStoreSchema = z.object({
  name: storeNameSchema,
  slug: storeSlugSchema,
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  logo: urlSchema.optional(),
});

/**
 * Product creation schema
 */
export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(200, 'Product name must be less than 200 characters')
    .trim(),
  sku: skuSchema,
  description: z
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional(),
  price: priceSchema,
  compareAtPrice: priceSchema.optional(),
  costPrice: priceSchema.optional(),
  categoryId: cuidSchema.optional(),
  brandId: cuidSchema.optional(),
  images: z
    .array(urlSchema)
    .min(1, 'At least one product image is required')
    .max(10, 'Maximum 10 images allowed'),
  tags: z
    .array(z.string().max(50))
    .max(20, 'Maximum 20 tags allowed')
    .optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

/**
 * Order creation schema
 */
export const createOrderSchema = z.object({
  customerId: cuidSchema.optional(),
  items: z
    .array(
      z.object({
        productId: cuidSchema,
        variantId: cuidSchema.optional(),
        quantity: quantitySchema.positive('Quantity must be at least 1'),
        price: priceSchema,
      })
    )
    .min(1, 'Order must contain at least one item'),
  shippingAddress: z.object({
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    address1: z.string().min(1, 'Address is required').max(255),
    address2: z.string().max(255).optional(),
    city: z.string().min(1, 'City is required').max(100),
    state: z.string().min(1, 'State/Province is required').max(100),
    postalCode: z.string().min(1, 'Postal code is required').max(20),
    country: z.string().min(2, 'Country is required').max(2), // ISO 3166-1 alpha-2
    phone: phoneSchema,
  }),
  billingAddress: z
    .object({
      firstName: z.string().min(1).max(100),
      lastName: z.string().min(1).max(100),
      address1: z.string().min(1).max(255),
      address2: z.string().max(255).optional(),
      city: z.string().min(1).max(100),
      state: z.string().min(1).max(100),
      postalCode: z.string().min(1).max(20),
      country: z.string().min(2).max(2),
      phone: phoneSchema,
    })
    .optional(),
  shippingMethodId: cuidSchema,
  notes: z.string().max(1000).optional(),
});

/**
 * Helper function to validate data against a schema
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Helper function to format Zod errors for API responses
 */
export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(err.message);
  });
  return formatted;
}
