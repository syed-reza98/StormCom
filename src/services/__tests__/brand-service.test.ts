// src/services/__tests__/brand-service.test.ts
// Unit tests for BrandService

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrandService } from '../brand-service';
import { prismaMock } from '../../../tests/mocks/prisma';

// Mock the prisma module
vi.mock('@/lib/db', () => ({
  prisma: prismaMock,
}));

describe('BrandService', () => {
  let brandService: BrandService;
  const mockStoreId = 'store-123';
  const mockBrandId = 'brand-123';

  beforeEach(() => {
    brandService = BrandService.getInstance();
    vi.clearAllMocks();
  });

  describe('getBrands', () => {
    it('should return paginated brands with filters', async () => {
      const mockBrands = [
        {
          id: 'brand-1',
          name: 'Apple',
          slug: 'apple',
          description: 'Tech company',
          storeId: mockStoreId,
          isPublished: true,
          _count: { products: 10 },
        },
        {
          id: 'brand-2',
          name: 'Samsung',
          slug: 'samsung',
          description: 'Electronics company',
          storeId: mockStoreId,
          isPublished: true,
          _count: { products: 8 },
        },
      ];

      prismaMock.brand.findMany.mockResolvedValue(mockBrands as any);
      prismaMock.brand.count.mockResolvedValue(2);

      const result = await brandService.getBrands(mockStoreId, {
        search: 'tech',
        isPublished: true,
      });

      expect(result.brands).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(prismaMock.brand.findMany).toHaveBeenCalledWith({
        where: {
          storeId: mockStoreId,
          deletedAt: null,
          isPublished: true,
          OR: [
            { name: { contains: 'tech' } },
            { description: { contains: 'tech' } },
          ],
        },
        include: {
          _count: {
            select: {
              products: { where: { deletedAt: null } },
            },
          },
        },
        orderBy: { name: 'asc' },
        take: 10,
        skip: 0,
      });
    });
  });

  describe('getBrandById', () => {
    it('should return brand with product count', async () => {
      const mockBrand = {
        id: mockBrandId,
        name: 'Apple',
        slug: 'apple',
        storeId: mockStoreId,
        deletedAt: null,
        _count: { products: 5 },
      };

      prismaMock.brand.findFirst.mockResolvedValue(mockBrand as any);

      const result = await brandService.getBrandById(mockBrandId, mockStoreId);

      expect(result).toEqual(mockBrand);
      expect(prismaMock.brand.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockBrandId,
          storeId: mockStoreId,
          deletedAt: null,
        },
        include: {
          _count: {
            select: {
              products: { where: { deletedAt: null } },
            },
          },
        },
      });
    });

    it('should return null if brand not found', async () => {
      prismaMock.brand.findFirst.mockResolvedValue(null);

      const result = await brandService.getBrandById('non-existent', mockStoreId);

      expect(result).toBeNull();
    });
  });

  describe('createBrand', () => {
    const validBrandData = {
      name: 'New Brand',
      description: 'A great brand',
      website: 'https://newbrand.com',
      isPublished: true,
    };

    beforeEach(() => {
      // Mock validation calls
      prismaMock.brand.findFirst.mockResolvedValue(null); // No conflicts
    });

    it('should create brand with valid data', async () => {
      const mockCreatedBrand = {
        id: 'new-brand-id',
        ...validBrandData,
        slug: 'new-brand',
        storeId: mockStoreId,
        _count: { products: 0 },
      };

      prismaMock.brand.create.mockResolvedValue(mockCreatedBrand as any);

      const result = await brandService.createBrand(mockStoreId, validBrandData);

      expect(result).toEqual(mockCreatedBrand);
      expect(prismaMock.brand.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: validBrandData.name,
          description: validBrandData.description,
          website: validBrandData.website,
          storeId: mockStoreId,
          slug: expect.any(String),
        }),
        include: expect.any(Object),
      });
    });

    it('should generate slug from name if not provided', async () => {
      prismaMock.brand.create.mockResolvedValue({
        id: 'new-brand-id',
        ...validBrandData,
        slug: 'new-brand',
        storeId: mockStoreId,
      } as any);

      await brandService.createBrand(mockStoreId, validBrandData);

      expect(prismaMock.brand.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: expect.stringMatching(/^[a-z0-9-]+$/),
          }),
        })
      );
    });

    it('should throw error for duplicate slug', async () => {
      const brandWithSlug = {
        ...validBrandData,
        slug: 'existing-slug',
      };

      // Mock existing brand with same slug
      prismaMock.brand.findFirst.mockResolvedValue({
        id: 'existing-brand',
        slug: 'existing-slug',
      } as any);

      await expect(
        brandService.createBrand(mockStoreId, brandWithSlug)
      ).rejects.toThrow("Slug 'existing-slug' already exists in this store");
    });

    it('should validate website URL format', async () => {
      const invalidData = {
        ...validBrandData,
        website: 'invalid-url',
      };

      await expect(
        brandService.createBrand(mockStoreId, invalidData)
      ).rejects.toThrow('Invalid website URL format');
    });

    it('should validate logo URL format', async () => {
      const invalidData = {
        ...validBrandData,
        logo: 'invalid-url',
      };

      await expect(
        brandService.createBrand(mockStoreId, invalidData)
      ).rejects.toThrow('Invalid logo URL format');
    });
  });

  describe('updateBrand', () => {
    const existingBrand = {
      id: mockBrandId,
      name: 'Existing Brand',
      slug: 'existing-brand',
      storeId: mockStoreId,
      deletedAt: null,
    };

    beforeEach(() => {
      prismaMock.brand.findFirst.mockResolvedValue(existingBrand as any);
      prismaMock.brand.update.mockResolvedValue({
        ...existingBrand,
        name: 'Updated Brand',
      } as any);
    });

    it('should update brand with valid data', async () => {
      const updateData = {
        name: 'Updated Brand',
        description: 'Updated description',
      };

      await brandService.updateBrand(mockBrandId, mockStoreId, updateData);

      expect(prismaMock.brand.update).toHaveBeenCalledWith({
        where: { id: mockBrandId },
        data: expect.objectContaining({
          name: 'Updated Brand',
          description: 'Updated description',
        }),
        include: expect.any(Object),
      });
    });

    it('should generate new slug when name changes', async () => {
      const updateData = { name: 'New Name' };

      // Mock slug uniqueness check
      prismaMock.brand.findFirst
        .mockResolvedValueOnce(existingBrand as any) // existing brand
        .mockResolvedValueOnce(null); // slug uniqueness check

      await brandService.updateBrand(mockBrandId, mockStoreId, updateData);

      expect(prismaMock.brand.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: expect.stringMatching(/^[a-z0-9-]+$/),
          }),
        })
      );
    });

    it('should throw error if brand not found', async () => {
      prismaMock.brand.findFirst.mockResolvedValue(null);

      await expect(
        brandService.updateBrand('non-existent', mockStoreId, { name: 'Test' })
      ).rejects.toThrow('Brand not found');
    });
  });

  describe('deleteBrand', () => {
    it('should soft delete brand when no products', async () => {
      const brandWithoutProducts = {
        id: mockBrandId,
        storeId: mockStoreId,
        _count: { products: 0 },
        deletedAt: null,
      };

      prismaMock.brand.findFirst.mockResolvedValue(brandWithoutProducts as any);
      prismaMock.brand.update.mockResolvedValue({} as any);

      await brandService.deleteBrand(mockBrandId, mockStoreId);

      expect(prismaMock.brand.update).toHaveBeenCalledWith({
        where: { id: mockBrandId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw error when brand has products', async () => {
      const brandWithProducts = {
        id: mockBrandId,
        storeId: mockStoreId,
        _count: { products: 5 },
        deletedAt: null,
      };

      prismaMock.brand.findFirst.mockResolvedValue(brandWithProducts as any);

      await expect(
        brandService.deleteBrand(mockBrandId, mockStoreId)
      ).rejects.toThrow('Cannot delete brand with products');
    });

    it('should throw error if brand not found', async () => {
      prismaMock.brand.findFirst.mockResolvedValue(null);

      await expect(
        brandService.deleteBrand('non-existent', mockStoreId)
      ).rejects.toThrow('Brand not found');
    });
  });

  describe('assignProductsToBrand', () => {
    const validBrand = {
      id: mockBrandId,
      storeId: mockStoreId,
      deletedAt: null,
    };

    beforeEach(() => {
      prismaMock.brand.findFirst.mockResolvedValue(validBrand as any);
    });

    it('should assign products to brand successfully', async () => {
      const productIds = ['product-1', 'product-2'];
      
      prismaMock.product.updateMany
        .mockResolvedValueOnce({ count: 1 }) // First product updated
        .mockResolvedValueOnce({ count: 1 }); // Second product updated

      const result = await brandService.assignProductsToBrand(
        mockBrandId,
        productIds,
        mockStoreId
      );

      expect(result.updated).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(prismaMock.product.updateMany).toHaveBeenCalledTimes(2);
    });

    it('should handle products not found', async () => {
      const productIds = ['product-1', 'non-existent'];
      
      prismaMock.product.updateMany
        .mockResolvedValueOnce({ count: 1 }) // First product updated
        .mockResolvedValueOnce({ count: 0 }); // Second product not found

      const result = await brandService.assignProductsToBrand(
        mockBrandId,
        productIds,
        mockStoreId
      );

      expect(result.updated).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('non-existent');
    });

    it('should throw error if brand not found', async () => {
      prismaMock.brand.findFirst.mockResolvedValue(null);

      await expect(
        brandService.assignProductsToBrand('non-existent', ['product-1'], mockStoreId)
      ).rejects.toThrow('Brand not found');
    });
  });

  describe('getPublishedBrands', () => {
    it('should return published brands for selection', async () => {
      const mockBrands = [
        { id: 'brand-1', name: 'Apple', slug: 'apple' },
        { id: 'brand-2', name: 'Samsung', slug: 'samsung' },
      ];

      prismaMock.brand.findMany.mockResolvedValue(mockBrands as any);

      const result = await brandService.getPublishedBrands(mockStoreId);

      expect(result).toEqual(mockBrands);
      expect(prismaMock.brand.findMany).toHaveBeenCalledWith({
        where: {
          storeId: mockStoreId,
          isPublished: true,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('getTotalBrandCount', () => {
    it('should return total brand count for store', async () => {
      prismaMock.brand.count.mockResolvedValue(15);

      const count = await brandService.getTotalBrandCount(mockStoreId);

      expect(count).toBe(15);
      expect(prismaMock.brand.count).toHaveBeenCalledWith({
        where: {
          storeId: mockStoreId,
          deletedAt: null,
        },
      });
    });
  });
});