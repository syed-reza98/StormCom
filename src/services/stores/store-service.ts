/**
 * Store Service
 * 
 * Handles store CRUD operations, settings management, and multi-tenant isolation.
 * 
 * @module services/stores/store-service
 */

import { prisma } from '@/lib/prisma';
import type { Store, Prisma } from '@prisma/client';

export interface CreateStoreInput {
  name: string;
  domain: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  currency?: string;
  timezone?: string;
  language?: string;
  subscriptionPlanId: string;
}

export interface UpdateStoreInput {
  name?: string;
  domain?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  currency?: string;
  timezone?: string;
  language?: string;
  onboardingCompleted?: boolean;
  allowCouponsWithFlashSale?: boolean;
}

export interface StoreSettings {
  currency: string;
  timezone: string;
  language: string;
  allowCouponsWithFlashSale: boolean;
  onboardingCompleted: boolean;
}

/**
 * Create a new store
 * Requires SUPER_ADMIN role
 */
export async function createStore(data: CreateStoreInput): Promise<Store> {
  // Check if domain already exists
  const existingStore = await prisma.store.findFirst({
    where: {
      OR: [
        { domain: data.domain },
        { email: data.email },
      ],
      deletedAt: null,
    },
  });

  if (existingStore) {
    if (existingStore.domain === data.domain) {
      throw new Error('A store with this domain already exists');
    }
    if (existingStore.email === data.email) {
      throw new Error('A store with this email already exists');
    }
  }

  // Create store with default settings
  const store = await prisma.store.create({
    data: {
      name: data.name,
      domain: data.domain,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country || 'Bangladesh',
      postalCode: data.postalCode,
      currency: data.currency || 'BDT',
      timezone: data.timezone || 'Asia/Dhaka',
      language: data.language || 'en',
      subscriptionPlanId: data.subscriptionPlanId,
      onboardingCompleted: false,
      allowCouponsWithFlashSale: false,
    },
  });

  return store;
}

/**
 * Get store by ID
 * Returns null if store doesn't exist or is soft deleted
 */
export async function getStoreById(storeId: string): Promise<Store | null> {
  const store = await prisma.store.findFirst({
    where: {
      id: storeId,
      deletedAt: null,
    },
    include: {
      subscriptionPlan: true,
    },
  });

  return store as Store | null;
}

/**
 * List all stores with pagination
 * Super Admin only - sees all stores
 */
export async function listStores(params: {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ stores: Store[]; total: number }> {
  const page = params.page || 1;
  const perPage = Math.min(params.perPage || 20, 100);
  const skip = (page - 1) * perPage;

  const where: Prisma.StoreWhereInput = {
    deletedAt: null,
  };

  // Add search filter
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { domain: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      where,
      take: perPage,
      skip,
      orderBy: params.sortBy
        ? { [params.sortBy]: params.sortOrder || 'asc' }
        : { createdAt: 'desc' },
      include: {
        subscriptionPlan: true,
      },
    }),
    prisma.store.count({ where }),
  ]);

  return { stores: stores as Store[], total };
}

/**
 * Update store by ID
 * Super Admin or Store Owner/Admin
 */
export async function updateStore(
  storeId: string,
  data: UpdateStoreInput
): Promise<Store> {
  // Check if store exists
  const existingStore = await getStoreById(storeId);
  if (!existingStore) {
    throw new Error('Store not found');
  }

  // Check for domain/email conflicts
  if (data.domain || data.email) {
    const conflictStore = await prisma.store.findFirst({
      where: {
        OR: [
          ...(data.domain ? [{ domain: data.domain }] : []),
          ...(data.email ? [{ email: data.email }] : []),
        ],
        NOT: { id: storeId },
        deletedAt: null,
      },
    });

    if (conflictStore) {
      if (conflictStore.domain === data.domain) {
        throw new Error('A store with this domain already exists');
      }
      if (conflictStore.email === data.email) {
        throw new Error('A store with this email already exists');
      }
    }
  }

  const store = await prisma.store.update({
    where: { id: storeId },
    data,
    include: {
      subscriptionPlan: true,
    },
  });

  return store as Store;
}

/**
 * Delete store (soft delete)
 * Super Admin only
 */
export async function deleteStore(storeId: string): Promise<void> {
  const store = await getStoreById(storeId);
  if (!store) {
    throw new Error('Store not found');
  }

  await prisma.store.update({
    where: { id: storeId },
    data: { deletedAt: new Date() },
  });
}

/**
 * Get store settings
 */
export async function getStoreSettings(storeId: string): Promise<StoreSettings> {
  const store = await getStoreById(storeId);
  if (!store) {
    throw new Error('Store not found');
  }

  return {
    currency: store.currency,
    timezone: store.timezone,
    language: store.language,
    allowCouponsWithFlashSale: store.allowCouponsWithFlashSale,
    onboardingCompleted: store.onboardingCompleted,
  };
}

/**
 * Update store settings
 */
export async function updateStoreSettings(
  storeId: string,
  settings: Partial<StoreSettings>
): Promise<StoreSettings> {
  const updatedStore = await prisma.store.update({
    where: { id: storeId },
    data: settings,
  });

  return {
    currency: updatedStore.currency,
    timezone: updatedStore.timezone,
    language: updatedStore.language,
    allowCouponsWithFlashSale: updatedStore.allowCouponsWithFlashSale,
    onboardingCompleted: updatedStore.onboardingCompleted,
  };
}
