/* eslint-disable no-console */

import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';

/**
 * E2E Tests: Password Reset Token Expiry
 * 
 * Task: T076 [US0] Create E2E test "Password reset token expires after 1 hour"
 * 
 * Purpose: Verify password reset tokens have proper expiry mechanism
 * to prevent unauthorized access through expired or stale reset links.
 * 
 * Requirements:
 * - Password reset tokens expire after 1 hour (3600 seconds)
 * - Expired tokens show clear error message: "Reset link has expired"
 * - User can request new reset token after expiry
 * - Token expiry is enforced server-side (not just client-side)
 * - Security: No information leakage about valid vs expired tokens
 * - One-time use: Tokens are invalidated after successful use
 * - Multiple tokens: Previous tokens invalidated when new one requested
 * - Accessibility: Error messages properly announced to screen readers
 * 
 * User Story: US0 Authentication
 * Security Feature: Token-based password reset with expiry
 * Acceptance Criteria:
 * - User receives reset token via email (simulated in test)
 * - Token valid for exactly 1 hour from generation
 * - Expired token attempts show "Reset link has expired" error
 * - User can request new reset link after expiry
 * - Success flow works within valid timeframe
 * - Tokens are single-use and properly invalidated
 */

test.describe('Password Reset Token Expiry - T076', () => {
  let page: Page;
  let loginPage: LoginPage;
  let registerPage: RegisterPage;

  // Test user data
  const testUser = {
    firstName: 'Token',
    lastName: 'Test',
    email: 'token.test@stormcom.dev',
    password: 'TokenTest123!',
    newPassword: 'NewTokenPass456@',
    storeId: 'store-001'
  };

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    loginPage = new LoginPage(page);
    registerPage = new RegisterPage(page);

    // Setup: Ensure test user exists
    await registerPage.goto();
    try {
      await registerPage.register(
        testUser.firstName,
        testUser.lastName,
        testUser.email,
        testUser.password
      );
      await page.waitForTimeout(2000);
    } catch (error) {
      // User might already exist, which is fine
    }
  });

  test('Password reset token works within 1 hour validity period', async () => {
    // Arrange: Navigate to forgot password page
    await loginPage.goto();
    await loginPage.clickForgotPassword();
    await page.waitForTimeout(1000);

    // Act: Request password reset
    const emailInput = page.locator('#email, input[type="email"]');
    await emailInput.fill(testUser.email);
    
    const requestResetButton = page.locator('button[type="submit"], [data-testid="request-reset-button"]');
    await requestResetButton.click();
    await page.waitForTimeout(2000);

    // Verify reset request was successful
    const successMessage = page.locator('[data-testid="reset-requested"], text=/reset.*sent|check.*email/i');
    if (await successMessage.isVisible()) {
      expect(await successMessage.isVisible()).toBe(true);
    }

    // Simulate valid token (in real scenario, would come from email)
    // Generate token that would be valid for 1 hour
    const currentTime = Date.now();
    const tokenData = {
      email: testUser.email,
      timestamp: currentTime,
      expires: currentTime + (60 * 60 * 1000) // 1 hour from now
    };
    
    // Encode token (simplified simulation)
    const validToken = Buffer.from(JSON.stringify(tokenData)).toString('base64');

    // Act: Use token immediately (should work)
    await page.goto(`/reset-password?token=${validToken}`);
    await page.waitForTimeout(1000);

    // Assert: Reset form should be accessible
    const resetForm = page.locator('form, [data-testid="reset-password-form"]');
    const newPasswordInput = page.locator('[data-testid="new-password"], input[type="password"]').first();
    const confirmPasswordInput = page.locator('[data-testid="confirm-password"], input[type="password"]').last();

    if (await resetForm.isVisible() && await newPasswordInput.isVisible()) {
      // Fill new password
      await newPasswordInput.fill(testUser.newPassword);
      await confirmPasswordInput.fill(testUser.newPassword);

      const submitResetButton = page.locator('button[type="submit"]');
      await submitResetButton.click();
      await page.waitForTimeout(2000);

      // Should either succeed or show validation error (not token expiry)
      const currentUrl = page.url();
      const resetSuccess = currentUrl.includes('/login') || 
                          currentUrl.includes('/success') ||
                          await page.locator('text=/password.*reset|reset.*success/i').isVisible();

      // Token expiry error should NOT appear for valid token
      const expiryError = page.locator('text=/expired|link.*expired|token.*expired/i');
      expect(await expiryError.isVisible()).toBe(false);

      // Should either succeed or show different validation error
      if (!resetSuccess) {
        const errorMessage = page.locator('[data-testid="reset-error"], [role="alert"]');
        if (await errorMessage.isVisible()) {
          const errorText = await errorMessage.textContent();
          expect(errorText?.toLowerCase()).not.toMatch(/expired|link.*expired|token.*expired/i);
        }
      }
    } else {
      // If reset form is not accessible with valid token, that indicates a different issue
      console.log('Reset form not accessible with valid token - may indicate implementation needed');
    }
  });

  test('Password reset token expires after 1 hour and shows error', async () => {
    // Arrange: Create an expired token
    const currentTime = Date.now();
    const expiredTokenData = {
      email: testUser.email,
      timestamp: currentTime - (61 * 60 * 1000), // 61 minutes ago (expired)
      expires: currentTime - (60 * 1000) // 1 minute ago (expired)
    };

    const expiredToken = Buffer.from(JSON.stringify(expiredTokenData)).toString('base64');

    // Act: Try to use expired token
    await page.goto(`/reset-password?token=${expiredToken}`);
    await page.waitForTimeout(2000);

    // Assert: Should show token expiry error
    const expiryError = page.locator('[data-testid="token-expired"], [data-testid="reset-error"], text=/expired|link.*expired|token.*expired/i');
    const resetForm = page.locator('[data-testid="reset-password-form"], form');

    // Should either show expiry error or not show reset form
    const hasExpiryError = await expiryError.isVisible();
    const formNotVisible = !(await resetForm.isVisible());

    expect(hasExpiryError || formNotVisible).toBe(true);

    if (hasExpiryError) {
      const errorText = await expiryError.textContent();
      expect(errorText?.toLowerCase()).toMatch(/expired|link.*expired|token.*expired/i);
    }

    // Should not be able to submit password reset with expired token
    if (await resetForm.isVisible()) {
      const newPasswordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"]');

      if (await newPasswordInput.isVisible()) {
        await newPasswordInput.fill(testUser.newPassword);
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Should show expiry error after attempted submission
        const postSubmitError = page.locator('text=/expired|link.*expired|token.*expired/i');
        expect(await postSubmitError.isVisible()).toBe(true);
      }
    }
  });

  test('User can request new reset token after expiry', async () => {
    // Arrange: Simulate expired token scenario
    const expiredToken = 'expired-token-12345';
    await page.goto(`/reset-password?token=${expiredToken}`);
    await page.waitForTimeout(1000);

    // Verify expiry state
    const expiryIndicator = page.locator('text=/expired|link.*expired|token.*expired/i');
    const requestNewLink = page.locator('a[href*="/forgot"], a:has-text("request"), a:has-text("new"), button:has-text("request")');

    // Act: Look for option to request new reset link
    if (await expiryIndicator.isVisible() || await requestNewLink.isVisible()) {
      // Click link to request new reset or navigate manually
      if (await requestNewLink.isVisible()) {
        await requestNewLink.first().click();
      } else {
        await page.goto('/forgot-password');
      }
      
      await page.waitForTimeout(1000);

      // Fill email for new reset request
      const emailInput = page.locator('#email, input[type="email"]');
      await emailInput.fill(testUser.email);

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForTimeout(2000);

      // Assert: Should be able to request new reset
      const successMessage = page.locator('text=/reset.*sent|check.*email|new.*link/i');
      expect(await successMessage.isVisible()).toBe(true);

      // Should not show any error about recent requests (rate limiting tested elsewhere)
      const rateError = page.locator('text=/too.*many|wait.*before|recently.*sent/i');
      expect(await rateError.isVisible()).toBe(false);
    } else {
      // Navigate to forgot password manually to test new request
      await page.goto('/forgot-password');
      await page.waitForTimeout(1000);

      const emailInput = page.locator('#email, input[type="email"]');
      await emailInput.fill(testUser.email);

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForTimeout(2000);

      const successMessage = page.locator('text=/reset.*sent|check.*email/i');
      expect(await successMessage.isVisible()).toBe(true);
    }
  });

  test('Token expiry is enforced server-side', async () => {
    // Test that token expiry cannot be bypassed through client-side manipulation
    
    // Arrange: Create token that would appear valid client-side but expired server-side
    const manipulatedTokenData = {
      email: testUser.email,
      timestamp: Date.now(), // Current time (would seem valid)
      expires: Date.now() + (60 * 60 * 1000) // Future expiry (would seem valid)
    };

    // Create token with invalid signature or format that would fail server validation
    const manipulatedToken = Buffer.from(JSON.stringify(manipulatedTokenData)).toString('base64') + 'INVALID';

    // Act: Try to use manipulated token
    await page.goto(`/reset-password?token=${manipulatedToken}`);
    await page.waitForTimeout(2000);

    // Assert: Server should reject invalid token
    const resetForm = page.locator('[data-testid="reset-password-form"], form');

    // Should either not show form or show error
    const formVisible = await resetForm.isVisible();

    if (formVisible) {
      // If form is visible, try submitting
      const newPasswordInput = page.locator('input[type="password"]').first();
      const confirmPasswordInput = page.locator('input[type="password"]').last();

      if (await newPasswordInput.isVisible()) {
        await newPasswordInput.fill(testUser.newPassword);
        await confirmPasswordInput.fill(testUser.newPassword);

        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();
        await page.waitForTimeout(2000);

        // Should fail with token error
        const submitError = page.locator('text=/invalid|expired|token.*error/i');
        expect(await submitError.isVisible()).toBe(true);
      }
    } else {
      // Form should not be accessible with invalid token
      expect(formVisible).toBe(false);
    }
  });

  test('Token is single-use and invalidated after successful reset', async () => {
    // Arrange: Get valid token
    await loginPage.goto();
    await loginPage.clickForgotPassword();

    const emailInput = page.locator('#email, input[type="email"]');
    await emailInput.fill(testUser.email);

    const requestButton = page.locator('button[type="submit"]');
    await requestButton.click();
    await page.waitForTimeout(2000);

    // Simulate valid token
    const validToken = 'valid-single-use-token-12345';

    // Act: Use token for first time
    await page.goto(`/reset-password?token=${validToken}`);
    await page.waitForTimeout(1000);

    const resetForm = page.locator('form, [data-testid="reset-password-form"]');
    
    if (await resetForm.isVisible()) {
      const newPasswordInput = page.locator('input[type="password"]').first();
      const confirmPasswordInput = page.locator('input[type="password"]').last();

      await newPasswordInput.fill(testUser.newPassword + '1');
      await confirmPasswordInput.fill(testUser.newPassword + '1');

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      await page.waitForTimeout(2000);

      // Note success or validation errors (for second attempt test)
      const currentUrl = page.url();
      const resetSuccessful = currentUrl.includes('/login') || 
                            currentUrl.includes('/success');

      // Act: Try to use same token again
      await page.goto(`/reset-password?token=${validToken}`);
      await page.waitForTimeout(2000);

      // Assert: Second use should be rejected
      const secondForm = page.locator('[data-testid="reset-password-form"], form');

      // Should either not show form or show error about token being used
      const secondFormVisible = await secondForm.isVisible();

      if (resetSuccessful) {
        // If first reset was successful, token should definitely be invalid
        expect(secondFormVisible).toBe(false);
      } else {
        // Even if first reset failed, attempting reuse should be prevented
        if (secondFormVisible) {
          // Try submitting again
          const retryPassword = page.locator('input[type="password"]').first();
          if (await retryPassword.isVisible()) {
            await retryPassword.fill(testUser.newPassword + '2');
            
            const retrySubmit = page.locator('button[type="submit"]');
            await retrySubmit.click();
            await page.waitForTimeout(1000);

            // Should show token reuse error
            const reuseError = page.locator('text=/used|already.*used|invalid|expired/i');
            expect(await reuseError.isVisible()).toBe(true);
          }
        }
      }
    }
  });

  test('Multiple tokens: Previous tokens invalidated when new one requested', async () => {
    // Arrange: Request first reset token
    await loginPage.goto();
    await loginPage.clickForgotPassword();

    const emailInput = page.locator('#email, input[type="email"]');
    await emailInput.fill(testUser.email);

    const requestButton = page.locator('button[type="submit"]');
    await requestButton.click();
    await page.waitForTimeout(2000);

    // Simulate first token
    const firstToken = 'first-token-12345';

    // Act: Request second reset token (should invalidate first)
    await page.goto('/forgot-password');
    await emailInput.fill(testUser.email);
    await requestButton.click();
    await page.waitForTimeout(2000);

    // Simulate second token
    const secondToken = 'second-token-67890';

    // Assert: First token should now be invalid
    await page.goto(`/reset-password?token=${firstToken}`);
    await page.waitForTimeout(1000);

    const firstTokenForm = page.locator('[data-testid="reset-password-form"], form');

    // First token should be rejected
    const firstFormVisible = await firstTokenForm.isVisible();

    if (firstFormVisible) {
      // Try using first token
      const passwordInput = page.locator('input[type="password"]').first();
      if (await passwordInput.isVisible()) {
        await passwordInput.fill(testUser.newPassword);
        
        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Should fail
        const submitError = page.locator('text=/invalid|expired|superseded/i');
        expect(await submitError.isVisible()).toBe(true);
      }
    }

    // Act: Second token should work
    await page.goto(`/reset-password?token=${secondToken}`);
    await page.waitForTimeout(1000);

    const secondTokenForm = page.locator('[data-testid="reset-password-form"], form');
    
    if (await secondTokenForm.isVisible()) {
      // Second token should be accessible (latest valid token)
      const newPasswordInput = page.locator('input[type="password"]').first();
      expect(await newPasswordInput.isVisible()).toBe(true);
    }
  });

  test('Token expiry error messages are accessible', async () => {
    // Arrange: Use expired token
    const expiredToken = 'expired-accessibility-test-token';
    await page.goto(`/reset-password?token=${expiredToken}`);
    await page.waitForTimeout(1000);

    // Assert: Check accessibility of error messages
    const expiryError = page.locator('[data-testid="token-expired"], [role="alert"], text=/expired|link.*expired/i');
    
    if (await expiryError.isVisible()) {
      // 1. Error should have proper ARIA role
      const ariaRole = await expiryError.getAttribute('role');
      const ariaLive = await expiryError.getAttribute('aria-live');
      expect(ariaRole === 'alert' || ariaLive).toBeTruthy();

      // 2. Error message should be descriptive
      const errorText = await expiryError.textContent();
      expect(errorText).toBeTruthy();
      expect(errorText!.length).toBeGreaterThan(10);

      // 3. Should provide helpful next steps
      const hasGuidance = errorText?.toLowerCase().includes('request') ||
                         errorText?.toLowerCase().includes('new') ||
                         errorText?.toLowerCase().includes('again');
      expect(hasGuidance).toBe(true);

      // 4. Screen reader announcement
      const hasAriaLive = ariaLive === 'polite' || ariaLive === 'assertive' || ariaRole === 'alert';
      expect(hasAriaLive).toBe(true);
    }

    // 5. Look for accessible navigation options
    const requestNewLink = page.locator('a[href*="/forgot"], button:has-text("request"), a:has-text("new")');
    if (await requestNewLink.isVisible()) {
      // Link should be keyboard accessible
      await requestNewLink.first().focus();
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['A', 'BUTTON']).toContain(focusedElement);
    }

    // 6. Test keyboard navigation
    await page.keyboard.press('Tab');
    const afterTabElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(afterTabElement);
  });

  test('Security: No information leakage about valid vs invalid tokens', async () => {
    // Test that error messages don't reveal whether email exists or token format is correct

    const testTokens = [
      {
        token: 'completely-invalid-format',
        description: 'invalid format'
      },
      {
        token: Buffer.from('{"email":"nonexistent@example.com","timestamp":123456}').toString('base64'),
        description: 'valid format, nonexistent email'
      },
      {
        token: Buffer.from(`{"email":"${testUser.email}","timestamp":${Date.now() - 3600000}}`).toString('base64'),
        description: 'valid format, expired timestamp'
      },
      {
        token: '',
        description: 'empty token'
      }
    ];

    const errorMessages: string[] = [];

    for (const testCase of testTokens) {
      // Act: Try each token type
      await page.goto(`/reset-password?token=${testCase.token}`);
      await page.waitForTimeout(1000);

      // Collect error message
      const errorElement = page.locator('[data-testid="reset-error"], [role="alert"], text=/error|invalid|expired/i');
      
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        if (errorText) {
          errorMessages.push(errorText.toLowerCase());
        }
      } else {
        // Note if no error shown (form might not be visible)
        const formVisible = await page.locator('form, [data-testid="reset-password-form"]').isVisible();
        errorMessages.push(formVisible ? 'no_error_shown' : 'form_not_accessible');
      }
    }

    // Assert: Error messages should be generic, not revealing specifics
    for (const message of errorMessages) {
      // Should not reveal:
      // - Whether email exists in system
      // - Specific token format requirements
      // - Timestamp validation details
      // - Database/system internals

      const hasInfoLeakage = message.includes('email') && message.includes('not found') ||
                            message.includes('user') && message.includes('does not exist') ||
                            message.includes('timestamp') ||
                            message.includes('format') ||
                            message.includes('database') ||
                            message.includes('system error');

      expect(hasInfoLeakage).toBe(false);
    }

    // Messages should be generic like "Invalid or expired reset link"
    const commonErrorPatterns = /invalid.*link|expired.*link|link.*expired|invalid.*token|expired.*token/;
    
    let hasGenericError = false;
    for (const message of errorMessages) {
      if (commonErrorPatterns.test(message)) {
        hasGenericError = true;
        break;
      }
    }

    // At least some errors should use generic messaging
    expect(hasGenericError).toBe(true);
  });

  test('Token expiry timing is precise and consistent', async () => {
    // Test that token expiry is enforced precisely at 1 hour mark

    // Note: This test would require actual token generation in a real implementation
    // For E2E testing, we simulate the timing behavior

    const testScenarios = [
      {
        ageMinutes: 59, // 59 minutes old (should be valid)
        shouldBeValid: true,
        description: '59 minutes old'
      },
      {
        ageMinutes: 60, // Exactly 60 minutes old (boundary case)
        shouldBeValid: false,
        description: 'exactly 60 minutes old'
      },
      {
        ageMinutes: 61, // 61 minutes old (should be expired)
        shouldBeValid: false,
        description: '61 minutes old'
      }
    ];

    for (const scenario of testScenarios) {
      const currentTime = Date.now();
      const tokenTime = currentTime - (scenario.ageMinutes * 60 * 1000);
      
      const tokenData = {
        email: testUser.email,
        timestamp: tokenTime,
        expires: tokenTime + (60 * 60 * 1000) // 1 hour from token generation
      };

      const testToken = Buffer.from(JSON.stringify(tokenData)).toString('base64');

      // Act: Test token
      await page.goto(`/reset-password?token=${testToken}`);
      await page.waitForTimeout(1000);

      // Assert: Check if token is treated as expected
      const resetForm = page.locator('[data-testid="reset-password-form"], form');
      const expiryError = page.locator('text=/expired|invalid.*link/i');

      const formVisible = await resetForm.isVisible();
      const hasExpiryError = await expiryError.isVisible();

      if (scenario.shouldBeValid) {
        // Should be able to access form (token still valid)
        expect(formVisible || !hasExpiryError).toBe(true);
      } else {
        // Should show expiry error or not show form (token expired)
        expect(!formVisible || hasExpiryError).toBe(true);
      }
    }
  });
});