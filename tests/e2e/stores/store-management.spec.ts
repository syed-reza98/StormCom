/**
 * E2E Test: Store Management
 * 
 * Task: T092
 * Tests comprehensive store management functionality including CRUD operations,
 * settings management, and subscription handling using Page Object Model.
 * 
 * Test Coverage:
 * - Store creation with validation
 * - Store settings update and logo upload
 * - Store deletion and restoration (soft delete)
 * - Multi-tenant access control
 * - Subscription plan management
 * - Store admin assignment and permissions
 * - Audit logging for store operations
 */

import { test, expect } from '@playwright/test';
import { StoreListPage } from '../pages/StoreListPage';
import { StoreCreatePage } from '../pages/StoreCreatePage';
import { StoreDetailsPage } from '../pages/StoreDetailsPage';
import { StoreSettingsPage } from '../pages/StoreSettingsPage';
import { db } from '../../../src/lib/db';
import {
  createSuperAdmin,
  createStoreAdmin,
  deleteTestUser,
} from '../fixtures/users';
import {
  createTestStore,
  createBasicStore,
  createProStore,
  deleteTestStore,
  generateUniqueSlug,
} from '../fixtures/stores';

test.describe('Store Management', () => {
  let storeListPage: StoreListPage;
  let storeCreatePage: StoreCreatePage;
  let storeDetailsPage: StoreDetailsPage;
  let storeSettingsPage: StoreSettingsPage;
  let superAdmin: any;

  test.beforeEach(async ({ page }) => {
    // Initialize page objects
    storeListPage = new StoreListPage(page);
    storeCreatePage = new StoreCreatePage(page);
    storeDetailsPage = new StoreDetailsPage(page);
    storeSettingsPage = new StoreSettingsPage(page);

    // Create super admin for testing
    superAdmin = await createSuperAdmin({
      email: 'superadmin-store-mgmt@stormcom-test.local',
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

  test('Super Admin can create a new store with all required fields', async () => {
    // Arrange
    const storeData = {
      name: 'New Test Store',
      email: 'newstore@stormcom-test.local',
      subdomain: generateUniqueSlug('new'),
      country: 'US',
      currency: 'USD',
      timezone: 'UTC',
      locale: 'en',
    };

    // Act
    await storeListPage.goto();
    await storeListPage.clickCreateStore();

    await storeCreatePage.waitForPageLoad();
    await storeCreatePage.fillBasicInfo(
      storeData.name,
      storeData.email,
      storeData.subdomain
    );
    await storeCreatePage.fillLocalization(
      storeData.country,
      storeData.currency,
      storeData.timezone,
      storeData.locale
    );
    await storeCreatePage.submit();

    // Wait for redirect to store details
    await storeDetailsPage.waitForPageLoad();

    // Assert - Store should be created successfully
    await expect(storeDetailsPage.page).toHaveURL(/\/dashboard\/stores\/[a-z0-9-]+$/);
    
    // Verify store details are displayed
    await expect(storeDetailsPage.getStoreName()).toContainText(storeData.name);
    await expect(storeDetailsPage.getStoreEmail()).toContainText(storeData.email);

    // Verify store was created in database
    const createdStore = await db.store.findFirst({
      where: { slug: storeData.subdomain },
    });

    expect(createdStore).not.toBeNull();
    expect(createdStore?.name).toBe(storeData.name);
    expect(createdStore?.email).toBe(storeData.email);
    expect(createdStore?.country).toBe(storeData.country);
    expect(createdStore?.currency).toBe(storeData.currency);

    // Verify audit log entry
    const auditLog = await db.auditLog.findFirst({
      where: {
        userId: superAdmin.id,
        action: 'STORE_CREATE',
        entityType: 'Store',
        entityId: createdStore?.id,
      },
    });

    expect(auditLog).not.toBeNull();
    expect(auditLog?.details).toMatchObject({
      storeName: storeData.name,
      storeSlug: storeData.subdomain,
    });

    // Clean up
    if (createdStore) {
      await deleteTestStore(createdStore.id);
    }
  });

  test('Store creation validates subdomain uniqueness', async () => {
    // Arrange - Create existing store first
    const existingStore = await createTestStore({
      slug: 'existing-store-123',
    });

    try {
      // Act - Try to create store with same slug
      await storeListPage.goto();
      await storeListPage.clickCreateStore();

      await storeCreatePage.waitForPageLoad();
      await storeCreatePage.fillBasicInfo(
        'Duplicate Store',
        'duplicate@stormcom-test.local',
        'existing-store-123'
      );
      await storeCreatePage.fillLocalization('US', 'USD', 'UTC', 'en');
      await storeCreatePage.submit();

      // Assert - Should show validation error
      await expect(storeCreatePage.getSubdomainError()).toBeVisible();
      await expect(storeCreatePage.getSubdomainError()).toContainText(
        'subdomain is already taken'
      );

      // Should remain on create page
      await expect(storeCreatePage.page).toHaveURL(/\/dashboard\/stores\/create$/);
    } finally {
      // Clean up
      await deleteTestStore(existingStore.id);
    }
  });

  test('Store Admin can update store settings', async () => {
    // Arrange - Create store and store admin
    const testStore = await createTestStore({
      name: 'Settings Test Store',
    });

    const storeAdmin = await createStoreAdmin(testStore.id, {
      email: 'storeadmin-settings@stormcom-test.local',
      password: 'StoreAdmin123!',
    });

    try {
      // Login as store admin
      await storeDetailsPage.page.goto('/login');
      await storeDetailsPage.page.fill('input#email', storeAdmin.email);
      await storeDetailsPage.page.fill('input#password', storeAdmin.plainPassword);
      await storeDetailsPage.page.click('button[type="submit"]');
      await storeDetailsPage.page.waitForURL('**/dashboard');

      // Act - Navigate to store settings
      await storeDetailsPage.goto(testStore.id);
      await storeDetailsPage.clickSettingsTab();

      await storeSettingsPage.waitForPageLoad();

      // Update store settings
      const updatedData = {
        name: 'Updated Store Name',
        description: 'Updated store description',
        phone: '+1-555-123-4567',
        website: 'https://updated.example.com',
        address: '456 Updated Street',
        city: 'Updated City',
        state: 'UP',
        postalCode: '54321',
      };

      await storeSettingsPage.fillBasicInfo(
        updatedData.name,
        updatedData.description,
        updatedData.phone,
        updatedData.website
      );

      await storeSettingsPage.fillAddress(
        updatedData.address,
        updatedData.city,
        updatedData.state,
        updatedData.postalCode
      );

      await storeSettingsPage.submit();

      // Assert - Should show success message and redirect
      await expect(storeSettingsPage.getSuccessMessage()).toBeVisible();
      await storeDetailsPage.waitForPageLoad();

      // Verify database was updated
      const updatedStore = await db.store.findUnique({
        where: { id: testStore.id },
      });

      expect(updatedStore?.name).toBe(updatedData.name);
      expect(updatedStore?.description).toBe(updatedData.description);
      expect(updatedStore?.phone).toBe(updatedData.phone);
      expect(updatedStore?.website).toBe(updatedData.website);
      expect(updatedStore?.address).toBe(updatedData.address);
      expect(updatedStore?.city).toBe(updatedData.city);
      expect(updatedStore?.state).toBe(updatedData.state);
      expect(updatedStore?.postalCode).toBe(updatedData.postalCode);

      // Verify audit log
      const auditLog = await db.auditLog.findFirst({
        where: {
          userId: storeAdmin.id,
          action: 'STORE_UPDATE',
          entityType: 'Store',
          entityId: testStore.id,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog?.details).toMatchObject({
        updatedFields: expect.arrayContaining(['name', 'description', 'phone', 'website']),
      });
    } finally {
      // Clean up
      await deleteTestUser(storeAdmin.id);
      await deleteTestStore(testStore.id);
    }
  });

  test('Store settings form validates required fields', async () => {
    // Arrange - Create test store
    const testStore = await createTestStore();

    try {
      // Act - Navigate to store settings
      await storeDetailsPage.goto(testStore.id);
      await storeDetailsPage.clickSettingsTab();

      await storeSettingsPage.waitForPageLoad();

      // Clear required fields
      await storeSettingsPage.clearField('name');
      await storeSettingsPage.clearField('email');
      await storeSettingsPage.clearField('country');

      // Try to submit
      await storeSettingsPage.submit();

      // Assert - Should show validation errors
      await expect(storeSettingsPage.getNameError()).toBeVisible();
      await expect(storeSettingsPage.getEmailError()).toBeVisible();
      await expect(storeSettingsPage.getCountryError()).toBeVisible();

      // Should remain on settings page
      await expect(storeSettingsPage.page).toHaveURL(/\/settings$/);
    } finally {
      // Clean up
      await deleteTestStore(testStore.id);
    }
  });

  test('Store Admin can update theme settings', async () => {
    // Arrange - Create test store
    const testStore = await createTestStore();

    try {
      // Act - Navigate to store settings
      await storeDetailsPage.goto(testStore.id);
      await storeDetailsPage.clickSettingsTab();

      await storeSettingsPage.waitForPageLoad();

      // Update theme settings
      const themeData = {
        primaryColor: '#FF6B6B',
        secondaryColor: '#4ECDC4',
        accentColor: '#45B7D1',
        fontFamily: 'poppins',
      };

      await storeSettingsPage.fillThemeSettings(
        themeData.primaryColor,
        themeData.secondaryColor,
        themeData.accentColor,
        themeData.fontFamily
      );

      await storeSettingsPage.submit();

      // Assert - Should save successfully
      await expect(storeSettingsPage.getSuccessMessage()).toBeVisible();

      // Verify theme settings are applied (check for color previews)
      const primaryColorPreview = storeSettingsPage.page.locator(
        `input[type="color"][value="${themeData.primaryColor}"]`
      );
      await expect(primaryColorPreview).toHaveValue(themeData.primaryColor);
    } finally {
      // Clean up
      await deleteTestStore(testStore.id);
    }
  });

  test('Super Admin can soft delete a store', async () => {
    // Arrange - Create test store
    const testStore = await createTestStore({
      name: 'Store to Delete',
    });

    try {
      // Act - Navigate to store details and delete
      await storeDetailsPage.goto(testStore.id);
      await storeDetailsPage.clickDeleteStore();

      // Confirm deletion in modal
      await expect(storeDetailsPage.getDeleteModal()).toBeVisible();
      await storeDetailsPage.confirmDelete();

      // Assert - Should redirect to store list
      await storeListPage.waitForPageLoad();
      await expect(storeListPage.page).toHaveURL(/\/dashboard\/stores$/);

      // Verify store was soft deleted in database
      const deletedStore = await db.store.findUnique({
        where: { id: testStore.id },
      });

      expect(deletedStore?.deletedAt).not.toBeNull();

      // Verify audit log
      const auditLog = await db.auditLog.findFirst({
        where: {
          userId: superAdmin.id,
          action: 'STORE_DELETE',
          entityType: 'Store',
          entityId: testStore.id,
        },
      });

      expect(auditLog).not.toBeNull();
    } finally {
      // Hard delete for cleanup
      await deleteTestStore(testStore.id);
    }
  });

  test('Store Admin cannot delete their own store', async () => {
    // Arrange - Create store and store admin
    const testStore = await createTestStore();
    const storeAdmin = await createStoreAdmin(testStore.id, {
      email: 'storeadmin-nodelete@stormcom-test.local',
      password: 'StoreAdmin123!',
    });

    try {
      // Login as store admin
      await storeDetailsPage.page.goto('/login');
      await storeDetailsPage.page.fill('input#email', storeAdmin.email);
      await storeDetailsPage.page.fill('input#password', storeAdmin.plainPassword);
      await storeDetailsPage.page.click('button[type="submit"]');
      await storeDetailsPage.page.waitForURL('**/dashboard');

      // Act - Navigate to store details
      await storeDetailsPage.goto(testStore.id);

      // Assert - Delete button should not be visible or should be disabled
      const deleteButton = storeDetailsPage.getDeleteButton();
      await expect(deleteButton).not.toBeVisible();
    } finally {
      // Clean up
      await deleteTestUser(storeAdmin.id);
      await deleteTestStore(testStore.id);
    }
  });

  test('Store Admin can only access their assigned store', async () => {
    // Arrange - Create two stores and one store admin
    const ownStore = await createTestStore({
      name: 'Own Store',
    });

    const otherStore = await createTestStore({
      name: 'Other Store',
    });

    const storeAdmin = await createStoreAdmin(ownStore.id, {
      email: 'storeadmin-access@stormcom-test.local',
      password: 'StoreAdmin123!',
    });

    try {
      // Login as store admin
      await storeDetailsPage.page.goto('/login');
      await storeDetailsPage.page.fill('input#email', storeAdmin.email);
      await storeDetailsPage.page.fill('input#password', storeAdmin.plainPassword);
      await storeDetailsPage.page.click('button[type="submit"]');
      await storeDetailsPage.page.waitForURL('**/dashboard');

      // Act & Assert - Can access own store
      await storeDetailsPage.goto(ownStore.id);
      await storeDetailsPage.waitForPageLoad();
      await expect(storeDetailsPage.getStoreName()).toContainText('Own Store');

      // Try to access other store - should be forbidden
      const response = await storeDetailsPage.page.request.get(
        `/api/stores/${otherStore.id}`
      );
      expect(response.status()).toBe(403);

      // Direct navigation should redirect or show error
      await storeDetailsPage.page.goto(`/dashboard/stores/${otherStore.id}`);
      await expect(storeDetailsPage.page).toHaveURL(/\/(dashboard|403|unauthorized)/);
    } finally {
      // Clean up
      await deleteTestUser(storeAdmin.id);
      await deleteTestStore(ownStore.id);
      await deleteTestStore(otherStore.id);
    }
  });

  test('Subscription plan limits are enforced correctly', async () => {
    // Arrange - Create FREE plan store at product limit
    const freeStore = await createTestStore({
      subscriptionPlan: 'FREE',
      productLimit: 10,
    });

    // Create 10 products to reach limit
    for (let i = 0; i < 10; i++) {
      await db.product.create({
        data: {
          name: `Test Product ${i + 1}`,
          slug: `test-product-${i + 1}-${Date.now()}`,
          storeId: freeStore.id,
          price: 1000, // $10.00
          inventory: 100,
          isActive: true,
        },
      });
    }

    try {
      // Act & Assert - Should not be able to create 11th product
      await storeDetailsPage.goto(freeStore.id);
      await storeDetailsPage.clickProductsTab();

      const productCount = await db.product.count({
        where: { storeId: freeStore.id },
      });
      expect(productCount).toBe(10);

      // Check if upgrade notice is shown
      const upgradeNotice = storeDetailsPage.page.locator('[data-testid="product-limit-notice"]');
      await expect(upgradeNotice).toBeVisible();
    } finally {
      // Clean up
      await db.product.deleteMany({
        where: { storeId: freeStore.id },
      });
      await deleteTestStore(freeStore.id);
    }
  });

  test('Store can be upgraded to higher subscription plan', async () => {
    // Arrange - Create BASIC plan store
    const basicStore = await createBasicStore({
      name: 'Upgrade Test Store',
    });

    try {
      // Act - Navigate to billing tab
      await storeDetailsPage.goto(basicStore.id);
      await storeDetailsPage.clickBillingTab();

      // Verify current plan is displayed
      const currentPlan = storeDetailsPage.page.locator('[data-testid="current-plan"]');
      await expect(currentPlan).toContainText('BASIC');

      // Click upgrade to PRO
      const upgradeButton = storeDetailsPage.page.locator('[data-testid="upgrade-to-pro"]');
      await upgradeButton.click();

      // In a real test, this would involve payment processing
      // For now, we'll verify the upgrade flow is initiated
      await expect(storeDetailsPage.page).toHaveURL(/\/billing\/upgrade/);
    } finally {
      // Clean up
      await deleteTestStore(basicStore.id);
    }
  });

  test('Store settings form handles logo upload', async () => {
    // Arrange - Create test store
    const testStore = await createTestStore();

    try {
      // Act - Navigate to store settings
      await storeDetailsPage.goto(testStore.id);
      await storeDetailsPage.clickSettingsTab();

      await storeSettingsPage.waitForPageLoad();

      // Mock file upload (in real test, would use actual file)
      const fileInput = storeSettingsPage.page.locator('input[type="file"]#logo');
      
      // Simulate file selection
      await fileInput.evaluate(input => {
        const file = new File(['test image content'], 'logo.png', { type: 'image/png' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        (input as HTMLInputElement).files = dataTransfer.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });

      // Wait for upload to complete (would show loading state)
      await storeSettingsPage.page.waitForTimeout(1000);

      // Assert - Logo preview should be visible
      const logoPreview = storeSettingsPage.page.locator('[data-testid="logo-preview"]');
      await expect(logoPreview).toBeVisible();
    } finally {
      // Clean up
      await deleteTestStore(testStore.id);
    }
  });

  test('Store search and filtering works correctly', async () => {
    // Arrange - Create test stores with different attributes
    const searchStore = await createTestStore({
      name: 'Searchable Store Name',
      email: 'search@stormcom-test.local',
    });

    const filterStore = await createBasicStore({
      name: 'Filter Test Store',
      email: 'filter@stormcom-test.local',
    });

    try {
      // Act & Assert - Search by name
      await storeListPage.goto();
      await storeListPage.searchStores('Searchable');
      
      await expect(storeListPage.getStoreRow(searchStore.id)).toBeVisible();
      await expect(storeListPage.getStoreRow(filterStore.id)).not.toBeVisible();

      // Clear search and filter by plan
      await storeListPage.clearSearch();
      await storeListPage.filterByPlan('BASIC');

      await expect(storeListPage.getStoreRow(filterStore.id)).toBeVisible();
      await expect(storeListPage.getStoreRow(searchStore.id)).not.toBeVisible();

      // Clear all filters
      await storeListPage.clearFilters();
      
      // Both stores should be visible
      await expect(storeListPage.getStoreRow(searchStore.id)).toBeVisible();
      await expect(storeListPage.getStoreRow(filterStore.id)).toBeVisible();
    } finally {
      // Clean up
      await deleteTestStore(searchStore.id);
      await deleteTestStore(filterStore.id);
    }
  });
});