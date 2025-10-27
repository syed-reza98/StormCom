/**
 * E2E Test: Store Details Page
 * 
 * Task: T094
 * Tests store details page functionality including tabbed interface,
 * information display, statistics, and management actions.
 * 
 * Test Coverage:
 * - Store details display and information sections
 * - Tab navigation (General, Settings, Theme, Billing, Users, Products, Orders, Analytics)
 * - Store statistics and metrics
 * - Status banners (trial, expired, limits)
 * - Store management actions (edit, delete, upgrade)
 * - User assignment and permissions
 * - Subscription management and billing
 * - Accessibility and keyboard navigation
 */

import { test, expect } from '@playwright/test';
import { StoreDetailsPage } from '../pages/StoreDetailsPage';
import { StoreSettingsPage } from '../pages/StoreSettingsPage';
import { db } from '../../../src/lib/db';
import {
  createSuperAdmin,
  createStoreAdmin,
  createCustomer,
  deleteTestUser,
} from '../fixtures/users';
import {
  createTestStore,
  createBasicStore,
  createProStore,
  createExpiredTrialStore,
  deleteTestStore,
  assignUserToStore,
} from '../fixtures/stores';

test.describe('Store Details Page', () => {
  let storeDetailsPage: StoreDetailsPage;
  let storeSettingsPage: StoreSettingsPage;
  let superAdmin: any;

  test.beforeEach(async ({ page }) => {
    storeDetailsPage = new StoreDetailsPage(page);
    storeSettingsPage = new StoreSettingsPage(page);

    // Create super admin for testing
    superAdmin = await createSuperAdmin({
      email: 'superadmin-storedetails@stormcom-test.local',
      password: 'Admin123456!',
    });

    // Login as super admin
    await page.goto('/login');
    await page.fill('input#email', superAdmin.email);
    await page.fill('input#password', superAdmin.plainPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test.afterEach(async () => {
    // Clean up test user
    if (superAdmin) {
      await deleteTestUser(superAdmin.id);
    }
  });

  test('displays store information correctly', async () => {
    // Arrange - Create test store with complete information
    const testStore = await createTestStore({
      name: 'Details Test Store',
      email: 'details@stormcom-test.local',
      description: 'A comprehensive test store',
      phone: '+1-555-123-4567',
      website: 'https://test.example.com',
      address: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      postalCode: '12345',
      country: 'US',
      currency: 'USD',
      timezone: 'UTC',
      locale: 'en',
    });

    try {
      // Act
      await storeDetailsPage.goto(testStore.id);

      // Assert - Header information
      await expect(storeDetailsPage.getStoreName()).toContainText('Details Test Store');
      await expect(storeDetailsPage.getStoreEmail()).toContainText('details@stormcom-test.local');
      await expect(storeDetailsPage.getStoreStatus()).toContainText('TRIAL');
      await expect(storeDetailsPage.getStorePlan()).toContainText('FREE');

      // Assert - Store information sections are visible
      await expect(storeDetailsPage.storeInfo).toBeVisible();
      await expect(storeDetailsPage.contactInfo).toBeVisible();
      await expect(storeDetailsPage.addressInfo).toBeVisible();
      await expect(storeDetailsPage.subscriptionInfo).toBeVisible();

      // Verify store information content
      const storeInfoText = await storeDetailsPage.getStoreInfo();
      expect(storeInfoText).toContain('Details Test Store');
      expect(storeInfoText).toContain('A comprehensive test store');

      const contactInfoText = await storeDetailsPage.getContactInfo();
      expect(contactInfoText).toContain('details@stormcom-test.local');
      expect(contactInfoText).toContain('+1-555-123-4567');
      expect(contactInfoText).toContain('https://test.example.com');

      const addressInfoText = await storeDetailsPage.getAddressInfo();
      expect(addressInfoText).toContain('123 Test Street');
      expect(addressInfoText).toContain('Test City, TS 12345');
      expect(addressInfoText).toContain('United States');
    } finally {
      // Clean up
      await deleteTestStore(testStore.id);
    }
  });

  test('tab navigation works correctly', async () => {
    // Arrange
    const testStore = await createTestStore({
      name: 'Tab Navigation Store',
    });

    try {
      // Act & Assert - Test each tab
      await storeDetailsPage.goto(testStore.id);

      // Should start on General tab
      const currentTab = await storeDetailsPage.getCurrentTab();
      expect(currentTab.toLowerCase()).toContain('general');

      // Navigate to Settings tab
      await storeDetailsPage.clickSettingsTab();
      await storeSettingsPage.waitForPageLoad();
      await expect(storeDetailsPage.page).toHaveURL(/\/settings$/);

      // Navigate back to General tab
      await storeDetailsPage.clickGeneralTab();
      await expect(storeDetailsPage.storeInfo).toBeVisible();

      // Navigate to Theme tab
      await storeDetailsPage.clickThemeTab();
      await expect(storeDetailsPage.page).toHaveURL(/\/theme$/);

      // Navigate to Billing tab
      await storeDetailsPage.clickBillingTab();
      await expect(storeDetailsPage.page).toHaveURL(/\/billing$/);

      // Navigate to Users tab
      await storeDetailsPage.clickUsersTab();
      await expect(storeDetailsPage.page).toHaveURL(/\/users$/);

      // Navigate to Products tab
      await storeDetailsPage.clickProductsTab();
      await expect(storeDetailsPage.page).toHaveURL(/\/products$/);

      // Navigate to Orders tab
      await storeDetailsPage.clickOrdersTab();
      await expect(storeDetailsPage.page).toHaveURL(/\/orders$/);

      // Navigate to Analytics tab
      await storeDetailsPage.clickAnalyticsTab();
      await expect(storeDetailsPage.page).toHaveURL(/\/analytics$/);
    } finally {
      // Clean up
      await deleteTestStore(testStore.id);
    }
  });

  test('displays store statistics correctly', async () => {
    // Arrange - Create store with some data
    const testStore = await createTestStore({
      name: 'Statistics Test Store',
    });

    // Create test products
    const products = [];
    for (let i = 0; i < 5; i++) {
      const product = await db.product.create({
        data: {
          name: `Test Product ${i + 1}`,
          slug: `test-product-${i + 1}-${Date.now()}`,
          storeId: testStore.id,
          price: 1000 + (i * 500), // $10.00, $15.00, etc.
          inventory: 50,
          isActive: true,
        },
      });
      products.push(product);
    }

    // Create test customers
    const customers = [];
    for (let i = 0; i < 3; i++) {
      const customer = await createCustomer(testStore.id, {
        email: `customer${i + 1}@stormcom-test.local`,
        firstName: `Customer`,
        lastName: `${i + 1}`,
      });
      customers.push(customer);
    }

    // Create test orders
    const orders = [];
    for (let i = 0; i < 2; i++) {
      const order = await db.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${i + 1}`,
          storeId: testStore.id,
          customerId: customers[i].id,
          status: 'COMPLETED',
          subtotal: 1000,
          tax: 100,
          shipping: 500,
          total: 1600,
          currency: 'USD',
        },
      });
      orders.push(order);
    }

    try {
      // Act
      await storeDetailsPage.goto(testStore.id);
      await storeDetailsPage.waitForStatisticsUpdate();

      // Assert - Statistics should be displayed
      const totalProducts = await storeDetailsPage.getTotalProducts();
      expect(totalProducts).toBe(5);

      const totalOrders = await storeDetailsPage.getTotalOrders();
      expect(totalOrders).toBe(2);

      const totalCustomers = await storeDetailsPage.getTotalCustomers();
      expect(totalCustomers).toBe(3);

      const totalRevenue = await storeDetailsPage.getTotalRevenue();
      expect(totalRevenue).toContain('$'); // Should be formatted currency
    } finally {
      // Clean up
      await db.order.deleteMany({ where: { storeId: testStore.id } });
      await db.product.deleteMany({ where: { storeId: testStore.id } });
      for (const customer of customers) {
        await deleteTestUser(customer.id);
      }
      await deleteTestStore(testStore.id);
    }
  });

  test('trial banner is shown for trial stores', async () => {
    // Arrange - Create trial store
    const trialStore = await createTestStore({
      name: 'Trial Banner Store',
      subscriptionStatus: 'TRIAL',
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    try {
      // Act
      await storeDetailsPage.goto(trialStore.id);

      // Assert - Trial banner should be visible
      await expect(storeDetailsPage.hasTrialBanner()).resolves.toBe(true);

      // Check trial days remaining
      const daysRemaining = await storeDetailsPage.getTrialDaysRemaining();
      expect(daysRemaining).toBeGreaterThan(0);
      expect(daysRemaining).toBeLessThanOrEqual(7);
    } finally {
      // Clean up
      await deleteTestStore(trialStore.id);
    }
  });

  test('expired banner is shown for expired stores', async () => {
    // Arrange - Create expired store
    const expiredStore = await createExpiredTrialStore({
      name: 'Expired Banner Store',
    });

    try {
      // Act
      await storeDetailsPage.goto(expiredStore.id);

      // Assert - Expired banner should be visible
      await expect(storeDetailsPage.hasExpiredBanner()).resolves.toBe(true);
      await expect(storeDetailsPage.isExpiredStore()).resolves.toBe(true);
    } finally {
      // Clean up
      await deleteTestStore(expiredStore.id);
    }
  });

  test('limit warning is shown when approaching product limit', async () => {
    // Arrange - Create FREE store at 90% of product limit
    const limitStore = await createTestStore({
      name: 'Limit Warning Store',
      subscriptionPlan: 'FREE',
      productLimit: 10,
    });

    // Create 9 products (90% of limit)
    for (let i = 0; i < 9; i++) {
      await db.product.create({
        data: {
          name: `Limit Product ${i + 1}`,
          slug: `limit-product-${i + 1}-${Date.now()}`,
          storeId: limitStore.id,
          price: 1000,
          inventory: 100,
          isActive: true,
        },
      });
    }

    try {
      // Act
      await storeDetailsPage.goto(limitStore.id);
      await storeDetailsPage.clickProductsTab();

      // Assert - Limit warning should be visible
      await expect(storeDetailsPage.hasLimitWarning()).resolves.toBe(true);
    } finally {
      // Clean up
      await db.product.deleteMany({ where: { storeId: limitStore.id } });
      await deleteTestStore(limitStore.id);
    }
  });

  test('store URL link works correctly', async () => {
    // Arrange
    const testStore = await createTestStore({
      name: 'URL Test Store',
      slug: 'url-test-store-123',
    });

    try {
      // Act
      await storeDetailsPage.goto(testStore.id);

      // Assert - Store URL should be displayed
      await expect(storeDetailsPage.getStoreUrl()).toBeVisible();
      await expect(storeDetailsPage.getStoreUrl()).toContainText('url-test-store-123');

      // Click store URL (would open in new tab in real usage)
      const storeUrl = await storeDetailsPage.getStoreUrl().getAttribute('href');
      expect(storeUrl).toContain('url-test-store-123');
    } finally {
      // Clean up
      await deleteTestStore(testStore.id);
    }
  });

  test('Store Admin has limited actions available', async () => {
    // Arrange - Create store and store admin
    const testStore = await createTestStore({
      name: 'Admin Actions Store',
    });

    const storeAdmin = await createStoreAdmin(testStore.id, {
      email: 'storeadmin-actions@stormcom-test.local',
      password: 'StoreAdmin123!',
    });

    try {
      // Login as store admin
      await storeDetailsPage.page.goto('/login');
      await storeDetailsPage.page.fill('input#email', storeAdmin.email);
      await storeDetailsPage.page.fill('input#password', storeAdmin.plainPassword);
      await storeDetailsPage.page.click('button[type="submit"]');
      await storeDetailsPage.page.waitForURL('**/dashboard');

      // Act
      await storeDetailsPage.goto(testStore.id);

      // Assert - Store admin should not see delete button
      await expect(storeDetailsPage.getDeleteButton()).not.toBeVisible();

      // Should be able to access settings
      await storeDetailsPage.clickSettingsTab();
      await storeSettingsPage.waitForPageLoad();
    } finally {
      // Clean up
      await deleteTestUser(storeAdmin.id);
      await deleteTestStore(testStore.id);
    }
  });

  test('Super Admin can delete store', async () => {
    // Arrange
    const testStore = await createTestStore({
      name: 'Delete Test Store',
    });

    try {
      // Act
      await storeDetailsPage.goto(testStore.id);
      await storeDetailsPage.clickDeleteStore();

      // Assert - Delete modal should appear
      await expect(storeDetailsPage.getDeleteModal()).toBeVisible();

      // Cancel deletion
      await storeDetailsPage.cancelDelete();
      await expect(storeDetailsPage.getDeleteModal()).not.toBeVisible();

      // Try delete again and confirm
      await storeDetailsPage.clickDeleteStore();
      await expect(storeDetailsPage.getDeleteModal()).toBeVisible();
      await storeDetailsPage.confirmDelete();

      // Should redirect to store list
      await expect(storeDetailsPage.page).toHaveURL(/\/dashboard\/stores$/);

      // Verify store was soft deleted
      const deletedStore = await db.store.findUnique({
        where: { id: testStore.id },
      });
      expect(deletedStore?.deletedAt).not.toBeNull();
    } finally {
      // Hard delete for cleanup
      await deleteTestStore(testStore.id);
    }
  });

  test('back button navigates to store list', async () => {
    // Arrange
    const testStore = await createTestStore({
      name: 'Back Button Store',
    });

    try {
      // Act
      await storeDetailsPage.goto(testStore.id);
      await storeDetailsPage.clickBack();

      // Assert - Should navigate back to store list
      await expect(storeDetailsPage.page).toHaveURL(/\/dashboard\/stores$/);
    } finally {
      // Clean up
      await deleteTestStore(testStore.id);
    }
  });

  test('keyboard navigation works correctly for tabs', async () => {
    // Arrange
    const testStore = await createTestStore({
      name: 'Keyboard Navigation Store',
    });

    try {
      // Act & Assert
      await storeDetailsPage.goto(testStore.id);
      await storeDetailsPage.verifyTabNavigation();

      // No additional assertions needed - method throws on failure
    } finally {
      // Clean up
      await deleteTestStore(testStore.id);
    }
  });

  test('store details match database values', async () => {
    // Arrange - Create store with specific values
    const testStore = await createBasicStore({
      name: 'Verification Store',
      email: 'verify@stormcom-test.local',
      description: 'Store for verification testing',
      subscriptionPlan: 'BASIC',
      subscriptionStatus: 'ACTIVE',
    });

    try {
      // Act
      await storeDetailsPage.goto(testStore.id);

      // Assert - Verify all details match
      await storeDetailsPage.verifyStoreDetails({
        name: 'Verification Store',
        email: 'verify@stormcom-test.local',
        status: 'ACTIVE',
        plan: 'BASIC',
      });
    } finally {
      // Clean up
      await deleteTestStore(testStore.id);
    }
  });

  test('actions dropdown shows appropriate options', async () => {
    // Arrange
    const testStore = await createTestStore({
      name: 'Actions Dropdown Store',
    });

    try {
      // Act
      await storeDetailsPage.goto(testStore.id);
      await storeDetailsPage.openActionsDropdown();

      // Assert - Should show available actions
      const actionsMenu = storeDetailsPage.page.locator('[role="menu"]');
      await expect(actionsMenu).toBeVisible();

      // Verify specific actions are available
      const assignAdminAction = storeDetailsPage.page.locator('button[role="menuitem"]').filter({ hasText: /assign.*admin/i });
      const upgradeAction = storeDetailsPage.page.locator('button[role="menuitem"]').filter({ hasText: /upgrade/i });

      await expect(assignAdminAction).toBeVisible();
      await expect(upgradeAction).toBeVisible();
    } finally {
      // Clean up
      await deleteTestStore(testStore.id);
    }
  });

  test('subscription info displays correctly for different plans', async () => {
    // Arrange - Create PRO store
    const proStore = await createProStore({
      name: 'Pro Subscription Store',
    });

    try {
      // Act
      await storeDetailsPage.goto(proStore.id);

      // Assert - Subscription information
      const subscriptionInfo = await storeDetailsPage.getSubscriptionInfo();
      expect(subscriptionInfo).toContain('PRO');
      expect(subscriptionInfo).toContain('ACTIVE');

      // Should show product and order limits
      expect(subscriptionInfo).toContain('1,000'); // PRO plan product limit
      expect(subscriptionInfo).toContain('10,000'); // PRO plan order limit
    } finally {
      // Clean up
      await deleteTestStore(proStore.id);
    }
  });

  test('upgrade notice is shown for appropriate plans', async () => {
    // Arrange - Create FREE store
    const freeStore = await createTestStore({
      name: 'Upgrade Notice Store',
      subscriptionPlan: 'FREE',
    });

    try {
      // Act
      await storeDetailsPage.goto(freeStore.id);
      await storeDetailsPage.clickBillingTab();

      // Assert - Upgrade notice should be visible
      await expect(storeDetailsPage.hasUpgradeNotice()).resolves.toBe(true);

      // Should have upgrade button
      const upgradeButton = storeDetailsPage.page.locator('button').filter({ hasText: /upgrade.*plan/i });
      await expect(upgradeButton).toBeVisible();
    } finally {
      // Clean up
      await deleteTestStore(freeStore.id);
    }
  });

  test('store edit button navigates to settings', async () => {
    // Arrange
    const testStore = await createTestStore({
      name: 'Edit Button Store',
    });

    try {
      // Act
      await storeDetailsPage.goto(testStore.id);
      await storeDetailsPage.clickEdit();

      // Assert - Should navigate to settings page
      await storeSettingsPage.waitForPageLoad();
      await expect(storeDetailsPage.page).toHaveURL(/\/settings$/);
    } finally {
      // Clean up
      await deleteTestStore(testStore.id);
    }
  });

  test('store analytics tab shows appropriate metrics', async () => {
    // Arrange
    const testStore = await createProStore({
      name: 'Analytics Store',
    });

    try {
      // Act
      await storeDetailsPage.goto(testStore.id);
      await storeDetailsPage.clickAnalyticsTab();

      // Assert - Should show analytics interface
      await expect(storeDetailsPage.page).toHaveURL(/\/analytics$/);

      // Should show metrics sections (exact content depends on implementation)
      const metricsSection = storeDetailsPage.page.locator('[data-testid="metrics-section"]');
      await expect(metricsSection.or(storeDetailsPage.page.getByText('Analytics'))).toBeVisible();
    } finally {
      // Clean up
      await deleteTestStore(testStore.id);
    }
  });

  test('responsive design works on mobile viewport', async () => {
    // Arrange
    const testStore = await createTestStore({
      name: 'Mobile Responsive Store',
    });

    try {
      // Act - Set mobile viewport
      await storeDetailsPage.page.setViewportSize({ width: 375, height: 667 });
      await storeDetailsPage.goto(testStore.id);

      // Assert - Page should still be functional
      await expect(storeDetailsPage.getStoreName()).toBeVisible();
      await expect(storeDetailsPage.generalTab).toBeVisible();

      // Tab navigation should work on mobile
      await storeDetailsPage.clickSettingsTab();
      await storeSettingsPage.waitForPageLoad();
    } finally {
      // Clean up
      await deleteTestStore(testStore.id);
    }
  });
});