/**
 * E2E Security Tests: Checkout Price Tampering (T015)
 * 
 * Tests that server-side price recalculation prevents client-side tampering:
 * - Attempt to submit lower prices than actual
 * - Attempt to bypass server validation
 * - Verify server always recalculates from database prices
 * 
 * Requirements:
 * - FR-002: Server-side price recalculation
 * - Never trust client-submitted monetary values
 * - Prevent fraudulent checkouts
 * - WCAG 2.1 AA accessibility compliance
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Checkout Security - Price Tampering Prevention', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to storefront
    await page.goto('/');

    // Login as customer (required for checkout - T010)
    await page.click('[data-testid="login-link"]');
    await page.fill('[name="email"]', 'customer@test.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');
    await page.waitForURL('/');
  });

  test('should reject tampered product prices in checkout', async ({ page }) => {
    // Add product to cart
    await page.click('[data-testid="product-card"]');
    await page.click('[data-testid="add-to-cart"]');

    // Intercept checkout API call and modify price
    await page.route('**/api/checkout/complete', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      // Tamper: Submit $1.00 instead of actual price
      const tamperedData = {
        ...postData,
        items: postData.items.map((item: any) => ({
          ...item,
          price: 1.0, // Attempt to pay $1 for expensive product
        })),
        subtotal: 1.0,
        taxAmount: 0.08,
        shippingCost: 5.0,
      };

      // Continue with tampered data
      await route.continue({ postData: JSON.stringify(tamperedData) });
    });

    // Proceed to checkout
    await page.click('[data-testid="cart-icon"]');
    await page.click('[data-testid="checkout-button"]');

    // Accessibility check on checkout page
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    // Fill shipping form
    await page.fill('[name="email"]', 'tamper-test@example.com');
    await page.fill('[name="fullName"]', 'Tamper Test');
    await page.fill('[name="phone"]', '555-9999');
    await page.fill('[name="address1"]', '123 Hack St');
    await page.fill('[name="city"]', 'Security City');
    await page.fill('[name="postalCode"]', '12345');
    await page.selectOption('[name="country"]', 'US');
    await page.selectOption('[name="state"]', 'CA');

    // Submit checkout
    await page.click('[data-testid="submit-order"]');

    // Server should recalculate prices and create order with CORRECT total
    // NOT the tampered $1.00 price
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible();

    // Accessibility check on order confirmation page
    const confirmationScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(confirmationScanResults.violations).toEqual([]);

    // Verify order total is NOT $1.00
    const orderTotal = await page.locator('[data-testid="order-total"]').textContent();
    expect(orderTotal).not.toContain('$1.00');
    expect(orderTotal).not.toContain('$6.08'); // 1.00 + 0.08 tax + 5.00 shipping

    // Verify order total matches actual product price (server-calculated)
    // Actual product price should be higher (e.g., $29.99)
    expect(orderTotal).toMatch(/\\$[2-9]\\d+\\.\\d{2}/); // At least $20+
  });

  test('should ignore client-submitted subtotal/tax/shipping', async ({ page }) => {
    // Get actual product price from product page
    await page.goto('/products/test-product');
    const actualPriceText = await page.locator('[data-testid="product-price"]').textContent();
    const actualPrice = parseFloat(actualPriceText?.replace(/[^0-9.]/g, '') || '0');

    // Add to cart and proceed to checkout
    await page.click('[data-testid="add-to-cart"]');
    await page.click('[data-testid="cart-icon"]');
    await page.click('[data-testid="checkout-button"]');

    // Fill shipping form
    await page.fill('[name="fullName"]', 'Price Bypass Test');
    await page.fill('[name="email"]', 'bypass@example.com');
    await page.fill('[name="phone"]', '555-0000');
    await page.fill('[name="address1"]', '789 Exploit Ave');
    await page.fill('[name="city"]', 'Bypass City');
    await page.fill('[name="postalCode"]', '99999');
    await page.selectOption('[name="country"]', 'US');

    // Intercept and tamper with ALL monetary fields
    let tamperedRequest: any = null;
    await page.route('**/api/checkout/complete', async (route) => {
      const request = route.request();
      tamperedRequest = request.postDataJSON();

      const tamperedData = {
        ...tamperedRequest,
        subtotal: 0.01, // Attempt $0.01 subtotal
        taxAmount: 0.0, // Attempt $0 tax
        shippingCost: 0.0, // Attempt free shipping
        discountAmount: 999.99, // Attempt massive fake discount
        items: tamperedRequest.items.map((item: any) => ({
          ...item,
          price: 0.01, // Attempt $0.01 per item
        })),
      };

      await route.continue({ postData: JSON.stringify(tamperedData) });
    });

    await page.click('[data-testid="submit-order"]');

    // Verify order created successfully (server ignored tampered values)
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible({ timeout: 10000 });

    // Get final order total from confirmation page
    const confirmedTotal = await page.locator('[data-testid="order-total"]').textContent();
    const confirmedAmount = parseFloat(confirmedTotal?.replace(/[^0-9.]/g, '') || '0');

    // Verify server used ACTUAL prices (not tampered $0.01)
    expect(confirmedAmount).toBeGreaterThan(actualPrice); // Should include tax + shipping
    expect(confirmedAmount).not.toBe(0.01);
    expect(confirmedAmount).toBeGreaterThan(10); // Reasonable minimum order total
  });

  test('should prevent checkout without authentication', async ({ page, context }) => {
    // Clear session cookies to simulate unauthenticated user
    await context.clearCookies();

    // Attempt to call checkout API directly (bypass UI)
    const response = await page.request.post('/api/checkout/complete', {
      data: {
        items: [
          { productId: 'test-product-id', quantity: 1, price: 99.99 },
        ],
        shippingAddress: {
          fullName: 'Unauth User',
          phone: '555-1234',
          country: 'US',
          city: 'Test City',
          postalCode: '12345',
          address1: '123 Test St',
        },
        shippingMethod: 'standard',
        subtotal: 99.99,
        taxAmount: 8.0,
        shippingCost: 5.0,
        paymentMethod: 'CREDIT_CARD',
        paymentIntentId: 'pi_fake_intent',
      },
    });

    // Should return 401 Unauthorized (T010 requirement)
    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.error?.code).toBe('UNAUTHORIZED');
  });

  test('should validate payment intent before creating order', async ({ page }) => {
    // Add product to cart
    await page.click('[data-testid="product-card"]');
    await page.click('[data-testid="add-to-cart"]');
    await page.click('[data-testid="cart-icon"]');
    await page.click('[data-testid="checkout-button"]');

    // Fill shipping form
    await page.fill('[name="fullName"]', 'Payment Test');
    await page.fill('[name="email"]', 'payment@example.com');
    await page.fill('[name="phone"]', '555-7777');
    await page.fill('[name="address1"]', '456 Payment Blvd');
    await page.fill('[name="city"]', 'Payment City');
    await page.fill('[name="postalCode"]', '54321');
    await page.selectOption('[name="country"]', 'US');

    // Intercept and provide invalid payment intent
    await page.route('**/api/checkout/complete', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      const invalidData = {
        ...postData,
        paymentIntentId: 'invalid_payment_intent', // Invalid format (should be pi_*)
      };

      await route.continue({ postData: JSON.stringify(invalidData) });
    });

    await page.click('[data-testid="submit-order"]');

    // Should show payment validation error (T012 requirement)
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 });
    const errorText = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorText).toMatch(/payment/i);
  });

  test('should use atomic transactions for checkout', async ({ page }) => {
    // This test verifies that if payment validation fails,
    // the entire checkout is rolled back (no order created, no inventory decremented)

    // Get initial product stock
    await page.goto('/products/test-product');
    const initialStockText = await page.locator('[data-testid="stock-quantity"]').textContent();
    const initialStock = parseInt(initialStockText?.replace(/[^0-9]/g, '') || '0');

    // Add to cart
    await page.click('[data-testid="add-to-cart"]');
    await page.click('[data-testid="cart-icon"]');
    await page.click('[data-testid="checkout-button"]');

    // Fill shipping form
    await page.fill('[name="fullName"]', 'Atomic Test');
    await page.fill('[name="email"]', 'atomic@example.com');
    await page.fill('[name="phone"]', '555-8888');
    await page.fill('[name="address1"]', '789 Transaction St');
    await page.fill('[name="city"]', 'Atomic City');
    await page.fill('[name="postalCode"]', '67890');
    await page.selectOption('[name="country"]', 'US');

    // Intercept and force payment validation to fail
    await page.route('**/api/checkout/complete', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      // Provide payment intent that will fail validation
      const failingData = {
        ...postData,
        paymentIntentId: 'pi_will_fail_validation',
      };

      await route.continue({ postData: JSON.stringify(failingData) });
    });

    // Mock payment validation to fail
    await page.route('**/api/payments/validate-intent', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          isValid: false,
          reason: 'Payment intent declined',
        }),
      });
    });

    await page.click('[data-testid="submit-order"]');

    // Should show error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 });

    // Verify stock NOT decremented (atomic rollback - T013)
    await page.goto('/products/test-product');
    const finalStockText = await page.locator('[data-testid="stock-quantity"]').textContent();
    const finalStock = parseInt(finalStockText?.replace(/[^0-9]/g, '') || '0');

    expect(finalStock).toBe(initialStock); // Stock unchanged due to rollback
  });
});

test.describe('Checkout Security - Multi-Tenant Isolation', () => {
  test('should prevent checkout with products from different store', async ({ page }) => {
    // Login to Store A
    await page.goto('/');
    await page.click('[data-testid="login-link"]');
    await page.fill('[name="email"]', 'customer-store-a@test.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');

    // Attempt to checkout with product from Store B
    const response = await page.request.post('/api/checkout/complete', {
      data: {
        items: [
          { productId: 'store-b-product-id', quantity: 1 }, // Cross-tenant attempt
        ],
        shippingAddress: {
          fullName: 'Cross Tenant Test',
          phone: '555-9999',
          country: 'US',
          city: 'Test City',
          postalCode: '12345',
          address1: '123 Test St',
        },
        shippingMethod: 'standard',
        paymentMethod: 'CREDIT_CARD',
        paymentIntentId: 'pi_test_intent',
      },
    });

    // Should fail validation (product not found in Store A)
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error?.message).toMatch(/not found|unavailable/i);
  });
});
