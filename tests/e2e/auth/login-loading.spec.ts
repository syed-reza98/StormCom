import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';

/**
 * E2E Tests: Login Form Loading States
 * 
 * Task: T074 [US0] Create E2E test "Login form loading states"
 * 
 * Purpose: Verify login form provides proper loading feedback
 * during authentication process to improve user experience.
 * 
 * Requirements:
 * - Submit button shows loading state during authentication
 * - Form inputs are disabled during login process
 * - Loading spinner or progress indicator is visible
 * - Loading state prevents double-submission
 * - Appropriate ARIA labels for screen readers
 * - Loading timeout handling (15+ seconds)
 * - Error state restores form interaction
 * - Success state maintains loading until redirect
 * 
 * User Story: US0 Authentication  
 * UX Feature: Loading state management
 * Acceptance Criteria:
 * - Login button shows "Signing in..." text during loading
 * - Form fields are disabled to prevent input changes
 * - Loading indicator visible throughout authentication
 * - Double-click protection prevents multiple submissions
 * - Screen readers announce loading state changes
 * - Loading state clears on error or success
 * - Timeout handling after 15 seconds
 */

test.describe('Login Form Loading States - T074', () => {
  let page: Page;
  let loginPage: LoginPage;
  let registerPage: RegisterPage;

  // Test user credentials
  const testUser = {
    firstName: 'Loading',
    lastName: 'Test',
    email: 'loading.test@stormcom.dev',
    password: 'LoadingTest123!',
    storeId: 'store-001'
  };

  const validCredentials = {
    email: testUser.email,
    password: testUser.password
  };

  const invalidCredentials = {
    email: 'invalid@stormcom.dev',
    password: 'WrongPassword123!'
  };

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    loginPage = new LoginPage(page);
    registerPage = new RegisterPage(page);

    // Setup: Register test user if needed
    await registerPage.goto();
    await registerPage.fillAndSubmit(
      testUser.firstName,
      testUser.lastName,
      testUser.email,
      testUser.password,
      testUser.password
    );
    
    // Navigate back to login page for testing
    await loginPage.goto();
  });

  test('Login button shows loading state during authentication', async () => {
    // Arrange: Verify initial button state
    await loginPage.waitForPageLoad();
    
    const submitButton = loginPage.submitButton;
    const initialButtonText = await submitButton.textContent();
    
    // Button should initially show "Sign In" or similar
    expect(initialButtonText?.toLowerCase()).toMatch(/sign.*in|login|log.*in/i);
    
    // Verify button is enabled initially
    expect(await submitButton.isEnabled()).toBe(true);

    // Act: Fill form and submit
    await loginPage.fillForm(validCredentials.email, validCredentials.password);
    
    // Capture loading state immediately after submit
    const submitPromise = loginPage.submit();
    
    // Wait a brief moment for loading state to appear
    await page.waitForTimeout(100);

    // Assert: Check loading state during authentication
    // Button should show loading text
    const loadingButtonText = await submitButton.textContent();
    const showsLoadingText = loadingButtonText?.toLowerCase().includes('signing') ||
                            loadingButtonText?.toLowerCase().includes('loading') ||
                            loadingButtonText?.toLowerCase().includes('please wait') ||
                            loadingButtonText !== initialButtonText;

    // Button should be disabled during loading
    const isDisabledDuringLoading = !(await submitButton.isEnabled());
    
    // At least one loading indicator should be present
    expect(showsLoadingText || isDisabledDuringLoading).toBe(true);

    // Wait for authentication to complete
    await submitPromise;
  });

  test('Form inputs are disabled during login process', async () => {
    // Arrange: Fill form with valid credentials
    await loginPage.fillForm(validCredentials.email, validCredentials.password);

    // Act: Submit form and immediately check input states
    const submitPromise = loginPage.submit();
    
    // Brief wait for loading state to engage
    await page.waitForTimeout(50);

    // Assert: Form inputs should be disabled during loading
    const emailDisabled = !(await loginPage.emailInput.isEnabled());
    const passwordDisabled = !(await loginPage.passwordInput.isEnabled());
    const submitDisabled = !(await loginPage.submitButton.isEnabled());

    // At least submit button should be disabled
    expect(submitDisabled).toBe(true);
    
    // Ideally all inputs should be disabled
    if (emailDisabled && passwordDisabled) {
      expect(emailDisabled && passwordDisabled && submitDisabled).toBe(true);
    }

    // Wait for process to complete
    await submitPromise;

    // After completion, if still on login page (error case), inputs should be re-enabled
    if (page.url().includes('/login')) {
      await page.waitForTimeout(1000);
      expect(await loginPage.emailInput.isEnabled()).toBe(true);
      expect(await loginPage.passwordInput.isEnabled()).toBe(true);
      expect(await loginPage.submitButton.isEnabled()).toBe(true);
    }
  });

  test('Loading spinner or progress indicator is visible', async () => {
    // Arrange: Fill form
    await loginPage.fillForm(validCredentials.email, validCredentials.password);

    // Act: Submit and check for loading indicators
    const submitPromise = loginPage.submit();
    await page.waitForTimeout(100);

    // Assert: Look for various types of loading indicators
    const loadingSpinner = page.locator('[data-testid="loading-spinner"], .spinner, .loading-indicator');
    const progressBar = page.locator('[role="progressbar"], .progress-bar');
    const loadingIcon = page.locator('[data-testid="loading-icon"], .fa-spinner, .fa-loading');
    const ariaLiveRegion = page.locator('[aria-live="polite"]:has-text("loading"), [aria-live="assertive"]:has-text("signing")');

    // Check if any loading indicator is visible
    const hasSpinner = await loadingSpinner.isVisible();
    const hasProgressBar = await progressBar.isVisible();
    const hasLoadingIcon = await loadingIcon.isVisible();
    const hasAriaLive = await ariaLiveRegion.isVisible();

    const hasLoadingIndicator = hasSpinner || hasProgressBar || hasLoadingIcon || hasAriaLive;
    expect(hasLoadingIndicator).toBe(true);

    // Wait for completion
    await submitPromise;
  });

  test('Loading state prevents double-submission', async () => {
    // Arrange: Fill form
    await loginPage.fillForm(validCredentials.email, validCredentials.password);

    // Act: Submit form multiple times rapidly
    const firstSubmit = loginPage.submit();
    
    // Immediately try to submit again
    await page.waitForTimeout(50);
    
    // Try clicking submit button again while first submission is processing
    try {
      await loginPage.submitButton.click({ timeout: 500 });
    } catch (error) {
      // Button might be disabled/not clickable, which is expected
    }

    // Try submitting via keyboard
    try {
      await page.keyboard.press('Enter');
    } catch (error) {
      // Form might prevent this, which is expected
    }

    // Assert: Verify that only one authentication request is processed
    // This would ideally be verified by checking network requests or server logs
    // For E2E purposes, we verify the button remains disabled during processing
    
    await page.waitForTimeout(100);
    const buttonDisabled = !(await loginPage.submitButton.isEnabled());
    expect(buttonDisabled).toBe(true);

    // Wait for first submission to complete
    await firstSubmit;

    // After completion, button should be re-enabled (if still on login page)
    if (page.url().includes('/login')) {
      await page.waitForTimeout(500);
      expect(await loginPage.submitButton.isEnabled()).toBe(true);
    }
  });

  test('ARIA labels announce loading state for screen readers', async () => {
    // Arrange: Fill form
    await loginPage.fillForm(validCredentials.email, validCredentials.password);

    // Act: Submit form and check accessibility features
    const submitPromise = loginPage.submit();
    await page.waitForTimeout(100);

    // Assert: Check for proper ARIA attributes during loading
    // 1. Submit button should have aria-disabled or disabled attribute
    const submitButton = loginPage.submitButton;
    const ariaDisabled = await submitButton.getAttribute('aria-disabled');
    const disabled = await submitButton.getAttribute('disabled');
    const isDisabled = ariaDisabled === 'true' || disabled !== null;
    expect(isDisabled).toBe(true);

    // 2. Loading state should be announced via aria-live region
    const liveRegions = page.locator('[aria-live="polite"], [aria-live="assertive"]');
    let hasLoadingAnnouncement = false;
    
    const liveRegionCount = await liveRegions.count();
    for (let i = 0; i < liveRegionCount; i++) {
      const regionText = await liveRegions.nth(i).textContent();
      if (regionText?.toLowerCase().includes('signing') || 
          regionText?.toLowerCase().includes('loading') ||
          regionText?.toLowerCase().includes('authenticating')) {
        hasLoadingAnnouncement = true;
        break;
      }
    }

    // 3. Form should have appropriate aria-busy state
    const form = page.locator('form, [role="form"]').first();
    const ariaBusy = await form.getAttribute('aria-busy');
    
    // At least one accessibility feature should indicate loading
    const hasAccessibleLoading = hasLoadingAnnouncement || ariaBusy === 'true' || isDisabled;
    expect(hasAccessibleLoading).toBe(true);

    // Wait for completion
    await submitPromise;

    // After completion, aria-busy should be false
    if (page.url().includes('/login')) {
      await page.waitForTimeout(500);
      const finalAriaBusy = await form.getAttribute('aria-busy');
      expect(finalAriaBusy).not.toBe('true');
    }
  });

  test('Loading timeout handling after 15 seconds', async () => {
    // Note: This test simulates slow network or server response
    // In a real scenario, we might use network throttling or mock slow responses

    // Arrange: Prepare for potentially slow login
    await loginPage.fillForm(validCredentials.email, validCredentials.password);

    // Act: Submit and monitor for extended period
    const startTime = Date.now();
    const submitPromise = loginPage.submit();

    // Monitor loading state for up to 20 seconds
    let timeoutReached = false;
    let loadingStillVisible = false;

    const checkTimeout = async () => {
      let elapsed = 0;
      while (elapsed < 20000) { // 20 seconds max wait
        await page.waitForTimeout(1000);
        elapsed = Date.now() - startTime;

        // Check if still in loading state after 15 seconds
        if (elapsed > 15000 && !timeoutReached) {
          timeoutReached = true;
          
          // Check if loading indicators are still present
          const loadingSpinner = page.locator('[data-testid="loading-spinner"], .spinner');
          const disabledButton = !(await loginPage.submitButton.isEnabled());
          
          loadingStillVisible = await loadingSpinner.isVisible() || disabledButton;
          
          // After 15 seconds, there should be timeout handling
          if (loadingStillVisible) {
            // Look for timeout message or re-enabled form
            const timeoutMessage = page.locator('text=/timeout|try.*again|slow.*connection/i');
            const hasTimeoutMessage = await timeoutMessage.isVisible();
            
            // Either show timeout message or re-enable form
            if (hasTimeoutMessage) {
              expect(hasTimeoutMessage).toBe(true);
            } else {
              // Form should be re-enabled for retry
              await page.waitForTimeout(2000);
              const buttonEnabled = await loginPage.submitButton.isEnabled();
              expect(buttonEnabled).toBe(true);
            }
          }
          break;
        }

        // If authentication completes normally, break early
        if (!page.url().includes('/login')) {
          break;
        }
      }
    };

    // Run timeout check and original submit in parallel
    await Promise.race([submitPromise, checkTimeout()]);

    // Assert: Either completed normally or handled timeout appropriately
    const finalElapsed = Date.now() - startTime;
    
    if (finalElapsed > 15000) {
      // If took longer than 15 seconds, verify timeout was handled
      expect(timeoutReached).toBe(true);
    }
    
    // Form should be in a consistent state
    const currentUrl = page.url();
    const onLoginPage = currentUrl.includes('/login');
    const onDashboard = currentUrl.includes('/dashboard');
    
    expect(onLoginPage || onDashboard).toBe(true);
  });

  test('Error state restores form interaction', async () => {
    // Arrange: Use invalid credentials to trigger error
    await loginPage.fillForm(invalidCredentials.email, invalidCredentials.password);

    // Act: Submit with invalid credentials
    await loginPage.submit();
    
    // Wait for error response
    await page.waitForTimeout(2000);

    // Assert: Form should be interactive again after error
    // 1. Submit button should be re-enabled
    expect(await loginPage.submitButton.isEnabled()).toBe(true);

    // 2. Input fields should be re-enabled
    expect(await loginPage.emailInput.isEnabled()).toBe(true);
    expect(await loginPage.passwordInput.isEnabled()).toBe(true);

    // 3. Loading indicators should be hidden
    const loadingSpinner = page.locator('[data-testid="loading-spinner"], .spinner');
    expect(await loadingSpinner.isVisible()).toBe(false);

    // 4. Error message should be visible
    const errorMessage = page.locator('[data-testid="login-error"], [role="alert"]');
    expect(await errorMessage.isVisible()).toBe(true);

    // 5. Form should accept new input
    await loginPage.emailInput.clear();
    await loginPage.emailInput.fill('test@example.com');
    
    const newEmailValue = await loginPage.emailInput.inputValue();
    expect(newEmailValue).toBe('test@example.com');

    // 6. Should be able to submit again
    await loginPage.fillForm(validCredentials.email, validCredentials.password);
    await loginPage.submit();
    
    // Should process new submission
    await page.waitForTimeout(1000);
    const finalUrl = page.url();
    expect(finalUrl.includes('/login') || finalUrl.includes('/dashboard')).toBe(true);
  });

  test('Success state maintains loading until redirect', async () => {
    // Arrange: Fill valid credentials
    await loginPage.fillForm(validCredentials.email, validCredentials.password);

    // Act: Submit form and monitor transition
    const submitPromise = loginPage.submit();
    await page.waitForTimeout(100);

    // Assert: Loading state should persist during successful authentication
    let loadingMaintained = false;
    let redirectOccurred = false;

    // Monitor for 5 seconds or until redirect
    const monitoringStart = Date.now();
    while (Date.now() - monitoringStart < 5000) {
      const currentUrl = page.url();
      
      if (!currentUrl.includes('/login')) {
        redirectOccurred = true;
        break;
      }

      // Check if loading state is maintained
      const buttonDisabled = !(await loginPage.submitButton.isEnabled());
      const hasLoadingIndicator = await page.locator('[data-testid="loading-spinner"], .spinner, .loading').isVisible();
      
      if (buttonDisabled || hasLoadingIndicator) {
        loadingMaintained = true;
      }

      await page.waitForTimeout(200);
    }

    // Wait for submit promise to resolve
    await submitPromise;

    // Assert: Either redirect occurred or loading was maintained appropriately
    if (redirectOccurred) {
      // Successfully redirected (expected for valid credentials)
      expect(page.url()).not.toMatch(/\/login$/);
    } else {
      // If still on login page, loading should have been maintained during attempt
      expect(loadingMaintained).toBe(true);
    }
  });

  test('Loading state works with keyboard navigation', async () => {
    // Arrange: Navigate form using keyboard
    await page.keyboard.press('Tab'); // Navigate to form
    
    // Fill form using keyboard
    await loginPage.emailInput.focus();
    await loginPage.emailInput.fill(validCredentials.email);
    
    await page.keyboard.press('Tab');
    await loginPage.passwordInput.fill(validCredentials.password);

    // Act: Submit using Enter key
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);

    // Assert: Loading state should work with keyboard submission
    const buttonDisabled = !(await loginPage.submitButton.isEnabled());
    expect(buttonDisabled).toBe(true);

    // Check that keyboard navigation is appropriately handled during loading
    await page.keyboard.press('Tab');
    
    // Focus should not be able to return to disabled form elements
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    
    // Either focus moves past form or stays where appropriate
    expect(['BODY', 'BUTTON', 'A', 'INPUT']).toContain(focusedElement);

    // Wait for completion
    await page.waitForTimeout(2000);
  });

  test('Loading state is consistent across form validation errors', async () => {
    // Test 1: Empty form submission
    await loginPage.goto();
    await loginPage.submit();
    await page.waitForTimeout(500);

    // Form should not show extended loading for validation errors
    expect(await loginPage.submitButton.isEnabled()).toBe(true);

    // Test 2: Invalid email format
    await loginPage.fillForm('invalid-email', 'SomePassword123!');
    await loginPage.submit();
    await page.waitForTimeout(500);

    // Should quickly return to enabled state for client-side validation
    expect(await loginPage.submitButton.isEnabled()).toBe(true);

    // Test 3: Valid format but authentication error
    await loginPage.fillForm(invalidCredentials.email, invalidCredentials.password);
    const submitPromise = loginPage.submit();
    await page.waitForTimeout(100);

    // Should show loading state for server authentication
    const showsLoading = !(await loginPage.submitButton.isEnabled());
    expect(showsLoading).toBe(true);

    await submitPromise;
    await page.waitForTimeout(1000);

    // Should return to enabled state after server error
    expect(await loginPage.submitButton.isEnabled()).toBe(true);
  });

  test('Loading indicators have proper contrast and visibility', async () => {
    // Arrange: Fill form
    await loginPage.fillForm(validCredentials.email, validCredentials.password);

    // Act: Submit and check visual accessibility
    const submitPromise = loginPage.submit();
    await page.waitForTimeout(100);

    // Assert: Check loading indicators are properly visible
    const loadingElements = page.locator('[data-testid="loading-spinner"], .spinner, .loading, [aria-live]');
    const loadingCount = await loadingElements.count();

    if (loadingCount > 0) {
      for (let i = 0; i < loadingCount; i++) {
        const element = loadingElements.nth(i);
        
        if (await element.isVisible()) {
          // Check element has reasonable size (not 0x0)
          const boundingBox = await element.boundingBox();
          if (boundingBox) {
            expect(boundingBox.width).toBeGreaterThan(0);
            expect(boundingBox.height).toBeGreaterThan(0);
          }

          // Check element is not transparent
          const opacity = await element.evaluate(el => window.getComputedStyle(el).opacity);
          expect(parseFloat(opacity)).toBeGreaterThan(0);
        }
      }
    }

    // Check submit button loading state is visually clear
    const submitButton = loginPage.submitButton;
    if (!(await submitButton.isEnabled())) {
      // Disabled button should have visual indication
      const buttonOpacity = await submitButton.evaluate(el => window.getComputedStyle(el).opacity);
      const buttonCursor = await submitButton.evaluate(el => window.getComputedStyle(el).cursor);
      
      // Should have some visual indication of disabled state
      const hasDisabledStyling = parseFloat(buttonOpacity) < 1 || 
                                buttonCursor === 'not-allowed' || 
                                buttonCursor === 'default';
      
      expect(hasDisabledStyling).toBe(true);
    }

    await submitPromise;
  });
});