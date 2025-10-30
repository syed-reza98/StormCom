/**
 * E2E Test: Checkout fails when stock is insufficient
 * 
 * Tests error handling when product stock is insufficient:
 * 1. Add product to cart with quantity exceeding stock
 * 2. Attempt to proceed to checkout
 * 3. Verify stock validation error displayed
 * 4. Reduce quantity to valid amount
 * 5. Verify checkout proceeds successfully
 */

import { test, expect } from '@playwright/test';

test.describe('Checkout Stock Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to storefront
    await page.goto('/');
  });

  test('Checkout fails when product stock is insufficient', async ({ page }) => {
    // Step 1: Navigate to product with limited stock
    await page.goto('/products');
    
    // Click on product with limited stock (assume product has stock of 5)
    await page.click('[data-testid="product-card"]:first-child');
    
    // Verify product page loaded
    await expect(page.locator('h1[data-testid="product-name"]')).toBeVisible();
    
    // Check available stock
    const stockText = await page.locator('[data-testid="product-stock"]').textContent();
    const stockMatch = stockText?.match(/(\d+)/);
    const availableStock = stockMatch ? parseInt(stockMatch[1]) : 5;
    
    // Step 2: Attempt to add more than available stock
    const excessQuantity = availableStock + 10;
    
    // Change quantity input to exceed stock
    await page.fill('[data-testid="quantity-input"]', excessQuantity.toString());
    
    // Try to add to cart
    await page.click('[data-testid="add-to-cart-button"]');
    
    // Step 3: Verify error message displayed
    await expect(page.locator('[data-testid="stock-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="stock-error"]')).toContainText(/insufficient stock|not enough stock|only \d+ available/i);

    // Step 4: Reduce quantity to valid amount
    await page.fill('[data-testid="quantity-input"]', availableStock.toString());
    
    // Add to cart successfully
    await page.click('[data-testid="add-to-cart-button"]');
    
    // Verify success message
    await expect(page.locator('[data-testid="cart-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="cart-count"]')).toContainText(availableStock.toString());
  });

  test('Cart validation fails when stock becomes insufficient', async ({ page }) => {
    // Add product to cart with valid quantity
    await page.goto('/products');
    await page.click('[data-testid="product-card"]:first-child');
    
    // Add 3 items to cart
    await page.fill('[data-testid="quantity-input"]', '3');
    await page.click('[data-testid="add-to-cart-button"]');
    
    // Simulate stock reduction (admin reduces stock to 2 while customer has 3 in cart)
    // In real scenario, another customer buys the product or admin manually reduces stock
    
    // Proceed to checkout
    await page.click('[data-testid="cart-icon"]');
    await page.click('[data-testid="checkout-button"]');
    
    // Verify cart validation error
    // The validate cart API should catch insufficient stock
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText(/stock is insufficient|not enough stock available/i);
    
    // Verify user cannot proceed to shipping
    await expect(page.locator('h2:has-text("Shipping Address")')).not.toBeVisible();
  });

  test('Multiple items with stock issues show detailed errors', async ({ page }) => {
    // Add multiple products to cart
    await page.goto('/products');
    
    // Add first product (assume stock: 2)
    await page.click('[data-testid="product-card"]:nth-child(1)');
    await page.fill('[data-testid="quantity-input"]', '5'); // Exceeds stock
    await page.click('[data-testid="add-to-cart-button"]');
    
    // Expect error for first product
    await expect(page.locator('[data-testid="stock-error"]')).toBeVisible();
    
    // Reduce to valid quantity
    await page.fill('[data-testid="quantity-input"]', '2');
    await page.click('[data-testid="add-to-cart-button"]');
    await page.goBack();
    
    // Add second product (assume stock: 1)
    await page.click('[data-testid="product-card"]:nth-child(2)');
    await page.fill('[data-testid="quantity-input"]', '3'); // Exceeds stock
    await page.click('[data-testid="add-to-cart-button"]');
    
    // Expect error for second product
    await expect(page.locator('[data-testid="stock-error"]')).toBeVisible();
    
    // Fix quantity
    await page.fill('[data-testid="quantity-input"]', '1');
    await page.click('[data-testid="add-to-cart-button"]');
    
    // Now proceed to checkout
    await page.click('[data-testid="cart-icon"]');
    await page.click('[data-testid="checkout-button"]');
    
    // Should proceed successfully
    await expect(page.locator('h2:has-text("Shipping Address")')).toBeVisible();
  });

  test('Out of stock products cannot be added to cart', async ({ page }) => {
    // Navigate to product that is out of stock
    await page.goto('/products');
    
    // Filter to show out of stock products (if available)
    // Or navigate directly to a product known to be out of stock
    
    // For this test, we'll simulate by checking stock status
    const products = await page.locator('[data-testid="product-card"]').all();
    
    for (const product of products) {
      const stockBadge = product.locator('[data-testid="stock-badge"]');
      const stockText = await stockBadge.textContent();
      
      if (stockText?.toLowerCase().includes('out of stock')) {
        // Click on out of stock product
        await product.click();
        
        // Verify add to cart button is disabled
        const addToCartButton = page.locator('[data-testid="add-to-cart-button"]');
        await expect(addToCartButton).toBeDisabled();
        
        // Verify out of stock message displayed
        await expect(page.locator('[data-testid="out-of-stock-message"]')).toBeVisible();
        await expect(page.locator('[data-testid="out-of-stock-message"]')).toContainText(/out of stock|currently unavailable/i);
        
        break; // Only need to test one out of stock product
      }
    }
  });

  test('Variant stock validation works correctly', async ({ page }) => {
    // Navigate to product with variants (different sizes/colors)
    await page.goto('/products');
    
    // Find product with variants
    await page.click('[data-testid="product-card"]:has([data-testid="has-variants"])');
    
    // Select variant with limited stock
    await page.click('[data-testid="variant-option"]:first-child');
    
    // Check variant stock
    const variantStockText = await page.locator('[data-testid="variant-stock"]').textContent();
    const variantStockMatch = variantStockText?.match(/(\d+)/);
    const variantStock = variantStockMatch ? parseInt(variantStockMatch[1]) : 3;
    
    // Try to add more than variant stock
    await page.fill('[data-testid="quantity-input"]', (variantStock + 5).toString());
    await page.click('[data-testid="add-to-cart-button"]');
    
    // Verify variant stock error
    await expect(page.locator('[data-testid="stock-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="stock-error"]')).toContainText(/this variant has only \d+ in stock/i);
    
    // Fix quantity to match variant stock
    await page.fill('[data-testid="quantity-input"]', variantStock.toString());
    await page.click('[data-testid="add-to-cart-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="cart-success"]')).toBeVisible();
  });

  test('Stock validation error message shows specific product details', async ({ page }) => {
    // Add product to cart
    await page.goto('/products');
    await page.click('[data-testid="product-card"]:first-child');
    
    // Get product name for verification
    const productName = await page.locator('h1[data-testid="product-name"]').textContent();
    
    // Try to add excessive quantity
    await page.fill('[data-testid="quantity-input"]', '999');
    await page.click('[data-testid="add-to-cart-button"]');
    
    // Verify error message includes product name
    const errorMessage = await page.locator('[data-testid="stock-error"]').textContent();
    expect(errorMessage?.toLowerCase()).toContain(productName?.toLowerCase());
    
    // Verify error message shows available stock
    expect(errorMessage).toMatch(/\d+ (available|in stock)/i);
  });
});
