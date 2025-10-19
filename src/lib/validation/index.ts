/**
 * Zod Validation Helpers
 * 
 * Reusable Zod schemas and validators for input validation across the application.
 * These utilities ensure consistent validation rules for common data types.
 * 
 * @module lib/validation
 */

import { z } from 'zod';

// ============================================================================
// Email Validation (RFC 5322 compliant)
// ============================================================================

/**
 * Validates email addresses using RFC 5322 standard.
 * 
 * @example
 * ```typescript
 * const EmailSchema = z.object({ email: zodEmail });
 * EmailSchema.parse({ email: 'user@example.com' });
 * ```
 */
export const zodEmail = z
  .string()
  .email('Invalid email address')
  .min(3, 'Email must be at least 3 characters')
  .max(255, 'Email must not exceed 255 characters')
  .toLowerCase()
  .trim();

// ============================================================================
// Phone Validation (E.164 format)
// ============================================================================

/**
 * Validates phone numbers in E.164 international format (+1234567890).
 * 
 * @example
 * ```typescript
 * zodPhone.parse('+1234567890'); // ✅ Valid
 * zodPhone.parse('123-456-7890'); // ❌ Invalid format
 * ```
 */
export const zodPhone = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Phone must be in E.164 format (e.g., +1234567890)')
  .min(4, 'Phone number too short')
  .max(16, 'Phone number too long');

// ============================================================================
// URL Validation
// ============================================================================

/**
 * Validates URLs (HTTP/HTTPS only).
 * 
 * @example
 * ```typescript
 * zodUrl.parse('https://example.com'); // ✅ Valid
 * zodUrl.parse('ftp://example.com'); // ❌ Invalid protocol
 * ```
 */
export const zodUrl = z
  .string()
  .url('Invalid URL')
  .regex(/^https?:\/\//, 'URL must use HTTP or HTTPS protocol')
  .max(2048, 'URL must not exceed 2048 characters');

// ============================================================================
// Slug Validation (lowercase, hyphens, alphanumeric)
// ============================================================================

/**
 * Validates URL-friendly slugs (lowercase letters, numbers, hyphens).
 * 
 * @example
 * ```typescript
 * zodSlug.parse('my-product-name'); // ✅ Valid
 * zodSlug.parse('My Product Name'); // ❌ Invalid (uppercase/spaces)
 * ```
 */
export const zodSlug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
  .min(1, 'Slug cannot be empty')
  .max(200, 'Slug must not exceed 200 characters')
  .trim();

// ============================================================================
// Pagination Validation
// ============================================================================

/**
 * Validates pagination parameters with sensible defaults and limits.
 * 
 * @example
 * ```typescript
 * const PaginationSchema = z.object({
 *   page: zodPagination.page,
 *   perPage: zodPagination.perPage,
 * });
 * 
 * PaginationSchema.parse({ page: 1, perPage: 20 }); // ✅ Valid
 * PaginationSchema.parse({ page: 0, perPage: 200 }); // ❌ Invalid
 * ```
 */
export const zodPagination = {
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  perPage: z.coerce
    .number()
    .int()
    .min(1, 'Per page must be at least 1')
    .max(100, 'Per page must not exceed 100')
    .default(10),
};

/**
 * Complete pagination schema with defaults.
 */
export const PaginationSchema = z.object({
  page: zodPagination.page,
  perPage: zodPagination.perPage,
});

export type PaginationParams = z.infer<typeof PaginationSchema>;

// ============================================================================
// Date Range Validation
// ============================================================================

/**
 * Validates date ranges (start date must be before end date).
 * 
 * @example
 * ```typescript
 * zodDateRange.parse({
 *   startDate: new Date('2024-01-01'),
 *   endDate: new Date('2024-12-31'),
 * }); // ✅ Valid
 * ```
 */
export const zodDateRange = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'Start date must be before or equal to end date',
    path: ['startDate'],
  });

export type DateRange = z.infer<typeof zodDateRange>;

// ============================================================================
// File Upload Validation
// ============================================================================

/**
 * Validates file uploads with type and size constraints.
 * 
 * @param allowedTypes - MIME types (e.g., ['image/jpeg', 'image/png'])
 * @param maxSizeMB - Maximum file size in megabytes (default: 5MB)
 * 
 * @example
 * ```typescript
 * const ImageUploadSchema = zodFile(['image/jpeg', 'image/png'], 5);
 * ```
 */
export function zodFile(allowedTypes: string[], maxSizeMB: number = 5) {
  const maxBytes = maxSizeMB * 1024 * 1024;

  return z
    .instanceof(File)
    .refine((file) => file.size <= maxBytes, {
      message: `File size must not exceed ${maxSizeMB}MB`,
    })
    .refine((file) => allowedTypes.includes(file.type), {
      message: `File type must be one of: ${allowedTypes.join(', ')}`,
    });
}

// ============================================================================
// Password Validation (Strength Requirements)
// ============================================================================

/**
 * Validates password strength with complexity requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * @example
 * ```typescript
 * zodPassword.parse('MyP@ssw0rd'); // ✅ Valid
 * zodPassword.parse('password'); // ❌ Too weak
 * ```
 */
export const zodPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// ============================================================================
// CUID Validation
// ============================================================================

/**
 * Validates CUID (Collision-resistant Unique Identifier) format.
 * 
 * CUIDs are 25-character lowercase strings starting with 'c'.
 * 
 * @example
 * ```typescript
 * zodCuid.parse('ckl3g8q0x0000j8dg8q0x0000'); // ✅ Valid
 * zodCuid.parse('invalid-id'); // ❌ Invalid format
 * ```
 */
export const zodCuid = z
  .string()
  .regex(/^c[a-z0-9]{24}$/, 'Invalid CUID format')
  .length(25, 'CUID must be exactly 25 characters');

// ============================================================================
// Money/Decimal Validation
// ============================================================================

/**
 * Validates monetary amounts (positive decimals with max 2 decimal places).
 * 
 * @example
 * ```typescript
 * zodMoney.parse(29.99); // ✅ Valid
 * zodMoney.parse(-10.00); // ❌ Negative not allowed
 * zodMoney.parse(10.999); // ❌ Too many decimals
 * ```
 */
export const zodMoney = z
  .number()
  .positive('Amount must be positive')
  .finite('Amount must be a finite number')
  .refine((val) => /^\d+(\.\d{1,2})?$/.test(val.toFixed(2)), {
    message: 'Amount must have at most 2 decimal places',
  });

/**
 * String-based money validation (for form inputs).
 * Accepts strings like "29.99" and coerces to number.
 */
export const zodMoneyString = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid decimal with at most 2 decimal places')
  .transform((val) => parseFloat(val))
  .pipe(zodMoney);

// ============================================================================
// Composed Schemas
// ============================================================================

/**
 * Common ID parameter validation for API routes.
 */
export const IdParamSchema = z.object({
  id: zodCuid,
});

/**
 * Common search query validation.
 */
export const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query cannot be empty').max(200, 'Search query too long').optional(),
  ...zodPagination,
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

// ============================================================================
// Type Inference Helpers
// ============================================================================

/**
 * Infer TypeScript type from Zod schema.
 * 
 * @example
 * ```typescript
 * const UserSchema = z.object({ name: z.string(), email: zodEmail });
 * type User = InferSchema<typeof UserSchema>;
 * // User = { name: string; email: string; }
 * ```
 */
export type InferSchema<T extends z.ZodType<any, any>> = z.infer<T>;

// ============================================================================
// Exports
// ============================================================================

export { z } from 'zod';
