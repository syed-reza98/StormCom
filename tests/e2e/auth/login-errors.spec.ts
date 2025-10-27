/**
 * E2E Test: Login Errors
 * 
 * Task: T061
 * Tests incorrect password error handling, error messages,
 * and failed attempt logging using LoginPage POM.
 * 
 * Test Coverage:
 * - Incorrect password shows error message
 * - Valid email + wrong password error message
 * - Failed login attempts logged to database
 * - Failed login audit log entries
 * - Generic error message (no user enumeration)
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { db } from '../../../src/lib/db';
import { createSuperAdmin, deleteTestUser } from '../fixtures/users';

test.describe('Login Errors', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('Incorrect password shows error message', async () => {
    // Arrange
    const user = await createSuperAdmin({
      email: 'incorrect-password-test@stormcom-test.local',
      password: 'CorrectPassword123!',
    });

    try {
      // Act - Login with wrong password
      await loginPage.login(user.email, 'WrongPassword123!');

      // Wait for error
      await loginPage.page.waitForTimeout(1000);

      // Assert - Should show error alert
      const hasError = await loginPage.hasErrorAlert();
      expect(hasError).toBe(true);

      const errorText = await loginPage.getErrorAlertText();
      expect(errorText).toMatch(/invalid.*email.*password|incorrect.*credentials/i);

      // Should not redirect to dashboard
      await expect(loginPage.page).toHaveURL(/\/login/);

      // Failed attempt should be logged
      const updatedUser = await db.user.findUnique({
        where: { id: user.id },
        select: { failedLoginAttempts: true },
      });
      expect(updatedUser?.failedLoginAttempts).toBeGreaterThanOrEqual(1);
    } finally {
      // Clean up
      await deleteTestUser(user.id);
    }
  });

  test('Failed login attempt is logged to audit log', async () => {
    // Arrange
    const user = await createSuperAdmin({
      email: 'audit-log-test@stormcom-test.local',
      password: 'CorrectPassword123!',
    });

    try {
      // Act - Attempt failed login
      await loginPage.login(user.email, 'WrongPassword!');
      await loginPage.page.waitForTimeout(1000);

      // Assert - Audit log should contain failed login entry
      const auditLog = await db.auditLog.findFirst({
        where: {
          userId: user.id,
          action: 'LOGIN_FAILED',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog?.action).toBe('LOGIN_FAILED');
      expect(auditLog?.details).toMatchObject({
        email: user.email,
        reason: expect.stringMatching(/password|credentials/i),
      });
    } finally {
      // Clean up
      await deleteTestUser(user.id);
    }
  });

  test('Non-existent email shows generic error (no user enumeration)', async () => {
    // Act - Try to login with email that doesn't exist
    await loginPage.login('nonexistent@example.com', 'SomePassword123!');
    await loginPage.page.waitForTimeout(1000);

    // Assert - Should show same generic error as wrong password
    const hasError = await loginPage.hasErrorAlert();
    expect(hasError).toBe(true);

    const errorText = await loginPage.getErrorAlertText();
    // Should NOT say "user not found" or "email doesn't exist"
    expect(errorText).not.toMatch(/user.*not.*found|email.*not.*exist|no.*account/i);
    
    // Should show generic credentials error
    expect(errorText).toMatch(/invalid.*email.*password|incorrect.*credentials/i);
  });

  test('Failed attempts counter increments correctly', async () => {
    // Arrange
    const user = await createSuperAdmin({
      email: 'counter-increment-test@stormcom-test.local',
      password: 'CorrectPassword123!',
    });

    try {
      // Act - Attempt 3 failed logins
      for (let i = 1; i <= 3; i++) {
        await loginPage.login(user.email, `WrongPassword${i}!`);
        await loginPage.page.waitForTimeout(500);

        // Check counter
        const userCheck = await db.user.findUnique({
          where: { id: user.id },
          select: { failedLoginAttempts: true },
        });

        expect(userCheck?.failedLoginAttempts).toBe(i);

        if (i < 3) await loginPage.goto();
      }
    } finally {
      // Clean up
      await deleteTestUser(user.id);
    }
  });

  test('Error message is accessible to screen readers', async () => {
    // Arrange
    const user = await createSuperAdmin({
      email: 'accessibility-error-test@stormcom-test.local',
      password: 'CorrectPassword123!',
    });

    try {
      // Act
      await loginPage.login(user.email, 'WrongPassword!');
      await loginPage.page.waitForTimeout(1000);

      // Assert - Error alert should have role="alert"
      const errorAlert = loginPage.errorAlert;
      await expect(errorAlert).toBeVisible();

      const role = await errorAlert.getAttribute('role');
      expect(role).toBe('alert');

      // Should be announced to screen readers immediately
      const ariaLive = await errorAlert.getAttribute('aria-live');
      expect(ariaLive).toMatch(/assertive|polite/);
    } finally {
      // Clean up
      await deleteTestUser(user.id);
    }
  });

  test('Empty email and password show field-specific errors', async () => {
    // Act - Submit empty form
    await loginPage.submit();
    await loginPage.page.waitForTimeout(500);

    // Assert - Should show errors for both fields
    expect(await loginPage.hasEmailError()).toBe(true);
    expect(await loginPage.hasPasswordError()).toBe(true);

    // Email error should mention email
    const emailError = await loginPage.getEmailErrorText();
    expect(emailError).toMatch(/email|required/i);

    // Password error should mention password
    const passwordError = await loginPage.getPasswordErrorText();
    expect(passwordError).toMatch(/password|required/i);
  });

  test('Failed login does not reveal account status', async () => {
    // Arrange - Create inactive user
    const user = await createSuperAdmin({
      email: 'inactive-user-test@stormcom-test.local',
      password: 'Password123!',
    });

    try {
      // Set user to INACTIVE
      await db.user.update({
        where: { id: user.id },
        data: { status: 'INACTIVE' },
      });

      // Act - Try to login with correct password
      await loginPage.login(user.email, user.plainPassword);
      await loginPage.page.waitForTimeout(1000);

      // Assert - Should show generic error, not "account inactive"
      const errorText = await loginPage.getErrorAlertText();
      
      // Should use generic message
      expect(errorText).toMatch(/invalid.*email.*password|incorrect.*credentials/i);
      
      // Should NOT reveal account status
      expect(errorText).not.toMatch(/inactive|disabled|suspended/i);
    } finally {
      // Clean up
      await deleteTestUser(user.id);
    }
  });

  test('Login error persists after page reload', async () => {
    // Arrange
    const user = await createSuperAdmin({
      email: 'error-persist-test@stormcom-test.local',
      password: 'CorrectPassword123!',
    });

    try {
      // Act - Fail login
      await loginPage.login(user.email, 'WrongPassword!');
      await loginPage.page.waitForTimeout(500);

      // Verify error shown
      expect(await loginPage.hasErrorAlert()).toBe(true);

      // Reload page
      await loginPage.goto();

      // Assert - Failed attempts should persist in database
      const userCheck = await db.user.findUnique({
        where: { id: user.id },
        select: { failedLoginAttempts: true },
      });
      expect(userCheck?.failedLoginAttempts).toBeGreaterThanOrEqual(1);
    } finally {
      // Clean up
      await deleteTestUser(user.id);
    }
  });
});
