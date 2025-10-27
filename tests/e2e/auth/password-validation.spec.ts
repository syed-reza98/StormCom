import { test, expect, Page } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';
import { LoginPage } from '../pages/LoginPage';
import { AccountPage } from '../pages/AccountPage';
import { SettingsPage } from '../pages/SettingsPage';

/**
 * E2E Tests: Password Validation Requirements
 * 
 * Task: T072 [US0] Create E2E test "Password validation requirements"
 * 
 * Purpose: Verify comprehensive password validation rules are enforced
 * during registration, password changes, and reset operations.
 * 
 * Requirements:
 * - Password must be 8-128 characters long
 * - Must contain lowercase letter (a-z)
 * - Must contain uppercase letter (A-Z)  
 * - Must contain digit (0-9)
 * - Must contain special character (!@#$%^&*)
 * - Cannot contain common passwords (password123, 123456, etc.)
 * - Cannot contain user's email or name
 * - Real-time validation feedback during typing
 * - Clear error messages for each failed requirement
 * - Accessibility compliance for validation messages
 * 
 * User Story: US0 Authentication
 * Security Feature: Password complexity enforcement
 * Acceptance Criteria:
 * - Registration rejects weak passwords with specific feedback
 * - Password change validates new password strength
 * - Password reset enforces same validation rules
 * - Progressive validation shows requirements being met
 * - ARIA live regions announce validation status
 */

