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
export function createEnumSchema<T extends readonly [string, ...string[]]>(values: T, name: string) {
  return z.enum(values, {
    errorMap: () => ({ message: `Invalid ${name}` }),
  });
}

/**
 * Helper to make all fields optional (for PATCH updates)
 */
export function makeOptional<T extends z.ZodObject<any>>(schema: T): z.ZodObject<any> {
  return schema.partial();
}

/**
 * Helper to strip unknown fields from input
 */
export function strictSchema<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).strict();
}
