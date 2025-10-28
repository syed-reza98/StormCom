/**
 * E2E Test: Customer can browse products and view details
 * 
 * Tests the complete product browsing workflow:
 * - Homepage navigation
 * - Product listing with filters and sorting
 * - Category navigation
 * - Product detail page with variants
 * - Breadcrumb navigation
 */

import { test, expect } from '@playwright/test';

test.describe('Product Browsing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
  });

  test('should display homepage with featured products and categories', async ({ page }) => {
    // Verify hero section
    await expect(page.locator('h1')).toContainText('Welcome to StormCom');
    
    // Verify featured products section exists
    const featuredSection = page.locator('section').filter({ hasText: 'Featured Products' });
    await expect(featuredSection).toBeVisible();
    
    // Verify at least one product card is visible
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible();
    
    // Verify categories section exists
    const categoriesSection = page.locator('section').filter({ hasText: 'Shop by Category' });
    await expect(categoriesSection).toBeVisible();
  });

  test('should navigate to products page and display product grid', async ({ page }) => {
    // Click "Shop Now" button or navigate directly
    await page.goto('/products');
    
    // Verify page title
    await expect(page.locator('h1')).toContainText('Products');
    
    // Verify product grid is visible
    const productGrid = page.locator('[data-testid="product-card"]');
    await expect(productGrid.first()).toBeVisible();
    
    // Verify filters sidebar exists
    await expect(page.locator('aside')).toBeVisible();
    
    // Verify sort dropdown exists
    await expect(page.getByRole('combobox')).toBeVisible();
  });

  test('should filter products by category', async ({ page }) => {
    await page.goto('/products');
    
    // Get initial product count
    const initialProducts = await page.locator('[data-testid="product-card"]').count();
    
    // Select a category filter (assuming first radio button is a category)
    const firstCategory = page.locator('input[type="radio"]').first();
    await firstCategory.check();
    
    // Click apply filters button
    await page.getByRole('button', { name: /apply filters/i }).click();
    
    // Wait for navigation/reload
    await page.waitForLoadState('networkidle');
    
    // Verify URL has category parameter
    expect(page.url()).toContain('categoryId=');
    
    // Verify products are displayed (may be different count)
    const filteredProducts = await page.locator('[data-testid="product-card"]').count();
    expect(filteredProducts).toBeGreaterThan(0);
  });

  test('should filter products by price range', async ({ page }) => {
    await page.goto('/products');
    
    // Enter min price
    await page.locator('input[placeholder*="Min"]').fill('10');
    
    // Enter max price
    await page.locator('input[placeholder*="Max"]').fill('100');
    
    // Click apply filters
    await page.getByRole('button', { name: /apply filters/i }).click();
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Verify URL has price parameters
    expect(page.url()).toContain('minPrice=10');
    expect(page.url()).toContain('maxPrice=100');
  });

  test('should sort products by price', async ({ page }) => {
    await page.goto('/products');
    
    // Click sort dropdown
    await page.getByRole('combobox').click();
    
    // Select "Price: Low to High"
    await page.getByRole('option', { name: /price.*low.*high/i }).click();
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Verify URL has sort parameters
    expect(page.url()).toContain('sortBy=price');
    expect(page.url()).toContain('sortOrder=asc');
    
    // Get all product prices
    const prices = await page.locator('[data-testid="product-card"]').allTextContents();
    // Note: In a real test, we'd extract and verify prices are sorted
  });

  test('should navigate to product detail page from product card', async ({ page }) => {
    await page.goto('/products');
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]');
    
    // Get first product name
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    const productName = await firstProduct.locator('h3').textContent();
    
    // Click on the product
    await firstProduct.click();
    
    // Wait for navigation to product detail page
    await page.waitForURL(/\/products\/.+/);
    
    // Verify we're on product detail page
    expect(page.url()).toMatch(/\/products\/[^\/]+$/);
    
    // Verify product name is displayed
    await expect(page.locator('h1')).toContainText(productName || '');
  });

  test('should display product details with image gallery', async ({ page }) => {
    // Navigate directly to a product (assuming slug exists)
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]');
    
    // Click first product
    await page.locator('[data-testid="product-card"]').first().click();
    await page.waitForLoadState('networkidle');
    
    // Verify main image is visible
    const mainImage = page.locator('img').first();
    await expect(mainImage).toBeVisible();
    
    // Verify product name
    await expect(page.locator('h1')).toBeVisible();
    
    // Verify price is displayed
    await expect(page.locator('text=/\\$[0-9]+\\.[0-9]{2}/')).toBeVisible();
    
    // Verify add to cart button exists
    await expect(page.getByRole('button', { name: /add to cart/i })).toBeVisible();
    
    // Verify quantity controls exist
    await expect(page.locator('input[type="number"]')).toBeVisible();
  });

  test('should navigate image gallery with thumbnails', async ({ page }) => {
    // Navigate to product detail page
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.waitForLoadState('networkidle');
    
    // Check if multiple images exist (thumbnails)
    const thumbnails = page.locator('button[aria-label*="View image"]');
    const thumbnailCount = await thumbnails.count();
    
    if (thumbnailCount > 1) {
      // Click second thumbnail
      await thumbnails.nth(1).click();
      
      // Wait for image to change
      await page.waitForTimeout(300);
      
      // Verify image counter updated (if visible)
      const counter = page.locator('text=/[0-9]+ \\/ [0-9]+/');
      if (await counter.isVisible()) {
        await expect(counter).toContainText('2 /');
      }
    }
  });

  test('should display product tabs with description and specifications', async ({ page }) => {
    // Navigate to product detail page
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.waitForLoadState('networkidle');
    
    // Verify tabs are visible
    await expect(page.getByRole('button', { name: 'Description' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Specifications' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reviews' })).toBeVisible();
    
    // Click Specifications tab
    await page.getByRole('button', { name: 'Specifications' }).click();
    
    // Verify specifications table is visible
    await expect(page.locator('table')).toBeVisible();
  });

  test('should navigate categories with breadcrumbs', async ({ page }) => {
    // Navigate to categories page (if exists)
    await page.goto('/products');
    
    // Check if category filter exists
    const categoryRadio = page.locator('input[type="radio"]').first();
    if (await categoryRadio.isVisible()) {
      await categoryRadio.check();
      await page.getByRole('button', { name: /apply filters/i }).click();
      await page.waitForLoadState('networkidle');
      
      // Verify breadcrumbs exist on category page
      const breadcrumbs = page.locator('nav[aria-label="Breadcrumb"]');
      await expect(breadcrumbs).toBeVisible();
      
      // Verify breadcrumb contains "Home"
      await expect(breadcrumbs.locator('text=Home')).toBeVisible();
    }
  });

  test('should display related products section', async ({ page }) => {
    // Navigate to product detail page
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]');
    await page.locator('[data-testid="product-card"]').first().click();
    await page.waitForLoadState('networkidle');
    
    // Scroll to bottom to see related products
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check if related products section exists
    const relatedSection = page.locator('section').filter({ hasText: /related products/i });
    const isVisible = await relatedSection.isVisible().catch(() => false);
    
    if (isVisible) {
      // Verify at least one related product is shown
      const relatedProducts = relatedSection.locator('[data-testid="product-card"]');
      await expect(relatedProducts.first()).toBeVisible();
    }
  });

  test('should search products and display results', async ({ page }) => {
    // Navigate to search page with query
    await page.goto('/search?q=product');
    
    // Verify search results header
    await expect(page.locator('h1')).toContainText('Search Results');
    
    // Verify product grid or empty state
    const productCards = page.locator('[data-testid="product-card"]');
    const noResults = page.locator('text=/no products found/i');
    
    // Either products or no results message should be visible
    const hasProducts = await productCards.first().isVisible().catch(() => false);
    const hasNoResults = await noResults.isVisible().catch(() => false);
    
    expect(hasProducts || hasNoResults).toBe(true);
  });

  test('should display empty state when no products match search', async ({ page }) => {
    // Search for non-existent product
    await page.goto('/search?q=nonexistentproductxyz123');
    
    // Verify empty state message
    await expect(page.locator('text=/no products found/i')).toBeVisible();
    
    // Verify search tips are displayed
    await expect(page.locator('text=/search tips/i')).toBeVisible();
    
    // Verify "Browse All Products" link exists
    await expect(page.locator('a[href="/products"]')).toBeVisible();
  });

  test('should maintain filters across pagination', async ({ page }) => {
    await page.goto('/products?minPrice=10&maxPrice=100');
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]');
    
    // Check if pagination exists
    const nextButton = page.locator('a[aria-label="Next page"]');
    const isVisible = await nextButton.isVisible().catch(() => false);
    
    if (isVisible && !(await nextButton.getAttribute('aria-disabled'))) {
      // Click next page
      await nextButton.click();
      await page.waitForLoadState('networkidle');
      
      // Verify filters are preserved in URL
      expect(page.url()).toContain('minPrice=10');
      expect(page.url()).toContain('maxPrice=100');
      expect(page.url()).toContain('page=2');
    }
  });
});
