// tests/integration/helpers/test-data.ts
// Test data factories and utilities for integration tests

import { getTestPrismaClient } from './database';
import { randomBytes } from 'crypto';

const prisma = getTestPrismaClient;

/**
 * Create a test store with optional custom data
 * @param customData Optional store data overrides
 * @returns Created store object
 */
export async function createTestStore(name?: string, customData?: any) {
  const storeData = {
    name: name || `Test Store ${randomBytes(4).toString('hex')}`,
    slug: `test-store-${randomBytes(4).toString('hex')}`,
    description: 'Test store for integration testing',
    email: `test-${randomBytes(4).toString('hex')}@example.com`,
    currency: 'USD',
    timezone: 'UTC',
    locale: 'en',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...customData,
  };

  return await prisma().$transaction(async (tx) => {
    return await tx.store.create({
      data: storeData,
    });
  });
}

/**
 * Create a test user associated with a store
 * @param storeId Store ID to associate user with
 * @param customData Optional user data overrides
 * @returns Created user object
 */
export async function createTestUser(storeId: string, customData?: any) {
  const userData = {
    email: `test-${randomBytes(4).toString('hex')}@example.com`,
    name: `Test User ${randomBytes(4).toString('hex')}`,
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/6Btj6OgUu', // hashed "password"
    role: 'CUSTOMER',
    storeId,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...customData,
  };

  return await prisma().$transaction(async (tx) => {
    return await tx.user.create({
      data: userData,
    });
  });
}

/**
 * Create a test admin user for a store
 * @param storeId Store ID to associate admin with
 * @param customData Optional user data overrides
 * @returns Created admin user object
 */
export async function createTestAdmin(storeId: string, customData?: any) {
  return await createTestUser(storeId, {
    role: 'STORE_ADMIN',
    name: `Test Admin ${randomBytes(4).toString('hex')}`,
    ...customData,
  });
}

/**
 * Create a test category for a store
 * @param storeId Store ID to associate category with
 * @param customData Optional category data overrides
 * @returns Created category object
 */
export async function createTestCategory(storeId: string, customData?: any) {
  const categoryData = {
    name: `Test Category ${randomBytes(4).toString('hex')}`,
    slug: `test-category-${randomBytes(4).toString('hex')}`,
    description: 'Test category for integration testing',
    isPublished: true,
    sortOrder: 0,
    storeId,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...customData,
  };

  return await prisma().$transaction(async (tx) => {
    return await tx.category.create({
      data: categoryData,
    });
  });
}

/**
 * Create a test product for a store
 * @param storeId Store ID to associate product with
 * @param categoryId Category ID to associate product with
 * @param customData Optional product data overrides
 * @returns Created product object
 */
export async function createTestProduct(storeId: string, categoryId: string, customData?: any) {
  const productData = {
    name: `Test Product ${randomBytes(4).toString('hex')}`,
    slug: `test-product-${randomBytes(4).toString('hex')}`,
    description: 'Test product for integration testing',
    shortDescription: 'Test product short description',
    sku: `TEST-${randomBytes(4).toString('hex').toUpperCase()}`,
    price: 99.99,
    compareAtPrice: 79.99,
    categoryId,
    storeId,
    weight: 1.0,
    length: 10.0,
    width: 10.0,
    height: 5.0,
    images: JSON.stringify([]),
    metaKeywords: JSON.stringify(['test', 'integration']),
    isPublished: true,
    isFeatured: false,
    inventoryQty: 100,
    lowStockThreshold: 10,
    trackInventory: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...customData,
  };

  return await prisma().$transaction(async (tx) => {
    return await tx.product.create({
      data: productData,
    });
  });
}

/**
 * Create a test product attribute for testing
 * @param customData Optional attribute data overrides
 * @returns Created product attribute object
 */
export async function createTestAttribute(customData?: any) {
  const attributeData = {
    name: `Test Attribute ${randomBytes(4).toString('hex')}`,
    values: JSON.stringify(['Small', 'Medium', 'Large']),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...customData,
  };

  return await prisma().$transaction(async (tx) => {
    return await tx.productAttribute.create({
      data: attributeData,
    });
  });
}

/**
 * Create a test product attribute value for a product
 * @param productId Product ID to associate value with
 * @param attributeId Attribute ID to associate value with
 * @param customData Optional value data overrides
 * @returns Created product attribute value object
 */
export async function createTestAttributeValue(productId: string, attributeId: string, customData?: any) {
  const valueData = {
    productId,
    attributeId,
    value: 'Medium',
    createdAt: new Date(),
    ...customData,
  };

  return await prisma().$transaction(async (tx) => {
    return await tx.productAttributeValue.create({
      data: valueData,
    });
  });
}

/**
 * Create a test customer for a store
 * @param storeId Store ID to associate customer with
 * @param customData Optional customer data overrides
 * @returns Created customer object
 */
export async function createTestCustomer(storeId: string, customData?: any) {
  const customerData = {
    email: `customer-${randomBytes(4).toString('hex')}@example.com`,
    firstName: `Customer ${randomBytes(4).toString('hex')}`,
    lastName: 'Test',
    phone: '+1234567890',
    storeId,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...customData,
  };

  return await prisma().$transaction(async (tx) => {
    return await tx.customer.create({
      data: customerData,
    });
  });
}

