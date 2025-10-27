/**
 * E2E Test: MFA Recovery
 * 
 * Task: T063
 * Tests lost MFA access recovery via email and MFA disable
 * using MFAChallengePage POM.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { MFAChallengePage } from '../pages/MFAChallengePage';
import { db } from '../../../src/lib/db';
import { createSuperAdmin, deleteTestUser } from '../fixtures/users';

test.describe('MFA Recovery', () => {
  // TODO: MFA recovery feature not yet implemented - requires mfaRecoveryToken/mfaRecoveryExpires fields in User model
  test.skip('User can recover lost MFA access via email', async ({ page }) => {
    const user = await createSuperAdmin({
      email: 'mfa-recovery-test@stormcom-test.local',
      password: 'Recovery123!',
      mfaEnabled: true,
      totpSecret: 'JBSWY3DPEHPK3PXP',
    });

    try {
      const loginPage = new LoginPage(page);
      const mfaChallengePage = new MFAChallengePage(page);

      await loginPage.goto();
      await loginPage.login(user.email, user.plainPassword);
      await loginPage.waitForMFARedirect();

      // Click "Lost access?" link
      await mfaChallengePage.lostAccessLink.click();

      // Should show recovery options
      await page.waitForTimeout(1000);
      const recoveryText = await page.textContent('body');
      expect(recoveryText).toMatch(/email|recovery|support/i);

      // Verify recovery token generated in database
      const userCheck = await db.user.findUnique({
        where: { id: user.id },
        select: { mfaRecoveryToken: true, mfaRecoveryExpires: true },
      });

      expect(userCheck?.mfaRecoveryToken).not.toBeNull();
      expect(userCheck?.mfaRecoveryExpires).not.toBeNull();
    } finally {
      await deleteTestUser(user.id);
    }
  });

  // TODO: MFA recovery feature not yet implemented - requires mfaRecoveryToken/mfaRecoveryExpires fields in User model  
  test.skip('MFA can be disabled via recovery process', async ({ page }) => {
    const recoveryToken = 'recovery_token_123';
    const user = await createSuperAdmin({
      email: 'mfa-disable-test@stormcom-test.local',
      password: 'Disable123!',
      mfaEnabled: true,
      totpSecret: 'JBSWY3DPEHPK3PXP',
    });

    try {
      // Set recovery token
      await db.user.update({
        where: { id: user.id },
        data: {
          mfaRecoveryToken: recoveryToken,
          mfaRecoveryExpires: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      // Visit recovery link
      await page.goto(`/mfa/recover?token=${recoveryToken}`);
      await page.waitForLoadState('networkidle');

      // Confirm disable MFA
      const confirmButton = page.locator('button:has-text("Disable MFA")');
      await confirmButton.click();
      await page.waitForTimeout(1000);

      // Verify MFA disabled
      const updatedUser = await db.user.findUnique({
        where: { id: user.id },
        select: { mfaEnabled: true, totpSecret: true, mfaBackupCodes: true },
      });

      expect(updatedUser?.mfaEnabled).toBe(false);
      expect(updatedUser?.totpSecret).toBeNull();
      expect(updatedUser?.mfaBackupCodes).toHaveLength(0);
    } finally {
      await deleteTestUser(user.id);
    }
  });
});
