// tests/e2e/products/categories-management.spec.ts
// E2E tests for category management functionality

import { test, expect } from '@playwright/test';
import { seedTestData } from '../helpers/test-data';
import { loginAsStoreOwner } from '../helpers/auth';

test.describe('Categories Management', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test data
    await seedTestData();
    
    // Login as store owner
    await loginAsStoreOwner(page);
  });

  test.describe('Category Listing', () => {
    test('should display categories in tree view', async ({ page }) => {
      await page.goto('/categories');
      
      // Wait for categories to load
      await expect(page.locator('[data-testid="categories-tree"]')).toBeVisible();
      
      // Check that categories are displayed
      const categoryNodes = page.locator('[data-testid="category-node"]');
      await expect(categoryNodes).toHaveCount(await categoryNodes.count());
      
      // Verify category structure
      const firstCategory = categoryNodes.first();
      await expect(firstCategory.locator('[data-testid="category-name"]')).toBeVisible();
      await expect(firstCategory.locator('[data-testid="category-products-count"]')).toBeVisible();
    });

    test('should expand and collapse category tree', async ({ page }) => {
      await page.goto('/categories');
      
      // Find a parent category with children
      const parentCategory = page.locator('[data-testid="category-node"][data-has-children="true"]').first();
      
      if (await parentCategory.count() > 0) {
        // Expand category
        await parentCategory.locator('[data-testid="expand-button"]').click();
        await expect(parentCategory.locator('[data-testid="category-children"]')).toBeVisible();
        
        // Collapse category
        await parentCategory.locator('[data-testid="collapse-button"]').click();
        await expect(parentCategory.locator('[data-testid="category-children"]')).not.toBeVisible();
      }
    });

    test('should filter categories by search', async ({ page }) => {
      await page.goto('/categories');
      
      // Enter search term
      await page.fill('[data-testid="category-search"]', 'electronics');
      
      // Wait for filtered results
      await page.waitForTimeout(500);
      
      // Verify search results
      const visibleCategories = page.locator('[data-testid="category-node"]:visible');
      const count = await visibleCategories.count();
      
      for (let i = 0; i < count; i++) {
        const name = await visibleCategories.nth(i).locator('[data-testid="category-name"]').textContent();
        expect(name?.toLowerCase()).toContain('electronics');
      }
      
      // Clear search
      await page.fill('[data-testid="category-search"]', '');
      await page.waitForTimeout(500);
    });

    test('should show category statistics', async ({ page }) => {
      await page.goto('/categories');
      
      // Check stats cards
      await expect(page.locator('[data-testid="total-categories"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-categories"]')).toBeVisible();
      await expect(page.locator('[data-testid="empty-categories"]')).toBeVisible();
      
      // Verify stats contain numbers
      const totalCategories = await page.locator('[data-testid="total-categories"] .text-2xl').textContent();
      expect(totalCategories).toMatch(/^\d+$/);
    });
  });

  test.describe('Category Creation', () => {
    test('should create a new root category', async ({ page }) => {
      await page.goto('/categories');
      
      // Click create category button
      await page.click('[data-testid="create-category"]');
      
      // Fill in category details
      await page.fill('[data-testid="category-name"]', 'Test Category E2E');
      await page.fill('[data-testid="category-slug"]', 'test-category-e2e');
      await page.fill('[data-testid="category-description"]', 'This is a test category created by E2E test');
      
      // Submit form
      await page.click('[data-testid="save-category"]');
      
      // Wait for success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      
      // Verify category appears in tree
      await expect(page.locator('[data-testid="category-node"]').filter({ hasText: 'Test Category E2E' })).toBeVisible();
    });

    test('should create a subcategory', async ({ page }) => {
      await page.goto('/categories');
      
      // Find parent category and click add child
      const parentCategory = page.locator('[data-testid="category-node"]').first();
      await parentCategory.hover();
      await parentCategory.locator('[data-testid="add-subcategory"]').click();
      
      // Fill in subcategory details
      await page.fill('[data-testid="category-name"]', 'Test Subcategory');
      await page.fill('[data-testid="category-slug"]', 'test-subcategory');
      
      // Submit form
      await page.click('[data-testid="save-category"]');
      
      // Verify subcategory appears under parent
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      
      // Expand parent to see subcategory
      await parentCategory.locator('[data-testid="expand-button"]').click();
      await expect(parentCategory.locator('[data-testid="category-children"]').filter({ hasText: 'Test Subcategory' })).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/categories');
      
      // Click create category
      await page.click('[data-testid="create-category"]');
      
      // Try to submit without required fields
      await page.click('[data-testid="save-category"]');
      
      // Check for validation errors
      await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="slug-error"]')).toBeVisible();
    });

    test('should auto-generate slug from name', async ({ page }) => {
      await page.goto('/categories');
      await page.click('[data-testid="create-category"]');
      
      // Type category name
      await page.fill('[data-testid="category-name"]', 'Auto Generated Slug Test');
      
      // Click outside to trigger slug generation
      await page.click('[data-testid="category-description"]');
      
      // Verify slug was generated
      const slugValue = await page.locator('[data-testid="category-slug"]').inputValue();
      expect(slugValue).toBe('auto-generated-slug-test');
    });

    test('should upload category image', async ({ page }) => {
      await page.goto('/categories');
      await page.click('[data-testid="create-category"]');
      
      // Fill basic info
      await page.fill('[data-testid="category-name"]', 'Category with Image');
      await page.fill('[data-testid="category-slug"]', 'category-with-image');
      
      // Upload image
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.click('[data-testid="category-image-upload"]');
      const fileChooser = await fileChooserPromise;
      
      await fileChooser.setFiles({
        name: 'category-image.png',
        mimeType: 'image/png',
        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
      });
      
      // Wait for image preview
      await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
      
      // Submit form
      await page.click('[data-testid="save-category"]');
      
      // Verify category was created with image
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });
  });

  test.describe('Category Editing', () => {
    test('should edit existing category', async ({ page }) => {
      await page.goto('/categories');
      
      // Find and click edit on first category
      const firstCategory = page.locator('[data-testid="category-node"]').first();
      await firstCategory.hover();
      await firstCategory.locator('[data-testid="edit-category"]').click();
      
      // Modify category name
      const newName = 'Updated Category Name E2E';
      await page.fill('[data-testid="category-name"]', newName);
      
      // Save changes
      await page.click('[data-testid="save-category"]');
      
      // Verify changes
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="category-node"]').filter({ hasText: newName })).toBeVisible();
    });

    test('should reorder categories via drag and drop', async ({ page }) => {
      await page.goto('/categories');
      
      // Get initial order
      const categories = page.locator('[data-testid="category-node"]');
      const firstCategoryName = await categories.first().locator('[data-testid="category-name"]').textContent();
      const secondCategoryName = await categories.nth(1).locator('[data-testid="category-name"]').textContent();
      
      // Drag first category to second position
      await categories.first().dragTo(categories.nth(1));
      
      // Wait for reorder to complete
      await page.waitForTimeout(1000);
      
      // Verify order changed
      const newFirstCategoryName = await categories.first().locator('[data-testid="category-name"]').textContent();
      expect(newFirstCategoryName).toBe(secondCategoryName);
    });

    test('should move category to different parent', async ({ page }) => {
      await page.goto('/categories');
      
      // Create test categories for moving
      await page.click('[data-testid="create-category"]');
      await page.fill('[data-testid="category-name"]', 'Source Category');
      await page.fill('[data-testid="category-slug"]', 'source-category');
      await page.click('[data-testid="save-category"]');
      
      await page.click('[data-testid="create-category"]');
      await page.fill('[data-testid="category-name"]', 'Target Category');
      await page.fill('[data-testid="category-slug"]', 'target-category');
      await page.click('[data-testid="save-category"]');
      
      // Move source under target
      const sourceCategory = page.locator('[data-testid="category-node"]').filter({ hasText: 'Source Category' });
      const targetCategory = page.locator('[data-testid="category-node"]').filter({ hasText: 'Target Category' });
      
      await sourceCategory.hover();
      await sourceCategory.locator('[data-testid="move-category"]').click();
      
      // Select new parent
      await page.click('[data-testid="parent-select"]');
      await page.click('[data-testid="parent-option"]').filter({ hasText: 'Target Category' });
      await page.click('[data-testid="confirm-move"]');
      
      // Verify move
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });
  });

  test.describe('Category Deletion', () => {
    test('should delete empty category', async ({ page }) => {
      await page.goto('/categories');
      
      // Create a test category to delete
      await page.click('[data-testid="create-category"]');
      await page.fill('[data-testid="category-name"]', 'Category to Delete');
      await page.fill('[data-testid="category-slug"]', 'category-to-delete');
      await page.click('[data-testid="save-category"]');
      
      // Delete the category
      const testCategory = page.locator('[data-testid="category-node"]').filter({ hasText: 'Category to Delete' });
      await testCategory.hover();
      await testCategory.locator('[data-testid="delete-category"]').click();
      
      // Confirm deletion
      await expect(page.locator('[data-testid="delete-modal"]')).toBeVisible();
      await page.click('[data-testid="confirm-delete"]');
      
      // Verify deletion
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(testCategory).not.toBeVisible();
    });

    test('should prevent deletion of category with products', async ({ page }) => {
      await page.goto('/categories');
      
      // Try to delete category that has products
      const categoryWithProducts = page.locator('[data-testid="category-node"]').filter({ hasText: 'Electronics' });
      await categoryWithProducts.hover();
      await categoryWithProducts.locator('[data-testid="delete-category"]').click();
      
      // Should show warning about products
      await expect(page.locator('[data-testid="delete-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="products-warning"]')).toBeVisible();
      
      // Should offer to reassign products
      await expect(page.locator('[data-testid="reassign-products"]')).toBeVisible();
    });

    test('should delete category and reassign products', async ({ page }) => {
      await page.goto('/categories');
      
      // Delete category with product reassignment
      const sourceCategory = page.locator('[data-testid="category-node"]').filter({ hasText: 'Electronics' });
      await sourceCategory.hover();
      await sourceCategory.locator('[data-testid="delete-category"]').click();
      
      // Choose to reassign products
      await page.click('[data-testid="reassign-products"]');
      await page.click('[data-testid="target-category-select"]');
      await page.click('[data-testid="target-category-option"]').first();
      await page.click('[data-testid="confirm-delete-reassign"]');
      
      // Verify deletion and reassignment
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText('products reassigned');
    });
  });

  test.describe('Bulk Operations', () => {
    test('should bulk enable/disable categories', async ({ page }) => {
      await page.goto('/categories');
      
      // Select multiple categories
      await page.click('[data-testid="select-category-0"]');
      await page.click('[data-testid="select-category-1"]');
      
      // Verify bulk actions appear
      await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();
      
      // Disable selected categories
      await page.click('[data-testid="bulk-disable"]');
      await page.click('[data-testid="confirm-bulk-action"]');
      
      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should bulk delete empty categories', async ({ page }) => {
      await page.goto('/categories');
      
      // Create test categories for bulk delete
      for (let i = 1; i <= 2; i++) {
        await page.click('[data-testid="create-category"]');
        await page.fill('[data-testid="category-name"]', `Bulk Delete Test ${i}`);
        await page.fill('[data-testid="category-slug"]', `bulk-delete-test-${i}`);
        await page.click('[data-testid="save-category"]');
      }
      
      // Select the test categories
      const testCategory1 = page.locator('[data-testid="category-node"]').filter({ hasText: 'Bulk Delete Test 1' });
      const testCategory2 = page.locator('[data-testid="category-node"]').filter({ hasText: 'Bulk Delete Test 2' });
      
      await testCategory1.locator('[data-testid="select-category"]').click();
      await testCategory2.locator('[data-testid="select-category"]').click();
      
      // Bulk delete
      await page.click('[data-testid="bulk-delete"]');
      await page.click('[data-testid="confirm-bulk-delete"]');
      
      // Verify deletion
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(testCategory1).not.toBeVisible();
      await expect(testCategory2).not.toBeVisible();
    });
  });

  test.describe('Category SEO', () => {
    test('should manage category SEO settings', async ({ page }) => {
      await page.goto('/categories');
      
      // Edit first category
      const firstCategory = page.locator('[data-testid="category-node"]').first();
      await firstCategory.hover();
      await firstCategory.locator('[data-testid="edit-category"]').click();
      
      // Go to SEO tab
      await page.click('[data-testid="seo-tab"]');
      
      // Fill SEO fields
      await page.fill('[data-testid="seo-title"]', 'Custom SEO Title for Category');
      await page.fill('[data-testid="seo-description"]', 'Custom meta description for this category page');
      await page.fill('[data-testid="seo-keywords"]', 'category, products, ecommerce');
      
      // Save changes
      await page.click('[data-testid="save-category"]');
      
      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });
  });
});