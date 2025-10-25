import { db } from '../../../src/lib/db';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

/**
 * Store fixture utilities for E2E tests
 * Provides functions to create test stores with various configurations
 */

/**
 * Generate unique store slug for test stores
 * Uses timestamp to ensure uniqueness across parallel test runs
 * @param prefix - Slug prefix (e.g., 'test', 'demo')
 * @returns Unique URL-safe slug
 */
export function generateUniqueSlug(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}-store-${timestamp}-${random}`;
}

/**
 * Interface for test store creation options
 */
export interface CreateTestStoreOptions {
  name?: string;
  slug?: string;
  description?: string;
  logo?: string;
  email?: string;
  phone?: string;
  website?: string;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  trialEndsAt?: Date;
  subscriptionEndsAt?: Date;
  productLimit?: number;
  orderLimit?: number;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  locale?: string;
}

/**
 * Create a test store with specified options
 * @param options - Store creation options
 * @returns Created store object
 */
export async function createTestStore(options: CreateTestStoreOptions = {}) {
  const slug = options.slug || generateUniqueSlug();
  const {
    name = `Test Store ${slug}`,
    description = 'A test store for E2E testing',
    logo = null,
    email = `${slug}@stormcom-test.local`,
    phone = '+1234567890',
    website = null,
    subscriptionPlan = SubscriptionPlan.FREE,
    subscriptionStatus = SubscriptionStatus.TRIAL,
    trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    subscriptionEndsAt = null,
    productLimit = 10, // FREE plan default
    orderLimit = 100,  // FREE plan default
    address = '123 Test Street',
    city = 'Test City',
    state = 'TS',
    postalCode = '12345',
    country = 'US',
    currency = 'USD',
    timezone = 'UTC',
    locale = 'en',
  } = options;

  const store = await db.store.create({
    data: {
      name,
      slug,
      description,
      logo,
      email,
      phone,
      website,
      subscriptionPlan,
      subscriptionStatus,
      trialEndsAt,
      subscriptionEndsAt,
      productLimit,
      orderLimit,
      address,
      city,
      state,
      postalCode,
      country,
      currency,
      timezone,
      locale,
    },
  });

  return store;
}

/**
 * Create a FREE plan store (default trial)
 * @param options - Optional store creation options
 * @returns Created FREE plan store
 */
export async function createFreeStore(options: Partial<CreateTestStoreOptions> = {}) {
  return await createTestStore({
    subscriptionPlan: SubscriptionPlan.FREE,
    subscriptionStatus: SubscriptionStatus.TRIAL,
    productLimit: 10,
    orderLimit: 100,
    ...options,
  });
}

/**
 * Create a BASIC plan store
 * @param options - Optional store creation options
 * @returns Created BASIC plan store
 */
export async function createBasicStore(options: Partial<CreateTestStoreOptions> = {}) {
  return await createTestStore({
    subscriptionPlan: SubscriptionPlan.BASIC,
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    productLimit: 100,
    orderLimit: 1000,
    ...options,
  });
}

/**
 * Create a PRO plan store
 * @param options - Optional store creation options
 * @returns Created PRO plan store
 */
export async function createProStore(options: Partial<CreateTestStoreOptions> = {}) {
  return await createTestStore({
    subscriptionPlan: SubscriptionPlan.PRO,
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    productLimit: 1000,
    orderLimit: 10000,
    ...options,
  });
}

/**
 * Create an ENTERPRISE plan store
 * @param options - Optional store creation options
 * @returns Created ENTERPRISE plan store
 */
export async function createEnterpriseStore(options: Partial<CreateTestStoreOptions> = {}) {
  return await createTestStore({
    subscriptionPlan: SubscriptionPlan.ENTERPRISE,
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    productLimit: 999999, // Unlimited representation
    orderLimit: 999999,   // Unlimited representation
    ...options,
  });
}

/**
 * Create a store with expired trial
 * @param options - Optional store creation options
 * @returns Created store with expired trial
 */
export async function createExpiredTrialStore(options: Partial<CreateTestStoreOptions> = {}) {
  return await createTestStore({
    subscriptionPlan: SubscriptionPlan.FREE,
    subscriptionStatus: SubscriptionStatus.TRIAL,
    trialEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
    ...options,
  });
}

/**
 * Create a store with canceled subscription
 * @param options - Optional store creation options
 * @returns Created store with canceled subscription
 */
export async function createCanceledStore(options: Partial<CreateTestStoreOptions> = {}) {
  return await createTestStore({
    subscriptionPlan: SubscriptionPlan.BASIC,
    subscriptionStatus: SubscriptionStatus.CANCELED,
    subscriptionEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Ends in 7 days
    ...options,
  });
}

/**
 * Create a store with paused subscription
 * @param options - Optional store creation options
 * @returns Created store with paused subscription
 */
export async function createPausedStore(options: Partial<CreateTestStoreOptions> = {}) {
  return await createTestStore({
    subscriptionPlan: SubscriptionPlan.PRO,
    subscriptionStatus: SubscriptionStatus.PAUSED,
    ...options,
  });
}

/**
 * Assign a user to a store (update user's storeId)
 * @param userId - User ID to assign
 * @param storeId - Store ID to assign user to
 */
export async function assignUserToStore(userId: string, storeId: string) {
  await db.user.update({
    where: { id: userId },
    data: { storeId },
  });
}

/**
 * Remove user from store (set storeId to null)
 * @param userId - User ID to remove
 */
export async function removeUserFromStore(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: { storeId: null },
  });
}

/**
 * Update store subscription plan
 * @param storeId - Store ID
 * @param plan - New subscription plan
 */
export async function updateStoreSubscription(storeId: string, plan: SubscriptionPlan) {
  const limits = {
    [SubscriptionPlan.FREE]: { productLimit: 10, orderLimit: 100 },
    [SubscriptionPlan.BASIC]: { productLimit: 100, orderLimit: 1000 },
    [SubscriptionPlan.PRO]: { productLimit: 1000, orderLimit: 10000 },
    [SubscriptionPlan.ENTERPRISE]: { productLimit: 999999, orderLimit: 999999 },
  };

  await db.store.update({
    where: { id: storeId },
    data: {
      subscriptionPlan: plan,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      ...limits[plan],
    },
  });
}

/**
 * Update store settings
 * @param storeId - Store ID
 * @param settings - Settings to update
 */
export async function updateStoreSettings(
  storeId: string,
  settings: {
    currency?: string;
    timezone?: string;
    locale?: string;
  }
) {
  await db.store.update({
    where: { id: storeId },
    data: settings,
  });
}

/**
 * Soft delete a store (set deletedAt)
 * @param storeId - Store ID to soft delete
 */
export async function softDeleteStore(storeId: string) {
  await db.store.update({
    where: { id: storeId },
    data: { deletedAt: new Date() },
  });
}

/**
 * Restore a soft-deleted store (set deletedAt to null)
 * @param storeId - Store ID to restore
 */
export async function restoreStore(storeId: string) {
  await db.store.update({
    where: { id: storeId },
    data: { deletedAt: null },
  });
}

/**
 * Delete a test store permanently
 * @param storeId - Store ID to delete
 */
export async function deleteTestStore(storeId: string) {
  await db.store.delete({
    where: { id: storeId },
  });
}

/**
 * Delete all test stores matching slug pattern
 * @param slugPattern - Slug pattern to match (e.g., 'test-store-%')
 */
export async function deleteTestStores(slugPattern: string = 'test-store-%') {
  await db.store.deleteMany({
    where: {
      slug: {
        startsWith: slugPattern.replace('%', ''),
      },
    },
  });
}

/**
 * Find store by slug
 * @param slug - Store slug
 * @returns Store object or null
 */
export async function findStoreBySlug(slug: string) {
  return await db.store.findUnique({
    where: { slug },
  });
}

/**
 * Find store by ID with users included
 * @param storeId - Store ID
 * @returns Store with users or null
 */
export async function findStoreWithUsers(storeId: string) {
  return await db.store.findUnique({
    where: { id: storeId },
    include: {
      users: true,
    },
  });
}

/**
 * Get store statistics (product count, order count, user count)
 * @param storeId - Store ID
 * @returns Object with store statistics
 */
export async function getStoreStatistics(storeId: string) {
  const [productCount, orderCount, userCount] = await Promise.all([
    db.product.count({ where: { storeId } }),
    db.order.count({ where: { storeId } }),
    db.user.count({ where: { storeId } }),
  ]);

  return {
    productCount,
    orderCount,
    userCount,
  };
}

/**
 * Check if store has reached product limit
 * @param storeId - Store ID
 * @returns True if product limit reached
 */
export async function hasReachedProductLimit(storeId: string): Promise<boolean> {
  const store = await db.store.findUnique({
    where: { id: storeId },
    select: { productLimit: true },
  });

  if (!store) {
    throw new Error(`Store ${storeId} not found`);
  }

  const productCount = await db.product.count({ where: { storeId } });
  return productCount >= store.productLimit;
}

/**
 * Check if store subscription is active
 * @param storeId - Store ID
 * @returns True if subscription is active or in trial
 */
export async function isSubscriptionActive(storeId: string): Promise<boolean> {
  const store = await db.store.findUnique({
    where: { id: storeId },
    select: { subscriptionStatus: true, trialEndsAt: true },
  });

  if (!store) {
    throw new Error(`Store ${storeId} not found`);
  }

  // Active subscription
  if (store.subscriptionStatus === SubscriptionStatus.ACTIVE) {
    return true;
  }

  // Valid trial (not expired)
  if (
    store.subscriptionStatus === SubscriptionStatus.TRIAL &&
    store.trialEndsAt &&
    store.trialEndsAt > new Date()
  ) {
    return true;
  }

  return false;
}
