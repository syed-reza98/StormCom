/**
 * Integration Tests: T038b-T038f JSON Migration
 * 
 * Tests String → Json type conversions for:
 * - T038b: Product.images
 * - T038c: Product.metaKeywords
 * - T038d: ProductVariant.options
 * - T038e: ProductAttribute.values
 * - T038f: Review.images
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('T038b-T038f: JSON Migration Tests', () => {
  let testStoreId: string;
  let testProductId: string;
  let testVariantId: string;
  let testAttributeId: string;
  let testCustomerId: string;
  let testReviewId: string;

  beforeAll(async () => {
    // Create test store
    const store = await prisma.store.create({
      data: {
        name: 'JSON Migration Test Store',
        slug: 'json-migration-test',
        domain: 'json-migration-test.example.com',
        email: 'test@json-migration.com',
        currency: 'USD',
        timezone: 'UTC',
        isActive: true,
      },
    });
    testStoreId = store.id;

    // Create test customer
    const customer = await prisma.customer.create({
      data: {
        storeId: testStoreId,
        email: 'customer@test.com',
        firstName: 'Test',
        lastName: 'Customer',
      },
    });
    testCustomerId = customer.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.store.delete({ where: { id: testStoreId } });
    await prisma.$disconnect();
  });

  describe('T038b: Product.images (String → Json)', () => {
    it('should accept Json array for images field', async () => {
      const product = await prisma.product.create({
        data: {
          storeId: testStoreId,
          name: 'Test Product T038b',
          slug: 'test-product-t038b',
          sku: 'TEST-T038B',
          price: 99.99,
          images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
          metaKeywords: ['test', 'product'],
        },
      });

      testProductId = product.id;

      expect(product.images).toBeInstanceOf(Array);
      expect(product.images).toHaveLength(2);
      expect(product.images[0]).toBe('https://example.com/image1.jpg');
      expect(product.images[1]).toBe('https://example.com/image2.jpg');
    });

    it('should retrieve images as Json array', async () => {
      const product = await prisma.product.findUnique({
        where: { id: testProductId },
        select: { images: true },
      });

      expect(product?.images).toBeInstanceOf(Array);
      expect(product?.images).toHaveLength(2);
    });

    it('should handle empty images array', async () => {
      const product = await prisma.product.create({
        data: {
          storeId: testStoreId,
          name: 'Test Product Empty Images',
          slug: 'test-product-empty-images',
          sku: 'TEST-EMPTY-IMAGES',
          price: 49.99,
          images: [],
          metaKeywords: [],
        },
      });

      expect(product.images).toBeInstanceOf(Array);
      expect(product.images).toHaveLength(0);
    });
  });

  describe('T038c: Product.metaKeywords (String → Json)', () => {
    it('should accept Json array for metaKeywords field', async () => {
      const product = await prisma.product.findUnique({
        where: { id: testProductId },
        select: { metaKeywords: true },
      });

      expect(product?.metaKeywords).toBeInstanceOf(Array);
      expect(product?.metaKeywords).toHaveLength(2);
      expect(product?.metaKeywords[0]).toBe('test');
      expect(product?.metaKeywords[1]).toBe('product');
    });

    it('should update metaKeywords as Json array', async () => {
      const updated = await prisma.product.update({
        where: { id: testProductId },
        data: {
          metaKeywords: ['updated', 'keywords', 'seo'],
        },
      });

      expect(updated.metaKeywords).toBeInstanceOf(Array);
      expect(updated.metaKeywords).toHaveLength(3);
      expect(updated.metaKeywords).toContain('seo');
    });
  });

  describe('T038d: ProductVariant.options (String → Json)', () => {
    it('should accept Json object for options field', async () => {
      const variant = await prisma.productVariant.create({
        data: {
          productId: testProductId,
          name: 'Small / Red',
          sku: 'TEST-T038D-SM-RED',
          options: { Size: 'Small', Color: 'Red' },
        },
      });

      testVariantId = variant.id;

      expect(variant.options).toBeInstanceOf(Object);
      expect(Array.isArray(variant.options)).toBe(false);
      expect((variant.options as Record<string, string>).Size).toBe('Small');
      expect((variant.options as Record<string, string>).Color).toBe('Red');
    });

    it('should retrieve options as Json object', async () => {
      const variant = await prisma.productVariant.findUnique({
        where: { id: testVariantId },
        select: { options: true },
      });

      expect(variant?.options).toBeInstanceOf(Object);
      expect(Array.isArray(variant?.options)).toBe(false);
    });

    it('should handle complex nested options', async () => {
      const variant = await prisma.productVariant.create({
        data: {
          productId: testProductId,
          name: 'Large / Blue / Premium',
          sku: 'TEST-T038D-LG-BLU-PREM',
          options: {
            Size: 'Large',
            Color: 'Blue',
            Material: 'Premium Cotton',
            customization: {
              text: 'Custom Name',
              position: 'front',
            },
          },
        },
      });

      const options = variant.options as Record<string, unknown>;
      expect(options.Size).toBe('Large');
      expect(options.customization).toBeInstanceOf(Object);
      expect((options.customization as Record<string, string>).text).toBe('Custom Name');
    });
  });

  describe('T038e: ProductAttribute.values (String → Json)', () => {
    it('should accept Json array for values field', async () => {
      const attribute = await prisma.productAttribute.create({
        data: {
          name: 'Color',
          values: ['Red', 'Blue', 'Green', 'Yellow'],
        },
      });

      testAttributeId = attribute.id;

      expect(attribute.values).toBeInstanceOf(Array);
      expect(attribute.values).toHaveLength(4);
      expect(attribute.values).toContain('Red');
      expect(attribute.values).toContain('Blue');
    });

    it('should retrieve values as Json array', async () => {
      const attribute = await prisma.productAttribute.findUnique({
        where: { id: testAttributeId },
        select: { values: true },
      });

      expect(attribute?.values).toBeInstanceOf(Array);
      expect(attribute?.values).toHaveLength(4);
    });

    it('should update values array', async () => {
      const updated = await prisma.productAttribute.update({
        where: { id: testAttributeId },
        data: {
          values: ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange'],
        },
      });

      expect(updated.values).toHaveLength(6);
      expect(updated.values).toContain('Purple');
    });
  });

  describe('T038f: Review.images (String → Json)', () => {
    it('should accept Json array for images field', async () => {
      const review = await prisma.review.create({
        data: {
          storeId: testStoreId,
          productId: testProductId,
          customerId: testCustomerId,
          rating: 5,
          comment: 'Great product!',
          images: ['https://example.com/review1.jpg', 'https://example.com/review2.jpg'],
        },
      });

      testReviewId = review.id;

      expect(review.images).toBeInstanceOf(Array);
      expect(review.images).toHaveLength(2);
      expect(review.images[0]).toBe('https://example.com/review1.jpg');
    });

    it('should retrieve review images as Json array', async () => {
      const review = await prisma.review.findUnique({
        where: { id: testReviewId },
        select: { images: true },
      });

      expect(review?.images).toBeInstanceOf(Array);
      expect(review?.images).toHaveLength(2);
    });

    it('should handle empty review images', async () => {
      const review = await prisma.review.create({
        data: {
          storeId: testStoreId,
          productId: testProductId,
          customerId: testCustomerId,
          rating: 4,
          comment: 'Good product, no photos',
          images: [],
        },
      });

      expect(review.images).toBeInstanceOf(Array);
      expect(review.images).toHaveLength(0);
    });
  });

  describe('Cross-Field Validation', () => {
    it('should handle all Json fields in a single query', async () => {
      const data = await prisma.product.findUnique({
        where: { id: testProductId },
        select: {
          images: true,
          metaKeywords: true,
          variants: {
            select: {
              options: true,
            },
          },
          reviews: {
            select: {
              images: true,
            },
          },
        },
      });

      expect(data?.images).toBeInstanceOf(Array);
      expect(data?.metaKeywords).toBeInstanceOf(Array);
      expect(data?.variants[0]?.options).toBeInstanceOf(Object);
    });

    it('should filter by Json field contents', async () => {
      // Find products with specific keyword
      const products = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM products 
        WHERE json_extract(metaKeywords, '$[0]') = 'updated'
      `;

      expect(products.length).toBeGreaterThan(0);
    });
  });

  describe('Type Safety & Error Handling', () => {
    it('should enforce type safety at compile time', () => {
      // TypeScript should prevent invalid types
      type ProductImages = typeof prisma.product extends {
        create: (args: { data: infer D }) => unknown;
      }
        ? D extends { images: infer I }
          ? I
          : never
        : never;

      // This type should be Json (Prisma.JsonValue)
      const validImages: ProductImages = ['https://example.com/img.jpg'];
      expect(validImages).toBeInstanceOf(Array);
    });

    it('should handle null checks for optional Json fields', async () => {
      const product = await prisma.product.create({
        data: {
          storeId: testStoreId,
          name: 'Minimal Product',
          slug: 'minimal-product',
          sku: 'MIN-001',
          price: 19.99,
          images: [],
          metaKeywords: [],
        },
      });

      expect(product.images).toBeDefined();
      expect(product.metaKeywords).toBeDefined();
    });
  });
});
