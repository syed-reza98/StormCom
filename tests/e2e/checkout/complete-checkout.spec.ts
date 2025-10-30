/**
 * E2E Test: Customer can complete checkout with credit card
 * 
 * Tests the happy path checkout flow:
 * 1. Add product to cart
 * 2. Proceed to checkout
 * 3. Enter shipping address
 * 4. Enter payment method (Stripe test card)
 * 5. Review order
 * 6. Complete checkout
 * 7. Verify order confirmation
 */

import { test, expect } from '@playwright/test';

test.describe('Complete Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to storefront
    await page.goto('/');
  });

  test('Customer can complete checkout with credit card', async ({ page }) => {
    // Step 1: Add product to cart
    await page.goto('/products');
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    
    // Click on first product
    await page.click('[data-testid="product-card"]:first-child');
    
    // Add to cart
    await page.click('[data-testid="add-to-cart-button"]');
    
    // Verify cart item count updated
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');

    // Step 2: Proceed to checkout
    await page.click('[data-testid="cart-icon"]');
    await page.click('[data-testid="checkout-button"]');
    
    // Wait for checkout page to load
    await page.waitForURL('/checkout');

    // Step 3: Enter shipping address
    await page.fill('#fullName', 'John Doe');
    await page.fill('#email', 'john.doe@example.com');
    await page.fill('#phone', '+1 (555) 123-4567');
    await page.fill('#address1', '123 Main Street');
    await page.fill('#city', 'New York');
    await page.fill('#state', 'NY');
    await page.fill('#postalCode', '10001');
    await page.selectOption('#country', 'US');
    
    // Continue to payment
    await page.click('button:has-text("Continue to Payment")');
    
    // Wait for payment step
    await page.waitForSelector('[data-testid="payment-form"]', { timeout: 5000 });

    // Step 4: Enter payment method (Stripe test card)
    const stripeFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]').first();
    
    // Fill card details (Stripe test card: 4242 4242 4242 4242)
    await stripeFrame.locator('[placeholder="Card number"]').fill('4242424242424242');
    await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/25');
    await stripeFrame.locator('[placeholder="CVC"]').fill('123');
    await stripeFrame.locator('[placeholder="ZIP"]').fill('10001');
    
    // Continue to review
    await page.click('button:has-text("Continue to Review")');
    
    // Wait for review step
    await page.waitForSelector('[data-testid="order-review"]', { timeout: 5000 });

    // Step 5: Verify order summary
    await expect(page.locator('h2:has-text("Review Your Order")')).toBeVisible();
    
    // Verify order items present
    await expect(page.locator('[data-testid="order-item"]')).toHaveCount(1);
    
    // Verify shipping address displayed
    await expect(page.locator('text="John Doe"')).toBeVisible();
    await expect(page.locator('text="123 Main Street"')).toBeVisible();
    
    // Verify order total
    await expect(page.locator('[data-testid="order-total"]')).toBeVisible();

    // Step 6: Complete checkout
    await page.click('button:has-text("Place Order")');
    
    // Wait for order confirmation page
    await page.waitForURL(/\/orders\/.*\/confirmation/, { timeout: 15000 });

    // Step 7: Verify order confirmation
    await expect(page.locator('h1:has-text("Order Confirmed!")')).toBeVisible();
    
    // Verify order number displayed
    await expect(page.locator('text=/Order Number:/')).toBeVisible();
    await expect(page.locator('text=/ORD-\\d+/')).toBeVisible();
    
    // Verify order details displayed
    await expect(page.locator('h2:has-text("Order Details")')).toBeVisible();
    await expect(page.locator('h2:has-text("Order Items")')).toBeVisible();
    await expect(page.locator('h2:has-text("Shipping Address")')).toBeVisible();
    
    // Verify payment status is PAID
    await expect(page.locator('text="PAID"')).toBeVisible();
    
    // Verify action buttons present
    await expect(page.locator('a:has-text("Continue Shopping")')).toBeVisible();
    await expect(page.locator('a:has-text("View Order Details")')).toBeVisible();
  });

  test('Customer can checkout with multiple items', async ({ page }) => {
    // Add multiple products to cart
    await page.goto('/products');
    
    // Add first product
    await page.click('[data-testid="product-card"]:nth-child(1)');
    await page.click('[data-testid="add-to-cart-button"]');
    await page.goBack();
    
    // Add second product
    await page.click('[data-testid="product-card"]:nth-child(2)');
    await page.click('[data-testid="add-to-cart-button"]');
    
    // Verify cart count
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('2');
    
    // Proceed to checkout
    await page.click('[data-testid="cart-icon"]');
    await page.click('[data-testid="checkout-button"]');
    
    // Fill shipping address
    await page.fill('#fullName', 'Jane Smith');
    await page.fill('#email', 'jane.smith@example.com');
    await page.fill('#phone', '+1 (555) 987-6543');
    await page.fill('#address1', '456 Oak Avenue');
    await page.fill('#city', 'Los Angeles');
    await page.fill('#state', 'CA');
    await page.fill('#postalCode', '90001');
    await page.selectOption('#country', 'US');
    
    await page.click('button:has-text("Continue to Payment")');
    
    // Fill payment (Stripe test card)
    const stripeFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]').first();
    await stripeFrame.locator('[placeholder="Card number"]').fill('4242424242424242');
    await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/25');
    await stripeFrame.locator('[placeholder="CVC"]').fill('123');
    
    await page.click('button:has-text("Continue to Review")');
    
    // Verify 2 items in order review
    await expect(page.locator('[data-testid="order-item"]')).toHaveCount(2);
    
    // Place order
    await page.click('button:has-text("Place Order")');
    
    // Verify confirmation
    await page.waitForURL(/\/orders\/.*\/confirmation/);
    await expect(page.locator('h1:has-text("Order Confirmed!")')).toBeVisible();
  });

  test('Customer can navigate back through checkout steps', async ({ page }) => {
    // Add product to cart
    await page.goto('/products');
    await page.click('[data-testid="product-card"]:first-child');
    await page.click('[data-testid="add-to-cart-button"]');
    
    // Start checkout
    await page.click('[data-testid="cart-icon"]');
    await page.click('[data-testid="checkout-button"]');
    
    // Fill shipping address
    await page.fill('#fullName', 'Test User');
    await page.fill('#phone', '+1 (555) 111-2222');
    await page.fill('#address1', '789 Test St');
    await page.fill('#city', 'Test City');
    await page.fill('#postalCode', '12345');
    await page.selectOption('#country', 'US');
    
    await page.click('button:has-text("Continue to Payment")');
    
    // Go back to shipping
    await page.click('button:has-text("Back")');
    
    // Verify back on shipping step
    await expect(page.locator('h2:has-text("Shipping Address")')).toBeVisible();
    
    // Continue again
    await page.click('button:has-text("Continue to Payment")');
    
    // Fill payment
    const stripeFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]').first();
    await stripeFrame.locator('[placeholder="Card number"]').fill('4242424242424242');
    await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/25');
    await stripeFrame.locator('[placeholder="CVC"]').fill('123');
    
    await page.click('button:has-text("Continue to Review")');
    
    // Go back to payment
    await page.click('button:has-text("Back")');
    
    // Verify back on payment step
    await expect(page.locator('h2:has-text("Payment Method")')).toBeVisible();
  });
});