/**
 * Create a test order for a customer
 * @param customerId Customer ID to associate order with
 * @param storeId Store ID to associate order with
 * @param customData Optional order data overrides
 * @returns Created order object
 */
export async function createTestOrder(customerId: string, storeId: string, customData?: any) {
  const orderData = {
    orderNumber: `ORD-${randomBytes(6).toString('hex').toUpperCase()}`,
    status: 'PENDING',
    subtotal: 99.99,
    taxAmount: 8.00,
    shippingAmount: 10.00,
    discountAmount: 0.00,
    totalAmount: 117.99,
    paymentStatus: 'PENDING',
    customerId,
    storeId,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...customData,
  };

  return await prisma().$transaction(async (tx) => {
    return await tx.order.create({
      data: orderData,
    });
  });
}

/**
 * Create a test order item for an order
 * @param orderId Order ID to associate item with
 * @param productId Product ID to associate item with
 * @param customData Optional order item data overrides
 * @returns Created order item object
 */
export async function createTestOrderItem(orderId: string, productId: string, customData?: any) {
  const itemData = {
    orderId,
    productId,
    productName: 'Test Product',
    sku: 'TEST-001',
    price: 99.99,
    quantity: 2,
    subtotal: 199.98,
    taxAmount: 16.00,
    discountAmount: 0.00,
    totalAmount: 215.98,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...customData,
  };

  return await prisma().$transaction(async (tx) => {
    return await tx.orderItem.create({
      data: itemData,
    });
  });
}

/**
 * Create a complete test setup with store, users, categories, and products
 * @param options Configuration options for test setup
 * @returns Object containing all created test entities
 */
export async function createTestSetup(options: {
  storeName?: string;
  categoriesCount?: number;
  productsCount?: number;
  usersCount?: number;
  customersCount?: number;
} = {}) {
  const {
    storeName = 'Test Store',
    categoriesCount = 3,
    productsCount = 5,
    usersCount = 2,
    customersCount = 3,
  } = options;

  // Create store
  const store = await createTestStore(storeName);

  // Create users
  const users = [];
  for (let i = 0; i < usersCount; i++) {
    const user = await createTestUser(store.id, {
      role: i === 0 ? 'ADMIN' : 'USER',
    });
    users.push(user);
  }

  // Create categories
  const categories = [];
  for (let i = 0; i < categoriesCount; i++) {
    const category = await createTestCategory(store.id, {
      sortOrder: i,
    });
    categories.push(category);
  }

  // Create products
  const products = [];
  for (let i = 0; i < productsCount; i++) {
    const categoryIndex = i % categories.length;
    const product = await createTestProduct(store.id, categories[categoryIndex].id);
    products.push(product);
  }

  // Create customers
  const customers = [];
  for (let i = 0; i < customersCount; i++) {
    const customer = await createTestCustomer(store.id);
    customers.push(customer);
  }

  return {
    store,
    users,
    categories,
    products,
    customers,
  };
}

/**
 * Clean up test data by store ID
 * @param storeId Store ID to clean up data for
 */
export async function cleanupTestData(storeId: string): Promise<void> {
  await prisma().$transaction(async (tx) => {
    // Delete in reverse dependency order
    await tx.orderItem.deleteMany({ where: { order: { storeId } } });
    await tx.order.deleteMany({ where: { storeId } });
    await tx.payment.deleteMany({ where: { storeId } });
    await tx.review.deleteMany({ where: { storeId } });
    await tx.customer.deleteMany({ where: { storeId } });
    await tx.productAttributeValue.deleteMany({ where: { product: { storeId } } });
    await tx.product.deleteMany({ where: { storeId } });
    await tx.category.deleteMany({ where: { storeId } });
    await tx.brand.deleteMany({ where: { storeId } });
    await tx.user.deleteMany({ where: { storeId } });
    await tx.store.delete({ where: { id: storeId } });
  });
}

/**
 * Generate random test email
 * @param domain Optional domain override
 * @returns Random email address
 */
export function generateTestEmail(domain = 'example.com'): string {
  return `test-${randomBytes(4).toString('hex')}@${domain}`;
}

/**
 * Generate random test slug
 * @param prefix Optional prefix for slug
 * @returns Random slug
 */
export function generateTestSlug(prefix = 'test'): string {
  return `${prefix}-${randomBytes(4).toString('hex')}`;
}

/**
 * Generate random test SKU
 * @param prefix Optional prefix for SKU
 * @returns Random SKU
 */
export function generateTestSku(prefix = 'TEST'): string {
  return `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

/**
 * Wait for a specified amount of time
 * Useful for testing time-dependent operations
 * @param ms Milliseconds to wait
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Assert that two dates are approximately equal (within tolerance)
 * @param date1 First date
 * @param date2 Second date
 * @param toleranceMs Tolerance in milliseconds (default: 1000ms)
 */
export function assertDatesEqual(date1: Date, date2: Date, toleranceMs = 1000): void {
  const diff = Math.abs(date1.getTime() - date2.getTime());
  if (diff > toleranceMs) {
    throw new Error(`Dates differ by ${diff}ms, expected within ${toleranceMs}ms`);
  }
}