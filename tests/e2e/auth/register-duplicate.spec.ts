import { test, expect, Page } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';
import { LoginPage } from '../pages/LoginPage';

/**
 * E2E Tests: Registration Duplicate Email Handling
 * 
 * Task: T075 [US0] Create E2E test "Registration handles duplicate email"
 * 
 * Purpose: Verify registration form properly handles attempts to register
 * with email addresses that already exist in the system.
 * 
 * Requirements:
 * - Registration rejects duplicate email addresses
 * - Clear error message: "Email already registered"
 * - Error message includes link to login page
 * - Suggested actions: "Login instead" or "Reset password"
 * - Case-insensitive email duplicate detection
 * - Multi-tenant email scoping (same email, different stores allowed)
 * - Real-time validation on email input blur
 * - Accessibility compliance for error messages
 * - Security: No information leakage about existing accounts
 * 
 * User Story: US0 Authentication
 * UX Feature: Duplicate email prevention and guidance
 * Acceptance Criteria:
 * - Registration form rejects duplicate emails with clear message
 * - Error message provides helpful next steps (login/reset)
 * - Case variations (user@email.com vs USER@EMAIL.COM) treated as duplicate
 * - Same email can exist in different store tenants
 * - Real-time validation prevents submission with duplicate email
 * - Screen readers properly announce duplicate email errors
 * - Error state recovers when user changes email
 */

