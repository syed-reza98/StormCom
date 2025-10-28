import { test, expect, Page, BrowserContext } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { SettingsPage } from '../pages/SettingsPage';

/**
 * E2E Tests: Password Change Session Invalidation
 * 
 * Task: T070 [US0] Create E2E test "Password change invalidates all sessions"
 * 
 * Purpose: Verify that when a user changes their password, all existing 
 * sessions are invalidated within 60 seconds for security purposes.
 * 
 * Requirements:
 * - Password change invalidates ALL user sessions across devices/browsers
 * - Session invalidation occurs within 60 seconds of password change
 * - User must re-authenticate with new password after change
 * - Other sessions receive proper termination notification
 * - Current session (where password was changed) remains valid temporarily
 * - Security audit logging for session termination events
 * 
 * User Story: US0 Authentication
 * Security Feature: Session invalidation on credential changes
 * Acceptance Criteria:
 * - User changes password in settings
 * - All other sessions become invalid within 60 seconds
 * - Affected sessions redirect to login with termination message
 * - New password required for re-authentication
 * - Session termination events logged for security audit
 */

test.describe('Password Change Session Invalidation - T070', () => {
  let primaryPage: Page;
  let secondaryPage: Page;
  let primaryContext: BrowserContext;
  let secondaryContext: BrowserContext;
  let loginPagePrimary: LoginPage;
  let loginPageSecondary: LoginPage;
  let settingsPagePrimary: SettingsPage;

  // Test data
  const testUser = {
    email: 'user@stormcom.dev',
    currentPassword: 'OldPassword123!@#',
    newPassword: 'NewPassword456$%^',
    role: 'STORE_ADMIN',
    storeId: 'store-001'
  };

  test.beforeEach(async ({ browser }) => {
    // Create two separate browser contexts to simulate different devices/sessions
    primaryContext = await browser.newContext();
    secondaryContext = await browser.newContext();

    primaryPage = await primaryContext.newPage();
    secondaryPage = await secondaryContext.newPage();

    loginPagePrimary = new LoginPage(primaryPage);
    loginPageSecondary = new LoginPage(secondaryPage);
    settingsPagePrimary = new SettingsPage(primaryPage);

    // Setup: Login user in both contexts to create multiple sessions
    await loginPagePrimary.goto();
    await loginPagePrimary.login(testUser.email, testUser.currentPassword);
    await primaryPage.waitForURL(/\/dashboard/);

    await loginPageSecondary.goto();
    await loginPageSecondary.login(testUser.email, testUser.currentPassword);
    await secondaryPage.waitForURL(/\/dashboard/);
  });

  test.afterEach(async () => {
    // Cleanup: Close contexts and reset password if needed
    await primaryContext.close();
    await secondaryContext.close();
  });

  test('Password change invalidates secondary sessions within 60 seconds', async () => {
    // Arrange: Verify both sessions are active
    await expect(primaryPage.locator('h1')).toBeVisible();
    await expect(secondaryPage.locator('h1')).toBeVisible();

    // Verify both pages can access protected content
    expect(primaryPage.url()).toMatch(/\/dashboard/);
    expect(secondaryPage.url()).toMatch(/\/dashboard/);

    // Act: Change password in primary session
    await settingsPagePrimary.goto();
    await settingsPagePrimary.waitForLoad();
    await settingsPagePrimary.changePassword(
      testUser.currentPassword,
      testUser.newPassword
    );

    // Wait for password change confirmation
    await settingsPagePrimary.waitForPasswordChangeSuccess();

    // Start monitoring secondary session for invalidation
    const startTime = Date.now();

    // Act: Check secondary session is invalidated within 60 seconds
    let sessionInvalidated = false;
    const maxWaitTime = 60000; // 60 seconds
    const checkInterval = 2000; // Check every 2 seconds

    while (Date.now() - startTime < maxWaitTime && !sessionInvalidated) {
      try {
        // Try to access protected content in secondary session
        await secondaryPage.goto('/dashboard');
        await secondaryPage.waitForTimeout(checkInterval);

        const currentUrl = secondaryPage.url();
        if (currentUrl.includes('/login')) {
          sessionInvalidated = true;
          break;
        }

        // Check for session termination message
        const terminationMessage = secondaryPage.locator('text=/session.*terminated|logged.*out|password.*changed/i');
        if (await terminationMessage.isVisible()) {
          sessionInvalidated = true;
          break;
        }

      } catch (error) {
        // Page navigation failed, likely due to session invalidation
        sessionInvalidated = true;
        break;
      }
    }

    // Assert: Secondary session should be invalidated within 60 seconds
    expect(sessionInvalidated).toBe(true);

    const elapsedTime = Date.now() - startTime;
    expect(elapsedTime).toBeLessThan(maxWaitTime);

    // Verify secondary session redirected to login
    expect(secondaryPage.url()).toMatch(/\/login/);
  });

  test('Session termination shows proper notification message', async () => {
    // Arrange: Change password in primary session
    await settingsPagePrimary.goto();
    await settingsPagePrimary.changePassword(
      testUser.currentPassword,
      testUser.newPassword
    );
    await settingsPagePrimary.waitForPasswordChangeSuccess();

    // Act: Wait for secondary session termination
    await secondaryPage.waitForTimeout(5000); // Wait for termination signal

    // Try to access protected content to trigger termination message
    await secondaryPage.goto('/dashboard');
    await secondaryPage.waitForTimeout(2000);

    // Assert: Verify proper termination message
    expect(secondaryPage.url()).toMatch(/\/login/);

    // Check for session termination notification
    const terminationMessages = [
      'session.*terminated',
      'password.*changed',
      'logged.*out.*security',
      'session.*invalidated',
      'authentication.*expired'
    ];

    let messageFound = false;
    for (const messagePattern of terminationMessages) {
      const messageElement = secondaryPage.locator(`text=/${messagePattern}/i`);
      if (await messageElement.isVisible()) {
        messageFound = true;
        break;
      }
    }

    expect(messageFound).toBe(true);
  });

  test('Primary session remains valid after password change', async () => {
    // Act: Change password in primary session
    await settingsPagePrimary.goto();
    await settingsPagePrimary.changePassword(
      testUser.currentPassword,
      testUser.newPassword
    );
    await settingsPagePrimary.waitForPasswordChangeSuccess();

    // Assert: Primary session should remain valid temporarily
    await primaryPage.goto('/dashboard');
    await primaryPage.waitForTimeout(1000);

    // Primary session should still work (where password was changed)
    expect(primaryPage.url()).toMatch(/\/dashboard/);
    
    // Verify user can navigate to other protected pages
    await primaryPage.goto('/products');
    await primaryPage.waitForTimeout(1000);
    expect(primaryPage.url()).toMatch(/\/products/);

    // Primary session should work for a reasonable time after password change
    await primaryPage.goto('/settings');
    await settingsPagePrimary.waitForLoad();
    await expect(settingsPagePrimary.pageTitle).toBeVisible();
  });

  test('Re-authentication required with new password after session termination', async () => {
    // Arrange: Change password in primary session
    await settingsPagePrimary.goto();
    await settingsPagePrimary.changePassword(
      testUser.currentPassword,
      testUser.newPassword
    );
    await settingsPagePrimary.waitForPasswordChangeSuccess();

    // Wait for secondary session termination
    await secondaryPage.waitForTimeout(10000);
    await secondaryPage.goto('/dashboard');
    await secondaryPage.waitForTimeout(1000);

    // Assert: Secondary session should be redirected to login
    expect(secondaryPage.url()).toMatch(/\/login/);

    // Act: Try to login with old password (should fail)
    await loginPageSecondary.clearForm();
    await loginPageSecondary.fillEmail(testUser.email);
    await loginPageSecondary.fillPassword(testUser.currentPassword);
    await loginPageSecondary.clickSubmit();

    await loginPageSecondary.waitForError();
    const errorMessage = await loginPageSecondary.getErrorMessage();
    expect(errorMessage).toMatch(/invalid.*credentials|password.*incorrect/i);

    // Act: Login with new password (should succeed)
    await loginPageSecondary.clearForm();
    await loginPageSecondary.login(testUser.email, testUser.newPassword);

    // Assert: Should successfully authenticate with new password
    await secondaryPage.waitForURL(/\/dashboard/, { timeout: 10000 });
    expect(secondaryPage.url()).toMatch(/\/dashboard/);
  });

  test('Multiple sessions terminated simultaneously', async () => {
    // Arrange: Create third session
    const thirdContext = await primaryPage.context().browser()?.newContext();
    if (!thirdContext) {
      test.skip(true, 'Could not create third browser context');
      return;
    }
    
    const thirdPage = await thirdContext!.newPage();
    const loginPageThird = new LoginPage(thirdPage);

    await loginPageThird.goto();
    await loginPageThird.login(testUser.email, testUser.currentPassword);
    await thirdPage.waitForURL(/\/dashboard/);

    // Verify all three sessions are active
    expect(primaryPage.url()).toMatch(/\/dashboard/);
    expect(secondaryPage.url()).toMatch(/\/dashboard/);
    expect(thirdPage.url()).toMatch(/\/dashboard/);

    // Act: Change password in primary session
    await settingsPagePrimary.goto();
    await settingsPagePrimary.changePassword(
      testUser.currentPassword,
      testUser.newPassword
    );
    await settingsPagePrimary.waitForPasswordChangeSuccess();

    // Wait for session termination propagation
    await primaryPage.waitForTimeout(15000);

    // Act: Check all secondary sessions are terminated
    await secondaryPage.goto('/dashboard');
    await thirdPage.goto('/dashboard');
    await primaryPage.waitForTimeout(2000);

    // Assert: Both secondary sessions should be invalidated
    expect(secondaryPage.url()).toMatch(/\/login/);
    expect(thirdPage.url()).toMatch(/\/login/);

    // Primary session should still work
    await primaryPage.goto('/dashboard');
    expect(primaryPage.url()).toMatch(/\/dashboard/);

    // Cleanup
    await thirdContext!.close();
  });

  test('Session invalidation works across different user agents', async () => {
    // Arrange: Create session with different user agent
    const mobileContext = await primaryPage.context().browser()?.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
    });
    
    if (!mobileContext) {
      test.skip(true, 'Could not create mobile browser context');
      return;
    }

    const mobilePage = await mobileContext!.newPage();
    const loginPageMobile = new LoginPage(mobilePage);

    await loginPageMobile.goto();
    await loginPageMobile.login(testUser.email, testUser.currentPassword);
    await mobilePage.waitForURL(/\/dashboard/);

    // Act: Change password in desktop session
    await settingsPagePrimary.goto();
    await settingsPagePrimary.changePassword(
      testUser.currentPassword,
      testUser.newPassword
    );
    await settingsPagePrimary.waitForPasswordChangeSuccess();

    // Wait for termination
    await mobilePage.waitForTimeout(10000);

    // Act: Check mobile session is terminated
    await mobilePage.goto('/dashboard');
    await mobilePage.waitForTimeout(2000);

    // Assert: Mobile session should be invalidated
    expect(mobilePage.url()).toMatch(/\/login/);

    // Cleanup
    await mobileContext!.close();
  });

  test('Session termination notification is accessible', async () => {
    // Arrange: Change password and wait for secondary session termination
    await settingsPagePrimary.goto();
    await settingsPagePrimary.changePassword(
      testUser.currentPassword,
      testUser.newPassword
    );
    await settingsPagePrimary.waitForPasswordChangeSuccess();

    await secondaryPage.waitForTimeout(10000);
    await secondaryPage.goto('/dashboard');
    await secondaryPage.waitForTimeout(2000);

    // Assert: Check accessibility of termination message
    expect(secondaryPage.url()).toMatch(/\/login/);

    // Verify termination message has proper ARIA attributes
    const terminationMessage = secondaryPage.locator('[data-testid="session-terminated-message"]');
    if (await terminationMessage.isVisible()) {
      await expect(terminationMessage).toHaveAttribute('role', 'alert');
      await expect(terminationMessage).toHaveAttribute('aria-live');
    }

    // Check for general alert messages about session termination
    const alertElements = secondaryPage.locator('[role="alert"]');
    const alertCount = await alertElements.count();
    expect(alertCount).toBeGreaterThan(0);

    // Verify keyboard navigation works
    await secondaryPage.keyboard.press('Tab');
    const focusedElement = await secondaryPage.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A']).toContain(focusedElement);
  });

  test('Password change with invalid current password fails gracefully', async () => {
    // Act: Try to change password with wrong current password
    await settingsPagePrimary.goto();
    await settingsPagePrimary.navigateToPasswordTab();

    await settingsPagePrimary.currentPasswordInput.fill('WrongCurrentPassword');
    await settingsPagePrimary.newPasswordInput.fill(testUser.newPassword);
    await settingsPagePrimary.confirmPasswordInput.fill(testUser.newPassword);
    await settingsPagePrimary.changePasswordButton.click();

    // Assert: Should show error for incorrect current password
    const errorMessage = await settingsPagePrimary.waitForPasswordChangeError();
    expect(errorMessage).toMatch(/current.*password.*incorrect|invalid.*password/i);

    // Verify no sessions are terminated
    await secondaryPage.goto('/dashboard');
    await secondaryPage.waitForTimeout(2000);
    expect(secondaryPage.url()).toMatch(/\/dashboard/);

    // Verify secondary session is still active
    await expect(secondaryPage.locator('h1')).toBeVisible();
  });

  test('Session invalidation timing is consistent', async () => {
    // Track timing of session invalidation
    const timingTests = [];

    for (let i = 0; i < 3; i++) {
      // Reset password for each test iteration
      const testPassword = `TestPassword${i}123!@#`;
      
      if (i > 0) {
        // Reset to known password
        await settingsPagePrimary.goto();
        await settingsPagePrimary.changePassword(testUser.newPassword, testPassword);
        await settingsPagePrimary.waitForPasswordChangeSuccess();
        testUser.currentPassword = testPassword;
      }

      // Measure invalidation timing
      const startTime = Date.now();
      
      await settingsPagePrimary.goto();
      await settingsPagePrimary.changePassword(testUser.currentPassword, testUser.newPassword);
      await settingsPagePrimary.waitForPasswordChangeSuccess();

      // Monitor secondary session for invalidation
      let invalidated = false;
      while (Date.now() - startTime < 60000 && !invalidated) {
        await secondaryPage.goto('/dashboard');
        await secondaryPage.waitForTimeout(1000);
        
        if (secondaryPage.url().includes('/login')) {
          invalidated = true;
          break;
        }
        
        await primaryPage.waitForTimeout(2000);
      }

      const elapsedTime = Date.now() - startTime;
      timingTests.push(elapsedTime);
      
      expect(invalidated).toBe(true);
      expect(elapsedTime).toBeLessThan(60000);

      testUser.currentPassword = testUser.newPassword;
    }

    // Verify timing consistency (all within reasonable range)
    const avgTime = timingTests.reduce((a, b) => a + b, 0) / timingTests.length;
    expect(avgTime).toBeLessThan(30000); // Average should be well under 60 seconds

    // No timing should exceed 60 seconds
    timingTests.forEach(time => {
      expect(time).toBeLessThan(60000);
    });
  });
});