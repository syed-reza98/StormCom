/**
 * E2E Test: Cross-Tenant Access
 * 
 * Task: T064
 * Tests Super Admin accessing all stores and cross-store data visibility
 * using DashboardPage POM.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { createSuperAdmin, deleteTestUser } from '../fixtures/users';
import { createTestStore, deleteTestStore } from '../fixtures/stores';

test.describe('Cross-Tenant Access', () => {
  test('Super Admin can access all stores', async ({ page }) => {
    // Arrange - Create multiple stores
    const store1 = await createTestStore({ name: 'Store Alpha' });
    const store2 = await createTestStore({ name: 'Store Beta' });
    const store3 = await createTestStore({ name: 'Store Gamma' });
    
    const superAdmin = await createSuperAdmin({
      email: 'superadmin-cross-tenant@stormcom-test.local',
      password: 'SuperAdmin123!',
    });

    try {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      // Act - Login as Super Admin
      await loginPage.goto();
      await loginPage.login(superAdmin.email, superAdmin.plainPassword);
      await loginPage.waitForSuccessfulLogin('/dashboard');

      // Assert - Should have store selector
      await dashboardPage.waitForPageLoad();
      const hasStoreSelector = await dashboardPage.hasStoreSelector();
      expect(hasStoreSelector).toBe(true);

      // Should see all stores in selector
      const availableStores = await dashboardPage.getAvailableStores();
      expect(availableStores.length).toBeGreaterThanOrEqual(3);
      expect(availableStores.some(s => s.includes('Alpha'))).toBe(true);
      expect(availableStores.some(s => s.includes('Beta'))).toBe(true);
      expect(availableStores.some(s => s.includes('Gamma'))).toBe(true);

      // Should be able to switch between stores
      await dashboardPage.selectStore(store1.id);
      await page.waitForTimeout(500);
      let currentStore = await dashboardPage.getCurrentStore();
      expect(currentStore).toContain('Alpha');

      await dashboardPage.selectStore(store2.id);
      await page.waitForTimeout(500);
      currentStore = await dashboardPage.getCurrentStore();
      expect(currentStore).toContain('Beta');

      // Should have Stores link (Super Admin only)
      const hasStoresLink = await dashboardPage.hasStoresLink();
      expect(hasStoresLink).toBe(true);
    } finally {
      await deleteTestUser(superAdmin.id);
      await deleteTestStore(store1.id);
      await deleteTestStore(store2.id);
      await deleteTestStore(store3.id);
    }
  });

  test('Super Admin can view cross-store data', async ({ page }) => {
    // Arrange
    const store1 = await createTestStore({ name: 'Store One' });
    const store2 = await createTestStore({ name: 'Store Two' });
    
    const superAdmin = await createSuperAdmin({
      email: 'superadmin-data-view@stormcom-test.local',
      password: 'SuperAdmin456!',
    });

    try {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      await loginPage.goto();
      await loginPage.login(superAdmin.email, superAdmin.plainPassword);
      await loginPage.waitForSuccessfulLogin('/dashboard');

      // Navigate to Stores page
      await dashboardPage.navigateToStores();

      // Should see all stores listed
      const storesList = await page.locator('[data-testid="store-row"]').count();
      expect(storesList).toBeGreaterThanOrEqual(2);

      // Should see Store One
      const hasStore1 = await page.locator('text=Store One').isVisible();
      expect(hasStore1).toBe(true);

      // Should see Store Two
      const hasStore2 = await page.locator('text=Store Two').isVisible();
      expect(hasStore2).toBe(true);
    } finally {
      await deleteTestUser(superAdmin.id);
      await deleteTestStore(store1.id);
      await deleteTestStore(store2.id);
    }
  });
});
