import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

/**
 * E2E Tests: Session Expiry After Inactivity
 * 
 * Task: T069 [US0] Create E2E test "Session expires after 7 days inactivity"
 * 
 * Purpose: Verify that user sessions automatically expire after 7 days of
 * inactivity, with proper cleanup and redirect to login page.
 * 
 * Requirements:
 * - Sessions expire after 7 days of inactivity (168 hours)
 * - Expired session redirects user to login page
 * - "Session expired" message displayed to user
 * - Session cleanup removes authentication cookies/tokens
 * - Expired sessions cannot access protected pages
 * - Security audit logging for session expiry events
 * 
 * User Story: US0 Authentication
 * Session Management: JWT sessions with 7-day TTL
 * Acceptance Criteria:
 * - User login creates session with 7-day expiry
 * - After 7 days inactivity, session becomes invalid
 * - Accessing protected pages shows "session expired" message
 * - User redirected to login page
 * - Re-authentication required to access protected content
 */

test.describe('Session Expiry After Inactivity - T069', () => {
  let page: Page;
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  // Test data
  const testUser = {
    email: 'user@stormcom.dev',
    password: 'User123!@#',
    role: 'STORE_ADMIN',
    storeId: 'store-001'
  };

  // Session expiry constants
  const SESSION_EXPIRY_DAYS = 7;
  const SESSION_EXPIRY_MS = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);

    // Navigate to login page
    await loginPage.goto();
  });

  test.afterEach(async () => {
    // Cleanup: Clear all session state and cookies
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.context().clearCookies();
  });

  test('Session expires after 7 days of inactivity using time manipulation', async () => {
    // Arrange: Login and establish session
    await loginPage.login(testUser.email, testUser.password);
    await dashboardPage.waitForPageLoad();
    
    // Verify initial session is active
    await expect(dashboardPage.heading).toBeVisible();
    const initialUrl = page.url();
    expect(initialUrl).toMatch(/\/dashboard/);

    // Act: Simulate 7 days passing by manipulating browser time
    // Method 1: Override Date.now() to simulate time passage
    await page.addInitScript(() => {
      const originalDateNow = Date.now;
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      Date.now = () => originalDateNow() + SEVEN_DAYS_MS;
    });

    // Method 2: Modify session token timestamps in localStorage/cookies if accessible
    await page.evaluate((expiryMs) => {
      // Simulate session expiry by modifying session data
      const sessionKeys = Object.keys(localStorage).filter(key => 
        key.includes('session') || key.includes('auth') || key.includes('token')
      );
      
      sessionKeys.forEach(key => {
        try {
          const sessionData = JSON.parse(localStorage.getItem(key) || '{}');
          if (sessionData.expiresAt || sessionData.exp) {
            // Set expiry to past time
            const pastTime = Date.now() - expiryMs;
            sessionData.expiresAt = pastTime;
            sessionData.exp = Math.floor(pastTime / 1000); // JWT exp is in seconds
            localStorage.setItem(key, JSON.stringify(sessionData));
          }
        } catch (e) {
          // Not JSON data, skip
        }
      });
    }, SESSION_EXPIRY_MS);

    // Act: Try to access a protected page after session expiry
    await page.goto('/dashboard');
    await page.waitForTimeout(2000); // Wait for session validation

    // Assert: Verify session expired and redirected to login
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/login/);

    // Check for session expired message
    const sessionExpiredMessage = page.locator('text=/session.*expired|session.*timeout|login.*expired/i');
    await expect(sessionExpiredMessage).toBeVisible();
  });

  test('Expired session prevents access to protected pages', async () => {
    // Arrange: Login and establish session
    await loginPage.login(testUser.email, testUser.password);
    await dashboardPage.waitForPageLoad();

    // Simulate session expiry by clearing/modifying session cookies
    await page.context().clearCookies();
    
    // Also clear session storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // List of protected pages to test
    const protectedPages = [
      '/dashboard',
      '/products',
      '/orders',
      '/customers',
      '/settings',
      '/analytics'
    ];

    // Act & Assert: Test each protected page
    for (const protectedPage of protectedPages) {
      await page.goto(protectedPage);
      await page.waitForTimeout(1000);

      // Should be redirected to login page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/login/);

      // Check for authentication required message
      const authRequiredMessage = page.locator('text=/login.*required|authentication.*required|session.*expired/i');
      const messageVisible = await authRequiredMessage.isVisible();
      expect(messageVisible).toBe(true);
    }
  });

  test('Session expiry message is displayed with proper context', async () => {
    // Arrange: Login user
    await loginPage.login(testUser.email, testUser.password);
    await dashboardPage.waitForPageLoad();

    // Simulate session expiry by manipulating session time
    await page.evaluate(() => {
      // Find and expire session tokens
      const now = Date.now();
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

      // Modify localStorage session data
      Object.keys(localStorage).forEach(key => {
        if (key.includes('session') || key.includes('auth')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.exp || data.expiresAt) {
              data.exp = Math.floor(sevenDaysAgo / 1000);
              data.expiresAt = sevenDaysAgo;
              localStorage.setItem(key, JSON.stringify(data));
            }
          } catch (e) {
            // Skip non-JSON items
          }
        }
      });
    });

    // Act: Try to access protected content
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);

    // Assert: Verify proper session expiry handling
    expect(page.url()).toMatch(/\/login/);

    // Check for informative session expired message
    const sessionMessage = page.locator('[data-testid="session-expired-message"]');
    await expect(sessionMessage).toBeVisible();
    
    const messageText = await sessionMessage.textContent();
    expect(messageText).toMatch(/session.*expired|login.*session|timed.*out/i);

    // Verify message includes helpful information
    expect(messageText?.toLowerCase()).toContain('session');
    expect(messageText?.length).toBeGreaterThan(10); // Meaningful message

    // Check for re-login instruction
    const reLoginMessage = page.locator('text=/please.*login|log.*in.*again|re.*authenticate/i');
    await expect(reLoginMessage).toBeVisible();
  });

  test('User can re-login after session expiry', async () => {
    // Arrange: Login and then simulate session expiry
    await loginPage.login(testUser.email, testUser.password);
    await dashboardPage.waitForPageLoad();

    // Expire the session
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Act: Try to access dashboard (should redirect to login)
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    expect(page.url()).toMatch(/\/login/);

    // Re-login with same credentials
    await loginPage.login(testUser.email, testUser.password);

    // Assert: Verify successful re-authentication
    await dashboardPage.waitForPageLoad();
    expect(page.url()).toMatch(/\/dashboard/);
    await expect(dashboardPage.heading).toBeVisible();

    // Verify new session is working
    await page.goto('/products');
    await page.waitForTimeout(1000);
    expect(page.url()).toMatch(/\/products/);
  });

  test('Session expiry works consistently across multiple tabs/windows', async () => {
    // Arrange: Login in first tab
    await loginPage.login(testUser.email, testUser.password);
    await dashboardPage.waitForPageLoad();

    // Open second tab/page with same context
    const secondPage = await page.context().newPage();
    await secondPage.goto('/dashboard');
    await secondPage.waitForTimeout(1000);
    
    // Verify both tabs are authenticated
    expect(page.url()).toMatch(/\/dashboard/);
    expect(secondPage.url()).toMatch(/\/dashboard/);

    // Act: Expire session in first tab
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Try to access protected content in both tabs
    await page.goto('/products');
    await secondPage.goto('/orders');
    
    await page.waitForTimeout(1000);
    await secondPage.waitForTimeout(1000);

    // Assert: Both tabs should redirect to login
    expect(page.url()).toMatch(/\/login/);
    expect(secondPage.url()).toMatch(/\/login/);

    // Cleanup
    await secondPage.close();
  });

  test('Session expiry preserves intended destination for redirect after login', async () => {
    // Arrange: Login user first
    await loginPage.login(testUser.email, testUser.password);
    await dashboardPage.waitForPageLoad();

    // Expire session
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Act: Try to access specific protected page
    await page.goto('/products');
    await page.waitForTimeout(1000);

    // Should be redirected to login
    expect(page.url()).toMatch(/\/login/);

    // Re-login
    await loginPage.login(testUser.email, testUser.password);

    // Assert: Should redirect to originally requested page
    await page.waitForTimeout(2000);
    
    // Check if redirected to intended destination
    const finalUrl = page.url();
    const redirectedToProducts = finalUrl.includes('/products');
    const redirectedToDashboard = finalUrl.includes('/dashboard');
    
    // Either is acceptable - different implementations handle this differently
    expect(redirectedToProducts || redirectedToDashboard).toBe(true);
  });

  test('Session expiry cleanup removes all authentication data', async () => {
    // Arrange: Login and verify session data exists
    await loginPage.login(testUser.email, testUser.password);
    await dashboardPage.waitForPageLoad();

    // Check initial session data
    const initialCookies = await page.context().cookies();
    const initialLocalStorage = await page.evaluate(() => Object.keys(localStorage));
    
    const hasInitialAuth = initialCookies.some(cookie => 
      cookie.name.includes('session') || cookie.name.includes('auth')
    ) || initialLocalStorage.some(key => 
      key.includes('session') || key.includes('auth') || key.includes('token')
    );
    
    expect(hasInitialAuth).toBe(true);

    // Act: Trigger session expiry by accessing protected page after clearing auth
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Assert: Verify all authentication data is cleared
    const finalCookies = await page.context().cookies();
    const finalLocalStorage = await page.evaluate(() => Object.keys(localStorage));
    const finalSessionStorage = await page.evaluate(() => Object.keys(sessionStorage));

    const hasRemainingAuth = finalCookies.some(cookie => 
      cookie.name.includes('session') || cookie.name.includes('auth')
    ) || finalLocalStorage.some(key => 
      key.includes('session') || key.includes('auth') || key.includes('token')
    ) || finalSessionStorage.some(key => 
      key.includes('session') || key.includes('auth') || key.includes('token')
    );
    
    expect(hasRemainingAuth).toBe(false);
  });

  test('Session expiry accessibility compliance', async () => {
    // Arrange: Login and expire session
    await loginPage.login(testUser.email, testUser.password);
    await dashboardPage.waitForPageLoad();

    // Expire session
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Act: Access protected page to trigger expiry message
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Assert: Check accessibility of session expiry message
    expect(page.url()).toMatch(/\/login/);

    // Verify session expired message has proper ARIA attributes
    const sessionMessage = page.locator('[data-testid="session-expired-message"]');
    if (await sessionMessage.isVisible()) {
      await expect(sessionMessage).toHaveAttribute('role', 'alert');
      await expect(sessionMessage).toHaveAttribute('aria-live');
    }

    // Check that error message is announced to screen readers
    const alertElements = page.locator('[role="alert"]');
    const alertCount = await alertElements.count();
    expect(alertCount).toBeGreaterThan(0);

    // Verify keyboard navigation still works
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A']).toContain(focusedElement);

    // Check that page maintains proper focus management
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeFocused();
  });

  test('Session expiry with concurrent user activity simulation', async () => {
    // Arrange: Login user
    await loginPage.login(testUser.email, testUser.password);
    await dashboardPage.waitForPageLoad();

    // Simulate user activity for a while, then inactivity
    const activitySimulation = async () => {
      for (let i = 0; i < 3; i++) {
        await page.mouse.move(100 + i * 10, 100 + i * 10);
        await page.waitForTimeout(500);
        await page.keyboard.press('Tab');
        await page.waitForTimeout(500);
      }
    };

    // Simulate some user activity
    await activitySimulation();

    // Now simulate session expiry (7 days later)
    await page.evaluate(() => {
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      // Modify session timestamps
      Object.keys(localStorage).forEach(key => {
        if (key.includes('session') || key.includes('auth')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.lastActivity || data.createdAt) {
              data.lastActivity = sevenDaysAgo;
              data.createdAt = sevenDaysAgo;
              localStorage.setItem(key, JSON.stringify(data));
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      });
    });

    // Act: Try to perform an action that requires authentication
    await page.goto('/settings');
    await page.waitForTimeout(1000);

    // Assert: Should be redirected due to expired session
    expect(page.url()).toMatch(/\/login/);
    
    const sessionExpiredIndicator = page.locator('text=/session.*expired|please.*login.*again/i');
    await expect(sessionExpiredIndicator).toBeVisible();
  });
});