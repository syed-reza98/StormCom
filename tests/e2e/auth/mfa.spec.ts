/**
 * E2E Test: MFA Enrollment and Login
 * 
 * Task: T058
 * Tests MFA enrollment flow including QR code display, backup codes generation,
 * and TOTP code verification during login using MFAEnrollPage and MFAChallengePage POMs.
 * 
 * Test Coverage:
 * - MFA enrollment with QR code generation
 * - TOTP secret display and copying
 * - Backup codes generation (10 codes)
 * - TOTP code verification during enrollment
 * - MFA challenge during login
 * - TOTP code validation (6 digits)
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { MFAEnrollPage } from '../pages/MFAEnrollPage';
import { MFAChallengePage } from '../pages/MFAChallengePage';
import { db } from '../../../src/lib/db';
import { createSuperAdmin, deleteTestUser } from '../fixtures/users';
import * as OTPAuth from 'otpauth';

test.describe('MFA Enrollment and Login', () => {
  test('User can complete MFA enrollment with QR code and backup codes', async ({ page }) => {
    // Arrange
    const user = await createSuperAdmin({
      email: 'mfa-enroll-test@stormcom-test.local',
      password: 'MFATest123!',
      mfaEnabled: false,
    });

    const loginPage = new LoginPage(page);
    const mfaEnrollPage = new MFAEnrollPage(page);

    try {
      // Act - Login first
      await loginPage.goto();
      await loginPage.login(user.email, user.plainPassword);
      await loginPage.waitForSuccessfulLogin('/dashboard');

      // Navigate to MFA enrollment
      await mfaEnrollPage.goto();
      await mfaEnrollPage.waitForSetupReady();

      // Assert - QR code should be visible
      await expect(mfaEnrollPage.qrCodeImage).toBeVisible();
      await expect(mfaEnrollPage.secretCode).toBeVisible();

      // Get TOTP secret from page
      const secretText = await mfaEnrollPage.secretCode.textContent();
      expect(secretText).not.toBeNull();
      expect(secretText?.length).toBeGreaterThan(0);

      // Generate TOTP code from secret
      const totp = new OTPAuth.TOTP({
        issuer: 'StormCom',
        label: user.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: secretText!,
      });

      const totpCode = totp.generate();
      expect(totpCode).toHaveLength(6);

      // Enter verification code
      await mfaEnrollPage.codeInput.fill(totpCode);
      await mfaEnrollPage.submitButton.click();

      // Wait for success and backup codes
      await mfaEnrollPage.successHeading.waitFor({ state: 'visible', timeout: 10000 });

      // Assert - Backup codes should be displayed
      await expect(mfaEnrollPage.backupCodesWarning).toBeVisible();
      
      const backupCodeElements = await mfaEnrollPage.backupCodesDisplay.count();
      expect(backupCodeElements).toBe(10); // Should have 10 backup codes

      // Verify MFA enabled in database
      const updatedUser = await db.user.findUnique({
        where: { id: user.id },
        select: {
          mfaEnabled: true,
          totpSecret: true,
          backupCodes: true,
        },
      });

      expect(updatedUser?.mfaEnabled).toBe(true);
      expect(updatedUser?.totpSecret).not.toBeNull();
      expect(updatedUser?.backupCodes).toHaveLength(10);
    } finally {
      // Clean up
      await deleteTestUser(user.id);
    }
  });

  test('User with MFA enabled must complete MFA challenge during login', async ({ page }) => {
    // Arrange - Create user with MFA already enabled
    const totpSecret = 'JBSWY3DPEHPK3PXP'; // Test TOTP secret
    
    const user = await createSuperAdmin({
      email: 'mfa-login-test@stormcom-test.local',
      password: 'MFALogin123!',
      mfaEnabled: true,
      totpSecret,
    });

    const loginPage = new LoginPage(page);
    const mfaChallengePage = new MFAChallengePage(page);

    try {
      // Act - Login with email/password
      await loginPage.goto();
      await loginPage.login(user.email, user.plainPassword);

      // Should redirect to MFA challenge
      await loginPage.waitForMFARedirect();
      await expect(page).toHaveURL(/\/mfa\/challenge/);

      // Assert - MFA challenge page should be visible
      await expect(mfaChallengePage.heading).toBeVisible();
      await expect(mfaChallengePage.codeInput).toBeVisible();

      // Generate TOTP code
      const totp = new OTPAuth.TOTP({
        issuer: 'StormCom',
        label: user.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: totpSecret,
      });

      const totpCode = totp.generate();

      // Enter TOTP code
      await mfaChallengePage.codeInput.fill(totpCode);
      await mfaChallengePage.submitButton.click();

      // Should redirect to dashboard
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard/);
    } finally {
      // Clean up
      await deleteTestUser(user.id);
    }
  });

  test('Invalid TOTP code during enrollment shows error', async ({ page }) => {
    // Arrange
    const user = await createSuperAdmin({
      email: 'mfa-invalid-enroll@stormcom-test.local',
      password: 'MFAInvalid123!',
    });

    const loginPage = new LoginPage(page);
    const mfaEnrollPage = new MFAEnrollPage(page);

    try {
      // Login and navigate to MFA enrollment
      await loginPage.goto();
      await loginPage.login(user.email, user.plainPassword);
      await loginPage.waitForSuccessfulLogin('/dashboard');

      await mfaEnrollPage.goto();
      await mfaEnrollPage.waitForSetupReady();

      // Act - Enter invalid code
      await mfaEnrollPage.codeInput.fill('000000'); // Invalid code
      await mfaEnrollPage.submitButton.click();

      // Wait for error
      await page.waitForTimeout(1000);

      // Assert - Should show error message
      const hasError = await mfaEnrollPage.codeError.isVisible();
      expect(hasError).toBe(true);

      const errorText = await mfaEnrollPage.codeError.textContent();
      expect(errorText).toMatch(/invalid|incorrect/i);

      // MFA should NOT be enabled
      const userCheck = await db.user.findUnique({
        where: { id: user.id },
        select: { mfaEnabled: true },
      });
      expect(userCheck?.mfaEnabled).toBe(false);
    } finally {
      // Clean up
      await deleteTestUser(user.id);
    }
  });

  test('MFA enrollment can be cancelled', async ({ page }) => {
    // Arrange
    const user = await createSuperAdmin({
      email: 'mfa-cancel-test@stormcom-test.local',
      password: 'MFACancel123!',
    });

    const loginPage = new LoginPage(page);
    const mfaEnrollPage = new MFAEnrollPage(page);

    try {
      // Login and start MFA enrollment
      await loginPage.goto();
      await loginPage.login(user.email, user.plainPassword);
      await loginPage.waitForSuccessfulLogin('/dashboard');

      await mfaEnrollPage.goto();
      await mfaEnrollPage.waitForSetupReady();

      // Act - Click cancel
      await mfaEnrollPage.cancelLink.click();

      // Should redirect back (likely to settings or dashboard)
      await page.waitForURL(/\/(dashboard|settings)/, { timeout: 5000 });

      // Assert - MFA should NOT be enabled
      const userCheck = await db.user.findUnique({
        where: { id: user.id },
        select: { mfaEnabled: true },
      });
      expect(userCheck?.mfaEnabled).toBe(false);
    } finally {
      // Clean up
      await deleteTestUser(user.id);
    }
  });
});
