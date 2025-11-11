// tests/e2e/subscriptions/plan-limits.spec.ts
// E2E test "Store cannot exceed plan limits"

import { test, expect } from '@playwright/test';
import { db } from '@/lib/db';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

test.describe('Subscription Plan Limits', () => {
  let storeId: string;
  let userId: string;

  test.beforeEach(async ({ page }) => {
    // Create test store with FREE plan (10 products, 100 orders limit)
    const store = await db.store.create({
      data: {
        name: 'Test Store',
        slug: `test-store-${Date.now()}`,
        email: 'test@example.com',
        subscriptionPlan: SubscriptionPlan.FREE,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        productLimit: 10,
        orderLimit: 100,
      },
    });
    storeId = store.id;

    // Create test user
    const user = await db.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewgY6dE5QQhVj5BS', // password
        name: 'Test User',
        role: 'STORE_ADMIN',
        storeId,
        emailVerified: true,
      },
    });
    userId = user.id;

    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test.afterEach(async () => {
    // Cleanup
    await db.user.delete({ where: { id: userId } });
    await db.store.delete({ where: { id: storeId } });
  });

  test('should prevent creating products when limit is reached', async ({ page }) => {
    // Create 10 products (at the limit)
    for (let i = 1; i <= 10; i++) {
      await db.product.create({
        data: {
          name: `Test Product ${i}`,
          slug: `test-product-${i}-${Date.now()}`,
          description: 'Test description',
          price: 99.99,
          sku: `test-sku-${i}-${Date.now()}`,
          storeId,
          isPublished: true,
          categoryId: null,
          brandId: null,
          images: '[]',
          metaKeywords: '[]',
        },
      });
    }

    // Navigate to products page
    await page.goto('/dashboard/products');
    
    // Try to create 11th product
    await page.click('button:has-text("Add Product")');
    
    // Should show error message about limit
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Product limit exceeded'
    );
    
    // Should show upgrade prompt
    await expect(page.locator('[data-testid="upgrade-prompt"]')).toBeVisible();
    await expect(page.locator('[data-testid="upgrade-prompt"]')).toContainText(
      'Upgrade to increase limit'
    );
  });

  test('should show usage warning when approaching product limit', async ({ page }) => {
    // Create 8 products (80% of limit)
    for (let i = 1; i <= 8; i++) {
      await db.product.create({
        data: {
          name: `Test Product ${i}`,
          slug: `test-product-${i}-${Date.now()}`,
          description: 'Test description',
          price: 99.99,
          sku: `test-sku-${i}-${Date.now()}`,
          storeId,
          isPublished: true,
          categoryId: null,
          brandId: null,
          images: '[]',
          metaKeywords: '[]',
        },
      });
    }

    // Navigate to products page
    await page.goto('/dashboard/products');
    
    // Should show usage warning
    await expect(page.locator('[data-testid="usage-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="usage-warning"]')).toContainText(
      '8 of 10 products used'
    );
    
    // Should show progress bar
    await expect(page.locator('[data-testid="usage-progress"]')).toBeVisible();
  });

  test('should prevent creating orders when monthly limit is reached', async ({ page }) => {
    // Mock 100 orders for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    for (let i = 1; i <= 100; i++) {
      await db.order.create({
        data: {
          orderNumber: `ORD-${i.toString().padStart(6, '0')}`,
          storeId,
          status: 'PENDING',
          subtotal: 99.99,
          totalAmount: 99.99,
          createdAt: new Date(startOfMonth.getTime() + i * 1000), // Space them out
        },
      });
    }

    // Navigate to checkout flow and try to create order
    await page.goto('/storefront/checkout');
    
    // Should show error message about order limit
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Monthly order limit exceeded'
    );
    
    // Should show upgrade prompt
    await expect(page.locator('[data-testid="upgrade-prompt"]')).toBeVisible();
  });

  test('should allow operations for ENTERPRISE plan (unlimited)', async ({ page }) => {
    // Upgrade store to ENTERPRISE plan
    await db.store.update({
      where: { id: storeId },
      data: {
        subscriptionPlan: SubscriptionPlan.ENTERPRISE,
        productLimit: 999999,
        orderLimit: 999999,
      },
    });

    // Create 15 products (more than FREE limit)
    for (let i = 1; i <= 15; i++) {
      await db.product.create({
        data: {
          name: `Test Product ${i}`,
          slug: `test-product-${i}-${Date.now()}`,
          description: 'Test description',
          price: 99.99,
          sku: `test-sku-${i}-${Date.now()}`,
          storeId,
          isPublished: true,
          categoryId: null,
          brandId: null,
          images: '[]',
          metaKeywords: '[]',
        },
      });
    }

    // Navigate to products page
    await page.goto('/dashboard/products');
    
    // Should not show any limit warnings
    await expect(page.locator('[data-testid="usage-warning"]')).not.toBeVisible();
    
    // Should show unlimited badge
    await expect(page.locator('[data-testid="unlimited-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="unlimited-badge"]')).toContainText('Unlimited');
    
    // Should be able to create more products
    await page.click('button:has-text("Add Product")');
    await expect(page.locator('[data-testid="product-form"]')).toBeVisible();
  });

  test('should show subscription status warning for inactive subscription', async ({ page }) => {
    // Set subscription to CANCELED
    await db.store.update({
      where: { id: storeId },
      data: {
        subscriptionStatus: SubscriptionStatus.CANCELED,
        subscriptionEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ended yesterday
      },
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Should show subscription warning
    await expect(page.locator('[data-testid="subscription-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="subscription-warning"]')).toContainText(
      'Subscription is not active'
    );
    
    // Should show reactivate button
    await expect(page.locator('[data-testid="reactivate-button"]')).toBeVisible();
  });

  test('should display correct usage percentages', async ({ page }) => {
    // Create 5 products (50% of FREE limit)
    for (let i = 1; i <= 5; i++) {
      await db.product.create({
        data: {
          name: `Test Product ${i}`,
          slug: `test-product-${i}-${Date.now()}`,
          description: 'Test description',
          price: 99.99,
          sku: `test-sku-${i}-${Date.now()}`,
          storeId,
          isPublished: true,
          categoryId: null,
          brandId: null,
          images: '[]',
          metaKeywords: '[]',
        },
      });
    }

    // Create 30 orders (30% of FREE limit)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    for (let i = 1; i <= 30; i++) {
      await db.order.create({
        data: {
          orderNumber: `ORD-${i.toString().padStart(6, '0')}`,
          storeId,
          status: 'PENDING',
          subtotal: 99.99,
          totalAmount: 99.99,
          createdAt: new Date(startOfMonth.getTime() + i * 1000),
        },
      });
    }

    // Navigate to subscription billing page
    await page.goto(`/subscription/billing?storeId=${storeId}`);
    
    // Check product usage display
    await expect(page.locator('[data-testid="product-usage-text"]')).toContainText('5 of 10');
    await expect(page.locator('[data-testid="product-usage-percentage"]')).toContainText('50%');
    
    // Check order usage display
    await expect(page.locator('[data-testid="order-usage-text"]')).toContainText('30 of 100');
    await expect(page.locator('[data-testid="order-usage-percentage"]')).toContainText('30%');
  });

  test('should redirect to upgrade page when limit exceeded', async ({ page }) => {
    // Create 10 products (at limit)
    for (let i = 1; i <= 10; i++) {
      await db.product.create({
        data: {
          name: `Test Product ${i}`,
          slug: `test-product-${i}-${Date.now()}`,
          description: 'Test description',
          price: 99.99,
          sku: `test-sku-${i}-${Date.now()}`,
          storeId,
          isPublished: true,
          categoryId: null,
          brandId: null,
          images: '[]',
          metaKeywords: '[]',
        },
      });
    }

    // Navigate to products page
    await page.goto('/dashboard/products');
    
    // Try to create 11th product and click upgrade link
    await page.click('button:has-text("Add Product")');
    await page.click('[data-testid="upgrade-link"]');
    
    // Should navigate to subscription plans page
    await page.waitForURL(`/subscription/plans?storeId=${storeId}`);
    
    // Should show current plan and available upgrades
    await expect(page.locator('[data-testid="current-plan-badge"]')).toContainText('FREE');
    await expect(page.locator('[data-testid="upgrade-button-BASIC"]')).toBeVisible();
    await expect(page.locator('[data-testid="upgrade-button-PRO"]')).toBeVisible();
    await expect(page.locator('[data-testid="upgrade-button-ENTERPRISE"]')).toBeVisible();
  });
});
