// src/services/__tests__/category-service.test.ts
// Unit tests for CategoryService

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CategoryService } from '../category-service';
import { prismaMock } from '../../../tests/mocks/prisma';

// Mock the prisma module
vi.mock('@/lib/db', () => ({
  prisma: prismaMock,
}));

describe('CategoryService', () => {
  let categoryService: CategoryService;
  const mockStoreId = 'store-123';
  const mockCategoryId = 'category-123';

  beforeEach(() => {
    categoryService = CategoryService.getInstance();
    vi.clearAllMocks();
  });

  describe('getCategories', () => {
    it('should return paginated categories with filters', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Electronics',
          slug: 'electronics',
          description: 'Electronic products',
          storeId: mockStoreId,
          parentId: null,
          parent: null,
          children: [
            { id: 'cat-2', name: 'Phones', slug: 'phones', sortOrder: 0 },
          ],
          _count: { products: 10, children: 1 },
        },
      ];

      prismaMock.category.findMany.mockResolvedValue(mockCategories as any);
      prismaMock.category.count.mockResolvedValue(1);

      const result = await categoryService.getCategories(mockStoreId, {
        search: 'electronics',
        isPublished: true,
      });

      expect(result.categories).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(prismaMock.category.findMany).toHaveBeenCalledWith({
        where: {
          storeId: mockStoreId,
          deletedAt: null,
          isPublished: true,
          OR: [
            { name: { contains: 'electronics', mode: 'insensitive' } },
            { description: { contains: 'electronics', mode: 'insensitive' } },
          ],
        },
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          children: {
            where: { deletedAt: null },
            select: { id: true, name: true, slug: true, sortOrder: true },
            orderBy: { sortOrder: 'asc' },
          },
          _count: {
            select: {
              products: { where: { deletedAt: null } },
              children: { where: { deletedAt: null } },
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        take: 10,
        skip: 0,
      });
    });

    it('should filter by parentId', async () => {
      prismaMock.category.findMany.mockResolvedValue([]);
      prismaMock.category.count.mockResolvedValue(0);

      await categoryService.getCategories(mockStoreId, {
        parentId: 'parent-123',
      });

      expect(prismaMock.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            parentId: 'parent-123',
          }),
        })
      );
    });
  });

  describe('getCategoryById', () => {
    it('should return category with relations', async () => {
      const mockCategory = {
        id: mockCategoryId,
        name: 'Electronics',
        slug: 'electronics',
        storeId: mockStoreId,
        deletedAt: null,
        parent: null,
        children: [],
        _count: { products: 5, children: 2 },
      };

      prismaMock.category.findFirst.mockResolvedValue(mockCategory as any);

      const result = await categoryService.getCategoryById(mockCategoryId, mockStoreId);

      expect(result).toEqual(mockCategory);
      expect(prismaMock.category.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockCategoryId,
          storeId: mockStoreId,
          deletedAt: null,
        },
        include: {
          parent: { select: { id: true, name: true, slug: true } },
          children: {
            where: { deletedAt: null },
            orderBy: { sortOrder: 'asc' },
          },
          _count: {
            select: {
              products: { where: { deletedAt: null } },
              children: { where: { deletedAt: null } },
            },
          },
        },
      });
    });
  });

  describe('getCategoryTree', () => {
    it('should return hierarchical category structure', async () => {
      const mockCategories = [
        {
          id: 'root-1',
          name: 'Electronics',
          slug: 'electronics',
          parentId: null,
          parent: null,
          children: [
            { id: 'child-1', name: 'Phones', slug: 'phones' },
          ],
          _count: { products: 10, children: 1 },
        },
        {
          id: 'child-1',
          name: 'Phones',
          slug: 'phones',
          parentId: 'root-1',
          parent: { id: 'root-1', name: 'Electronics', slug: 'electronics' },
          children: [],
          _count: { products: 5, children: 0 },
        },
      ];

      prismaMock.category.findMany.mockResolvedValue(mockCategories as any);

      const result = await categoryService.getCategoryTree(mockStoreId);

      expect(result).toHaveLength(1); // Only root categories in result
      expect(result[0].level).toBe(0);
      expect(result[0].hasChildren).toBe(true);
    });
  });

  describe('createCategory', () => {
    const validCategoryData = {
      name: 'New Category',
      description: 'A new category',
      isPublished: true,
      sortOrder: 0,
    };

    beforeEach(() => {
      // Mock validation calls
      prismaMock.category.findFirst.mockResolvedValue(null); // No conflicts
    });

    it('should create category with valid data', async () => {
      const mockCreatedCategory = {
        id: 'new-category-id',
        ...validCategoryData,
        slug: 'new-category',
        storeId: mockStoreId,
        parentId: null,
        parent: null,
        children: [],
        _count: { products: 0, children: 0 },
      };

      prismaMock.category.create.mockResolvedValue(mockCreatedCategory as any);

      const result = await categoryService.createCategory(mockStoreId, validCategoryData);

      expect(result).toEqual(mockCreatedCategory);
      expect(prismaMock.category.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: validCategoryData.name,
          description: validCategoryData.description,
          storeId: mockStoreId,
          slug: expect.any(String),
        }),
        include: expect.any(Object),
      });
    });

    it('should generate slug from name if not provided', async () => {
      const categoryDataWithoutSlug = { ...validCategoryData };

      prismaMock.category.create.mockResolvedValue({
        id: 'new-category-id',
        ...categoryDataWithoutSlug,
        slug: 'new-category',
        storeId: mockStoreId,
      } as any);

      await categoryService.createCategory(mockStoreId, categoryDataWithoutSlug);

      expect(prismaMock.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: expect.stringMatching(/^[a-z0-9-]+$/),
          }),
        })
      );
    });

    it('should throw error for duplicate slug', async () => {
      const categoryWithSlug = {
        ...validCategoryData,
        slug: 'existing-slug',
      };

      // Mock existing category with same slug
      prismaMock.category.findFirst.mockResolvedValue({
        id: 'existing-category',
        slug: 'existing-slug',
      } as any);

      await expect(
        categoryService.createCategory(mockStoreId, categoryWithSlug)
      ).rejects.toThrow("Slug 'existing-slug' already exists in this store");
    });

    it('should validate parent category exists', async () => {
      const categoryWithParent = {
        ...validCategoryData,
        parentId: 'non-existent-parent',
      };

      // Mock parent not found
      prismaMock.category.findFirst
        .mockResolvedValueOnce(null) // slug check
        .mockResolvedValueOnce(null); // parent check

      await expect(
        categoryService.createCategory(mockStoreId, categoryWithParent)
      ).rejects.toThrow('Parent category not found');
    });
  });

  describe('updateCategory', () => {
    const existingCategory = {
      id: mockCategoryId,
      name: 'Existing Category',
      slug: 'existing-category',
      storeId: mockStoreId,
      parentId: null,
      deletedAt: null,
    };

    beforeEach(() => {
      prismaMock.category.findFirst.mockResolvedValue(existingCategory as any);
      prismaMock.category.update.mockResolvedValue({
        ...existingCategory,
        name: 'Updated Category',
      } as any);
    });

    it('should update category with valid data', async () => {
      const updateData = {
        name: 'Updated Category',
        description: 'Updated description',
      };

      await categoryService.updateCategory(mockCategoryId, mockStoreId, updateData);

      expect(prismaMock.category.update).toHaveBeenCalledWith({
        where: { id: mockCategoryId },
        data: expect.objectContaining({
          name: 'Updated Category',
          description: 'Updated description',
        }),
        include: expect.any(Object),
      });
    });

    it('should generate new slug when name changes', async () => {
      const updateData = { name: 'New Name' };

      // Mock slug uniqueness check
      prismaMock.category.findFirst
        .mockResolvedValueOnce(existingCategory as any) // existing category
        .mockResolvedValueOnce(null); // slug uniqueness check

      await categoryService.updateCategory(mockCategoryId, mockStoreId, updateData);

      expect(prismaMock.category.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: expect.stringMatching(/^[a-z0-9-]+$/),
          }),
        })
      );
    });

    it('should throw error if category not found', async () => {
      prismaMock.category.findFirst.mockResolvedValue(null);

      await expect(
        categoryService.updateCategory('non-existent', mockStoreId, { name: 'Test' })
      ).rejects.toThrow('Category not found');
    });
  });

  describe('deleteCategory', () => {
    it('should soft delete category when no children or products', async () => {
      const categoryWithoutDependencies = {
        id: mockCategoryId,
        storeId: mockStoreId,
        _count: { children: 0, products: 0 },
        deletedAt: null,
      };

      prismaMock.category.findFirst.mockResolvedValue(categoryWithoutDependencies as any);
      prismaMock.category.update.mockResolvedValue({} as any);

      await categoryService.deleteCategory(mockCategoryId, mockStoreId);

      expect(prismaMock.category.update).toHaveBeenCalledWith({
        where: { id: mockCategoryId },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw error when category has children', async () => {
      const categoryWithChildren = {
        id: mockCategoryId,
        storeId: mockStoreId,
        _count: { children: 2, products: 0 },
        deletedAt: null,
      };

      prismaMock.category.findFirst.mockResolvedValue(categoryWithChildren as any);

      await expect(
        categoryService.deleteCategory(mockCategoryId, mockStoreId)
      ).rejects.toThrow('Cannot delete category with subcategories');
    });

    it('should throw error when category has products', async () => {
      const categoryWithProducts = {
        id: mockCategoryId,
        storeId: mockStoreId,
        _count: { children: 0, products: 5 },
        deletedAt: null,
      };

      prismaMock.category.findFirst.mockResolvedValue(categoryWithProducts as any);

      await expect(
        categoryService.deleteCategory(mockCategoryId, mockStoreId)
      ).rejects.toThrow('Cannot delete category with products');
    });
  });

  describe('moveCategory', () => {
    const sourceCategory = {
      id: mockCategoryId,
      storeId: mockStoreId,
      deletedAt: null,
    };

    const targetParent = {
      id: 'new-parent-id',
      storeId: mockStoreId,
      deletedAt: null,
    };

    beforeEach(() => {
      prismaMock.category.findFirst
        .mockResolvedValueOnce(sourceCategory as any) // source category
        .mockResolvedValueOnce(targetParent as any); // target parent

      prismaMock.category.findMany.mockResolvedValue([]); // no descendants for circular check
      prismaMock.category.update.mockResolvedValue({
        ...sourceCategory,
        parentId: 'new-parent-id',
      } as any);
    });

    it('should move category to new parent', async () => {
      await categoryService.moveCategory(mockCategoryId, 'new-parent-id', mockStoreId);

      expect(prismaMock.category.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            parentId: 'new-parent-id',
          }),
        })
      );
    });

    it('should throw error if new parent not found', async () => {
      prismaMock.category.findFirst
        .mockResolvedValueOnce(sourceCategory as any) // source category
        .mockResolvedValueOnce(null); // parent not found

      await expect(
        categoryService.moveCategory(mockCategoryId, 'non-existent-parent', mockStoreId)
      ).rejects.toThrow('New parent category not found');
    });
  });

  describe('reorderCategories', () => {
    it('should update sort order for categories', async () => {
      const categoryIds = ['cat-1', 'cat-2', 'cat-3'];
      const mockCategories = categoryIds.map((id, index) => ({
        id,
        storeId: mockStoreId,
        parentId: 'parent-1',
        sortOrder: index,
      }));

      prismaMock.category.findMany.mockResolvedValue(mockCategories as any);
      prismaMock.$transaction.mockResolvedValue([]);

      await categoryService.reorderCategories(mockStoreId, 'parent-1', categoryIds);

      expect(prismaMock.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            where: { id: 'cat-1' },
            data: { sortOrder: 0 },
          }),
          expect.objectContaining({
            where: { id: 'cat-2' },
            data: { sortOrder: 1 },
          }),
          expect.objectContaining({
            where: { id: 'cat-3' },
            data: { sortOrder: 2 },
          }),
        ])
      );
    });

    it('should throw error if categories do not belong to same parent', async () => {
      const categoryIds = ['cat-1', 'cat-2'];
      
      // Return only one category (missing one)
      prismaMock.category.findMany.mockResolvedValue([
        { id: 'cat-1', parentId: 'parent-1' },
      ] as any);

      await expect(
        categoryService.reorderCategories(mockStoreId, 'parent-1', categoryIds)
      ).rejects.toThrow('One or more categories not found');
    });
  });
});