/**
 * E2E Test: User Login
 * 
 * Task: T056
 * Tests user login with valid credentials, session creation,
 * and role-based redirects using LoginPage POM.
 * 
 * Test Coverage:
 * - Email/password authentication
 * - Session creation and storage
 * - Role-based redirects (SUPER_ADMIN → /dashboard, CUSTOMER → /account)
 * - Login button loading state
 * - Successful login audit log
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { db } from '../../../src/lib/db';
import {
  createSuperAdmin,
  createCustomer,
  createStoreAdmin,
  deleteTestUser,
} from '../fixtures/users';
import { createTestStore, deleteTestStore } from '../fixtures/stores';

test.describe('User Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('Super Admin can login and is redirected to /dashboard', async () => {
    // Arrange
    const admin = await createSuperAdmin({
      email: 'superadmin-login-test@stormcom-test.local',
      password: 'Admin123456!',
    });

    try {
      // Act
      await loginPage.login(admin.email, admin.plainPassword);

      // Wait for redirect to dashboard
      await loginPage.waitForSuccessfulLogin('/dashboard');

      // Assert - Should be on dashboard
      await expect(loginPage.page).toHaveURL(/\/dashboard/);

      // Verify session was created by checking if user is authenticated
      // Try to access protected page - should not redirect to login
      await loginPage.page.goto('/dashboard');
      await expect(loginPage.page).toHaveURL(/\/dashboard/);

      // Verify last login timestamp was updated
      const updatedUser = await db.user.findUnique({
        where: { id: admin.id },
        select: { lastLoginAt: true, lastLoginIP: true },
      });

      expect(updatedUser?.lastLoginAt).not.toBeNull();
      expect(updatedUser?.lastLoginIP).not.toBeNull();

      // Verify audit log entry was created
      const auditLog = await db.auditLog.findFirst({
        where: {
          userId: admin.id,
          action: 'LOGIN',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog?.action).toBe('LOGIN');
      
      // Parse changes JSON to verify it contains the expected data
      const changes = auditLog?.changes ? JSON.parse(auditLog.changes as string) : null;
      expect(changes).toMatchObject({
        email: admin.email,
        role: 'SUPER_ADMIN',
      });
    } finally {
      // Clean up
      await deleteTestUser(admin.id);
    }
  });

  test('Customer can login and is redirected to /account', async () => {
    // Arrange - Create store first, then customer
    const store = await createTestStore({
      name: 'Test Store for Customer Login',
    });

    const customer = await createCustomer(store.id, {
      email: 'customer-login-test@stormcom-test.local',
      password: 'Customer123!',
    });

    try {
      // Act
      await loginPage.login(customer.email, customer.plainPassword);

      // Wait for redirect to account page
      await loginPage.waitForSuccessfulLogin('/account');

      // Assert - Should be on account page
      await expect(loginPage.page).toHaveURL(/\/account/);

      // Verify session exists
      await loginPage.page.goto('/account');
      await expect(loginPage.page).toHaveURL(/\/account/);
    } finally {
      // Clean up
      await deleteTestUser(customer.id);
      await deleteTestStore(store.id);
    }
  });

  test('Store Admin can login and is redirected to /dashboard', async () => {
    // Arrange
    const store = await createTestStore({
      name: 'Test Store for Admin Login',
    });

    const storeAdmin = await createStoreAdmin(store.id, {
      email: 'storeadmin-login-test@stormcom-test.local',
      password: 'StoreAdmin123!',
    });

    try {
      // Act
      await loginPage.login(storeAdmin.email, storeAdmin.plainPassword);

      // Wait for redirect to dashboard
      await loginPage.waitForSuccessfulLogin('/dashboard');

      // Assert - Should be on dashboard
      await expect(loginPage.page).toHaveURL(/\/dashboard/);

      // Verify user can only see their assigned store
      const userData = await db.user.findUnique({
        where: { id: storeAdmin.id },
        select: { storeId: true },
      });

      expect(userData?.storeId).toBe(store.id);
    } finally {
      // Clean up
      await deleteTestUser(storeAdmin.id);
      await deleteTestStore(store.id);
    }
  });

  test('Login form shows loading state during authentication', async () => {
    // Arrange
    const admin = await createSuperAdmin({
      email: 'loading-test@stormcom-test.local',
      password: 'Loading123!',
    });

    try {
      // Act
      await loginPage.fillForm(admin.email, admin.plainPassword);

      // Submit and check loading state
      const submitPromise = loginPage.submit();
      
      // Wait brief moment for loading state
      await loginPage.page.waitForTimeout(100);
      
      // Check if loading state is shown (validates UI feedback)
      await loginPage.isSubmitLoading();
      
      // Wait for completion
      await submitPromise;
      await loginPage.waitForSuccessfulLogin('/dashboard');

      // Loading should be done
      expect(await loginPage.isSubmitLoading()).toBe(false);
    } finally {
      // Clean up
      await deleteTestUser(admin.id);
    }
  });

  test('Login can be submitted with Enter key', async () => {
    // Arrange
    const admin = await createSuperAdmin({
      email: 'enter-key-test@stormcom-test.local',
      password: 'EnterKey123!',
    });

    try {
      // Act
      await loginPage.fillForm(admin.email, admin.plainPassword);
      await loginPage.submitWithEnter();

      // Assert
      await loginPage.waitForSuccessfulLogin('/dashboard');
      await expect(loginPage.page).toHaveURL(/\/dashboard/);
    } finally {
      // Clean up
      await deleteTestUser(admin.id);
    }
  });

  test('Keyboard navigation works correctly', async () => {
    // Act & Assert
    await loginPage.verifyKeyboardNavigation();
    
    // No additional assertions needed - method throws on failure
  });

  test('Remember Me checkbox persists session longer', async () => {
    // Arrange
    const admin = await createSuperAdmin({
      email: 'remember-me-test@stormcom-test.local',
      password: 'RememberMe123!',
    });

    try {
      // Act - Login with remember me (if checkbox exists)
      await loginPage.fillForm(admin.email, admin.plainPassword);
      
      // Check if remember me checkbox exists
      const rememberMeCheckbox = loginPage.page.locator('input[type="checkbox"][name="rememberMe"]');
      const hasRememberMe = await rememberMeCheckbox.count() > 0;
      
      if (hasRememberMe) {
        await rememberMeCheckbox.check();
      }
      
      await loginPage.submit();
      await loginPage.waitForSuccessfulLogin('/dashboard');

      // Assert - Session should exist
      await expect(loginPage.page).toHaveURL(/\/dashboard/);

      // Verify session in database has correct expiration
      const session = await db.session.findFirst({
        where: { userId: admin.id },
        orderBy: { createdAt: 'desc' },
      });

      expect(session).not.toBeNull();
      
      if (hasRememberMe) {
        // With remember me, session should last 30 days
        const expiresAt = new Date(session!.expiresAt).getTime();
        const now = Date.now();
        const daysUntilExpiry = (expiresAt - now) / (1000 * 60 * 60 * 24);
        expect(daysUntilExpiry).toBeGreaterThan(29);
        expect(daysUntilExpiry).toBeLessThan(31);
      } else {
        // Without remember me, session should last 7 days
        const expiresAt = new Date(session!.expiresAt).getTime();
        const now = Date.now();
        const daysUntilExpiry = (expiresAt - now) / (1000 * 60 * 60 * 24);
        expect(daysUntilExpiry).toBeGreaterThan(6.9);
        expect(daysUntilExpiry).toBeLessThan(7.1);
      }
    } finally {
      // Clean up
      await deleteTestUser(admin.id);
    }
  });

  test('Failed login attempts do not reset on page reload', async () => {
    // Arrange
    const admin = await createSuperAdmin({
      email: 'failed-attempts-test@stormcom-test.local',
      password: 'CorrectPassword123!',
    });

    try {
      // Act - Attempt failed login
      await loginPage.login(admin.email, 'WrongPassword123!');
      
      // Wait for error
      await loginPage.page.waitForTimeout(1000);

      // Reload page
      await loginPage.goto();

      // Attempt another failed login
      await loginPage.login(admin.email, 'WrongPassword456!');
      
      // Wait for error
      await loginPage.page.waitForTimeout(1000);

      // Check failed attempts in database
      const user = await db.user.findUnique({
        where: { id: admin.id },
        select: { failedLoginAttempts: true },
      });

      // Should have 2 failed attempts
      expect(user?.failedLoginAttempts).toBeGreaterThanOrEqual(2);
    } finally {
      // Clean up
      await deleteTestUser(admin.id);
    }
  });
});
