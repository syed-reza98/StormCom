/**
 * E2E Test: Validation Errors
 * 
 * Task: T060
 * Tests invalid email format validation and inline error messages
 * using RegisterPage and LoginPage POMs.
 * 
 * Test Coverage:
 * - Invalid email formats show validation errors
 * - Inline error messages appear near fields
 * - Real-time validation on blur
 * - ARIA invalid attributes set correctly
 */

import { test, expect } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';
import { LoginPage } from '../pages/LoginPage';

test.describe('Validation Errors', () => {
  let registerPage: RegisterPage;
  let loginPage: LoginPage;

  test.describe('Register Page Validation', () => {
    test.beforeEach(async ({ page }) => {
      registerPage = new RegisterPage(page);
      await registerPage.goto();
    });

    test('Invalid email format shows validation error', async () => {
      // Act - Enter invalid email
      await registerPage.emailInput.fill('notanemail');
      await registerPage.emailInput.blur(); // Trigger validation

      // Wait for validation
      await registerPage.page.waitForTimeout(300);

      // Assert - Should show error
      const hasEmailError = await registerPage.emailError.isVisible();
      expect(hasEmailError).toBe(true);

      const errorText = await registerPage.getEmailErrorText();
      expect(errorText).toMatch(/invalid.*email|valid.*email/i);

      // ARIA invalid should be set
      const isInvalid = await registerPage.isFieldInvalid('email');
      expect(isInvalid).toBe(true);
    });

    test('Multiple invalid email formats are caught', async () => {
      const invalidEmails = [
        'plaintext',
        '@missinglocal.com',
        'missing@domain',
        'spaces in@email.com',
        'double@@domain.com',
        '.startswith@dot.com',
        'ends.with.dot.@domain.com',
      ];

      for (const email of invalidEmails) {
        // Act
        await registerPage.emailInput.clear();
        await registerPage.emailInput.fill(email);
        await registerPage.emailInput.blur();
        await registerPage.page.waitForTimeout(200);

        // Assert
        const hasError = await registerPage.emailError.isVisible();
        expect(hasError).toBe(true); // Email "${email}" should be invalid
      }
    });

    test('Valid email clears validation error', async () => {
      // Act - Enter invalid email first
      await registerPage.emailInput.fill('invalid');
      await registerPage.emailInput.blur();
      await registerPage.page.waitForTimeout(300);

      // Verify error appears
      expect(await registerPage.emailError.isVisible()).toBe(true);

      // Enter valid email
      await registerPage.emailInput.clear();
      await registerPage.emailInput.fill('valid@example.com');
      await registerPage.emailInput.blur();
      await registerPage.page.waitForTimeout(300);

      // Assert - Error should disappear
      const hasError = await registerPage.emailError.isVisible();
      expect(hasError).toBe(false);

      // ARIA invalid should be cleared
      const isInvalid = await registerPage.isFieldInvalid('email');
      expect(isInvalid).toBe(false);
    });

    test('Password strength validation shows specific errors', async () => {
      // Act - Try weak password (too short)
      await registerPage.passwordInput.fill('short');
      await registerPage.passwordInput.blur();
      await registerPage.page.waitForTimeout(300);

      // Assert
      const hasError = await registerPage.passwordError.isVisible();
      expect(hasError).toBe(true);

      const errorText = await registerPage.getPasswordErrorText();
      expect(errorText).toMatch(/8.*character/i);
    });

    test('Empty required fields show validation errors', async () => {
      // Act - Focus and blur without entering
      await registerPage.firstNameInput.focus();
      await registerPage.firstNameInput.blur();
      await registerPage.page.waitForTimeout(200);

      await registerPage.lastNameInput.focus();
      await registerPage.lastNameInput.blur();
      await registerPage.page.waitForTimeout(200);

      await registerPage.emailInput.focus();
      await registerPage.emailInput.blur();
      await registerPage.page.waitForTimeout(200);

      await registerPage.passwordInput.focus();
      await registerPage.passwordInput.blur();
      await registerPage.page.waitForTimeout(200);

      // Assert - All should show required errors
      expect(await registerPage.firstNameError.isVisible()).toBe(true);
      expect(await registerPage.lastNameError.isVisible()).toBe(true);
      expect(await registerPage.emailError.isVisible()).toBe(true);
      expect(await registerPage.passwordError.isVisible()).toBe(true);
    });
  });

  test.describe('Login Page Validation', () => {
    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      await loginPage.goto();
    });

    test('Invalid email format shows validation error on login', async () => {
      // Act
      await loginPage.emailInput.fill('notanemail');
      await loginPage.emailInput.blur();
      await loginPage.page.waitForTimeout(300);

      // Assert
      const hasError = await loginPage.hasEmailError();
      expect(hasError).toBe(true);

      const errorText = await loginPage.getEmailErrorText();
      expect(errorText).toMatch(/invalid.*email|valid.*email/i);
    });

    test('Empty email shows required error', async () => {
      // Act
      await loginPage.emailInput.focus();
      await loginPage.emailInput.blur();
      await loginPage.page.waitForTimeout(300);

      // Assert
      const hasError = await loginPage.hasEmailError();
      expect(hasError).toBe(true);

      const errorText = await loginPage.getEmailErrorText();
      expect(errorText).toMatch(/required|enter.*email/i);
    });

    test('Empty password shows required error', async () => {
      // Act
      await loginPage.passwordInput.focus();
      await loginPage.passwordInput.blur();
      await loginPage.page.waitForTimeout(300);

      // Assert
      const hasError = await loginPage.hasPasswordError();
      expect(hasError).toBe(true);

      const errorText = await loginPage.getPasswordErrorText();
      expect(errorText).toMatch(/required|enter.*password/i);
    });

    test('Valid inputs clear validation errors', async () => {
      // Act - Trigger errors first
      await loginPage.emailInput.fill('invalid');
      await loginPage.emailInput.blur();
      await loginPage.page.waitForTimeout(300);
      expect(await loginPage.hasEmailError()).toBe(true);

      // Enter valid email
      await loginPage.emailInput.clear();
      await loginPage.emailInput.fill('valid@example.com');
      await loginPage.emailInput.blur();
      await loginPage.page.waitForTimeout(300);

      // Assert - Error should clear
      expect(await loginPage.hasEmailError()).toBe(false);
    });

    test('Form cannot be submitted with validation errors', async () => {
      // Act - Enter invalid email
      await loginPage.emailInput.fill('invalid');
      await loginPage.passwordInput.fill('somepassword');

      // Try to submit
      await loginPage.submit();
      await loginPage.page.waitForTimeout(500);

      // Assert - Should still be on login page
      await expect(loginPage.page).toHaveURL(/\/login/);

      // Error should be visible
      expect(await loginPage.hasEmailError()).toBe(true);
    });
  });

  test.describe('Real-time Validation', () => {
    test.beforeEach(async ({ page }) => {
      registerPage = new RegisterPage(page);
      await registerPage.goto();
    });

    test('Email validation triggers on blur', async () => {
      // Act
      await registerPage.emailInput.fill('invalid');
      
      // Before blur - no error
      expect(await registerPage.emailError.isVisible()).toBe(false);

      // After blur - error appears
      await registerPage.emailInput.blur();
      await registerPage.page.waitForTimeout(300);
      expect(await registerPage.emailError.isVisible()).toBe(true);
    });

    test('Password validation triggers on input', async () => {
      // Act - Start typing password
      await registerPage.passwordInput.fill('a');
      await registerPage.page.waitForTimeout(100);

      // Password help should be visible
      const hasHelp = await registerPage.passwordHelp.isVisible();
      expect(hasHelp).toBe(true);

      // Help text should describe requirements
      const helpText = await registerPage.getPasswordHelpText();
      expect(helpText).toMatch(/(8.*character|uppercase|lowercase|number|special)/i);
    });
  });
});
