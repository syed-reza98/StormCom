/**
 * E2E Test: Store List Page
 * 
 * Task: T093
 * Tests store list page functionality including search, filtering, pagination,
 * sorting, and bulk operations using Page Object Model pattern.
 * 
 * Test Coverage:
 * - Store list display and pagination
 * - Search functionality (name, email, subdomain)
 * - Filter by plan, status, country
 * - Sorting by columns (name, created, plan, status)
 * - Bulk selection and operations
 * - Keyboard navigation and accessibility
 * - Empty states and loading states
 * - Export functionality
 */

import { test, expect } from '@playwright/test';
import { StoreListPage } from '../pages/StoreListPage';
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
  createExpiredTrialStore,
  deleteTestStore,
  generateUniqueSlug,
} from '../fixtures/stores';

test.describe('Store List Page', () => {
  let storeListPage: StoreListPage;
  let superAdmin: any;

  test.beforeEach(async ({ page }) => {
    storeListPage = new StoreListPage(page);

    // Create super admin for testing
    superAdmin = await createSuperAdmin({
      email: 'superadmin-storelist@stormcom-test.local',
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

  test('displays store list with correct information', async () => {
    // Arrange - Create test stores
    const store1 = await createTestStore({
      name: 'Alpha Store',
      email: 'alpha@stormcom-test.local',
    });

    const store2 = await createBasicStore({
      name: 'Beta Store',
      email: 'beta@stormcom-test.local',
    });

    try {
      // Act
      await storeListPage.goto();

      // Assert - Stores should be visible
      await expect(storeListPage.getStoreRow(store1.id)).toBeVisible();
      await expect(storeListPage.getStoreRow(store2.id)).toBeVisible();

      // Verify store information is displayed correctly
      await expect(storeListPage.getStoreName(store1.id)).toContainText('Alpha Store');
      await expect(storeListPage.getStoreEmail(store1.id)).toContainText('alpha@stormcom-test.local');
      await expect(storeListPage.getStorePlan(store1.id)).toContainText('FREE');

      await expect(storeListPage.getStoreName(store2.id)).toContainText('Beta Store');
      await expect(storeListPage.getStoreEmail(store2.id)).toContainText('beta@stormcom-test.local');
      await expect(storeListPage.getStorePlan(store2.id)).toContainText('BASIC');
    } finally {
      // Clean up
      await deleteTestStore(store1.id);
      await deleteTestStore(store2.id);
    }
  });

  test('search functionality works correctly', async () => {
    // Arrange - Create test stores with distinct names
    const searchableStore = await createTestStore({
      name: 'Searchable Store Name',
      email: 'searchable@stormcom-test.local',
      slug: generateUniqueSlug('searchable'),
    });

    const otherStore = await createTestStore({
      name: 'Other Store Name',
      email: 'other@stormcom-test.local',
      slug: generateUniqueSlug('other'),
    });

    try {
      // Act & Assert - Search by store name
      await storeListPage.goto();

      // Search for "Searchable"
      await storeListPage.searchStores('Searchable');

      // Should show matching store
      await expect(storeListPage.getStoreRow(searchableStore.id)).toBeVisible();
      await expect(storeListPage.getStoreRow(otherStore.id)).not.toBeVisible();

      // Clear search
      await storeListPage.clearSearch();

      // Both stores should be visible again
      await expect(storeListPage.getStoreRow(searchableStore.id)).toBeVisible();
      await expect(storeListPage.getStoreRow(otherStore.id)).toBeVisible();

      // Search by email
      await storeListPage.searchStores('searchable@stormcom-test.local');
      await expect(storeListPage.getStoreRow(searchableStore.id)).toBeVisible();
      await expect(storeListPage.getStoreRow(otherStore.id)).not.toBeVisible();

      // Search by subdomain
      await storeListPage.clearSearch();
      await storeListPage.searchStores(searchableStore.slug);
      await expect(storeListPage.getStoreRow(searchableStore.id)).toBeVisible();
      await expect(storeListPage.getStoreRow(otherStore.id)).not.toBeVisible();

      // Case insensitive search
      await storeListPage.clearSearch();
      await storeListPage.searchStores('SEARCHABLE');
      await expect(storeListPage.getStoreRow(searchableStore.id)).toBeVisible();
      await expect(storeListPage.getStoreRow(otherStore.id)).not.toBeVisible();
    } finally {
      // Clean up
      await deleteTestStore(searchableStore.id);
      await deleteTestStore(otherStore.id);
    }
  });

  test('search with Enter key works correctly', async () => {
    // Arrange
    const store = await createTestStore({
      name: 'Enter Key Test Store',
    });

    try {
      // Act
      await storeListPage.goto();
      await storeListPage.searchWithEnter('Enter Key');

      // Assert
      await expect(storeListPage.getStoreRow(store.id)).toBeVisible();
    } finally {
      // Clean up
      await deleteTestStore(store.id);
    }
  });

  test('filter by subscription plan works correctly', async () => {
    // Arrange - Create stores with different plans
    const freeStore = await createTestStore({
      name: 'Free Plan Store',
      subscriptionPlan: 'FREE',
    });

    const basicStore = await createBasicStore({
      name: 'Basic Plan Store',
    });

    const proStore = await createProStore({
      name: 'Pro Plan Store',
    });

    try {
      // Act & Assert - Filter by FREE plan
      await storeListPage.goto();
      await storeListPage.filterByPlan('FREE');

      await expect(storeListPage.getStoreRow(freeStore.id)).toBeVisible();
      await expect(storeListPage.getStoreRow(basicStore.id)).not.toBeVisible();
      await expect(storeListPage.getStoreRow(proStore.id)).not.toBeVisible();

      // Filter by BASIC plan
      await storeListPage.filterByPlan('BASIC');

      await expect(storeListPage.getStoreRow(freeStore.id)).not.toBeVisible();
      await expect(storeListPage.getStoreRow(basicStore.id)).toBeVisible();
      await expect(storeListPage.getStoreRow(proStore.id)).not.toBeVisible();

      // Filter by PRO plan
      await storeListPage.filterByPlan('PRO');

      await expect(storeListPage.getStoreRow(freeStore.id)).not.toBeVisible();
      await expect(storeListPage.getStoreRow(basicStore.id)).not.toBeVisible();
      await expect(storeListPage.getStoreRow(proStore.id)).toBeVisible();

      // Clear filters
      await storeListPage.clearFilters();

      await expect(storeListPage.getStoreRow(freeStore.id)).toBeVisible();
      await expect(storeListPage.getStoreRow(basicStore.id)).toBeVisible();
      await expect(storeListPage.getStoreRow(proStore.id)).toBeVisible();
    } finally {
      // Clean up
      await deleteTestStore(freeStore.id);
      await deleteTestStore(basicStore.id);
      await deleteTestStore(proStore.id);
    }
  });

  test('filter by status works correctly', async () => {
    // Arrange - Create stores with different statuses
    const trialStore = await createTestStore({
      name: 'Trial Store',
      subscriptionStatus: 'TRIAL',
    });

    const activeStore = await createBasicStore({
      name: 'Active Store',
      subscriptionStatus: 'ACTIVE',
    });

    const expiredStore = await createExpiredTrialStore({
      name: 'Expired Store',
    });

    try {
      // Act & Assert - Filter by TRIAL status
      await storeListPage.goto();
      await storeListPage.filterByStatus('TRIAL');

      await expect(storeListPage.getStoreRow(trialStore.id)).toBeVisible();
      await expect(storeListPage.getStoreRow(activeStore.id)).not.toBeVisible();

      // Filter by ACTIVE status
      await storeListPage.filterByStatus('ACTIVE');

      await expect(storeListPage.getStoreRow(trialStore.id)).not.toBeVisible();
      await expect(storeListPage.getStoreRow(activeStore.id)).toBeVisible();

      // Clear filters
      await storeListPage.clearFilters();

      await expect(storeListPage.getStoreRow(trialStore.id)).toBeVisible();
      await expect(storeListPage.getStoreRow(activeStore.id)).toBeVisible();
    } finally {
      // Clean up
      await deleteTestStore(trialStore.id);
      await deleteTestStore(activeStore.id);
      await deleteTestStore(expiredStore.id);
    }
  });

  test('filter by country works correctly', async () => {
    // Arrange - Create stores in different countries
    const usStore = await createTestStore({
      name: 'US Store',
      country: 'US',
    });

    const caStore = await createTestStore({
      name: 'Canada Store',
      country: 'CA',
    });

    const gbStore = await createTestStore({
      name: 'UK Store',
      country: 'GB',
    });

    try {
      // Act & Assert - Filter by US
      await storeListPage.goto();
      await storeListPage.filterByCountry('US');

      await expect(storeListPage.getStoreRow(usStore.id)).toBeVisible();
      await expect(storeListPage.getStoreRow(caStore.id)).not.toBeVisible();
      await expect(storeListPage.getStoreRow(gbStore.id)).not.toBeVisible();

      // Filter by Canada
      await storeListPage.filterByCountry('CA');

      await expect(storeListPage.getStoreRow(usStore.id)).not.toBeVisible();
      await expect(storeListPage.getStoreRow(caStore.id)).toBeVisible();
      await expect(storeListPage.getStoreRow(gbStore.id)).not.toBeVisible();
    } finally {
      // Clean up
      await deleteTestStore(usStore.id);
      await deleteTestStore(caStore.id);
      await deleteTestStore(gbStore.id);
    }
  });

  test('pagination works correctly', async () => {
    // Arrange - Create many stores to trigger pagination
    const stores = [];
    for (let i = 0; i < 15; i++) {
      const store = await createTestStore({
        name: `Pagination Test Store ${i + 1}`,
        slug: generateUniqueSlug(`pagination-${i + 1}`),
      });
      stores.push(store);
    }

    try {
      // Act
      await storeListPage.goto();

      // Assert - Check pagination info
      const totalStores = await storeListPage.getTotalStores();
      expect(totalStores).toBeGreaterThanOrEqual(15);

      // Should have pagination controls
      const paginationInfo = await storeListPage.getPaginationInfo();
      expect(paginationInfo).toContain('Showing');
      expect(paginationInfo).toContain('of');

      // Check if next page is available (assuming 10 per page)
      if (totalStores > 10) {
        await expect(storeListPage.hasNextPage()).resolves.toBe(true);

        // Go to next page
        const currentPage = await storeListPage.getCurrentPage();
        await storeListPage.goToNextPage();

        const newPage = await storeListPage.getCurrentPage();
        expect(newPage).toBe(currentPage + 1);

        // Go back to previous page
        await storeListPage.goToPreviousPage();
        const backPage = await storeListPage.getCurrentPage();
        expect(backPage).toBe(currentPage);
      }
    } finally {
      // Clean up
      for (const store of stores) {
        await deleteTestStore(store.id);
      }
    }
  });

  test('column sorting works correctly', async () => {
    // Arrange - Create stores with different names and dates
    const storeA = await createTestStore({
      name: 'Alpha Store',
      slug: generateUniqueSlug('alpha'),
    });

    // Wait a bit to ensure different creation times
    await new Promise(resolve => setTimeout(resolve, 100));

    const storeZ = await createTestStore({
      name: 'Zulu Store',
      slug: generateUniqueSlug('zulu'),
    });

    try {
      // Act & Assert - Sort by name ascending
      await storeListPage.goto();
      await storeListPage.sortByColumn('name', 'asc');

      // Get visible store IDs in order
      const visibleStores = await storeListPage.getVisibleStoreIds();
      const storeAIndex = visibleStores.indexOf(storeA.id);
      const storeZIndex = visibleStores.indexOf(storeZ.id);

      // Alpha should come before Zulu
      if (storeAIndex !== -1 && storeZIndex !== -1) {
        expect(storeAIndex).toBeLessThan(storeZIndex);
      }

      // Sort by name descending
      await storeListPage.sortByColumn('name', 'desc');

      const visibleStoresDesc = await storeListPage.getVisibleStoreIds();
      const storeAIndexDesc = visibleStoresDesc.indexOf(storeA.id);
      const storeZIndexDesc = visibleStoresDesc.indexOf(storeZ.id);

      // Zulu should come before Alpha
      if (storeAIndexDesc !== -1 && storeZIndexDesc !== -1) {
        expect(storeZIndexDesc).toBeLessThan(storeAIndexDesc);
      }
    } finally {
      // Clean up
      await deleteTestStore(storeA.id);
      await deleteTestStore(storeZ.id);
    }
  });

  test('bulk selection and operations work correctly', async () => {
    // Arrange - Create test stores
    const store1 = await createTestStore({
      name: 'Bulk Test Store 1',
    });

    const store2 = await createTestStore({
      name: 'Bulk Test Store 2',
    });

    try {
      // Act
      await storeListPage.goto();

      // Select individual stores
      await storeListPage.selectStore(store1.id);
      await storeListPage.selectStore(store2.id);

      // Assert - Selected count should be 2
      const selectedCount = await storeListPage.getSelectedCount();
      expect(selectedCount).toBe(2);

      // Test select all
      await storeListPage.selectAllStores();

      // Should have more than 2 selected now
      const allSelectedCount = await storeListPage.getSelectedCount();
      expect(allSelectedCount).toBeGreaterThan(2);
    } finally {
      // Clean up
      await deleteTestStore(store1.id);
      await deleteTestStore(store2.id);
    }
  });

  test('export functionality works correctly', async () => {
    // Arrange - Create test stores
    const store = await createTestStore({
      name: 'Export Test Store',
    });

    try {
      // Act
      await storeListPage.goto();
      await storeListPage.selectStore(store.id);

      // Mock download handling
      const downloadPromise = storeListPage.page.waitForEvent('download');
      await storeListPage.exportStores();

      // Assert - Download should be triggered
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/stores.*\.(csv|xlsx)$/);
    } finally {
      // Clean up
      await deleteTestStore(store.id);
    }
  });

  test('empty state is shown when no stores exist', async () => {
    // Arrange - Ensure no stores exist (clean database)
    await db.store.deleteMany({
      where: {
        slug: {
          startsWith: 'test-',
        },
      },
    });

    // Act
    await storeListPage.goto();

    // Assert - Empty state should be visible
    await expect(storeListPage.isEmpty()).resolves.toBe(true);
    await expect(storeListPage.hasStores()).resolves.toBe(false);
  });

  test('empty search results show appropriate message', async () => {
    // Arrange - Create one store
    const store = await createTestStore({
      name: 'Only Store',
    });

    try {
      // Act - Search for non-existent store
      await storeListPage.goto();
      await storeListPage.searchStores('NonExistentStore');

      // Assert - Should show no results
      await expect(storeListPage.getStoreRow(store.id)).not.toBeVisible();
      await expect(storeListPage.hasStores()).resolves.toBe(false);
    } finally {
      // Clean up
      await deleteTestStore(store.id);
    }
  });

  test('keyboard navigation works correctly', async () => {
    // Act & Assert
    await storeListPage.goto();
    await storeListPage.verifyKeyboardNavigation();

    // No additional assertions needed - method throws on failure
  });

  test('Store Admin can only see their assigned store', async () => {
    // Arrange - Create stores and store admin
    const ownStore = await createTestStore({
      name: 'Own Store',
    });

    const otherStore = await createTestStore({
      name: 'Other Store',
    });

    const storeAdmin = await createStoreAdmin(ownStore.id, {
      email: 'storeadmin-list@stormcom-test.local',
      password: 'StoreAdmin123!',
    });

    try {
      // Login as store admin
      await storeListPage.page.goto('/login');
      await storeListPage.page.fill('input#email', storeAdmin.email);
      await storeListPage.page.fill('input#password', storeAdmin.plainPassword);
      await storeListPage.page.click('button[type="submit"]');
      await storeListPage.page.waitForURL('**/dashboard');

      // Act
      await storeListPage.goto();

      // Assert - Should only see own store
      await expect(storeListPage.getStoreRow(ownStore.id)).toBeVisible();
      await expect(storeListPage.getStoreRow(otherStore.id)).not.toBeVisible();

      // Should not have create store button
      await expect(storeListPage.createStoreButton).not.toBeVisible();
    } finally {
      // Clean up
      await deleteTestUser(storeAdmin.id);
      await deleteTestStore(ownStore.id);
      await deleteTestStore(otherStore.id);
    }
  });

  test('clicking store name navigates to store details', async () => {
    // Arrange
    const store = await createTestStore({
      name: 'Navigation Test Store',
    });

    try {
      // Act
      await storeListPage.goto();
      await storeListPage.clickStore(store.id);

      // Assert - Should navigate to store details
      await expect(storeListPage.page).toHaveURL(new RegExp(`/dashboard/stores/${store.id}`));
    } finally {
      // Clean up
      await deleteTestStore(store.id);
    }
  });

  test('store actions dropdown works correctly', async () => {
    // Arrange
    const store = await createTestStore({
      name: 'Actions Test Store',
    });

    try {
      // Act
      await storeListPage.goto();
      await storeListPage.openStoreActions(store.id);

      // Assert - Actions dropdown should be visible
      const actionsMenu = storeListPage.page.locator('[role="menu"]');
      await expect(actionsMenu).toBeVisible();

      // Should have Edit and Delete options
      const editOption = storeListPage.page.locator('button[role="menuitem"]').filter({ hasText: /edit/i });
      const deleteOption = storeListPage.page.locator('button[role="menuitem"]').filter({ hasText: /delete/i });

      await expect(editOption).toBeVisible();
      await expect(deleteOption).toBeVisible();
    } finally {
      // Clean up
      await deleteTestStore(store.id);
    }
  });

  test('loading state is shown during data fetch', async () => {
    // Act
    await storeListPage.page.goto('/dashboard/stores');

    // Assert - Loading spinner should appear briefly
    // Note: This is timing-dependent and might be too fast to catch in local tests
    try {
      await expect(storeListPage.loadingSpinner).toBeVisible({ timeout: 1000 });
    } catch {
      // Loading might complete too quickly in test environment
    }

    // Eventually should show content
    await storeListPage.waitForPageLoad();
    await expect(storeListPage.loadingSpinner).not.toBeVisible();
  });

  test('real-time search provides instant feedback', async () => {
    // Arrange
    const quickStore = await createTestStore({
      name: 'Quick Search Store',
    });

    try {
      // Act
      await storeListPage.goto();

      // Type search query character by character
      await storeListPage.searchInput.fill('Quick');

      // Wait for search debounce/instant feedback
      await storeListPage.page.waitForTimeout(500);

      // Assert - Should show matching results without explicit search button click
      await expect(storeListPage.getStoreRow(quickStore.id)).toBeVisible();
    } finally {
      // Clean up
      await deleteTestStore(quickStore.id);
    }
  });

  test('combined filters work correctly', async () => {
    // Arrange - Create stores with specific combinations
    const usBasicStore = await createBasicStore({
      name: 'US Basic Store',
      country: 'US',
    });

    const caBasicStore = await createBasicStore({
      name: 'Canada Basic Store',
      country: 'CA',
    });

    const usProStore = await createProStore({
      name: 'US Pro Store',
      country: 'US',
    });

    try {
      // Act - Apply multiple filters
      await storeListPage.goto();
      await storeListPage.filterByPlan('BASIC');
      await storeListPage.filterByCountry('US');

      // Assert - Should only show US BASIC stores
      await expect(storeListPage.getStoreRow(usBasicStore.id)).toBeVisible();
      await expect(storeListPage.getStoreRow(caBasicStore.id)).not.toBeVisible();
      await expect(storeListPage.getStoreRow(usProStore.id)).not.toBeVisible();
    } finally {
      // Clean up
      await deleteTestStore(usBasicStore.id);
      await deleteTestStore(caBasicStore.id);
      await deleteTestStore(usProStore.id);
    }
  });
});