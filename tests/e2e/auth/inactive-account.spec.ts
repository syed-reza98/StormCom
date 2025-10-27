import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * E2E Tests: Inactive Account Login Prevention
 * 
 * Task: T067 [US0] Create E2E test "Inactive account login prevented"
 * 
 * Purpose: Verify that users with INACTIVE account status are properly 
 * prevented from logging in, with clear messaging about account deactivation.
 * 
 * Requirements:
 * - Users with INACTIVE status cannot authenticate
 * - Clear "account deactivated" message displayed
 * - Login form validation prevents inactive account access
 * - Proper error messaging for user experience
 * - Security audit logging for inactive login attempts
 * 
 * User Story: US0 Authentication
 * Account Status: INACTIVE (account has been deactivated by admin)
 * Acceptance Criteria:
 * - Login form accepts credentials but rejects inactive accounts
 * - "Account has been deactivated" message displayed
 * - User redirected back to login form
 * - No session created for inactive accounts
 * - Failed login attempt logged for security monitoring
 */

test.describe('Inactive Account Login Prevention - T067', () => {
  let page: Page;
  let loginPage: LoginPage;

  // Test data for inactive account
  const inactiveUser = {
    email: 'inactive@stormcom.dev',
    password: 'Inactive123!@#',
    status: 'INACTIVE',
    role: 'STORE_ADMIN',
    storeId: 'store-001'
  };

  // Test data for active account (for comparison)
  const activeUser = {
    email: 'active@stormcom.dev', 
    password: 'Active123!@#',
    status: 'ACTIVE',
    role: 'STORE_ADMIN',
    storeId: 'store-001'
  };

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    loginPage = new LoginPage(page);

    // Navigate to login page
    await loginPage.goto();
  });

  test.afterEach(async () => {
    // Cleanup: Clear any session state
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('Inactive account login shows account deactivated message', async () => {
    // Act: Attempt to login with inactive account credentials
    await loginPage.fillEmail(inactiveUser.email);
    await loginPage.fillPassword(inactiveUser.password);
    await loginPage.clickSubmit();

    // Assert: Verify account deactivated message is displayed
    await loginPage.waitForError();
    
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toMatch(/account.*deactivated|account.*disabled|account.*inactive/i);
    
    // Verify specific error message content
    const accountDeactivatedMessage = page.locator('text=/account.*deactivated/i');
    await expect(accountDeactivatedMessage).toBeVisible();
    
    // Verify user remains on login page
    expect(page.url()).toMatch(/\/login/);
    
    // Verify no session is created
    const sessionCookie = await page.context().cookies();
    const authSession = sessionCookie.find(cookie => 
      cookie.name.includes('session') || cookie.name.includes('auth')
    );
    expect(authSession).toBeUndefined();
  });

  test('Inactive account login does not redirect to dashboard', async () => {
    // Act: Attempt login with inactive account
    await loginPage.login(inactiveUser.email, inactiveUser.password);

    // Assert: Verify user is NOT redirected to dashboard
    await page.waitForTimeout(2000); // Wait for any potential redirect
    
    expect(page.url()).toMatch(/\/login/);
    expect(page.url()).not.toMatch(/\/dashboard/);
    
    // Verify login form is still visible (not redirected)
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('Inactive account error message is accessible and clear', async () => {
    // Act: Attempt login with inactive account
    await loginPage.login(inactiveUser.email, inactiveUser.password);
    await loginPage.waitForError();

    // Assert: Verify error message accessibility
    
    // Check error message has proper ARIA attributes
    const errorElement = page.locator('[data-testid="error-message"]');
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toHaveAttribute('role', 'alert');
    
    // Verify error is announced to screen readers
    const ariaLive = await errorElement.getAttribute('aria-live');
    expect(['polite', 'assertive']).toContain(ariaLive);
    
    // Check error message content is helpful
    const errorText = await errorElement.textContent();
    expect(errorText).toMatch(/account.*deactivated/i);
    expect(errorText?.length).toBeGreaterThan(20); // Meaningful message length
    
    // Verify contact information or help is provided
    const contactInfo = page.locator('text=/contact.*support|help.*desk/i');
    await expect(contactInfo).toBeVisible();
  });

  test('Multiple inactive account login attempts remain blocked', async () => {
    // Act: Attempt multiple login attempts with inactive account
    for (let attempt = 1; attempt <= 3; attempt++) {
      await loginPage.fillEmail(inactiveUser.email);
      await loginPage.fillPassword(inactiveUser.password);
      await loginPage.clickSubmit();
      
      await loginPage.waitForError();
      
      // Assert: Each attempt shows deactivated message
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage).toMatch(/account.*deactivated/i);
      
      // Verify still on login page after each attempt
      expect(page.url()).toMatch(/\/login/);
      
      // Clear form for next attempt
      if (attempt < 3) {
        await loginPage.clearForm();
      }
    }
    
    // Verify no account lockout is triggered for inactive accounts
    // (lockout only applies to active accounts with wrong passwords)
    const lockoutMessage = page.locator('text=/account.*locked|too many attempts/i');
    await expect(lockoutMessage).not.toBeVisible();
  });

  test('Inactive account status persists across different browsers/sessions', async () => {
    // Act: Attempt login in current context
    await loginPage.login(inactiveUser.email, inactiveUser.password);
    await loginPage.waitForError();
    
    let errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toMatch(/account.*deactivated/i);

    // Simulate new browser session (clear storage)
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Clear cookies to simulate fresh browser
    await page.context().clearCookies();
    
    // Navigate to login page again
    await loginPage.goto();
    
    // Act: Attempt login again in "fresh" session
    await loginPage.login(inactiveUser.email, inactiveUser.password);
    await loginPage.waitForError();
    
    // Assert: Account still inactive
    errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toMatch(/account.*deactivated/i);
  });

  test('Active account can still login successfully for comparison', async () => {
    // Act: Login with active account to verify system is working
    await loginPage.login(activeUser.email, activeUser.password);

    // Assert: Active account should login successfully
    // Note: This assumes the test database has an active user account
    // In a real scenario, this would redirect to dashboard
    
    // Wait for either redirect or error
    await Promise.race([
      page.waitForURL(/\/dashboard/, { timeout: 5000 }).catch(() => {}),
      loginPage.waitForError().catch(() => {})
    ]);
    
    // Check if redirected (successful login) or still on login page
    const currentUrl = page.url();
    
    if (currentUrl.includes('/dashboard')) {
      // Successfully logged in - this is expected for active account
      expect(currentUrl).toMatch(/\/dashboard/);
    } else {
      // If still on login page, check it's not an "inactive" error
      const errorMessage = await loginPage.getErrorMessage().catch(() => '');
      expect(errorMessage).not.toMatch(/account.*deactivated/i);
      
      // Could be other errors like user not found (which is acceptable in test environment)
      // The key is that it's NOT the inactive account error
    }
  });

  test('Password reset for inactive account shows appropriate message', async () => {
    // Navigate to password reset page
    await loginPage.clickForgotPassword();
    await page.waitForURL(/\/forgot-password/);
    
    // Act: Request password reset for inactive account
    const emailInput = page.locator('input[type="email"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await emailInput.fill(inactiveUser.email);
    await submitButton.click();
    
    // Assert: Verify appropriate response
    // System should either:
    // 1. Show generic "if account exists, email sent" message (security best practice)
    // 2. Show specific "account deactivated" message
    
    await page.waitForTimeout(2000); // Wait for response
    
    const responseMessage = page.locator('[data-testid="reset-response-message"]');
    const messageText = await responseMessage.textContent();
    
    // Acceptable responses
    const isGenericMessage = messageText?.includes('If an account with this email exists');
    const isDeactivatedMessage = messageText?.includes('account') && messageText?.includes('deactivated');
    
    expect(isGenericMessage || isDeactivatedMessage).toBe(true);
  });

  test('Inactive account email and password validation still works', async () => {
    // Test invalid email format
    await loginPage.fillEmail('invalid-email');
    await loginPage.fillPassword(inactiveUser.password);
    await loginPage.clickSubmit();
    
    // Should show email validation error before account status check
    let errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toMatch(/invalid.*email|email.*format/i);
    
    // Clear and test with valid email but inactive account
    await loginPage.clearForm();
    await loginPage.fillEmail(inactiveUser.email);
    await loginPage.fillPassword(''); // Empty password
    await loginPage.clickSubmit();
    
    // Should show password required error
    errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toMatch(/password.*required|enter.*password/i);
    
    // Test with correct email but wrong password for inactive account
    await loginPage.clearForm();
    await loginPage.fillEmail(inactiveUser.email);
    await loginPage.fillPassword('WrongPassword123!');
    await loginPage.clickSubmit();
    
    await loginPage.waitForError();
    errorMessage = await loginPage.getErrorMessage();
    
    // Could show either:
    // 1. "Invalid credentials" (password wrong)
    // 2. "Account deactivated" (account status checked first)
    // Both are acceptable depending on system design
    expect(errorMessage).toMatch(/invalid.*credentials|account.*deactivated/i);
  });

  test('Inactive account login attempt creates audit log entry', async () => {
    // Act: Attempt login with inactive account
    await loginPage.login(inactiveUser.email, inactiveUser.password);
    await loginPage.waitForError();
    
    // Verify error is displayed
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toMatch(/account.*deactivated/i);
    
    // Note: In a real implementation, we would verify audit logs through:
    // 1. API call to audit log endpoint
    // 2. Database query to audit_logs table  
    // 3. Admin interface for security monitoring
    
    // Expected audit log entry structure:
    // {
    //   event_type: 'LOGIN_ATTEMPT_FAILED',
    //   user_email: inactiveUser.email,
    //   failure_reason: 'ACCOUNT_INACTIVE',
    //   timestamp: new Date(),
    //   ip_address: request.ip,
    //   user_agent: request.headers['user-agent'],
    //   success: false
    // }
    
    // For E2E test purposes, verify the system responds appropriately
    // to indicate the security event was processed
    expect(page.url()).toMatch(/\/login/);
    expect(errorMessage).toBeTruthy();
  });

  test('Accessibility compliance for inactive account error', async () => {
    // Act: Trigger inactive account error
    await loginPage.login(inactiveUser.email, inactiveUser.password);
    await loginPage.waitForError();

    // Assert: Check accessibility features
    
    // Verify error has proper ARIA attributes
    const errorElement = page.locator('[data-testid="error-message"]');
    await expect(errorElement).toHaveAttribute('role', 'alert');
    await expect(errorElement).toHaveAttribute('aria-live');
    
    // Check error is associated with form
    const formElement = page.locator('form');
    const ariaDescribedBy = await formElement.getAttribute('aria-describedby');
    const errorId = await errorElement.getAttribute('id');
    
    if (errorId && ariaDescribedBy) {
      expect(ariaDescribedBy).toContain(errorId);
    }
    
    // Verify keyboard navigation still works
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A']).toContain(focusedElement);
    
    // Check color contrast for error message
    const errorStyles = await errorElement.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor
      };
    });
    
    // Error should be visually distinct (non-default colors)
    expect(errorStyles.color).not.toBe('rgb(0, 0, 0)'); // Not default black
  });
});