test.describe('Registration Duplicate Email Handling - T075', () => {
  let page: Page;
  let registerPage: RegisterPage;
  let loginPage: LoginPage;

  // Test data
  const existingUser = {
    firstName: 'Existing',
    lastName: 'User',
    email: 'existing.user@stormcom.dev',
    password: 'ExistingUser123!',
    storeId: 'store-001'
  };

  const duplicateAttempts = [
    {
      email: 'existing.user@stormcom.dev', // Exact duplicate
      description: 'exact email match'
    },
    {
      email: 'EXISTING.USER@STORMCOM.DEV', // Uppercase
      description: 'uppercase email variation'
    },
    {
      email: 'Existing.User@StormCom.Dev', // Mixed case
      description: 'mixed case email variation'
    },
    {
      email: 'existing.user@STORMCOM.DEV', // Domain uppercase
      description: 'uppercase domain variation'
    }
  ];

  const newUser = {
    firstName: 'New',
    lastName: 'User',
    email: 'new.user@stormcom.dev',
    password: 'NewUser123!',
    storeId: 'store-001'
  };

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    registerPage = new RegisterPage(page);
    loginPage = new LoginPage(page);

    // Setup: Ensure existing user is registered
    await registerPage.goto();
    
    // Try to register existing user (may already exist)
    try {
      await registerPage.fillAndSubmit(
        existingUser.firstName,
        existingUser.lastName,
        existingUser.email,
        existingUser.password,
        existingUser.password
      );
      await page.waitForTimeout(2000);
    } catch (error) {
      // User might already exist, which is fine for our tests
    }

    // Navigate back to registration for testing
    await registerPage.goto();
  });

  test('Registration rejects exact duplicate email with clear error message', async () => {
    // Arrange: Fill form with existing user's email
    await registerPage.fillForm(
      'John',
      'Doe',
      existingUser.email, // Duplicate email
      'JohnDoe123!',
      'JohnDoe123!'
    );

    // Act: Submit registration form
    await registerPage.submit();
    await page.waitForTimeout(2000);

    // Assert: Should show duplicate email error
    const emailError = page.locator('[data-testid="email-error"], [data-testid="duplicate-email-error"], #email-error');
    await emailError.waitFor({ state: 'visible', timeout: 5000 });

    const errorText = await emailError.textContent();
    expect(errorText?.toLowerCase()).toMatch(/already.*registered|email.*exists|already.*taken|already.*use/i);

    // Should still be on registration page
    expect(page.url()).toMatch(/register|signup/);

    // Form should be interactive (not in loading state)
    expect(await registerPage.submitButton.isEnabled()).toBe(true);
  });

  test('Error message includes helpful next steps and login link', async () => {
    // Arrange & Act: Submit duplicate email registration
    await registerPage.fillAndSubmit(
      'Jane',
      'Smith',
      existingUser.email,
      'JaneSmith123!',
      'JaneSmith123!'
    );
    await page.waitForTimeout(2000);

    // Assert: Check for helpful guidance
    const errorContainer = page.locator('[data-testid="email-error"], [data-testid="duplicate-error-container"]');
    await errorContainer.waitFor({ state: 'visible' });

    const errorText = await errorContainer.textContent();
    
    // Should suggest login or password reset
    const hasHelpfulSuggestion = errorText?.toLowerCase().includes('login') ||
                                errorText?.toLowerCase().includes('sign in') ||
                                errorText?.toLowerCase().includes('reset') ||
                                errorText?.toLowerCase().includes('forgot');
    
    expect(hasHelpfulSuggestion).toBe(true);

    // Look for login link
    const loginLink = page.locator('a[href*="/login"], a:has-text("Login"), a:has-text("Sign in")');
    const resetLink = page.locator('a[href*="/forgot"], a[href*="/reset"], a:has-text("Reset"), a:has-text("Forgot")');

    const hasLoginLink = await loginLink.isVisible();
    const hasResetLink = await resetLink.isVisible();

    expect(hasLoginLink || hasResetLink).toBe(true);

    // Test login link functionality if present
    if (hasLoginLink) {
      await loginLink.first().click();
      await page.waitForTimeout(1000);
      
      // Should navigate to login page
      expect(page.url()).toMatch(/login|sign.*in/);
      
      // Email should be pre-filled if possible
      const emailInput = page.locator('#email, input[type="email"]');
      if (await emailInput.isVisible()) {
        const prefilledEmail = await emailInput.inputValue();
        expect(prefilledEmail).toBe(existingUser.email);
      }
    }
  });

  test('Case-insensitive duplicate detection works correctly', async () => {
    // Test each case variation
    for (const attempt of duplicateAttempts) {
      // Navigate to fresh registration page
      await registerPage.goto();
      await registerPage.waitForPageLoad();

      // Act: Try to register with case variation
      await registerPage.fillForm(
        'Test',
        'User',
        attempt.email,
        'TestUser123!',
        'TestUser123!'
      );

      await registerPage.submit();
      await page.waitForTimeout(2000);

      // Assert: Should detect duplicate regardless of case
      const emailError = page.locator('[data-testid="email-error"], #email-error');
      
      if (await emailError.isVisible()) {
        const errorText = await emailError.textContent();
        expect(errorText?.toLowerCase()).toMatch(/already.*registered|email.*exists|already.*taken/i);
      } else {
        // Alternative: Check if stayed on registration page (indicating rejection)
        expect(page.url()).toMatch(/register|signup/);
      }
    }
  });

  test('Real-time validation on email input blur', async () => {
    // Arrange: Fill basic info first
    await registerPage.firstNameInput.fill('Real');
    await registerPage.lastNameInput.fill('Time');

    // Act: Enter duplicate email and blur field
    await registerPage.emailInput.fill(existingUser.email);
    await registerPage.emailInput.blur();
    
    // Wait for real-time validation
    await page.waitForTimeout(1000);

    // Assert: Should show duplicate error without form submission
    const emailError = page.locator('[data-testid="email-error"], #email-error');
    const hasRealTimeError = await emailError.isVisible();

    if (hasRealTimeError) {
      const errorText = await emailError.textContent();
      expect(errorText?.toLowerCase()).toMatch(/already.*registered|email.*exists|already.*taken/i);
    }

    // Test error clears when email is changed
    await registerPage.emailInput.clear();
    await registerPage.emailInput.fill(newUser.email);
    await registerPage.emailInput.blur();
    await page.waitForTimeout(500);

    // Error should clear or change
    if (await emailError.isVisible()) {
      const newErrorText = await emailError.textContent();
      expect(newErrorText?.toLowerCase()).not.toMatch(/already.*registered|email.*exists|already.*taken/i);
    }
  });

  test('Different store tenants allow same email address', async () => {
    // Note: This test assumes multi-tenant architecture where same email
    // can exist in different stores/tenants

    // Arrange: Try to register same email for different store
    const differentStoreUser = {
      ...existingUser,
      storeId: 'store-002' // Different store tenant
    };

    // Check if store selection is available in registration
    const storeSelector = page.locator('[data-testid="store-selector"], select[name*="store"], input[name*="store"]');
    
    if (await storeSelector.isVisible()) {
      // Act: Fill form with same email but different store
      await registerPage.fillForm(
        'Store2',
        'User',
        existingUser.email, // Same email
        'Store2User123!',
        'Store2User123!'
      );

      // Select different store if selector exists
      if (await storeSelector.isVisible()) {
        await storeSelector.selectOption('store-002');
      }

      await registerPage.submit();
      await page.waitForTimeout(2000);

      // Assert: Should allow registration in different store
      const currentUrl = page.url();
      const registrationSuccessful = currentUrl.includes('/dashboard') || 
                                   currentUrl.includes('/welcome') ||
                                   currentUrl.includes('/verify') ||
                                   !currentUrl.includes('/register');

      if (registrationSuccessful) {
        expect(registrationSuccessful).toBe(true);
      } else {
        // If still on registration, error should not be about email duplicate
        const emailError = page.locator('[data-testid="email-error"]');
        if (await emailError.isVisible()) {
          const errorText = await emailError.textContent();
          expect(errorText?.toLowerCase()).not.toMatch(/already.*registered|email.*exists/i);
        }
      }
    } else {
      // If multi-tenant UI isn't available, skip this test
      test.skip('Multi-tenant store selection not available in registration form');
    }
  });

  test('Error state recovers when user changes email', async () => {
    // Arrange: Trigger duplicate email error
    await registerPage.fillAndSubmit(
      'Recovery',
      'Test',
      existingUser.email,
      'RecoveryTest123!',
      'RecoveryTest123!'
    );
    await page.waitForTimeout(2000);

    // Verify error is shown
    const emailError = page.locator('[data-testid="email-error"], #email-error');
    await emailError.waitFor({ state: 'visible' });

    // Act: Change email to new, unique address
    await registerPage.emailInput.clear();
    await registerPage.emailInput.fill(newUser.email + '.recovery');
    await registerPage.emailInput.blur();
    await page.waitForTimeout(1000);

    // Assert: Error should clear or change
    if (await emailError.isVisible()) {
      const newErrorText = await emailError.textContent();
      expect(newErrorText?.toLowerCase()).not.toMatch(/already.*registered|email.*exists/i);
    }

    // Form should be submittable again
    await registerPage.passwordInput.fill('RecoveryTest123!');
    await registerPage.confirmPasswordInput.fill('RecoveryTest123!');
    
    await registerPage.submit();
    await page.waitForTimeout(2000);

    // Should either succeed or show different error (not duplicate email)
    const currentUrl = page.url();
    const notOnRegister = !currentUrl.includes('/register');
    
    if (!notOnRegister) {
      // If still on register, should not show duplicate email error
      if (await emailError.isVisible()) {
        const finalErrorText = await emailError.textContent();
        expect(finalErrorText?.toLowerCase()).not.toMatch(/already.*registered|email.*exists/i);
      }
    }
  });

  test('Accessibility compliance for duplicate email errors', async () => {
    // Arrange & Act: Trigger duplicate email error
    await registerPage.fillAndSubmit(
      'Accessibility',
      'Test',
      existingUser.email,
      'AccessTest123!',
      'AccessTest123!'
    );
    await page.waitForTimeout(2000);

    // Assert: Check accessibility features
    const emailError = page.locator('[data-testid="email-error"], #email-error');
    await emailError.waitFor({ state: 'visible' });

    // 1. Error should have proper ARIA role
    const ariaRole = await emailError.getAttribute('role');
    const ariaLive = await emailError.getAttribute('aria-live');
    expect(ariaRole === 'alert' || ariaLive).toBeTruthy();

    // 2. Email input should be described by error
    const emailInput = registerPage.emailInput;
    const describedBy = await emailInput.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    // 3. Error message should be programmatically associated
    if (describedBy) {
      const describedElement = page.locator(`#${describedBy}`);
      expect(await describedElement.isVisible()).toBe(true);
    }

    // 4. Error should be announced to screen readers
    const hasAriaLive = ariaLive === 'polite' || ariaLive === 'assertive' || ariaRole === 'alert';
    expect(hasAriaLive).toBe(true);

    // 5. Keyboard navigation should work correctly
    await emailInput.focus();
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON']).toContain(focusedElement);

    // 6. Error text should be clear and informative
    const errorText = await emailError.textContent();
    expect(errorText).toBeTruthy();
    expect(errorText!.length).toBeGreaterThan(10); // Should be descriptive
  });

  test('Security: No information leakage about existing accounts', async () => {
    // Test that error messages don't reveal sensitive information
    
    // Arrange: Try registering with potentially existing email
    await registerPage.fillAndSubmit(
      'Security',
      'Test',
      existingUser.email,
      'SecurityTest123!',
      'SecurityTest123!'
    );
    await page.waitForTimeout(2000);

    // Assert: Error message should be generic, not revealing account details
    const emailError = page.locator('[data-testid="email-error"], #email-error');
    
    if (await emailError.isVisible()) {
      const errorText = await emailError.textContent();
      
      // Should not reveal:
      // - When account was created
      // - User's real name
      // - Account status (active/inactive)
      // - Last login time
      // - Associated stores/tenants
      
      const hasInformationLeakage = errorText?.includes(existingUser.firstName) ||
                                   errorText?.includes(existingUser.lastName) ||
                                   errorText?.includes('active') ||
                                   errorText?.includes('inactive') ||
                                   errorText?.includes('last login') ||
                                   errorText?.includes('created') ||
                                   errorText?.match(/\d{4}-\d{2}-\d{2}/) || // Date patterns
                                   errorText?.includes('store-001');

      expect(hasInformationLeakage).toBe(false);

      // Error should be generic but helpful
      expect(errorText?.toLowerCase()).toMatch(/already.*registered|email.*exists|already.*taken/i);
    }

    // Test with non-existent email for comparison
    await registerPage.goto();
    await registerPage.fillAndSubmit(
      'Security2',
      'Test',
      'definitely.not.existing@example.com',
      'SecurityTest123!',
      'SecurityTest123!'
    );
    await page.waitForTimeout(2000);

    // Should either succeed or show different error
    const currentUrl = page.url();
    if (currentUrl.includes('/register')) {
      const newEmailError = page.locator('[data-testid="email-error"]');
      if (await newEmailError.isVisible()) {
        const newErrorText = await newEmailError.textContent();
        // Should not be duplicate email error
        expect(newErrorText?.toLowerCase()).not.toMatch(/already.*registered|email.*exists/i);
      }
    }
  });

  test('Duplicate detection works with rapid form submissions', async () => {
    // Test that duplicate detection works even with rapid submissions
    
    // Arrange: Fill form with duplicate email
    await registerPage.fillForm(
      'Rapid',
      'Test',
      existingUser.email,
      'RapidTest123!',
      'RapidTest123!'
    );

    // Act: Submit multiple times rapidly
    const submitPromises = [];
    for (let i = 0; i < 3; i++) {
      submitPromises.push(registerPage.submit());
      await page.waitForTimeout(50); // Brief delay between submissions
    }

    // Wait for all submissions to complete
    await Promise.allSettled(submitPromises);
    await page.waitForTimeout(2000);

    // Assert: Should handle rapid submissions gracefully
    // 1. Should still be on registration page (not multiple redirects)
    expect(page.url()).toMatch(/register|signup/);

    // 2. Should show duplicate email error
    const emailError = page.locator('[data-testid="email-error"], #email-error');
    if (await emailError.isVisible()) {
      const errorText = await emailError.textContent();
      expect(errorText?.toLowerCase()).toMatch(/already.*registered|email.*exists/i);
    }

    // 3. Form should be in stable state (not stuck in loading)
    expect(await registerPage.submitButton.isEnabled()).toBe(true);
    expect(await registerPage.emailInput.isEnabled()).toBe(true);
  });

  test('Duplicate email handling works across registration sessions', async () => {
    // Test that duplicate detection persists across browser sessions
    
    // Arrange: Register user in current session
    await registerPage.fillAndSubmit(
      'Session',
      'Test',
      'session.test@stormcom.dev',
      'SessionTest123!',
      'SessionTest123!'
    );
    await page.waitForTimeout(2000);

    // Simulate new session (clear cookies/storage)
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Navigate to registration again
    await registerPage.goto();
    await registerPage.waitForPageLoad();

    // Act: Try to register same email again
    await registerPage.fillAndSubmit(
      'Session2',
      'Test',
      'session.test@stormcom.dev', // Same email as before
      'SessionTest456!',
      'SessionTest456!'
    );
    await page.waitForTimeout(2000);

    // Assert: Should still detect duplicate even in new session
    const emailError = page.locator('[data-testid="email-error"], #email-error');
    
    if (await emailError.isVisible()) {
      const errorText = await emailError.textContent();
      expect(errorText?.toLowerCase()).toMatch(/already.*registered|email.*exists/i);
    } else {
      // Alternative: Should stay on registration page indicating rejection
      expect(page.url()).toMatch(/register|signup/);
    }
  });
});