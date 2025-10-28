/**
 * Unit Tests: StorefrontService
 * 
 * Tests all public-facing product catalog operations for customer browsing.
 * Validates filtering, pagination, search, and category navigation logic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/db';
import {
  getPublishedProducts,
  getProductBySlug,
  getCategoryTree,
  getCategoryBySlug,
  getFeaturedProducts,
  getRelatedProducts,
} from '@/services/storefront-service';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('StorefrontService', () => {
  const mockStoreId = 'store-123';
  const mockProduct = {
    id: 'product-1',
    storeId: mockStoreId,
    name: 'Test Product',
    slug: 'test-product',
    description: 'Test description',
    shortDescription: 'Short description',
    price: 29.99,
    compareAtPrice: 39.99,
    costPrice: 15.00,
    sku: 'TEST-SKU-001',
    barcode: '123456789',
    trackInventory: true,
    inventoryQty: 10,
    lowStockThreshold: 5,
    inventoryStatus: 'IN_STOCK',
    weight: 0.5,
    length: 10,
    width: 10,
    height: 5,
    images: '["https://example.com/image1.jpg"]',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    categoryId: 'cat-1',
    brandId: 'brand-1',
    metaTitle: 'Test Product Meta',
    metaDescription: 'Test product meta description',
    metaKeywords: '["test", "product"]',
    isFeatured: false,
    isPublished: true,
    publishedAt: new Date('2025-01-01'),
    deletedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    category: {
      id: 'cat-1',
      name: 'Electronics',
      slug: 'electronics',
    },
    brand: {
      id: 'brand-1',
      name: 'TechBrand',
      slug: 'techbrand',
    },
    variants: [
      {
        id: 'variant-1',
        name: 'Small',
        sku: 'TEST-S',
        price: 29.99,
      },
    ],
  };

  const mockCategory = {
    id: 'cat-1',
    storeId: mockStoreId,
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic products',
    image: 'https://example.com/cat.jpg',
    parentId: null,
    metaTitle: 'Electronics Category',
    metaDescription: 'Browse electronics',
    sortOrder: 1,
    isPublished: true,
    deletedAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPublishedProducts', () => {
    it('should return paginated published products', async () => {
      const mockProducts = [mockProduct];
      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
      vi.mocked(prisma.product.count).mockResolvedValue(1);

      const result = await getPublishedProducts(mockStoreId);

      expect(result.products).toHaveLength(1);
      expect(result.products[0].inStock).toBe(true);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(12);
      expect(result.totalPages).toBe(1);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            storeId: mockStoreId,
            isPublished: true,
            deletedAt: null,
          }),
        })
      );
    });

    it('should filter by search term', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);
      vi.mocked(prisma.product.count).mockResolvedValue(1);

      await getPublishedProducts(mockStoreId, { search: 'test' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'test' } },
              { description: { contains: 'test' } },
            ],
          }),
        })
      );
    });

    it('should filter by category', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);
      vi.mocked(prisma.product.count).mockResolvedValue(1);

      await getPublishedProducts(mockStoreId, { categoryId: 'cat-1' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 'cat-1',
          }),
        })
      );
    });

    it('should filter by price range', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);
      vi.mocked(prisma.product.count).mockResolvedValue(1);

      await getPublishedProducts(mockStoreId, { minPrice: 10, maxPrice: 50 });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { gte: 10, lte: 50 },
          }),
        })
      );
    });

    it('should filter by stock status', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);
      vi.mocked(prisma.product.count).mockResolvedValue(1);

      await getPublishedProducts(mockStoreId, { inStock: true });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            inventoryQty: { gt: 0 },
          }),
        })
      );
    });

    it('should sort by name ascending', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);
      vi.mocked(prisma.product.count).mockResolvedValue(1);

      await getPublishedProducts(mockStoreId, { sortBy: 'name', sortOrder: 'asc' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        })
      );
    });

    it('should sort by price descending', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);
      vi.mocked(prisma.product.count).mockResolvedValue(1);

      await getPublishedProducts(mockStoreId, { sortBy: 'price', sortOrder: 'desc' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: 'desc' },
        })
      );
    });

    it('should handle pagination correctly', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);
      vi.mocked(prisma.product.count).mockResolvedValue(50);

      const result = await getPublishedProducts(mockStoreId, { page: 2, perPage: 10 });

      expect(result.page).toBe(2);
      expect(result.perPage).toBe(10);
      expect(result.totalPages).toBe(5);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page 2 - 1) * 10
          take: 10,
        })
      );
    });

    it('should cap perPage at 100', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);
      vi.mocked(prisma.product.count).mockResolvedValue(200);

      await getPublishedProducts(mockStoreId, { perPage: 500 });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });

    it('should mark out-of-stock products correctly', async () => {
      const outOfStockProduct = { ...mockProduct, inventoryQty: 0 };
      vi.mocked(prisma.product.findMany).mockResolvedValue([outOfStockProduct] as any);
      vi.mocked(prisma.product.count).mockResolvedValue(1);

      const result = await getPublishedProducts(mockStoreId);

      expect(result.products[0].inStock).toBe(false);
    });
  });

  describe('getProductBySlug', () => {
    it('should return product by slug', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(mockProduct as any);

      const result = await getProductBySlug(mockStoreId, 'test-product');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test Product');
      expect(result?.inStock).toBe(true);
      expect(prisma.product.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            storeId: mockStoreId,
            slug: 'test-product',
            isPublished: true,
            deletedAt: null,
          }),
        })
      );
    });

    it('should return null for non-existent slug', async () => {
      vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

      const result = await getProductBySlug(mockStoreId, 'non-existent');

      expect(result).toBeNull();
    });

    it('should mark out-of-stock product', async () => {
      const outOfStockProduct = { ...mockProduct, inventoryQty: 0 };
      vi.mocked(prisma.product.findFirst).mockResolvedValue(outOfStockProduct as any);

      const result = await getProductBySlug(mockStoreId, 'test-product');

      expect(result?.inStock).toBe(false);
    });
  });

  describe('getCategoryTree', () => {
    it('should return category tree with product counts', async () => {
      const rootCategory = { ...mockCategory, parentId: null };
      const childCategory = { ...mockCategory, id: 'cat-2', name: 'Laptops', slug: 'laptops', parentId: 'cat-1' };
      
      vi.mocked(prisma.category.findMany).mockResolvedValue([rootCategory, childCategory] as any);
      vi.mocked(prisma.product.count).mockResolvedValueOnce(10).mockResolvedValueOnce(5);

      const result = await getCategoryTree(mockStoreId);

      expect(result).toHaveLength(1); // Only root categories
      expect(result[0].name).toBe('Electronics');
      expect(result[0].productCount).toBe(10);
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children?.[0].name).toBe('Laptops');
      expect(result[0].children?.[0].productCount).toBe(5);
    });

    it('should only include published categories', async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue([mockCategory] as any);
      vi.mocked(prisma.product.count).mockResolvedValue(10);

      await getCategoryTree(mockStoreId);

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            storeId: mockStoreId,
            isPublished: true,
            deletedAt: null,
          }),
        })
      );
    });

    it('should sort categories by sortOrder', async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue([mockCategory] as any);
      vi.mocked(prisma.product.count).mockResolvedValue(10);

      await getCategoryTree(mockStoreId);

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { sortOrder: 'asc' },
        })
      );
    });
  });

  describe('getCategoryBySlug', () => {
    it('should return category with breadcrumbs', async () => {
      const parentCategory = { ...mockCategory, id: 'cat-parent', name: 'Parent', slug: 'parent', parentId: null };
      const childCategory = { ...mockCategory, id: 'cat-child', name: 'Child', slug: 'child', parentId: 'cat-parent' };
      
      vi.mocked(prisma.category.findFirst).mockResolvedValue(childCategory as any);
      vi.mocked(prisma.category.findUnique).mockResolvedValue(parentCategory as any);
      vi.mocked(prisma.product.count).mockResolvedValue(5);

      const result = await getCategoryBySlug(mockStoreId, 'child');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Child');
      expect(result?.productCount).toBe(5);
      expect(result?.breadcrumbs).toHaveLength(1);
      expect(result?.breadcrumbs[0].name).toBe('Parent');
    });

    it('should return null for non-existent slug', async () => {
      vi.mocked(prisma.category.findFirst).mockResolvedValue(null);

      const result = await getCategoryBySlug(mockStoreId, 'non-existent');

      expect(result).toBeNull();
    });

    it('should handle category without parent', async () => {
      vi.mocked(prisma.category.findFirst).mockResolvedValue(mockCategory as any);
      vi.mocked(prisma.product.count).mockResolvedValue(10);

      const result = await getCategoryBySlug(mockStoreId, 'electronics');

      expect(result).not.toBeNull();
      expect(result?.breadcrumbs).toHaveLength(0);
    });

    it('should prevent infinite loop in breadcrumbs (max 10 levels)', async () => {
      const circularCategory = { ...mockCategory, parentId: 'cat-1' }; // Points to itself
      vi.mocked(prisma.category.findFirst).mockResolvedValue(circularCategory as any);
      vi.mocked(prisma.category.findUnique).mockResolvedValue(circularCategory as any);
      vi.mocked(prisma.product.count).mockResolvedValue(5);

      const result = await getCategoryBySlug(mockStoreId, 'electronics');

      expect(result).not.toBeNull();
      // Should stop after 10 iterations
      expect(result?.breadcrumbs.length).toBeLessThanOrEqual(10);
    });
  });

  describe('getFeaturedProducts', () => {
    it('should return featured products with default limit', async () => {
      const featuredProduct = { ...mockProduct, isFeatured: true };
      vi.mocked(prisma.product.findMany).mockResolvedValue([featuredProduct] as any);

      const result = await getFeaturedProducts(mockStoreId);

      expect(result).toHaveLength(1);
      expect(result[0].isFeatured).toBe(true);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            storeId: mockStoreId,
            isPublished: true,
            isFeatured: true,
            deletedAt: null,
          }),
          take: 8,
        })
      );
    });

    it('should respect custom limit', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);

      await getFeaturedProducts(mockStoreId, 5);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });

    it('should cap limit at 100', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);

      await getFeaturedProducts(mockStoreId, 500);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });

    it('should enforce minimum limit of 1', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);

      await getFeaturedProducts(mockStoreId, -5);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1,
        })
      );
    });

    it('should sort by createdAt descending', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);

      await getFeaturedProducts(mockStoreId);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('getRelatedProducts', () => {
    it('should return related products from same category', async () => {
      const currentProduct = { id: 'product-1', categoryId: 'cat-1' };
      const relatedProduct = { ...mockProduct, id: 'product-2', name: 'Related Product' };
      
      vi.mocked(prisma.product.findUnique).mockResolvedValue(currentProduct as any);
      vi.mocked(prisma.product.findMany).mockResolvedValue([relatedProduct] as any);

      const result = await getRelatedProducts(mockStoreId, 'product-1');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Related Product');
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            storeId: mockStoreId,
            id: { not: 'product-1' },
            categoryId: 'cat-1',
            isPublished: true,
            deletedAt: null,
          }),
        })
      );
    });

    it('should return empty array if product not found', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      const result = await getRelatedProducts(mockStoreId, 'non-existent');

      expect(result).toEqual([]);
    });

    it('should return empty array if product has no category', async () => {
      const productWithoutCategory = { id: 'product-1', categoryId: null };
      vi.mocked(prisma.product.findUnique).mockResolvedValue(productWithoutCategory as any);

      const result = await getRelatedProducts(mockStoreId, 'product-1');

      expect(result).toEqual([]);
    });

    it('should respect custom limit', async () => {
      const currentProduct = { id: 'product-1', categoryId: 'cat-1' };
      vi.mocked(prisma.product.findUnique).mockResolvedValue(currentProduct as any);
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);

      await getRelatedProducts(mockStoreId, 'product-1', 10);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it('should cap limit at 100', async () => {
      const currentProduct = { id: 'product-1', categoryId: 'cat-1' };
      vi.mocked(prisma.product.findUnique).mockResolvedValue(currentProduct as any);
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);

      await getRelatedProducts(mockStoreId, 'product-1', 500);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });

    it('should enforce minimum limit of 1', async () => {
      const currentProduct = { id: 'product-1', categoryId: 'cat-1' };
      vi.mocked(prisma.product.findUnique).mockResolvedValue(currentProduct as any);
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);

      await getRelatedProducts(mockStoreId, 'product-1', 0);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1,
        })
      );
    });

    it('should exclude current product from results', async () => {
      const currentProduct = { id: 'product-1', categoryId: 'cat-1' };
      vi.mocked(prisma.product.findUnique).mockResolvedValue(currentProduct as any);
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);

      await getRelatedProducts(mockStoreId, 'product-1');

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: 'product-1' },
          }),
        })
      );
    });
  });
});

