/**
 * E2E Test: Mailchimp Integration
 * 
 * Tests the complete Mailchimp integration workflow:
 * 1. Navigate to integrations page
 * 2. Connect Mailchimp (OAuth flow)
 * 3. Verify connection status
 * 4. Sync customers
 * 5. Verify sync results and logs
 */

import { test, expect } from '@playwright/test';
import { db } from '@/lib/db';

test.describe('Mailchimp Integration', () => {
  let testStoreId: string;
  let testUserId: string;

  test.beforeAll(async () => {
    // Create test store and user
    const store = await db.store.create({
      data: {
        name: 'Test Store - Mailchimp',
        slug: 'test-mailchimp',
        email: 'store@test-mailchimp.stormcom.test',
      },
    });
    testStoreId = store.id;

    const user = await db.user.create({
      data: {
        email: 'mailchimp-test@example.com',
        password: 'hashed-password',
        name: 'Mailchimp Tester',
        role: 'STORE_ADMIN',
        storeId: testStoreId,
      },
    });
    testUserId = user.id;

    // Create test customers for syncing
    await db.customer.createMany({
      data: [
        {
          storeId: testStoreId,
          email: 'customer1@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        {
          storeId: testStoreId,
          email: 'customer2@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
        },
      ],
    });
  });

  test.afterAll(async () => {
    // Clean up test data
    await db.externalPlatformConfig.deleteMany({
      where: { storeId: testStoreId },
    });
    await db.customer.deleteMany({
      where: { storeId: testStoreId },
    });
    await db.user.delete({ where: { id: testUserId } });
    await db.store.delete({ where: { id: testStoreId } });
  });

  test('should display integrations page', async ({ page }) => {
    // Login (mocked session)
    await page.goto('/dashboard/integrations');

    // Verify page elements
    await expect(page.locator('h1')).toContainText('Integrations');
    await expect(page.locator('text=Mailchimp')).toBeVisible();
    await expect(page.locator('text=Shopify')).toBeVisible();
  });

  test('should show not connected status initially', async ({ page }) => {
    await page.goto('/dashboard/integrations');

    // Find Mailchimp card
    const mailchimpCard = page.locator('text=Mailchimp').locator('..');

    // Verify not connected badge
    await expect(mailchimpCard.locator('text=Not Connected')).toBeVisible();

    // Verify connect button
    await expect(mailchimpCard.locator('button:has-text("Connect Mailchimp")')).toBeVisible();
  });

  test('should initiate OAuth connection', async ({ page, context }) => {
    await page.goto('/dashboard/integrations');

    // Click connect button
    const mailchimpCard = page.locator('text=Mailchimp').locator('..');
    const connectButton = mailchimpCard.locator('button:has-text("Connect Mailchimp")');

    // Mock OAuth redirect
    await page.route('https://login.mailchimp.com/oauth2/authorize**', async (route) => {
      // Simulate OAuth redirect back with code
      await route.fulfill({
        status: 302,
        headers: {
          Location: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/mailchimp/connect?code=mock-code&state=${testStoreId}`,
        },
      });
    });

    // Mock token exchange
    await page.route('https://login.mailchimp.com/oauth2/token', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          token_type: 'bearer',
          expires_in: 3600,
        }),
      });
    });

    // Mock API URL discovery
    await page.route('https://login.mailchimp.com/oauth2/metadata', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          api_endpoint: 'https://us1.api.mailchimp.com',
          dc: 'us1',
        }),
      });
    });

    // Listen for navigation
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      connectButton.click(),
    ]);

    // Wait for OAuth callback
    await newPage.waitForLoadState();
    expect(newPage.url()).toContain('mailchimp.com');
  });

  test('should show connected status after OAuth', async ({ page }) => {
    // Create mock Mailchimp config
    await db.externalPlatformConfig.create({
      data: {
        storeId: testStoreId,
        platform: 'mailchimp',
        apiUrl: 'https://us1.api.mailchimp.com',
        apiKey: 'encrypted-mock-access-token',
      },
    });

    await page.goto('/dashboard/integrations');

    // Find Mailchimp card
    const mailchimpCard = page.locator('text=Mailchimp').locator('..');

    // Verify connected badge
    await expect(mailchimpCard.locator('text=Connected')).toBeVisible();

    // Verify sync button
    await expect(mailchimpCard.locator('button:has-text("Sync Now")')).toBeVisible();

    // Verify disconnect button
    await expect(mailchimpCard.locator('button:has-text("Disconnect")')).toBeVisible();
  });

  test('should sync customers to Mailchimp', async ({ page }) => {
    // Ensure config exists
    const config = await db.externalPlatformConfig.findFirst({
      where: { storeId: testStoreId, platform: 'mailchimp' },
    });

    if (!config) {
      await db.externalPlatformConfig.create({
        data: {
          storeId: testStoreId,
          platform: 'mailchimp',
          apiUrl: 'https://us1.api.mailchimp.com',
          apiKey: 'encrypted-mock-access-token',
        },
      });
    }

    // Mock Mailchimp API
    await page.route('https://us1.api.mailchimp.com/3.0/lists/*/members', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mock-member-id',
          email_address: 'customer1@example.com',
          status: 'subscribed',
        }),
      });
    });

    await page.goto('/dashboard/integrations');

    // Find Mailchimp card and click sync
    const mailchimpCard = page.locator('text=Mailchimp').locator('..');
    const syncButton = mailchimpCard.locator('button:has-text("Sync Now")');

    // Listen for sync response
    const [response] = await Promise.all([
      page.waitForResponse('/api/integrations/mailchimp/sync'),
      syncButton.click(),
    ]);

    expect(response.status()).toBe(200);

    // Verify success alert
    await expect(page.locator('text=Sync completed successfully')).toBeVisible({ timeout: 5000 });
  });

  test('should display sync history', async ({ page }) => {
    // Create mock sync logs
    const config = await db.externalPlatformConfig.findFirst({
      where: { storeId: testStoreId, platform: 'mailchimp' },
    });

    if (config) {
      await db.syncLog.create({
        data: {
          configId: config.id,
          entityType: 'customer',
          action: 'export',
          status: 'success',
          recordsProcessed: 2,
          recordsFailed: 0,
        },
      });
    }

    await page.goto('/dashboard/integrations');

    // Find Mailchimp card
    const mailchimpCard = page.locator('text=Mailchimp').locator('..');

    // Verify sync history section
    await expect(mailchimpCard.locator('text=Recent Syncs')).toBeVisible();
    await expect(mailchimpCard.locator('text=success')).toBeVisible();
    await expect(mailchimpCard.locator('text=2 synced')).toBeVisible();
  });

  test('should disconnect integration', async ({ page }) => {
    await page.goto('/dashboard/integrations');

    // Find Mailchimp card
    const mailchimpCard = page.locator('text=Mailchimp').locator('..');
    const disconnectButton = mailchimpCard.locator('button:has-text("Disconnect")');

    // Mock disconnect confirmation
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Disconnect Mailchimp');
      await dialog.accept();
    });

    // Click disconnect
    await disconnectButton.click();

    // Wait for API response
    await page.waitForResponse('/api/integrations/mailchimp/disconnect');

    // Verify page refresh (should show not connected)
    await page.waitForLoadState('networkidle');
    await expect(mailchimpCard.locator('text=Not Connected')).toBeVisible();
  });

  test('should handle sync errors gracefully', async ({ page }) => {
    // Create config
    await db.externalPlatformConfig.create({
      data: {
        storeId: testStoreId,
        platform: 'mailchimp',
        apiUrl: 'https://us1.api.mailchimp.com',
        apiKey: 'encrypted-mock-access-token',
      },
    });

    // Mock Mailchimp API error
    await page.route('https://us1.api.mailchimp.com/3.0/lists/*/members', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          title: 'Invalid Resource',
          detail: 'The email address is invalid',
        }),
      });
    });

    await page.goto('/dashboard/integrations');

    // Find Mailchimp card and click sync
    const mailchimpCard = page.locator('text=Mailchimp').locator('..');
    const syncButton = mailchimpCard.locator('button:has-text("Sync Now")');

    await syncButton.click();

    // Verify error alert
    await expect(page.locator('text=Sync failed')).toBeVisible({ timeout: 5000 });
  });
});