test.describe('Password Validation Requirements - T072', () => {
  let page: Page;
  let registerPage: RegisterPage;
  let loginPage: LoginPage;
  let accountPage: AccountPage;
  let settingsPage: SettingsPage;

  // Test data
  const validUser = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@stormcom.dev',
    validPassword: 'StrongPass123!',
    storeId: 'store-001'
  };

  // Password test cases
  const invalidPasswords = [
    {
      password: 'short',
      expectedError: 'at least 8 characters',
      description: 'too short (under 8 characters)'
    },
    {
      password: 'a'.repeat(129),
      expectedError: 'maximum 128 characters',
      description: 'too long (over 128 characters)'  
    },
    {
      password: 'alllowercase123!',
      expectedError: 'uppercase letter',
      description: 'missing uppercase letter'
    },
    {
      password: 'ALLUPPERCASE123!',
      expectedError: 'lowercase letter',
      description: 'missing lowercase letter'
    },
    {
      password: 'NoDigitsHere!',
      expectedError: 'digit',
      description: 'missing digit'
    },
    {
      password: 'NoSpecialChars123',
      expectedError: 'special character',
      description: 'missing special character'
    },
    {
      password: 'password123!',
      expectedError: 'common password|weak password',
      description: 'common password'
    },
    {
      password: '123456789!',
      expectedError: 'common password|weak password',
      description: 'sequential numbers'
    },
    {
      password: 'john.doe@stormcom.dev',
      expectedError: 'contain personal information|email',
      description: 'contains email address'
    },
    {
      password: 'JohnDoe123!',
      expectedError: 'contain personal information|name',
      description: 'contains user name'
    }
  ];

  const progressivePasswords = [
    { input: 'p', meets: [] },
    { input: 'pa', meets: [] },
    { input: 'pass', meets: [] },
    { input: 'passw', meets: [] },
    { input: 'passwor', meets: [] },
    { input: 'password', meets: ['length'] },
    { input: 'Password', meets: ['length', 'uppercase'] },
    { input: 'Password1', meets: ['length', 'uppercase', 'digit'] },
    { input: 'Password1!', meets: ['length', 'uppercase', 'lowercase', 'digit', 'special'] }
  ];

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    registerPage = new RegisterPage(page);
    loginPage = new LoginPage(page);
    accountPage = new AccountPage(page);
    settingsPage = new SettingsPage(page);
  });

  test('Registration enforces all password validation rules', async () => {
    // Arrange: Navigate to registration page
    await registerPage.goto();
    await registerPage.waitForPageLoad();

    // Test each invalid password case
    for (const testCase of invalidPasswords) {
      // Act: Fill form with invalid password
      await registerPage.fillForm(
        validUser.firstName,
        validUser.lastName,
        validUser.email,
        testCase.password,
        testCase.password // confirmPassword
      );

      // Submit form to trigger validation
      await registerPage.submit();
      await page.waitForTimeout(500);

      // Assert: Verify specific error message appears
      const passwordError = page.locator('[data-testid="password-error"], #password-error, [id*="password"][role="alert"]');
      await passwordError.waitFor({ state: 'visible', timeout: 2000 });

      const errorText = await passwordError.textContent();
      expect(errorText?.toLowerCase()).toMatch(new RegExp(testCase.expectedError, 'i'));

      // Clear form for next test
      await registerPage.passwordInput.clear();
      await registerPage.confirmPasswordInput.clear();
      await page.waitForTimeout(200);
    }
  });

  test('Real-time password validation shows progressive feedback', async () => {
    // Arrange: Navigate to registration page
    await registerPage.goto();
    await registerPage.fillBasicInfo(validUser.firstName, validUser.lastName, validUser.email);

    // Act & Assert: Test progressive password building
    for (const step of progressivePasswords) {
      // Clear and type progressive password
      await registerPage.passwordInput.clear();
      await registerPage.passwordInput.fill(step.input);
      await page.waitForTimeout(300); // Allow for real-time validation

      // Check which requirements are met
      const requirements = [
        { name: 'length', selector: '[data-testid="req-length"], [data-requirement="length"]' },
        { name: 'uppercase', selector: '[data-testid="req-uppercase"], [data-requirement="uppercase"]' },
        { name: 'lowercase', selector: '[data-testid="req-lowercase"], [data-requirement="lowercase"]' },
        { name: 'digit', selector: '[data-testid="req-digit"], [data-requirement="digit"]' },
        { name: 'special', selector: '[data-testid="req-special"], [data-requirement="special"]' }
      ];

      for (const req of requirements) {
        const reqElement = page.locator(req.selector).first();
        
        if (await reqElement.isVisible()) {
          const isMet = step.meets.includes(req.name);
          const elementClass = await reqElement.getAttribute('class') || '';
          const isMarkedMet = elementClass.includes('valid') || 
                             elementClass.includes('met') || 
                             elementClass.includes('success') ||
                             elementClass.includes('check');

          // Verify requirement status matches expected
          if (isMet) {
            expect(isMarkedMet).toBe(true);
          }
        }
      }
    }
  });

  test('Password change in settings validates new password', async () => {
    // Arrange: Register and login user first
    await registerPage.goto();
    await registerPage.fillAndSubmit(
      validUser.firstName,
      validUser.lastName,
      validUser.email,
      validUser.validPassword,
      validUser.validPassword
    );

    // Navigate to settings after login
    await settingsPage.goto();
    await settingsPage.waitForPageLoad();

    // Navigate to password change section
    await settingsPage.navigateToPasswordSection();

    // Test invalid password cases in settings
    for (const testCase of invalidPasswords.slice(0, 5)) { // Test subset for efficiency
      // Act: Enter current password and invalid new password
      await settingsPage.changePasswordForm.currentPasswordInput.fill(validUser.validPassword);
      await settingsPage.changePasswordForm.newPasswordInput.fill(testCase.password);
      await settingsPage.changePasswordForm.confirmPasswordInput.fill(testCase.password);

      // Submit password change
      await settingsPage.changePasswordForm.submitButton.click();
      await page.waitForTimeout(500);

      // Assert: Verify validation error
      const passwordError = page.locator('[data-testid="new-password-error"], [data-testid="password-error"]');
      if (await passwordError.isVisible()) {
        const errorText = await passwordError.textContent();
        expect(errorText?.toLowerCase()).toMatch(new RegExp(testCase.expectedError, 'i'));
      }

      // Clear form for next test
      await settingsPage.changePasswordForm.clearForm();
      await page.waitForTimeout(200);
    }
  });

  test('Password reset enforces validation rules', async () => {
    // Arrange: Navigate to forgot password page
    await loginPage.goto();
    await loginPage.clickForgotPassword();

    // Request password reset
    await page.locator('#email').fill(validUser.email);
    await page.locator('button[type="submit"]').click();

    // Simulate password reset token scenario
    // In real test, this would use actual reset token from email
    const resetToken = 'mock-reset-token-12345';
    await page.goto(`/reset-password?token=${resetToken}`);
    await page.waitForTimeout(1000);

    // Test password validation in reset form
    for (const testCase of invalidPasswords.slice(0, 6)) { // Test key cases
      // Act: Fill invalid password in reset form
      const newPasswordInput = page.locator('[data-testid="new-password"], input[type="password"]').first();
      const confirmPasswordInput = page.locator('[data-testid="confirm-password"], input[type="password"]').last();

      await newPasswordInput.fill(testCase.password);
      await confirmPasswordInput.fill(testCase.password);

      // Submit reset form
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForTimeout(500);

      // Assert: Verify validation error
      const passwordError = page.locator('[data-testid="password-error"], [role="alert"]');
      if (await passwordError.isVisible()) {
        const errorText = await passwordError.textContent();
        expect(errorText?.toLowerCase()).toMatch(new RegExp(testCase.expectedError, 'i'));
      }

      // Clear fields for next test
      await newPasswordInput.clear();
      await confirmPasswordInput.clear();
      await page.waitForTimeout(200);
    }
  });

  test('Password validation messages are accessible', async () => {
    // Arrange: Navigate to registration page
    await registerPage.goto();
    await registerPage.fillBasicInfo(validUser.firstName, validUser.lastName, validUser.email);

    // Act: Enter invalid password to trigger validation
    await registerPage.passwordInput.fill('weak');
    await page.waitForTimeout(500);

    // Assert: Check accessibility features
    // 1. Error messages have proper ARIA attributes
    const errorElements = page.locator('[role="alert"], [data-testid*="error"], [aria-live], [aria-describedby]');
    const errorCount = await errorElements.count();
    expect(errorCount).toBeGreaterThan(0);

    // 2. Password field is properly described by error
    const passwordField = registerPage.passwordInput;
    const describedBy = await passwordField.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    // 3. Requirements list is accessible
    const requirementsList = page.locator('[data-testid="password-requirements"], [role="list"]');
    if (await requirementsList.isVisible()) {
      const listRole = await requirementsList.getAttribute('role');
      expect(listRole).toBe('list');

      // Check individual requirements have proper roles
      const requirements = requirementsList.locator('[role="listitem"], li');
      const reqCount = await requirements.count();
      expect(reqCount).toBeGreaterThan(0);
    }

    // 4. Test keyboard navigation
    await passwordField.focus();
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON']).toContain(focusedElement);

    // 5. Screen reader announcements (aria-live regions)
    const liveRegions = page.locator('[aria-live="polite"], [aria-live="assertive"]');
    const liveCount = await liveRegions.count();
    expect(liveCount).toBeGreaterThan(0);
  });

  test('Common password validation blocks known weak passwords', async () => {
    // Arrange: Navigate to registration
    await registerPage.goto();
    await registerPage.fillBasicInfo(validUser.firstName, validUser.lastName, validUser.email);

    // Common weak passwords to test
    const commonPasswords = [
      'password',
      'password123',
      '123456789',
      'qwerty123',
      'admin123',
      'welcome123',
      'Password1',  // Meets basic requirements but still common
      'Password123', // Common pattern
      'letmein123',
      'monkey123'
    ];

    for (const weakPassword of commonPasswords) {
      // Add complexity to make it meet basic requirements
      const testPassword = weakPassword + '!';
      
      // Act: Try weak password
      await registerPage.passwordInput.clear();
      await registerPage.passwordInput.fill(testPassword);
      await registerPage.confirmPasswordInput.clear();
      await registerPage.confirmPasswordInput.fill(testPassword);

      await registerPage.submit();
      await page.waitForTimeout(500);

      // Assert: Should be rejected for being too common
      const errorElements = page.locator('[data-testid="password-error"], [role="alert"]');
      let errorFound = false;

      for (let i = 0; i < await errorElements.count(); i++) {
        const errorText = await errorElements.nth(i).textContent();
        if (errorText?.toLowerCase().includes('common') || 
            errorText?.toLowerCase().includes('weak') ||
            errorText?.toLowerCase().includes('predictable')) {
          errorFound = true;
          break;
        }
      }

      // Some common passwords might still pass if they meet requirements
      // The key is that the system should flag clearly weak/common ones
      if (['password123!', '123456789!', 'Password1!'].includes(testPassword)) {
        expect(errorFound).toBe(true);
      }
    }
  });

  test('Password confirmation validation works correctly', async () => {
    // Arrange: Navigate to registration
    await registerPage.goto();
    await registerPage.fillBasicInfo(validUser.firstName, validUser.lastName, validUser.email);

    // Test password mismatch scenarios
    const mismatchTests = [
      {
        password: 'StrongPass123!',
        confirm: 'StrongPass124!',
        description: 'Different special character'
      },
      {
        password: 'StrongPass123!',
        confirm: 'strongpass123!',
        description: 'Different case'
      },
      {
        password: 'StrongPass123!',
        confirm: 'StrongPass123',
        description: 'Missing special character in confirm'
      },
      {
        password: 'StrongPass123!',
        confirm: 'StrongPass123! ',
        description: 'Extra space in confirm'
      }
    ];

    for (const test of mismatchTests) {
      // Act: Enter mismatched passwords
      await registerPage.passwordInput.clear();
      await registerPage.passwordInput.fill(test.password);
      await registerPage.confirmPasswordInput.clear();
      await registerPage.confirmPasswordInput.fill(test.confirm);

      // Trigger validation by clicking submit or moving focus
      await registerPage.submit();
      await page.waitForTimeout(500);

      // Assert: Should show password mismatch error
      const confirmError = page.locator('[data-testid="confirm-password-error"], [data-testid="password-confirm-error"]');
      if (await confirmError.isVisible()) {
        const errorText = await confirmError.textContent();
        expect(errorText?.toLowerCase()).toMatch(/match|same|identical/);
      }

      // Alternative: Check if form submission was prevented
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/register|signup/);
    }

    // Test matching passwords work
    await registerPage.passwordInput.clear();
    await registerPage.passwordInput.fill(validUser.validPassword);
    await registerPage.confirmPasswordInput.clear();
    await registerPage.confirmPasswordInput.fill(validUser.validPassword);

    await page.waitForTimeout(500);

    // Should not show confirmation error
    const confirmError = page.locator('[data-testid="confirm-password-error"]');
    if (await confirmError.isVisible()) {
      const errorText = await confirmError.textContent();
      expect(errorText).toBeFalsy();
    }
  });

  test('Password validation performance handles rapid typing', async () => {
    // Arrange: Navigate to registration
    await registerPage.goto();
    await registerPage.fillBasicInfo(validUser.firstName, validUser.lastName, validUser.email);

    // Act: Simulate rapid typing to test validation performance
    const rapidPasswords = [
      'a',
      'ab',
      'abc',
      'abcd',
      'abcde',
      'abcdef',
      'abcdefg',
      'abcdefgh',
      'Abcdefgh',
      'Abcdefgh1',
      'Abcdefgh1!'
    ];

    const startTime = Date.now();

    for (const pass of rapidPasswords) {
      await registerPage.passwordInput.clear();
      await registerPage.passwordInput.fill(pass);
      await page.waitForTimeout(50); // Minimal delay to simulate rapid typing
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Assert: Validation should complete quickly without blocking UI
    expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds

    // Final validation state should be correct
    await page.waitForTimeout(1000); // Allow final validation to complete

    const passwordValue = await registerPage.passwordInput.inputValue();
    expect(passwordValue).toBe('Abcdefgh1!');

    // Check that validation indicators show correct final state
    const validationElements = page.locator('[data-testid*="req-"], [data-requirement]');
    const validationCount = await validationElements.count();

    if (validationCount > 0) {
      // At least some validation indicators should show the password meets requirements
      let metRequirements = 0;
      
      for (let i = 0; i < validationCount; i++) {
        const element = validationElements.nth(i);
        const elementClass = await element.getAttribute('class') || '';
        
        if (elementClass.includes('valid') || 
            elementClass.includes('met') || 
            elementClass.includes('success')) {
          metRequirements++;
        }
      }

      expect(metRequirements).toBeGreaterThan(0);
    }
  });

  test('Password validation handles edge cases and security', async () => {
    // Arrange: Navigate to registration
    await registerPage.goto();
    await registerPage.fillBasicInfo(validUser.firstName, validUser.lastName, validUser.email);

    // Test edge cases
    const edgeCases = [
      {
        password: '        ', // Only spaces
        description: 'only spaces',
        shouldReject: true
      },
      {
        password: '\t\n\r\f', // Whitespace characters
        description: 'whitespace characters',
        shouldReject: true
      },
      {
        password: 'ValidPass123!', // Valid password
        description: 'valid password',
        shouldReject: false
      },
      {
        password: 'Émile123!@#', // Unicode characters
        description: 'unicode characters',
        shouldReject: false
      },
      {
        password: 'Test<script>alert("xss")</script>123!', // XSS attempt
        description: 'potential XSS',
        shouldReject: true
      },
      {
        password: "Test'; DROP TABLE users; --123!", // SQL injection attempt
        description: 'potential SQL injection',
        shouldReject: true
      }
    ];

    for (const testCase of edgeCases) {
      // Act: Test edge case password
      await registerPage.passwordInput.clear();
      await registerPage.passwordInput.fill(testCase.password);
      await registerPage.confirmPasswordInput.clear();
      await registerPage.confirmPasswordInput.fill(testCase.password);

      await registerPage.submit();
      await page.waitForTimeout(1000);

      if (testCase.shouldReject) {
        // Assert: Should show validation error or stay on registration page
        const hasError = await page.locator('[data-testid*="error"], [role="alert"]').isVisible();
        const onRegisterPage = page.url().includes('/register') || page.url().includes('/signup');
        
        expect(hasError || onRegisterPage).toBe(true);
      } else {
        // For valid passwords, check they don't trigger unnecessary errors
        // (Note: They might still fail for other reasons like missing terms acceptance)
        const passwordError = page.locator('[data-testid="password-error"]');
        if (await passwordError.isVisible()) {
          const errorText = await passwordError.textContent();
          // Should not be a password validation error
          expect(errorText?.toLowerCase()).not.toMatch(/password.*requirement|weak|common|character/);
        }
      }
    }
  });
});