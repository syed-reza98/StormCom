/**
 * E2E Test: Password Reset
 * 
 * Task: T059
 * Tests password reset flow via email link, new password setting,
 * and 1-hour token expiry using ForgotPasswordPage and PasswordResetPage POMs.
 * 
 * Test Coverage:
 * - Password reset request with email
 * - Reset token generation
 * - Password reset via token link
 * - Token expiry after 1 hour
 * - Password history validation (no reuse)
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { PasswordResetPage } from '../pages/PasswordResetPage';
import { db } from '../../../src/lib/db';
import { createSuperAdmin, deleteTestUser } from '../fixtures/users';
import bcrypt from 'bcrypt';

test.describe('Password Reset', () => {
  test('User can request password reset and set new password', async ({ page }) => {
    // Arrange
    const user = await createSuperAdmin({
      email: 'password-reset-test@stormcom-test.local',
      password: 'OldPassword123!',
    });

    const loginPage = new LoginPage(page);

    try {
      // Act - Request password reset
      await loginPage.goto();
      await loginPage.clickForgotPassword();

      // Should be on forgot password page
      await expect(page).toHaveURL(/\/forgot-password/);

      // Enter email
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill(user.email);
      await page.locator('button[type="submit"]').click();

      // Wait for success message
      await page.waitForTimeout(1000);
      const successMessage = page.locator('text=/email.*sent/i');
      await expect(successMessage).toBeVisible();

      // Check database for reset token
      const userWithToken = await db.user.findUnique({
        where: { id: user.id },
        select: {
          resetToken: true,
          resetExpires: true,
        },
      });

      expect(userWithToken?.resetToken).not.toBeNull();
      expect(userWithToken?.resetExpires).not.toBeNull();

      // Simulate clicking email link
      const resetToken = userWithToken!.resetToken;
      const passwordResetPage = new PasswordResetPage(page);
      await passwordResetPage.gotoWithToken(resetToken!);

      // Assert - Reset page should load
      await passwordResetPage.waitForPageLoad();

      // Enter new password
      const newPassword = 'NewPassword456!';
      await passwordResetPage.fillNewPassword(newPassword, newPassword);
      await passwordResetPage.submit();

      // Wait for success
      await passwordResetPage.waitForSuccess();

      // Verify password was changed in database
      const updatedUser = await db.user.findUnique({
        where: { id: user.id },
        select: { password: true, resetToken: true },
      });

      const passwordMatches = await bcrypt.compare(newPassword, updatedUser!.password);
      expect(passwordMatches).toBe(true);
      expect(updatedUser?.resetToken).toBeNull(); // Token should be cleared

      // Try to login with new password
      await loginPage.goto();
      await loginPage.login(user.email, newPassword);
      await loginPage.waitForSuccessfulLogin('/dashboard');
      await expect(page).toHaveURL(/\/dashboard/);
    } finally {
      // Clean up
      await deleteTestUser(user.id);
    }
  });

  test('Password reset token expires after 1 hour', async ({ page }) => {
    // Arrange - Create user with expired reset token
    const user = await createSuperAdmin({
      email: 'expired-token-test@stormcom-test.local',
      password: 'Password123!',
    });

    try {
      // Set expired token (1 hour + 1 minute ago)
      const expiredToken = 'expired_token_123456789';
      await db.user.update({
        where: { id: user.id },
        data: {
          resetToken: expiredToken,
          resetExpires: new Date(Date.now() - 61 * 60 * 1000), // 61 minutes ago
        },
      });

      // Act - Try to use expired token
      const passwordResetPage = new PasswordResetPage(page);
      await passwordResetPage.gotoWithToken(expiredToken);

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Assert - Should show error about expired token
      const errorMessage = await passwordResetPage.getErrorMessage();
      expect(errorMessage).not.toBeNull();
      expect(errorMessage).toMatch(/expired|invalid/i);

      // Password input should not be visible (or disabled)
      const hasPasswordInput = await passwordResetPage.newPasswordInput.isVisible().catch(() => false);
      if (hasPasswordInput) {
        const isDisabled = await passwordResetPage.newPasswordInput.isDisabled();
        expect(isDisabled).toBe(true);
      }
    } finally {
      // Clean up
      await deleteTestUser(user.id);
    }
  });

  test('Password reset validates password strength', async ({ page }) => {
    // Arrange
    const user = await createSuperAdmin({
      email: 'weak-password-test@stormcom-test.local',
      password: 'OldPassword123!',
    });

    try {
      // Generate valid reset token
      const resetToken = `reset_${Date.now()}_test`;
      await db.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      // Act - Try to set weak password
      const passwordResetPage = new PasswordResetPage(page);
      await passwordResetPage.gotoWithToken(resetToken);
      await passwordResetPage.waitForPageLoad();

      // Enter weak password (no special char)
      await passwordResetPage.fillNewPassword('weakpassword', 'weakpassword');
      await passwordResetPage.submit();

      // Wait for validation error
      await page.waitForTimeout(500);

      // Assert - Should show validation error
      const hasError = await passwordResetPage.hasPasswordError();
      expect(hasError).toBe(true);

      const errorText = await passwordResetPage.getPasswordErrorText();
      expect(errorText).toMatch(/(uppercase|lowercase|digit|special|character|8 characters)/i);
    } finally {
      // Clean up
      await deleteTestUser(user.id);
    }
  });

  test('Cannot reuse recent password', async ({ page }) => {
    // Arrange
    const originalPassword = 'OriginalPassword123!';
    const user = await createSuperAdmin({
      email: 'password-reuse-test@stormcom-test.local',
      password: originalPassword,
    });

    try {
      // Store original password hash in password history
      const passwordHash = await bcrypt.hash(originalPassword, 12);
      await db.passwordHistory.create({
        data: {
          userId: user.id,
          hashedPassword: passwordHash,
        },
      });

      // Generate reset token
      const resetToken = `reset_${Date.now()}_test`;
      await db.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetExpires: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      // Act - Try to reuse same password
      const passwordResetPage = new PasswordResetPage(page);
      await passwordResetPage.gotoWithToken(resetToken);
      await passwordResetPage.waitForPageLoad();

      await passwordResetPage.fillNewPassword(originalPassword, originalPassword);
      await passwordResetPage.submit();

      // Wait for error
      await page.waitForTimeout(1000);

      // Assert - Should show error about password reuse
      const errorText = await passwordResetPage.getErrorMessage();
      expect(errorText).not.toBeNull();
      expect(errorText).toMatch(/(recently used|reuse|history)/i);
    } finally {
      // Clean up
      await deleteTestUser(user.id);
    }
  });

  test('Password confirmation must match', async ({ page }) => {
    // Arrange
    const user = await createSuperAdmin({
      email: 'password-mismatch-test@stormcom-test.local',
      password: 'OldPassword123!',
    });

    try {
      // Generate reset token
      const resetToken = `reset_${Date.now()}_test`;
      await db.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetExpires: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      // Act - Enter mismatched passwords
      const passwordResetPage = new PasswordResetPage(page);
      await passwordResetPage.gotoWithToken(resetToken);
      await passwordResetPage.waitForPageLoad();

      await passwordResetPage.fillNewPassword('NewPassword123!', 'DifferentPassword456!');
      await passwordResetPage.submit();

      // Wait for validation
      await page.waitForTimeout(500);

      // Assert - Should show error
      const hasError = await passwordResetPage.hasConfirmPasswordError();
      expect(hasError).toBe(true);

      const errorText = await passwordResetPage.getConfirmPasswordErrorText();
      expect(errorText).toMatch(/match/i);
    } finally {
      // Clean up
      await deleteTestUser(user.id);
    }
  });
});
