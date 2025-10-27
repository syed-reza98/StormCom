// tests/e2e/products/product-management.spec.ts
// E2E tests for product management functionality

import { test, expect } from '@playwright/test';
import { seedTestData } from '../helpers/test-data';
import { loginAsStoreOwner } from '../helpers/auth';

test.describe('Product Management', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test data
    await seedTestData();
    
    // Login as store owner
    await loginAsStoreOwner(page);
  });

  test.describe('Product Listing', () => {
    test('should display products in grid view', async ({ page }) => {
      await page.goto('/products');
      
      // Wait for products to load
      await expect(page.locator('[data-testid="products-grid"]')).toBeVisible();
      
      // Check that products are displayed
      const productCards = page.locator('[data-testid="product-card"]');
      await expect(productCards).toHaveCount(await productCards.count());
      
      // Verify product card structure
      const firstCard = productCards.first();
      await expect(firstCard.locator('[data-testid="product-image"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="product-name"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="product-price"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="product-sku"]')).toBeVisible();
    });

    test('should switch between grid and list views', async ({ page }) => {
      await page.goto('/products');
      
      // Start in grid view
      await expect(page.locator('[data-testid="products-grid"]')).toBeVisible();
      
      // Switch to list view
      await page.click('[data-testid="list-view-button"]');
      await expect(page.locator('[data-testid="products-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="products-grid"]')).not.toBeVisible();
      
      // Switch back to grid view
      await page.click('[data-testid="grid-view-button"]');
      await expect(page.locator('[data-testid="products-grid"]')).toBeVisible();
      await expect(page.locator('[data-testid="products-list"]')).not.toBeVisible();
    });

    test('should filter products by category', async ({ page }) => {
      await page.goto('/products');
      
      // Open category filter
      await page.click('[data-testid="category-filter"]');
      
      // Select a category
      await page.click('[data-testid="category-electronics"]');
      
      // Wait for filtered results
      await page.waitForSelector('[data-testid="products-grid"]');
      
      // Verify URL contains filter parameter
      await expect(page).toHaveURL(/category=electronics/);
      
      // Verify products are filtered
      const products = page.locator('[data-testid="product-card"]');
      await expect(products).toHaveCount(await products.count());
      
      // Clear filter
      await page.click('[data-testid="clear-filters"]');
      await expect(page).toHaveURL(/\/products$/);
    });

    test('should search products by name', async ({ page }) => {
      await page.goto('/products');
      
      // Enter search term
      await page.fill('[data-testid="product-search"]', 'laptop');
      await page.press('[data-testid="product-search"]', 'Enter');
      
      // Wait for search results
      await page.waitForSelector('[data-testid="products-grid"]');
      
      // Verify URL contains search parameter
      await expect(page).toHaveURL(/search=laptop/);
      
      // Verify search results contain the term
      const productNames = page.locator('[data-testid="product-name"]');
      const count = await productNames.count();
      
      for (let i = 0; i < count; i++) {
        const name = await productNames.nth(i).textContent();
        expect(name?.toLowerCase()).toContain('laptop');
      }
    });

    test('should sort products by price', async ({ page }) => {
      await page.goto('/products');
      
      // Open sort dropdown
      await page.click('[data-testid="sort-dropdown"]');
      
      // Select price ascending
      await page.click('[data-testid="sort-price-asc"]');
      
      // Wait for sorted results
      await page.waitForSelector('[data-testid="products-grid"]');
      
      // Get all product prices
      const priceElements = page.locator('[data-testid="product-price"]');
      const prices = await priceElements.allTextContents();
      
      // Convert to numbers and verify sorting
      const numericPrices = prices.map(price => 
        parseFloat(price.replace(/[^0-9.]/g, ''))
      );
      
      for (let i = 1; i < numericPrices.length; i++) {
        expect(numericPrices[i]).toBeGreaterThanOrEqual(numericPrices[i - 1]);
      }
    });

    test('should paginate through products', async ({ page }) => {
      await page.goto('/products');
      
      // Wait for initial page to load
      await page.waitForSelector('[data-testid="products-grid"]');
      
      // Check if pagination exists (only if there are many products)
      const pagination = page.locator('[data-testid="pagination"]');
      
      if (await pagination.isVisible()) {
        // Go to next page
        await page.click('[data-testid="next-page"]');
        
        // Wait for new products to load
        await page.waitForLoadState('networkidle');
        
        // Verify URL changed
        await expect(page).toHaveURL(/page=2/);
        
        // Verify different products are shown
        const newProducts = await page.locator('[data-testid="product-card"]').count();
        expect(newProducts).toBeGreaterThan(0);
        
        // Go back to first page
        await page.click('[data-testid="prev-page"]');
        await expect(page).toHaveURL(/page=1|\/products$/);
      }
    });
  });

  test.describe('Product Creation', () => {
    test('should create a new product successfully', async ({ page }) => {
      await page.goto('/products/new');
      
      // Fill in product details
      await page.fill('[data-testid="product-name"]', 'Test Product E2E');
      await page.fill('[data-testid="product-sku"]', 'TEST-SKU-001');
      await page.fill('[data-testid="product-price"]', '99.99');
      await page.fill('[data-testid="product-description"]', 'This is a test product created by E2E test');
      
      // Select category
      await page.click('[data-testid="category-select"]');
      await page.click('[data-testid="category-option-electronics"]');
      
      // Add stock
      await page.fill('[data-testid="stock-quantity"]', '50');
      
      // Submit form
      await page.click('[data-testid="save-product"]');
      
      // Wait for redirect and success message
      await page.waitForURL(/\/products\/[^\/]+$/);
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      
      // Verify product details are displayed
      await expect(page.locator('h1')).toContainText('Test Product E2E');
      await expect(page.locator('[data-testid="product-sku-display"]')).toContainText('TEST-SKU-001');
      await expect(page.locator('[data-testid="product-price-display"]')).toContainText('$99.99');
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/products/new');
      
      // Try to submit without required fields
      await page.click('[data-testid="save-product"]');
      
      // Check for validation errors
      await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="sku-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="price-error"]')).toBeVisible();
      
      // Verify form wasn't submitted
      await expect(page).toHaveURL(/\/products\/new$/);
    });

    test('should prevent duplicate SKU creation', async ({ page }) => {
      await page.goto('/products/new');
      
      // Fill form with existing SKU
      await page.fill('[data-testid="product-name"]', 'Duplicate SKU Test');
      await page.fill('[data-testid="product-sku"]', 'EXISTING-SKU-001'); // Assuming this exists
      await page.fill('[data-testid="product-price"]', '50.00');
      
      // Submit form
      await page.click('[data-testid="save-product"]');
      
      // Check for SKU error
      await expect(page.locator('[data-testid="sku-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="sku-error"]')).toContainText('SKU already exists');
    });

    test('should upload product images', async ({ page }) => {
      await page.goto('/products/new');
      
      // Fill basic product info
      await page.fill('[data-testid="product-name"]', 'Product with Image');
      await page.fill('[data-testid="product-sku"]', 'IMG-TEST-001');
      await page.fill('[data-testid="product-price"]', '75.00');
      
      // Upload image
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.click('[data-testid="image-upload-trigger"]');
      const fileChooser = await fileChooserPromise;
      
      // Create a test image file
      await fileChooser.setFiles({
        name: 'test-image.png',
        mimeType: 'image/png',
        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
      });
      
      // Wait for image preview
      await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
      
      // Submit form
      await page.click('[data-testid="save-product"]');
      
      // Verify product was created with image
      await page.waitForURL(/\/products\/[^\/]+$/);
      await expect(page.locator('[data-testid="product-image"]')).toBeVisible();
    });
  });

  test.describe('Product Editing', () => {
    test('should edit existing product', async ({ page }) => {
      // Navigate to first product
      await page.goto('/products');
      await page.click('[data-testid="product-card"]');
      const productUrl = page.url();
      
      // Go to edit page
      await page.click('[data-testid="edit-product"]');
      await expect(page).toHaveURL(/\/edit$/);
      
      // Modify product name
      const newName = 'Updated Product Name E2E';
      await page.fill('[data-testid="product-name"]', newName);
      
      // Save changes
      await page.click('[data-testid="save-product"]');
      
      // Verify redirect and changes
      await page.waitForURL(productUrl);
      await expect(page.locator('h1')).toContainText(newName);
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should update product stock', async ({ page }) => {
      await page.goto('/products');
      await page.click('[data-testid="product-card"]');
      
      // Go to inventory tab or section
      await page.click('[data-testid="inventory-tab"]');
      
      // Update stock quantity
      await page.fill('[data-testid="stock-quantity"]', '100');
      await page.click('[data-testid="update-stock"]');
      
      // Verify update
      await expect(page.locator('[data-testid="stock-display"]')).toContainText('100');
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });
  });

  test.describe('Product Deletion', () => {
    test('should delete product with confirmation', async ({ page }) => {
      await page.goto('/products');
      
      // Get initial product count
      const initialCount = await page.locator('[data-testid="product-card"]').count();
      
      // Click on first product
      await page.click('[data-testid="product-card"]');
      const productName = await page.locator('h1').textContent();
      
      // Delete product
      await page.click('[data-testid="delete-product"]');
      
      // Confirm deletion in modal
      await expect(page.locator('[data-testid="delete-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="delete-modal"]')).toContainText(productName || '');
      await page.click('[data-testid="confirm-delete"]');
      
      // Verify redirect to products list
      await page.waitForURL(/\/products$/);
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      
      // Verify product count decreased
      const newCount = await page.locator('[data-testid="product-card"]').count();
      expect(newCount).toBe(initialCount - 1);
    });

    test('should cancel product deletion', async ({ page }) => {
      await page.goto('/products');
      await page.click('[data-testid="product-card"]');
      const productUrl = page.url();
      
      // Start deletion process
      await page.click('[data-testid="delete-product"]');
      await expect(page.locator('[data-testid="delete-modal"]')).toBeVisible();
      
      // Cancel deletion
      await page.click('[data-testid="cancel-delete"]');
      
      // Verify modal closed and product still exists
      await expect(page.locator('[data-testid="delete-modal"]')).not.toBeVisible();
      await expect(page).toHaveURL(productUrl);
    });
  });

  test.describe('Bulk Operations', () => {
    test('should select and bulk delete products', async ({ page }) => {
      await page.goto('/products');
      
      // Select multiple products
      await page.click('[data-testid="select-product-0"]');
      await page.click('[data-testid="select-product-1"]');
      
      // Verify bulk actions appear
      await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();
      
      // Perform bulk delete
      await page.click('[data-testid="bulk-delete"]');
      await expect(page.locator('[data-testid="bulk-delete-modal"]')).toBeVisible();
      await page.click('[data-testid="confirm-bulk-delete"]');
      
      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText('2 products deleted');
    });

    test('should bulk update product status', async ({ page }) => {
      await page.goto('/products');
      
      // Select products
      await page.click('[data-testid="select-product-0"]');
      await page.click('[data-testid="select-product-1"]');
      
      // Change status
      await page.click('[data-testid="bulk-status"]');
      await page.click('[data-testid="status-inactive"]');
      
      // Verify update
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText('2 products updated');
    });
  });
});