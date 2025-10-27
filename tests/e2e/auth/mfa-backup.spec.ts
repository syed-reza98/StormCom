/**
 * E2E Test: MFA Backup Codes
 * 
 * Task: T062
 * Tests MFA backup code login, single-use validation,
 * and code marking using MFAChallengePage POM.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { MFAChallengePage } from '../pages/MFAChallengePage';
import { db } from '../../../src/lib/db';
import { createSuperAdmin, deleteTestUser } from '../fixtures/users';

test.describe('MFA Backup Codes', () => {
  test('User can login with MFA backup code', async ({ page }) => {
    const backupCode = 'BACKUP1234567890';
    const user = await createSuperAdmin({
      email: 'mfa-backup-test@stormcom-test.local',
      password: 'Backup123!',
      mfaEnabled: true,
      totpSecret: 'JBSWY3DPEHPK3PXP',
    });

    // Add backup code
    await db.user.update({
      where: { id: user.id },
      data: { backupCodes: [backupCode] },
    });

    try {
      const loginPage = new LoginPage(page);
      const mfaChallengePage = new MFAChallengePage(page);

      await loginPage.goto();
      await loginPage.login(user.email, user.plainPassword);
      await loginPage.waitForMFARedirect();

      // Use backup code
      await mfaChallengePage.codeInput.fill(backupCode);
      await mfaChallengePage.submitButton.click();

      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard/);

      // Verify code marked as used
      const updatedUser = await db.user.findUnique({
        where: { id: user.id },
        select: { backupCodes: true },
      });
      expect(updatedUser?.backupCodes).not.toContain(backupCode);
    } finally {
      await deleteTestUser(user.id);
    }
  });

  test('Backup code can only be used once', async ({ page }) => {
    const backupCode = 'SINGLEUSE12345';
    const user = await createSuperAdmin({
      email: 'single-use-test@stormcom-test.local',
      password: 'SingleUse123!',
      mfaEnabled: true,
      totpSecret: 'JBSWY3DPEHPK3PXP',
    });

    await db.user.update({
      where: { id: user.id },
      data: { backupCodes: [backupCode, 'BACKUP2'] },
    });

    try {
      const loginPage = new LoginPage(page);
      const mfaChallengePage = new MFAChallengePage(page);

      // First use - should succeed
      await loginPage.goto();
      await loginPage.login(user.email, user.plainPassword);
      await loginPage.waitForMFARedirect();
      await mfaChallengePage.codeInput.fill(backupCode);
      await mfaChallengePage.submitButton.click();
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });

      // Logout
      await page.goto('/api/auth/logout');
      await page.waitForTimeout(1000);

      // Second use - should fail
      await loginPage.goto();
      await loginPage.login(user.email, user.plainPassword);
      await loginPage.waitForMFARedirect();
      await mfaChallengePage.codeInput.fill(backupCode);
      await mfaChallengePage.submitButton.click();
      await page.waitForTimeout(1000);

      // Should show error
      const hasError = await mfaChallengePage.codeError.isVisible();
      expect(hasError).toBe(true);
    } finally {
      await deleteTestUser(user.id);
    }
  });
});
