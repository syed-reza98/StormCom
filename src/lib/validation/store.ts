/**
 * Store Validation Schemas
 * 
 * Zod schemas for store creation and update validation.
 * 
 * @module lib/validation/store
 */

import { z } from 'zod';

export const createStoreSchema = z.object({
  name: z.string().min(2, 'Store name must be at least 2 characters').max(100),
  domain: z.string().min(3).max(63).regex(/^[a-z0-9-]+$/, 'Domain must contain only lowercase letters, numbers, and hyphens'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('Bangladesh'),
  postalCode: z.string().optional(),
  currency: z.string().length(3).default('BDT'),
  timezone: z.string().default('Asia/Dhaka'),
  language: z.string().length(2).default('en'),
  subscriptionPlanId: z.string().cuid(),
});

export const updateStoreSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  domain: z.string().min(3).max(63).regex(/^[a-z0-9-]+$/).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().optional(),
  language: z.string().length(2).optional(),
  onboardingCompleted: z.boolean().optional(),
  allowCouponsWithFlashSale: z.boolean().optional(),
});

export const assignUserToStoreSchema = z.object({
  userId: z.string().cuid(),
  roleId: z.string().cuid(),
  isPrimary: z.boolean().optional().default(false),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
export type AssignUserToStoreInput = z.infer<typeof assignUserToStoreSchema>;
