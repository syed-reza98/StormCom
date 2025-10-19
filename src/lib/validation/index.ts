// src/lib/validation/index.ts

import { z } from 'zod';

/**
 * Base Zod validation helpers for API and forms
 */

export const emailSchema = z.string().email({ message: 'Invalid email address' });
export const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .max(64, { message: 'Password must be at most 64 characters' });

export const idSchema = z.string().cuid({ message: 'Invalid ID format' });

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
