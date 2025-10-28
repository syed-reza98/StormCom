// tests/integration/api/products-api.test.ts
// Integration tests for Products API routes

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database';
import { createTestStore, createTestUser, createTestCategory, createTestProduct } from '../helpers/test-data';
import { NextRequest } from 'next/server';

describe('Products API Integration Tests', () => {
  let testStoreId: string;
  let testUserId: string;
  let testCategoryId: string;

  beforeEach(async () => {
    await setupTestDatabase();
    
    const store = await createTestStore();
    const user = await createTestUser(store.id);
    const category = await createTestCategory(store.id);
    
    testStoreId = store.id;
    testUserId = user.id;
    testCategoryId = category.id;
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      // Create test products
      await createTestProduct(testStoreId, testCategoryId, {
        name: 'Product 1',
        price: 100.00,
        isActive: true,
      });
      
      await createTestProduct(testStoreId, testCategoryId, {
        name: 'Product 2', 
        price: 200.00,
        isActive: true,
      });
      
      await createTestProduct(testStoreId, testCategoryId, {
        name: 'Inactive Product',
        price: 50.00,
        isActive: false,
      });
    });

    it('should return paginated products list', async () => {
      const request = new NextRequest('http://localhost/api/products?page=1&perPage=10', {
        headers: { 'x-store-id': testStoreId },
      });

      // Import and test the API route handler
      const { GET } = await import('../../../src/app/api/products/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.products).toHaveLength(2); // Only active products
      expect(data.data.total).toBe(2);
      expect(data.data.page).toBe(1);
      expect(data.data.perPage).toBe(10);
    });

    it('should filter products by category', async () => {
      const request = new NextRequest(`http://localhost/api/products?categoryId=${testCategoryId}`, {
        headers: { 'x-store-id': testStoreId },
      });

      const { GET } = await import('../../../src/app/api/products/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.products).toHaveLength(2);
      data.data.products.forEach((product: any) => {
        expect(product.categoryId).toBe(testCategoryId);
      });
    });

    it('should search products by name', async () => {
      const request = new NextRequest('http://localhost/api/products?search=Product 1', {
        headers: { 'x-store-id': testStoreId },
      });

      const { GET } = await import('../../../src/app/api/products/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.products).toHaveLength(1);
      expect(data.data.products[0].name).toBe('Product 1');
    });

    it('should filter products by price range', async () => {
      const request = new NextRequest('http://localhost/api/products?minPrice=150&maxPrice=250', {
        headers: { 'x-store-id': testStoreId },
      });

      const { GET } = await import('../../../src/app/api/products/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.products).toHaveLength(1);
      expect(data.data.products[0].name).toBe('Product 2');
      expect(data.data.products[0].price).toBe(200.00);
    });

    it('should require store ID header', async () => {
      const request = new NextRequest('http://localhost/api/products');

      const { GET } = await import('../../../src/app/api/products/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_STORE_ID');
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Product',
        slug: 'new-product',
        description: 'A new test product',
        sku: 'NEW-001',
        price: 150.00,
        categoryId: testCategoryId,
        brand: 'Test Brand',
        isActive: true,
        stockQuantity: 50,
      };

      const request = new NextRequest('http://localhost/api/products', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-store-id': testStoreId,
          'x-user-id': testUserId,
        },
        body: JSON.stringify(productData),
      });

      const { POST } = await import('../../../src/app/api/products/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe(productData.name);
      expect(data.data.sku).toBe(productData.sku);
      expect(data.data.price).toBe(productData.price);
      expect(data.data.storeId).toBe(testStoreId);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: 'Product Without SKU',
        // Missing required fields
      };

      const request = new NextRequest('http://localhost/api/products', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-store-id': testStoreId,
          'x-user-id': testUserId,
        },
        body: JSON.stringify(invalidData),
      });

      const { POST } = await import('../../../src/app/api/products/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should prevent duplicate SKUs', async () => {
      // Create first product
      await createTestProduct(testStoreId, testCategoryId, {
        sku: 'DUPLICATE-SKU',
      });

      const duplicateData = {
        name: 'Duplicate SKU Product',
        slug: 'duplicate-sku-product',
        sku: 'DUPLICATE-SKU',
        price: 100.00,
        categoryId: testCategoryId,
        isActive: true,
        stockQuantity: 10,
      };

      const request = new NextRequest('http://localhost/api/products', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-store-id': testStoreId,
          'x-user-id': testUserId,
        },
        body: JSON.stringify(duplicateData),
      });

      const { POST } = await import('../../../src/app/api/products/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DUPLICATE_SKU');
    });

    it('should require authentication', async () => {
      const productData = {
        name: 'Unauthorized Product',
        sku: 'UNAUTH-001',
        price: 100.00,
      };

      const request = new NextRequest('http://localhost/api/products', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-store-id': testStoreId,
          // Missing x-user-id header
        },
        body: JSON.stringify(productData),
      });

      const { POST } = await import('../../../src/app/api/products/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/products/[id]', () => {
    let testProductId: string;

    beforeEach(async () => {
      const product = await createTestProduct(testStoreId, testCategoryId, {
        name: 'Test Product Detail',
        description: 'Detailed test product',
      });
      testProductId = product.id;
    });

    it('should return product details', async () => {
      const request = new NextRequest(`http://localhost/api/products/${testProductId}`, {
        headers: { 'x-store-id': testStoreId },
      });

      const { GET } = await import('../../../src/app/api/products/[id]/route');
      const response = await GET(request, { params: Promise.resolve({ id: testProductId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(testProductId);
      expect(data.data.name).toBe('Test Product Detail');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = 'non-existent-id';
      const request = new NextRequest(`http://localhost/api/products/${fakeId}`, {
        headers: { 'x-store-id': testStoreId },
      });

      const { GET } = await import('../../../src/app/api/products/[id]/route');
      const response = await GET(request, { params: Promise.resolve({ id: fakeId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('should enforce store isolation', async () => {
      // Create another store and product
      const otherStore = await createTestStore('Other Store');
      const otherCategory = await createTestCategory(otherStore.id);
      const otherProduct = await createTestProduct(otherStore.id, otherCategory.id);

      // Try to access other store's product with current store ID
      const request = new NextRequest(`http://localhost/api/products/${otherProduct.id}`, {
        headers: { 'x-store-id': testStoreId }, // Wrong store ID
      });

      const { GET } = await import('../../../src/app/api/products/[id]/route');
      const response = await GET(request, { params: Promise.resolve({ id: otherProduct.id }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('PUT /api/products/[id]', () => {
    let testProductId: string;

    beforeEach(async () => {
      const product = await createTestProduct(testStoreId, testCategoryId);
      testProductId = product.id;
    });

    it('should update product', async () => {
      const updateData = {
        name: 'Updated Product Name',
        price: 299.99,
        description: 'Updated description',
      };

      const request = new NextRequest(`http://localhost/api/products/${testProductId}`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'x-store-id': testStoreId,
          'x-user-id': testUserId,
        },
        body: JSON.stringify(updateData),
      });

      const { PUT } = await import('../../../src/app/api/products/[id]/route');
      const response = await PUT(request, { params: Promise.resolve({ id: testProductId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe(updateData.name);
      expect(data.data.price).toBe(updateData.price);
      expect(data.data.description).toBe(updateData.description);
    });

    it('should validate update data', async () => {
      const invalidData = {
        price: -100, // Invalid negative price
      };

      const request = new NextRequest(`http://localhost/api/products/${testProductId}`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'x-store-id': testStoreId,
          'x-user-id': testUserId,
        },
        body: JSON.stringify(invalidData),
      });

      const { PUT } = await import('../../../src/app/api/products/[id]/route');
      const response = await PUT(request, { params: Promise.resolve({ id: testProductId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should require authentication for updates', async () => {
      const updateData = { name: 'Unauthorized Update' };

      const request = new NextRequest(`http://localhost/api/products/${testProductId}`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'x-store-id': testStoreId,
          // Missing x-user-id header
        },
        body: JSON.stringify(updateData),
      });

      const { PUT } = await import('../../../src/app/api/products/[id]/route');
      const response = await PUT(request, { params: Promise.resolve({ id: testProductId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('DELETE /api/products/[id]', () => {
    let testProductId: string;

    beforeEach(async () => {
      const product = await createTestProduct(testStoreId, testCategoryId);
      testProductId = product.id;
    });

    it('should soft delete product', async () => {
      const request = new NextRequest(`http://localhost/api/products/${testProductId}`, {
        method: 'DELETE',
        headers: {
          'x-store-id': testStoreId,
          'x-user-id': testUserId,
        },
      });

      const { DELETE } = await import('../../../src/app/api/products/[id]/route');
      const response = await DELETE(request, { params: Promise.resolve({ id: testProductId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('deleted');

      // Verify product is no longer accessible
      const getRequest = new NextRequest(`http://localhost/api/products/${testProductId}`, {
        headers: { 'x-store-id': testStoreId },
      });

      const { GET } = await import('../../../src/app/api/products/[id]/route');
      const getResponse = await GET(getRequest, { params: Promise.resolve({ id: testProductId }) });
      
      expect(getResponse.status).toBe(404);
    });

    it('should require authentication for deletion', async () => {
      const request = new NextRequest(`http://localhost/api/products/${testProductId}`, {
        method: 'DELETE',
        headers: {
          'x-store-id': testStoreId,
          // Missing x-user-id header
        },
      });

      const { DELETE } = await import('../../../src/app/api/products/[id]/route');
      const response = await DELETE(request, { params: Promise.resolve({ id: testProductId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 for non-existent product deletion', async () => {
      const fakeId = 'non-existent-product';
      const request = new NextRequest(`http://localhost/api/products/${fakeId}`, {
        method: 'DELETE',
        headers: {
          'x-store-id': testStoreId,
          'x-user-id': testUserId,
        },
      });

      const { DELETE } = await import('../../../src/app/api/products/[id]/route');
      const response = await DELETE(request, { params: Promise.resolve({ id: fakeId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('Stock Management API', () => {
    let testProductId: string;

    beforeEach(async () => {
      const product = await createTestProduct(testStoreId, testCategoryId, {
        stockQuantity: 100,
        trackQuantity: true,
      });
      testProductId = product.id;
    });

    // TODO: This test is testing a non-existent PUT /api/products/[id]/stock endpoint
    // The stock route only has GET. This test should be either:
    // 1. Testing PUT /api/products/[id] to update stock via main product update, OR
    // 2. Testing POST /api/products/[id]/stock (if we implement this endpoint)
    it.skip('should update product stock', async () => {
      const stockData = { quantity: 150 };

      const request = new NextRequest(`http://localhost/api/products/${testProductId}/stock`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'x-store-id': testStoreId,
          'x-user-id': testUserId,
        },
        body: JSON.stringify(stockData),
      });
      
      // const { PUT } = await import('../../../src/app/api/products/[id]/stock/route');
      // Import PUT from the main product route (exports PUT). The stock route does not export PUT.
      const { PUT } = await import('../../../src/app/api/products/[id]/route');
      const response = await PUT(request, { params: Promise.resolve({ id: testProductId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.stockQuantity).toBe(150);
    });

    it('should decrease stock quantity', async () => {
      const decreaseData = { quantity: 25 };

      const request = new NextRequest(`http://localhost/api/products/${testProductId}/stock/decrease`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-store-id': testStoreId,
          'x-user-id': testUserId,
        },
        body: JSON.stringify(decreaseData),
      });

      const { POST } = await import('../../../src/app/api/products/[id]/stock/decrease/route');
      const response = await POST(request, { params: Promise.resolve({ id: testProductId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.stockQuantity).toBe(75); // 100 - 25
    });

    it('should check stock availability', async () => {
      const request = new NextRequest(`http://localhost/api/products/${testProductId}/stock/check?quantity=50`, {
        headers: { 'x-store-id': testStoreId },
      });

      const { GET } = await import('../../../src/app/api/products/[id]/stock/check/route');
      const response = await GET(request, { params: Promise.resolve({ id: testProductId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.available).toBe(true);
      expect(data.data.requestedQuantity).toBe(50);
      expect(data.data.availableQuantity).toBe(100);
    });
  });
});