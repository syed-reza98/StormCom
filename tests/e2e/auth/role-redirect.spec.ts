/**
 * E2E Test: Role-Based Redirects
 * 
 * Task: T065
 * Tests Store Admin redirect to assigned store only and blocks other stores
 * using LoginPage and DashboardPage POMs.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { db } from '../../../src/lib/db';
import { createStoreAdmin, deleteTestUser } from '../fixtures/users';
import { createTestStore, deleteTestStore } from '../fixtures/stores';

test.describe('Role-Based Redirects', () => {
  test('Store Admin redirected to assigned store only', async ({ page }) => {
    // Arrange
    const store1 = await createTestStore({ name: 'Assigned Store' });
    const store2 = await createTestStore({ name: 'Other Store' });
    
    const storeAdmin = await createStoreAdmin(store1.id, {
      email: 'storeadmin-redirect@stormcom-test.local',
      password: 'StoreAdmin123!',
    });

    try {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      // Act - Login as Store Admin
      await loginPage.goto();
      await loginPage.login(storeAdmin.email, storeAdmin.plainPassword);
      await loginPage.waitForSuccessfulLogin('/dashboard');

      // Assert - Should be on dashboard for assigned store
      await dashboardPage.waitForPageLoad();
      
      // Should NOT have store selector (only one store)
      const hasStoreSelector = await dashboardPage.hasStoreSelector();
      expect(hasStoreSelector).toBe(false);

      // Current store should be Assigned Store
      const currentStore = await dashboardPage.getCurrentStore();
      expect(currentStore).toContain('Assigned Store');

      // Should NOT have Stores link (not Super Admin)
      const hasStoresLink = await dashboardPage.hasStoresLink();
      expect(hasStoresLink).toBe(false);
    } finally {
      await deleteTestUser(storeAdmin.id);
      await deleteTestStore(store1.id);
      await deleteTestStore(store2.id);
    }
  });

  test('Store Admin blocked from accessing other stores with 404', async ({ page }) => {
    // Arrange
    const store1 = await createTestStore({ name: 'Admin Store' });
    const store2 = await createTestStore({ name: 'Restricted Store' });
    
    const storeAdmin = await createStoreAdmin(store1.id, {
      email: 'storeadmin-blocked@stormcom-test.local',
      password: 'Blocked123!',
    });

    try {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      // Login as Store Admin for store1
      await loginPage.goto();
      await loginPage.login(storeAdmin.email, storeAdmin.plainPassword);
      await loginPage.waitForSuccessfulLogin('/dashboard');

      // Act - Try to access store2 dashboard directly
      await dashboardPage.goto(store2.id);

      // Assert - Should get 404 or redirect to assigned store
      await page.waitForTimeout(1000);
      
      const url = page.url();
      const is404 = await page.locator('h1:has-text("404")').isVisible().catch(() => false);
      const isForbidden = await page.locator('h1:has-text("403")').isVisible().catch(() => false);
      const redirectedBack = url.includes(store1.id) || !url.includes(store2.id);

      expect(is404 || isForbidden || redirectedBack).toBe(true);

      // Verify audit log for unauthorized access attempt
      const auditLog = await db.auditLog.findFirst({
        where: {
          userId: storeAdmin.id,
          action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog?.changes).toMatchObject({
        attemptedStoreId: store2.id,
        assignedStoreId: store1.id,
      });
    } finally {
      await deleteTestUser(storeAdmin.id);
      await deleteTestStore(store1.id);
      await deleteTestStore(store2.id);
    }
  });

  test('Store Admin cannot view stores list', async ({ page }) => {
    // Arrange
    const store = await createTestStore({ name: 'Single Store' });
    const storeAdmin = await createStoreAdmin(store.id, {
      email: 'storeadmin-no-list@stormcom-test.local',
      password: 'NoList123!',
    });

    try {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.login(storeAdmin.email, storeAdmin.plainPassword);
      await loginPage.waitForSuccessfulLogin('/dashboard');

      // Act - Try to access /stores directly
      await page.goto('/stores');
      await page.waitForTimeout(1000);

      // Assert - Should be blocked (403 or 404)
      const is404 = await page.locator('h1:has-text("404")').isVisible().catch(() => false);
      const is403 = await page.locator('h1:has-text("403")').isVisible().catch(() => false);
      const redirected = !page.url().includes('/stores');

      expect(is404 || is403 || redirected).toBe(true);
    } finally {
      await deleteTestUser(storeAdmin.id);
      await deleteTestStore(store.id);
    }
  });
});
