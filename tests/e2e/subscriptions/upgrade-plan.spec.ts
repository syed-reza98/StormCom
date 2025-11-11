// tests/e2e/subscriptions/upgrade-plan.spec.ts
// E2E test "User can upgrade subscription plan"

import { test, expect } from '@playwright/test';
import { db } from '@/lib/db';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

test.describe('Subscription Plan Upgrade', () => {
  let storeId: string;
  let userId: string;

  test.beforeEach(async ({ page }) => {
    // Create test store with FREE plan
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

  test('should display subscription plans comparison page', async ({ page }) => {
    // Navigate to subscription plans page
    await page.goto(`/subscription/plans?storeId=${storeId}`);
    
    // Should show all available plans
    await expect(page.locator('[data-testid="plan-card-FREE"]')).toBeVisible();
    await expect(page.locator('[data-testid="plan-card-BASIC"]')).toBeVisible();
    await expect(page.locator('[data-testid="plan-card-PRO"]')).toBeVisible();
    await expect(page.locator('[data-testid="plan-card-ENTERPRISE"]')).toBeVisible();
    
    // Should show current plan badge
    await expect(page.locator('[data-testid="current-plan-badge-FREE"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-plan-badge-FREE"]')).toContainText('Current Plan');
    
    // Should show plan features
    await expect(page.locator('[data-testid="plan-features-FREE"]')).toContainText('10 Products');
    await expect(page.locator('[data-testid="plan-features-FREE"]')).toContainText('100 Orders/month');
    await expect(page.locator('[data-testid="plan-features-BASIC"]')).toContainText('100 Products');
    await expect(page.locator('[data-testid="plan-features-BASIC"]')).toContainText('1,000 Orders/month');
    
    // Should show upgrade buttons for paid plans
    await expect(page.locator('[data-testid="upgrade-button-BASIC"]')).toBeVisible();
    await expect(page.locator('[data-testid="upgrade-button-PRO"]')).toBeVisible();
    await expect(page.locator('[data-testid="upgrade-button-ENTERPRISE"]')).toBeVisible();
    
    // Should NOT show upgrade button for current plan
    await expect(page.locator('[data-testid="upgrade-button-FREE"]')).not.toBeVisible();
  });

  test('should show usage statistics on plans page', async ({ page }) => {
    // Create some products and orders to show usage
    for (let i = 1; i <= 7; i++) {
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

    // Navigate to subscription plans page
    await page.goto(`/subscription/plans?storeId=${storeId}`);
    
    // Should show current usage
    await expect(page.locator('[data-testid="current-usage"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-usage"]')).toContainText('7 of 10 products');
    await expect(page.locator('[data-testid="usage-progress"]')).toBeVisible();
    
    // Should show usage warning when approaching limit
    await expect(page.locator('[data-testid="usage-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="usage-warning"]')).toContainText('70% of product limit used');
  });

  test('should initiate Stripe checkout for plan upgrade', async ({ page }) => {
    // Mock Stripe checkout session
    await page.route('**/api/subscriptions', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            checkoutUrl: 'https://checkout.stripe.com/c/pay/mock-session-id',
          },
        }),
      });
    });

    // Navigate to subscription plans page
    await page.goto(`/subscription/plans?storeId=${storeId}`);
    
    // Click upgrade to BASIC plan
    await page.click('[data-testid="upgrade-button-BASIC"]');
    
    // Should show loading state
    await expect(page.locator('[data-testid="upgrade-loading-BASIC"]')).toBeVisible();
    
    // Should redirect to Stripe checkout
    await page.waitForURL(/checkout\.stripe\.com/);
  });

  test('should handle upgrade errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/subscriptions', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'STRIPE_ERROR',
            message: 'Unable to create checkout session',
          },
        }),
      });
    });

    // Navigate to subscription plans page
    await page.goto(`/subscription/plans?storeId=${storeId}`);
    
    // Click upgrade to BASIC plan
    await page.click('[data-testid="upgrade-button-BASIC"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Unable to create checkout session');
    
    // Should remove loading state
    await expect(page.locator('[data-testid="upgrade-loading-BASIC"]')).not.toBeVisible();
  });

  test('should display billing dashboard with subscription details', async ({ page }) => {
    // Update store with subscription details
    await db.store.update({
      where: { id: storeId },
      data: {
        subscriptionPlan: SubscriptionPlan.BASIC,


        subscriptionStatus: SubscriptionStatus.ACTIVE,
        
        subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    // Navigate to billing dashboard
    await page.goto(`/subscription/billing?storeId=${storeId}`);
    
    // Should show current plan
    await expect(page.locator('[data-testid="current-plan"]')).toContainText('BASIC');
    await expect(page.locator('[data-testid="plan-price"]')).toContainText('$29/month');
    
    // Should show billing period
    await expect(page.locator('[data-testid="billing-period"]')).toBeVisible();
    
    // Should show usage meters
    await expect(page.locator('[data-testid="product-usage-meter"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-usage-meter"]')).toBeVisible();
    
    // Should show manage subscription button
    await expect(page.locator('[data-testid="manage-subscription-button"]')).toBeVisible();
    
    // Should show upgrade options
    await expect(page.locator('[data-testid="upgrade-to-PRO"]')).toBeVisible();
    await expect(page.locator('[data-testid="upgrade-to-ENTERPRISE"]')).toBeVisible();
  });

  test('should show downgrade restrictions', async ({ page }) => {
    // Update store to PRO plan with lots of products
    await db.store.update({
      where: { id: storeId },
      data: {
        subscriptionPlan: SubscriptionPlan.PRO,
        productLimit: 1000,
        orderLimit: 10000,
      },
    });

    // Create 150 products (more than BASIC limit)
    for (let i = 1; i <= 150; i++) {
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

    // Navigate to subscription plans page
    await page.goto(`/subscription/plans?storeId=${storeId}`);
    
    // Should show current plan as PRO
    await expect(page.locator('[data-testid="current-plan-badge-PRO"]')).toBeVisible();
    
    // Should show downgrade restriction for BASIC
    await expect(page.locator('[data-testid="downgrade-restriction-BASIC"]')).toBeVisible();
    await expect(page.locator('[data-testid="downgrade-restriction-BASIC"]')).toContainText(
      'You have 150 products, but BASIC plan only allows 100'
    );
    
    // Should disable downgrade button
    await expect(page.locator('[data-testid="downgrade-button-BASIC"]')).toBeDisabled();
  });

  test('should navigate to Stripe customer portal', async ({ page }) => {
    // Mock Stripe customer portal
    await page.route('**/api/subscriptions/*/manage', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            portalUrl: 'https://billing.stripe.com/p/session/mock-portal-session',
          },
        }),
      });
    });

    // Navigate to billing dashboard
    await page.goto(`/subscription/billing?storeId=${storeId}`);
    
    // Click manage subscription button
    await page.click('[data-testid="manage-subscription-button"]');
    
    // Should redirect to Stripe customer portal
    await page.waitForURL(/billing\.stripe\.com/);
  });

  test('should show cancellation confirmation dialog', async ({ page }) => {
    // Update store with active subscription
    await db.store.update({
      where: { id: storeId },
      data: {
        subscriptionPlan: SubscriptionPlan.BASIC,
        subscriptionStatus: SubscriptionStatus.ACTIVE,

      },
    });

    // Navigate to billing dashboard
    await page.goto(`/subscription/billing?storeId=${storeId}`);
    
    // Click cancel subscription button
    await page.click('[data-testid="cancel-subscription-button"]');
    
    // Should show confirmation dialog
    await expect(page.locator('[data-testid="cancel-confirmation-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="cancel-dialog-title"]')).toContainText('Cancel Subscription');
    await expect(page.locator('[data-testid="cancel-dialog-description"]')).toContainText(
      'Your subscription will remain active until the end of the current billing period'
    );
    
    // Should show cancel options
    await expect(page.locator('[data-testid="cancel-at-period-end"]')).toBeVisible();
    await expect(page.locator('[data-testid="cancel-immediately"]')).toBeVisible();
    
    // Should show confirmation button
    await expect(page.locator('[data-testid="confirm-cancel-button"]')).toBeVisible();
  });

  test('should process subscription cancellation', async ({ page }) => {
    // Mock cancellation API
    await page.route(`**/api/subscriptions/${storeId}/cancel`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            message: 'Subscription canceled successfully',
          },
        }),
      });
    });

    // Update store with active subscription
    await db.store.update({
      where: { id: storeId },
      data: {
        subscriptionPlan: SubscriptionPlan.BASIC,
        subscriptionStatus: SubscriptionStatus.ACTIVE,

      },
    });

    // Navigate to billing dashboard
    await page.goto(`/subscription/billing?storeId=${storeId}`);
    
    // Cancel subscription
    await page.click('[data-testid="cancel-subscription-button"]');
    await page.click('[data-testid="cancel-at-period-end"]');
    await page.click('[data-testid="confirm-cancel-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      'Subscription canceled successfully'
    );
    
    // Should update UI to show canceled state
    await expect(page.locator('[data-testid="subscription-status"]')).toContainText('Canceling');
  });

  test('should show plan recommendations based on usage', async ({ page }) => {
    // Create usage that exceeds FREE plan
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

    // Navigate to subscription plans page
    await page.goto(`/subscription/plans?storeId=${storeId}`);
    
    // Should show recommendation banner
    await expect(page.locator('[data-testid="plan-recommendation"]')).toBeVisible();
    await expect(page.locator('[data-testid="plan-recommendation"]')).toContainText(
      'Based on your usage, we recommend upgrading to BASIC'
    );
    
    // Should highlight recommended plan
    await expect(page.locator('[data-testid="plan-card-BASIC"]')).toHaveClass(/recommended/);
    await expect(page.locator('[data-testid="recommended-badge-BASIC"]')).toBeVisible();
  });
});
