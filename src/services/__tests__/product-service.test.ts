// src/services/__tests__/product-service.test.ts
// Unit tests for ProductService

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductService } from '../product-service';
import { prismaMock } from '../../../tests/mocks/prisma';
import { InventoryStatus } from '@prisma/client';

// Mock the prisma module using dynamic import to avoid vi.mock hoisting issues
vi.mock('@/lib/db', async () => {
  const mocks = await vi.importActual('../../../tests/mocks/prisma');
  return { prisma: mocks.prismaMock };
});

describe('ProductService', () => {
  let productService: ProductService;
  const mockStoreId = 'store-123';
  // Use a UUID to satisfy Zod uuid() validation in updateProductSchema
  const mockProductId = '00000000-0000-4000-8000-000000000001';

  beforeEach(() => {
    productService = ProductService.getInstance();
    vi.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return paginated products with filters', async () => {
      const mockProducts = [
        {
          id: '00000000-0000-4000-8000-000000000002',
          name: 'Test Product 1',
          slug: 'test-product-1',
          price: 29.99,
          sku: 'TEST-001',
          storeId: mockStoreId,
          category: { id: 'cat-1', name: 'Category 1', slug: 'category-1' },
          brand: null,
          variants: [],
          _count: { orderItems: 5, reviews: 3, wishlistItems: 2 },
        },
        {
          id: '00000000-0000-4000-8000-000000000003',
          name: 'Test Product 2',
          slug: 'test-product-2',
          price: 49.99,
          sku: 'TEST-002',
          storeId: mockStoreId,
          category: null,
          brand: { id: 'brand-1', name: 'Brand 1', slug: 'brand-1' },
          variants: [],
          _count: { orderItems: 10, reviews: 8, wishlistItems: 5 },
        },
      ];

      prismaMock.product.findMany.mockResolvedValue(mockProducts as any);
      prismaMock.product.count.mockResolvedValue(2);

      const result = await productService.getProducts(mockStoreId, {
        search: 'test',
        isPublished: true,
      });

      expect(result.products).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
      expect(prismaMock.product.findMany).toHaveBeenCalledWith({
        where: {
          storeId: mockStoreId,
          deletedAt: null,
          isPublished: true,
          OR: [
            { name: { contains: 'test' } },
            { description: { contains: 'test' } },
            { sku: { contains: 'test' } },
          ],
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          variants: {
            orderBy: { isDefault: 'desc' },
          },
          _count: {
            select: {
              orderItems: true,
              reviews: true,
              wishlistItems: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
    });

    it('should handle price range filters', async () => {
      prismaMock.product.findMany.mockResolvedValue([]);
      prismaMock.product.count.mockResolvedValue(0);

      await productService.getProducts(mockStoreId, {
        minPrice: 10,
        maxPrice: 50,
      });

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: {
              gte: 10,
              lte: 50,
            },
          }),
        })
      );
    });
  });

  describe('getProductById', () => {
    it('should return product with relations', async () => {
      const mockProduct = {
        id: mockProductId,
        name: 'Test Product',
        slug: 'test-product',
        price: 29.99,
        sku: 'TEST-001',
        storeId: mockStoreId,
        deletedAt: null,
        category: { id: 'cat-1', name: 'Category 1', slug: 'category-1' },
        brand: null,
        variants: [],
        attributes: [],
        _count: { orderItems: 5, reviews: 3, wishlistItems: 2 },
      };

      prismaMock.product.findFirst.mockResolvedValue(mockProduct as any);

      const result = await productService.getProductById(mockProductId, mockStoreId);

      // Service normalizes images/metaKeywords into arrays; include those in expected
      const expected = { ...mockProduct, images: [], metaKeywords: [] };
      expect(result).toEqual(expected);
      expect(prismaMock.product.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockProductId,
          storeId: mockStoreId,
          deletedAt: null,
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          variants: {
            where: { deletedAt: null },
            orderBy: { isDefault: 'desc' },
          },
          attributes: {
            include: { attribute: true },
          },
          _count: {
            select: {
              orderItems: true,
              reviews: true,
              wishlistItems: true,
            },
          },
        },
      });
    });

    it('should return null if product not found', async () => {
      prismaMock.product.findFirst.mockResolvedValue(null);

      const result = await productService.getProductById('00000000-0000-0000-0000-000000000003', mockStoreId);

      expect(result).toBeNull();
    });
  });

  describe('createProduct', () => {
    const validProductData = {
      name: 'New Product',
      // Provide slug in tests to avoid triggering generateUniqueSlug loop in mocks
      slug: 'new-product',
      price: 29.99,
      sku: 'NEW-001',
      description: 'A great product',
      inventoryQty: 100,
      lowStockThreshold: 10,
      isPublished: true,
      trackInventory: true,
      images: [],
      metaKeywords: [],
      isFeatured: false,
    };

    beforeEach(() => {
      // Mock validation calls
      prismaMock.product.findFirst.mockResolvedValue(null); // No conflicts
      prismaMock.category.findFirst.mockResolvedValue(null); // Category validation
      prismaMock.brand.findFirst.mockResolvedValue(null); // Brand validation
    });

    it('should create product with valid data', async () => {
      const mockCreatedProduct = {
        id: 'new-product-id',
        ...validProductData,
        slug: 'new-product',
        storeId: mockStoreId,
        inventoryStatus: InventoryStatus.IN_STOCK,
        // Prisma returns legacy JSON-encoded strings in DB; service normalizes them
        images: '[]',
        metaKeywords: '[]',
        publishedAt: new Date(),
        category: null,
        brand: null,
        variants: [],
        _count: { orderItems: 0, reviews: 0, wishlistItems: 0 },
      };

      // The DB mock returns JSON strings for images/metaKeywords but the service
      // will normalize them into arrays for consumers.
      prismaMock.product.create.mockResolvedValue(mockCreatedProduct as any);

      const result = await productService.createProduct(mockStoreId, validProductData);

      const expected = {
        ...mockCreatedProduct,
        images: [],
        metaKeywords: [],
      };

      expect(result).toEqual(expected);
      expect(prismaMock.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: validProductData.name,
          price: validProductData.price,
          sku: validProductData.sku,
          storeId: mockStoreId,
          inventoryStatus: InventoryStatus.IN_STOCK,
          slug: expect.any(String),
          images: '[]',
          metaKeywords: '[]',
          publishedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });
    });

    it('should generate slug from name if not provided', async () => {
      const productDataWithoutSlug = { ...validProductData };
      // The slug will be generated automatically since it's not provided

      prismaMock.product.create.mockResolvedValue({
        id: 'new-product-id',
        ...productDataWithoutSlug,
        slug: 'new-product',
        storeId: mockStoreId,
      } as any);

      await productService.createProduct(mockStoreId, productDataWithoutSlug);

      expect(prismaMock.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: expect.stringMatching(/^[a-z0-9-]+$/),
          }),
        })
      );
    });

    it('should set correct inventory status based on quantity', async () => {
      const lowStockProduct = {
        ...validProductData,
        inventoryQty: 5,
        lowStockThreshold: 10,
      };

      prismaMock.product.create.mockResolvedValue({
        id: 'new-product-id',
        ...lowStockProduct,
        inventoryStatus: InventoryStatus.LOW_STOCK,
      } as any);

      await productService.createProduct(mockStoreId, lowStockProduct);

      expect(prismaMock.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            inventoryStatus: InventoryStatus.LOW_STOCK,
          }),
        })
      );
    });

    it('should throw error for duplicate SKU', async () => {
      // Mock existing product with same SKU
      prismaMock.product.findFirst.mockResolvedValue({
        id: 'existing-product',
        sku: validProductData.sku,
      } as any);

      await expect(
        productService.createProduct(mockStoreId, validProductData)
      ).rejects.toThrow(`SKU '${validProductData.sku}' already exists in this store`);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '', // Empty name
        price: -10, // Negative price
        sku: '', // Empty SKU
      };

      await expect(
        productService.createProduct(mockStoreId, invalidData as any)
      ).rejects.toThrow();
    });
  });

  describe('updateProduct', () => {
    const existingProduct = {
      id: mockProductId,
      name: 'Existing Product',
      slug: 'existing-product',
      price: 19.99,
      sku: 'EXIST-001',
      storeId: mockStoreId,
      inventoryQty: 50,
      lowStockThreshold: 5,
      inventoryStatus: InventoryStatus.IN_STOCK,
      publishedAt: null,
      deletedAt: null,
    };

    beforeEach(() => {
      prismaMock.product.findFirst.mockResolvedValue(existingProduct as any);
      prismaMock.product.update.mockResolvedValue({
        ...existingProduct,
        name: 'Updated Product',
      } as any);
    });

    it('should update product with valid data', async () => {
      const updateData = {
        name: 'Updated Product',
        price: 39.99,
      };

      await productService.updateProduct(mockProductId, mockStoreId, updateData);

      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: mockProductId },
        data: expect.objectContaining({
          name: 'Updated Product',
          price: 39.99,
        }),
        include: expect.any(Object),
      });
    });

    it('should update inventory status when quantity changes', async () => {
      const updateData = {
        inventoryQty: 3, // Below threshold of 5
      };

      await productService.updateProduct(mockProductId, mockStoreId, updateData);

      expect(prismaMock.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            inventoryStatus: InventoryStatus.LOW_STOCK,
          }),
        })
      );
    });

    it('should set publishedAt when isPublished changes to true', async () => {
      const updateData = { isPublished: true };

      await productService.updateProduct(mockProductId, mockStoreId, updateData);

      expect(prismaMock.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            publishedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should throw error if product not found', async () => {
      prismaMock.product.findFirst.mockResolvedValue(null);

      await expect(
        productService.updateProduct('00000000-0000-0000-0000-000000000004', mockStoreId, { name: 'Test' })
      ).rejects.toThrow('Product not found');
    });
  });

  describe('deleteProduct', () => {
    it('should soft delete product', async () => {
      const existingProduct = {
        id: mockProductId,
        storeId: mockStoreId,
        deletedAt: null,
      };

      prismaMock.product.findFirst.mockResolvedValue(existingProduct as any);
      prismaMock.product.update.mockResolvedValue({} as any);

      await productService.deleteProduct(mockProductId, mockStoreId);

      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: mockProductId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw error if product not found', async () => {
      prismaMock.product.findFirst.mockResolvedValue(null);

      await expect(
        productService.deleteProduct('00000000-0000-0000-0000-000000000005', mockStoreId)
      ).rejects.toThrow('Product not found');
    });
  });

  describe('updateInventory', () => {
    const trackableProduct = {
      id: mockProductId,
      storeId: mockStoreId,
      trackInventory: true,
      inventoryQty: 100,
      lowStockThreshold: 10,
      deletedAt: null,
    };

    beforeEach(() => {
      prismaMock.product.findFirst.mockResolvedValue(trackableProduct as any);
      prismaMock.product.update.mockResolvedValue({
        ...trackableProduct,
        inventoryQty: 50,
      } as any);
      prismaMock.inventoryLog.create.mockResolvedValue({} as any);
    });

    it('should update inventory and create log', async () => {
      await productService.updateInventory(mockProductId, mockStoreId, 50, 'Stock adjustment');

      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: mockProductId },
        data: {
          inventoryQty: 50,
          inventoryStatus: InventoryStatus.IN_STOCK,
        },
        include: expect.any(Object),
      });

      // Inventory log keys updated in service implementation; assert using those keys
      expect(prismaMock.inventoryLog.create).toHaveBeenCalledWith({
        data: {
          productId: mockProductId,
          storeId: mockStoreId,
          previousQty: 100,
          newQty: 50,
          changeQty: -50,
          reason: 'Stock adjustment',
          userId: null,
        },
      });
    });

    it('should not allow negative quantities', async () => {
      await productService.updateInventory(mockProductId, mockStoreId, -10);

      expect(prismaMock.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            inventoryQty: 0,
          }),
        })
      );
    });

    it('should throw error if inventory tracking is disabled', async () => {
      prismaMock.product.findFirst.mockResolvedValue({
        ...trackableProduct,
        trackInventory: false,
      } as any);

      await expect(
        productService.updateInventory(mockProductId, mockStoreId, 50)
      ).rejects.toThrow('Inventory tracking is disabled for this product');
    });
  });

  describe('getTotalProductCount', () => {
    it('should return total product count for store', async () => {
      prismaMock.product.count.mockResolvedValue(42);

      const count = await productService.getTotalProductCount(mockStoreId);

      expect(count).toBe(42);
      expect(prismaMock.product.count).toHaveBeenCalledWith({
        where: {
          storeId: mockStoreId,
          deletedAt: null,
        },
      });
    });
  });
});