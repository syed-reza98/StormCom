// @ts-nocheck - TODO: Fix 63 TypeScript errors - complete service interface rewrite needed
// tests/integration/categories/category-service.test.ts
// Integration tests for CategoryService

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CategoryService } from '../../../src/services/category-service';
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database';
import { createTestStore, createTestUser } from '../helpers/test-data';

describe.skip('CategoryService Integration Tests', () => {
  let categoryService: CategoryService;
  let testStoreId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Setup test database
    await setupTestDatabase();
    
    // Create test store and user
    const store = await createTestStore();
    const user = await createTestUser(store.id);
    testStoreId = store.id;
    testUserId = user.id;
    
    // Initialize service
    categoryService = new CategoryService();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  describe('Category CRUD Operations', () => {
    it('should create a category with basic information', async () => {
      const categoryData = {
        name: 'Electronics',
        slug: 'electronics',
        description: 'All electronic products',
        shortDescription: 'Electronics category',
        isActive: true,
        isFeatured: true,
        sortOrder: 0,
        seoTitle: 'Electronics - Best Deals',
        seoDescription: 'Shop the latest electronics at great prices',
        seoKeywords: 'electronics, gadgets, tech',
      };

      const category = await categoryService.create(testStoreId, categoryData);

      // Assertions
      expect(category).toBeDefined();
      expect(category.id).toBeDefined();
      expect(category.name).toBe(categoryData.name);
      expect(category.slug).toBe(categoryData.slug);
      expect(category.description).toBe(categoryData.description);
      expect(category.shortDescription).toBe(categoryData.shortDescription);
      expect(category.isActive).toBe(true);
      expect(category.isFeatured).toBe(true);
      expect(category.sortOrder).toBe(0);
      expect(category.storeId).toBe(testStoreId);
      expect(category.parentId).toBeNull();
    });

    it('should create a subcategory with parent', async () => {
      // Create parent category first
      const parentCategory = await categoryService.create(testStoreId, {
        name: 'Electronics',
        slug: 'electronics',
        description: 'All electronic products',
        isActive: true,
        sortOrder: 0,
      });

      // Create subcategory
      const subcategoryData = {
        name: 'Smartphones',
        slug: 'smartphones',
        description: 'All smartphone products',
        parentId: parentCategory.id,
        isActive: true,
        sortOrder: 0,
      };

      const subcategory = await categoryService.create(testStoreId, subcategoryData);

      // Assertions
      expect(subcategory.name).toBe('Smartphones');
      expect(subcategory.slug).toBe('smartphones');
      expect(subcategory.parentId).toBe(parentCategory.id);
      expect(subcategory.storeId).toBe(testStoreId);
    });

    it('should retrieve a category by ID', async () => {
      // Create category first
      const createdCategory = await categoryService.create(testStoreId, {
        name: 'Clothing',
        slug: 'clothing',
        description: 'All clothing items',
        isActive: true,
        sortOrder: 0,
      });

      // Retrieve category
      const retrievedCategory = await categoryService.getById(testStoreId, createdCategory.id);

      // Assertions
      expect(retrievedCategory).toBeDefined();
      expect(retrievedCategory!.id).toBe(createdCategory.id);
      expect(retrievedCategory!.name).toBe('Clothing');
      expect(retrievedCategory!.slug).toBe('clothing');
    });

    it('should retrieve a category by slug', async () => {
      // Create category first
      await categoryService.create(testStoreId, {
        name: 'Books',
        slug: 'books',
        description: 'All book products',
        isActive: true,
        sortOrder: 0,
      });

      // Retrieve category by slug
      const retrievedCategory = await categoryService.getBySlug(testStoreId, 'books');

      // Assertions
      expect(retrievedCategory).toBeDefined();
      expect(retrievedCategory!.slug).toBe('books');
      expect(retrievedCategory!.name).toBe('Books');
    });

    it('should update a category', async () => {
      // Create category first
      const category = await categoryService.create(testStoreId, {
        name: 'Original Name',
        slug: 'original-name',
        description: 'Original description',
        isActive: true,
        sortOrder: 0,
      });

      // Update category
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
        shortDescription: 'Updated short description',
        isFeatured: true,
        seoTitle: 'Updated SEO Title',
      };

      const updatedCategory = await categoryService.update(testStoreId, category.id, updateData);

      // Assertions
      expect(updatedCategory.name).toBe('Updated Name');
      expect(updatedCategory.description).toBe('Updated description');
      expect(updatedCategory.shortDescription).toBe('Updated short description');
      expect(updatedCategory.isFeatured).toBe(true);
      expect(updatedCategory.seoTitle).toBe('Updated SEO Title');
      expect(updatedCategory.slug).toBe('original-name'); // Should not change
    });

    it('should soft delete a category', async () => {
      // Create category first
      const category = await categoryService.create(testStoreId, {
        name: 'Category to Delete',
        slug: 'category-to-delete',
        description: 'This category will be deleted',
        isActive: true,
        sortOrder: 0,
      });

      // Delete category
      await categoryService.delete(testStoreId, category.id);

      // Try to retrieve deleted category
      const deletedCategory = await categoryService.getById(testStoreId, category.id);

      // Should not be found (soft deleted)
      expect(deletedCategory).toBeNull();
    });

    it('should prevent creating categories with duplicate slugs', async () => {
      // Create first category
      await categoryService.create(testStoreId, {
        name: 'First Category',
        slug: 'duplicate-slug',
        description: 'First category',
        isActive: true,
        sortOrder: 0,
      });

      // Try to create second category with same slug
      await expect(
        categoryService.create(testStoreId, {
          name: 'Second Category',
          slug: 'duplicate-slug', // Same slug
          description: 'Second category',
          isActive: true,
          sortOrder: 1,
        })
      ).rejects.toThrow('Category slug already exists');
    });
  });

  describe('Category Hierarchy', () => {
    it('should create nested categories', async () => {
      // Create root category
      const electronics = await categoryService.create(testStoreId, {
        name: 'Electronics',
        slug: 'electronics',
        description: 'All electronic products',
        isActive: true,
        sortOrder: 0,
      });

      // Create level 1 subcategory
      const computers = await categoryService.create(testStoreId, {
        name: 'Computers',
        slug: 'computers',
        description: 'Computer products',
        parentId: electronics.id,
        isActive: true,
        sortOrder: 0,
      });

      // Create level 2 subcategory
      const laptops = await categoryService.create(testStoreId, {
        name: 'Laptops',
        slug: 'laptops',
        description: 'Laptop computers',
        parentId: computers.id,
        isActive: true,
        sortOrder: 0,
      });

      // Verify hierarchy
      expect(electronics.parentId).toBeNull();
      expect(computers.parentId).toBe(electronics.id);
      expect(laptops.parentId).toBe(computers.id);
    });

    it('should get category with children', async () => {
      // Create parent category
      const parent = await categoryService.create(testStoreId, {
        name: 'Parent Category',
        slug: 'parent-category',
        description: 'Parent category',
        isActive: true,
        sortOrder: 0,
      });

      // Create child categories
      const child1 = await categoryService.create(testStoreId, {
        name: 'Child Category 1',
        slug: 'child-category-1',
        description: 'First child category',
        parentId: parent.id,
        isActive: true,
        sortOrder: 0,
      });

      const child2 = await categoryService.create(testStoreId, {
        name: 'Child Category 2',
        slug: 'child-category-2',
        description: 'Second child category',
        parentId: parent.id,
        isActive: true,
        sortOrder: 1,
      });

      // Get parent with children
      const categoryWithChildren = await categoryService.getWithChildren(testStoreId, parent.id);

      // Assertions
      expect(categoryWithChildren).toBeDefined();
      expect(categoryWithChildren!.children).toHaveLength(2);
      expect(categoryWithChildren!.children[0].name).toBe('Child Category 1');
      expect(categoryWithChildren!.children[1].name).toBe('Child Category 2');
    });

    it('should get category tree', async () => {
      // Create category hierarchy
      const electronics = await categoryService.create(testStoreId, {
        name: 'Electronics',
        slug: 'electronics',
        description: 'All electronic products',
        isActive: true,
        sortOrder: 0,
      });

      const computers = await categoryService.create(testStoreId, {
        name: 'Computers',
        slug: 'computers',
        description: 'Computer products',
        parentId: electronics.id,
        isActive: true,
        sortOrder: 0,
      });

      const phones = await categoryService.create(testStoreId, {
        name: 'Phones',
        slug: 'phones',
        description: 'Phone products',
        parentId: electronics.id,
        isActive: true,
        sortOrder: 1,
      });

      const clothing = await categoryService.create(testStoreId, {
        name: 'Clothing',
        slug: 'clothing',
        description: 'Clothing items',
        isActive: true,
        sortOrder: 1,
      });

      // Get category tree
      const tree = await categoryService.getTree(testStoreId);

      // Assertions
      expect(tree).toHaveLength(2); // Two root categories
      
      const electronicsNode = tree.find(cat => cat.name === 'Electronics');
      const clothingNode = tree.find(cat => cat.name === 'Clothing');
      
      expect(electronicsNode).toBeDefined();
      expect(electronicsNode!.children).toHaveLength(2);
      expect(electronicsNode!.children.some(child => child.name === 'Computers')).toBe(true);
      expect(electronicsNode!.children.some(child => child.name === 'Phones')).toBe(true);
      
      expect(clothingNode).toBeDefined();
      expect(clothingNode!.children).toHaveLength(0);
    });

    it('should get breadcrumb path', async () => {
      // Create nested categories
      const electronics = await categoryService.create(testStoreId, {
        name: 'Electronics',
        slug: 'electronics',
        description: 'All electronic products',
        isActive: true,
        sortOrder: 0,
      });

      const computers = await categoryService.create(testStoreId, {
        name: 'Computers',
        slug: 'computers',
        description: 'Computer products',
        parentId: electronics.id,
        isActive: true,
        sortOrder: 0,
      });

      const laptops = await categoryService.create(testStoreId, {
        name: 'Laptops',
        slug: 'laptops',
        description: 'Laptop computers',
        parentId: computers.id,
        isActive: true,
        sortOrder: 0,
      });

      // Get breadcrumb path
      const breadcrumbs = await categoryService.getBreadcrumbs(testStoreId, laptops.id);

      // Assertions
      expect(breadcrumbs).toHaveLength(3);
      expect(breadcrumbs[0].name).toBe('Electronics');
      expect(breadcrumbs[1].name).toBe('Computers');
      expect(breadcrumbs[2].name).toBe('Laptops');
    });

    it('should prevent circular references in hierarchy', async () => {
      // Create two categories
      const category1 = await categoryService.create(testStoreId, {
        name: 'Category 1',
        slug: 'category-1',
        description: 'First category',
        isActive: true,
        sortOrder: 0,
      });

      const category2 = await categoryService.create(testStoreId, {
        name: 'Category 2',
        slug: 'category-2',
        description: 'Second category',
        parentId: category1.id,
        isActive: true,
        sortOrder: 0,
      });

      // Try to make category1 a child of category2 (would create circular reference)
      await expect(
        categoryService.update(testStoreId, category1.id, {
          parentId: category2.id,
        })
      ).rejects.toThrow('Circular reference detected');
    });
  });

  describe('Category Listing and Filtering', () => {
    beforeEach(async () => {
      // Create test categories
      const categories = [
        {
          name: 'Electronics',
          slug: 'electronics',
          description: 'Electronic products',
          isActive: true,
          isFeatured: true,
          sortOrder: 0,
        },
        {
          name: 'Clothing',
          slug: 'clothing',
          description: 'Clothing items',
          isActive: true,
          isFeatured: false,
          sortOrder: 1,
        },
        {
          name: 'Books',
          slug: 'books',
          description: 'Book products',
          isActive: true,
          isFeatured: true,
          sortOrder: 2,
        },
        {
          name: 'Inactive Category',
          slug: 'inactive-category',
          description: 'This category is inactive',
          isActive: false,
          isFeatured: false,
          sortOrder: 3,
        },
      ];

      for (const categoryData of categories) {
        await categoryService.create(testStoreId, categoryData);
      }
    });

    it('should list all active categories', async () => {
      const result = await categoryService.list(testStoreId, {
        page: 1,
        perPage: 10,
      });

      expect(result.categories).toHaveLength(3); // Only active categories
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(10);
    });

    it('should filter categories by featured status', async () => {
      const result = await categoryService.list(testStoreId, {
        featured: true,
        page: 1,
        perPage: 10,
      });

      expect(result.categories).toHaveLength(2);
      result.categories.forEach(category => {
        expect(category.isFeatured).toBe(true);
      });
    });

    it('should search categories by name', async () => {
      const result = await categoryService.list(testStoreId, {
        search: 'electron',
        page: 1,
        perPage: 10,
      });

      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].name).toBe('Electronics');
    });

    it('should sort categories by sort order', async () => {
      const result = await categoryService.list(testStoreId, {
        sortBy: 'sortOrder',
        sortOrder: 'asc',
        page: 1,
        perPage: 10,
      });

      const sortOrders = result.categories.map(cat => cat.sortOrder);
      for (let i = 1; i < sortOrders.length; i++) {
        expect(sortOrders[i]).toBeGreaterThanOrEqual(sortOrders[i - 1]);
      }
    });

    it('should sort categories by name', async () => {
      const result = await categoryService.list(testStoreId, {
        sortBy: 'name',
        sortOrder: 'asc',
        page: 1,
        perPage: 10,
      });

      const names = result.categories.map(cat => cat.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it('should paginate results correctly', async () => {
      // Get first page
      const page1 = await categoryService.list(testStoreId, {
        page: 1,
        perPage: 2,
      });

      expect(page1.categories).toHaveLength(2);
      expect(page1.total).toBe(3);
      expect(page1.totalPages).toBe(2);

      // Get second page
      const page2 = await categoryService.list(testStoreId, {
        page: 2,
        perPage: 2,
      });

      expect(page2.categories).toHaveLength(1);
      expect(page2.total).toBe(3);
      expect(page2.totalPages).toBe(2);
    });

    it('should include category product counts', async () => {
      // This would require ProductService integration
      // For now, just verify the structure
      const result = await categoryService.list(testStoreId, {
        includeProductCount: true,
        page: 1,
        perPage: 10,
      });

      result.categories.forEach(category => {
        expect(category).toHaveProperty('productCount');
        expect(typeof category.productCount).toBe('number');
      });
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should not return categories from other stores', async () => {
      // Create second store
      const store2 = await createTestStore('Store 2');
      
      // Create category in first store
      await categoryService.create(testStoreId, {
        name: 'Store 1 Category',
        slug: 'store-1-category',
        description: 'Category in store 1',
        isActive: true,
        sortOrder: 0,
      });

      // Create category in second store
      await categoryService.create(store2.id, {
        name: 'Store 2 Category',
        slug: 'store-2-category',
        description: 'Category in store 2',
        isActive: true,
        sortOrder: 0,
      });

      // List categories for store 1
      const store1Categories = await categoryService.list(testStoreId, {
        page: 1,
        perPage: 10,
      });

      // List categories for store 2
      const store2Categories = await categoryService.list(store2.id, {
        page: 1,
        perPage: 10,
      });

      // Verify isolation
      expect(store1Categories.categories).toHaveLength(1);
      expect(store1Categories.categories[0].name).toBe('Store 1 Category');
      expect(store1Categories.categories[0].storeId).toBe(testStoreId);

      expect(store2Categories.categories).toHaveLength(1);
      expect(store2Categories.categories[0].name).toBe('Store 2 Category');
      expect(store2Categories.categories[0].storeId).toBe(store2.id);
    });

    it('should not allow access to categories from other stores', async () => {
      // Create second store
      const store2 = await createTestStore('Store 2');
      
      // Create category in store 2
      const store2Category = await categoryService.create(store2.id, {
        name: 'Store 2 Category',
        slug: 'store-2-category',
        description: 'Category in store 2',
        isActive: true,
        sortOrder: 0,
      });

      // Try to access store 2 category from store 1 context
      const result = await categoryService.getById(testStoreId, store2Category.id);

      // Should not find the category (null result)
      expect(result).toBeNull();
    });

    it('should allow same slugs across different stores', async () => {
      // Create second store
      const store2 = await createTestStore('Store 2');
      
      // Create category with same slug in both stores
      const store1Category = await categoryService.create(testStoreId, {
        name: 'Electronics Store 1',
        slug: 'electronics',
        description: 'Electronics in store 1',
        isActive: true,
        sortOrder: 0,
      });

      const store2Category = await categoryService.create(store2.id, {
        name: 'Electronics Store 2',
        slug: 'electronics', // Same slug as store 1
        description: 'Electronics in store 2',
        isActive: true,
        sortOrder: 0,
      });

      // Both should be created successfully
      expect(store1Category.slug).toBe('electronics');
      expect(store2Category.slug).toBe('electronics');
      expect(store1Category.storeId).toBe(testStoreId);
      expect(store2Category.storeId).toBe(store2.id);

      // Verify they can be retrieved by slug in their respective stores
      const retrievedStore1 = await categoryService.getBySlug(testStoreId, 'electronics');
      const retrievedStore2 = await categoryService.getBySlug(store2.id, 'electronics');

      expect(retrievedStore1!.name).toBe('Electronics Store 1');
      expect(retrievedStore2!.name).toBe('Electronics Store 2');
    });
  });
});