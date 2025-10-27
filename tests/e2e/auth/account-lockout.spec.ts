/**
 * E2E Test: Account Lockout
 * 
 * Task: T057
 * Tests account lockout after 5 failed login attempts, lockout message display,
 * and 15-minute timeout using LoginPage POM.
 * 
 * Test Coverage:
 * - 5 failed login attempts trigger account lockout
 * - Lockout message displayed with timeout
 * - Correct credentials rejected during lockout period
 * - Failed attempts counter resets after successful login
 * - Lockout automatically expires after 15 minutes
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { db } from '../../../src/lib/db';
import { createSuperAdmin, deleteTestUser } from '../fixtures/users';

test.describe('Account Lockout', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('Account is locked after 5 failed login attempts', async () => {
    // Arrange
    const user = await createSuperAdmin({
      email: 'lockout-test@stormcom-test.local',
      password: 'CorrectPassword123!',
    });

    try {
      // Act - Attempt 5 failed logins
      for (let i = 1; i <= 5; i++) {
        await loginPage.login(user.email, `WrongPassword${i}!`);
        
        // Wait for error message
        await loginPage.page.waitForTimeout(500);

        // Check if lockout message appears after 5th attempt
        if (i === 5) {
          // Wait a bit longer for lockout to trigger
          await loginPage.page.waitForTimeout(1000);
          break;
        }

        // Reload page for next attempt
        await loginPage.goto();
      }

      // Assert - Lockout message should be visible
      const hasLockoutMessage = await loginPage.hasLockoutMessage();
      expect(hasLockoutMessage).toBe(true);

      // Verify lockout message contains timeout information
      const lockoutText = await loginPage.lockoutMessage.textContent();
      expect(lockoutText).toMatch(/locked/i);
      expect(lockoutText).toMatch(/\d+\s*(minute|min)/i); // Should mention minutes

      // Verify database reflects lockout
      const lockedUser = await db.user.findUnique({
        where: { id: user.id },
        select: {
          failedLoginAttempts: true,
          lockedUntil: true,
        },
      });

      expect(lockedUser?.failedLoginAttempts).toBeGreaterThanOrEqual(5);
      expect(lockedUser?.lockedUntil).not.toBeNull();

      // Verify lockout duration is ~15 minutes (with 2 min tolerance)
      if (lockedUser?.lockedUntil) {
        const lockoutEnd = new Date(lockedUser.lockedUntil).getTime();
        const now = Date.now();
        const minutesUntilUnlock = (lockoutEnd - now) / (1000 * 60);
        expect(minutesUntilUnlock).toBeGreaterThan(13); // At least 13 minutes
        expect(minutesUntilUnlock).toBeLessThan(17); // At most 17 minutes
      }
    } finally {
      // Clean up
      await deleteTestUser(user.id);
    }
  });

  test('Correct credentials are rejected during lockout period', async () => {
    // Arrange
    const user = await createSuperAdmin({
      email: 'locked-correct-password-test@stormcom-test.local',
      password: 'CorrectPassword123!',
    });

    try {
      // Lock the account by failing 5 times
      for (let i = 1; i <= 5; i++) {
        await loginPage.login(user.email, `WrongPassword${i}!`);
        await loginPage.page.waitForTimeout(300);
        if (i < 5) await loginPage.goto();
      }

      // Wait for lockout
      await loginPage.page.waitForTimeout(1000);

      // Act - Try to login with CORRECT password while locked
      await loginPage.goto();
      await loginPage.login(user.email, user.plainPassword);
      
      // Wait for response
      await loginPage.page.waitForTimeout(1000);

      // Assert - Should still show lockout message
      const hasLockoutMessage = await loginPage.hasLockoutMessage();
      expect(hasLockoutMessage).toBe(true);

      // Should NOT be redirected to dashboard
      await expect(loginPage.page).not.toHaveURL(/\/dashboard/);

      // User should still be locked in database
      const stillLocked = await db.user.findUnique({
        where: { id: user.id },
        select: { lockedUntil: true },
      });

      expect(stillLocked?.lockedUntil).not.toBeNull();
      
      // Locked until time should still be in the future
      if (stillLocked?.lockedUntil) {
        expect(new Date(stillLocked.lockedUntil).getTime()).toBeGreaterThan(Date.now());
      }
    } finally {
      // Clean up
      await deleteTestUser(user.id);
    }
  });

  test('Failed attempts counter resets after successful login', async () => {
    // Arrange
    const user = await createSuperAdmin({
      email: 'reset-counter-test@stormcom-test.local',
      password: 'CorrectPassword123!',
    });

    try {
      // Act - Attempt 3 failed logins
      for (let i = 1; i <= 3; i++) {
        await loginPage.login(user.email, `WrongPassword${i}!`);
        await loginPage.page.waitForTimeout(300);
        await loginPage.goto();
      }

      // Verify failed attempts were recorded
      let userWithAttempts = await db.user.findUnique({
        where: { id: user.id },
        select: { failedLoginAttempts: true },
      });
      expect(userWithAttempts?.failedLoginAttempts).toBeGreaterThanOrEqual(3);

      // Now login successfully
      await loginPage.login(user.email, user.plainPassword);
      await loginPage.waitForSuccessfulLogin('/dashboard');

      // Assert - Failed attempts should be reset to 0
      const userAfterSuccess = await db.user.findUnique({
        where: { id: user.id },
        select: {
          failedLoginAttempts: true,
          lockedUntil: true,
        },
      });

      expect(userAfterSuccess?.failedLoginAttempts).toBe(0);
      expect(userAfterSuccess?.lockedUntil).toBeNull();
    } finally {
      // Clean up
      await deleteTestUser(user.id);
    }
  });

  test('Lockout automatically expires after timeout period', async () => {
    // Arrange
    const user = await createSuperAdmin({
      email: 'lockout-expiry-test@stormcom-test.local',
      password: 'CorrectPassword123!',
    });

    try {
      // Manually set lockout that expires in 2 seconds (for faster test)
      await db.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 5,
          lockedUntil: new Date(Date.now() + 2000), // 2 seconds from now
        },
      });

      // Act - Try to login immediately (should fail)
      await loginPage.login(user.email, user.plainPassword);
      await loginPage.page.waitForTimeout(500);

      // Should show lockout message
      const hasLockout = await loginPage.hasLockoutMessage();
      expect(hasLockout).toBe(true);

      // Wait for lockout to expire
      await loginPage.page.waitForTimeout(2500); // Wait 2.5 seconds

      // Try to login again (should succeed now)
      await loginPage.goto();
      await loginPage.login(user.email, user.plainPassword);
      
      // Assert - Should be successful
      await loginPage.waitForSuccessfulLogin('/dashboard');
      await expect(loginPage.page).toHaveURL(/\/dashboard/);

      // Verify lockout cleared in database
      const unlockedUser = await db.user.findUnique({
        where: { id: user.id },
        select: {
          failedLoginAttempts: true,
          lockedUntil: true,
        },
      });

      expect(unlockedUser?.failedLoginAttempts).toBe(0);
      expect(unlockedUser?.lockedUntil).toBeNull();
    } finally {
      // Clean up
      await deleteTestUser(user.id);
    }
  });

  test('Lockout message shows remaining time', async () => {
    // Arrange
    const user = await createSuperAdmin({
      email: 'lockout-time-display-test@stormcom-test.local',
      password: 'CorrectPassword123!',
    });

    try {
      // Lock the account
      await db.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 5,
          lockedUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        },
      });

      // Act - Try to login
      await loginPage.login(user.email, user.plainPassword);
      await loginPage.page.waitForTimeout(1000);

      // Assert - Lockout message should contain time information
      const lockoutText = await loginPage.lockoutMessage.textContent();
      expect(lockoutText).not.toBeNull();
      expect(lockoutText).toMatch(/locked/i);
      
      // Should mention time (could be "10 minutes", "9:xx", etc.)
      const hasTimeReference = 
        /\d+\s*(minute|min)/i.test(lockoutText!) ||
        /\d+:\d+/i.test(lockoutText!); // Format like "9:45"
      
      expect(hasTimeReference).toBe(true);
    } finally {
      // Clean up
      await deleteTestUser(user.id);
    }
  });

  test('Different users have independent lockout counters', async () => {
    // Arrange
    const user1 = await createSuperAdmin({
      email: 'lockout-user1@stormcom-test.local',
      password: 'Password123!',
    });
    
    const user2 = await createSuperAdmin({
      email: 'lockout-user2@stormcom-test.local',
      password: 'Password456!',
    });

    try {
      // Act - Fail login for user1 5 times
      for (let i = 1; i <= 5; i++) {
        await loginPage.login(user1.email, 'WrongPassword!');
        await loginPage.page.waitForTimeout(300);
        if (i < 5) await loginPage.goto();
      }

      // Wait for lockout
      await loginPage.page.waitForTimeout(1000);

      // Verify user1 is locked
      const lockedUser1 = await db.user.findUnique({
        where: { id: user1.id },
        select: { failedLoginAttempts: true, lockedUntil: true },
      });
      expect(lockedUser1?.failedLoginAttempts).toBeGreaterThanOrEqual(5);
      expect(lockedUser1?.lockedUntil).not.toBeNull();

      // Try to login as user2 (should succeed)
      await loginPage.goto();
      await loginPage.login(user2.email, user2.plainPassword);
      await loginPage.waitForSuccessfulLogin('/dashboard');

      // Assert - User2 should login successfully
      await expect(loginPage.page).toHaveURL(/\/dashboard/);

      // User2 should have 0 failed attempts
      const user2Data = await db.user.findUnique({
        where: { id: user2.id },
        select: { failedLoginAttempts: true, lockedUntil: true },
      });
      expect(user2Data?.failedLoginAttempts).toBe(0);
      expect(user2Data?.lockedUntil).toBeNull();
    } finally {
      // Clean up
      await deleteTestUser(user1.id);
      await deleteTestUser(user2.id);
    }
  });
});
