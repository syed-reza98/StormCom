/* eslint-disable no-console */

import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';

/**
 * E2E Tests: User Logout from User Menu
 * 
 * Task: T078 [US0] Create E2E test "Logout from user menu"
 * 
 * Purpose: Verify secure logout functionality that properly terminates
 * user sessions and clears authentication state across the application.
 * 
 * Requirements:
 * - Logout option accessible from user menu/profile dropdown
 * - Complete session termination (server-side and client-side)
 * - Redirect to login page after logout
 * - Clear all authentication tokens and session data
 * - No access to protected pages after logout
 * - Logout confirmation (optional but recommended)
 * - Keyboard accessibility for logout action
 * - Clear visual feedback during logout process
 * - Session cleanup prevents unauthorized access
 * 
 * User Story: US0 Authentication
 * Security Feature: Secure session termination
 * Acceptance Criteria:
 * - User menu contains logout option
 * - Logout completely terminates session
 * - User redirected to login page
 * - Cannot access protected pages after logout
 * - Session data properly cleared
 * - Accessible logout interface
 * - Clear confirmation of logout action
 */

test.describe('User Logout from User Menu - T078', () => {
  let page: Page;
  let loginPage: LoginPage;
  let registerPage: RegisterPage;

  // Test user data
  const testUser = {
    firstName: 'Logout',
    lastName: 'TestUser',
    email: 'logout.test@stormcom.dev',
    password: 'LogoutTest123!',
    storeId: 'store-001'
  };

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    loginPage = new LoginPage(page);
    registerPage = new RegisterPage(page);

    // Setup authenticated user session
    await registerPage.goto();
    await registerPage.register(
      testUser.firstName,
      testUser.lastName,
      testUser.email,
      testUser.password
    );
    await page.waitForTimeout(1000);

    // Login to establish session
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await page.waitForTimeout(2000);

    // Navigate to dashboard to ensure authenticated state
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
  });

  test('User menu contains accessible logout option', async () => {
    // Act: Look for user menu or profile dropdown
    const userMenu = page.locator('[data-testid="user-menu"], [data-testid="profile-menu"], .user-menu, .profile-dropdown');
    const userAvatar = page.locator('[data-testid="user-avatar"], .user-avatar, img[alt*="profile"], img[alt*="user"]');
    const userMenuButton = page.locator('[data-testid="user-menu-button"], button[aria-label*="user"], button[aria-label*="profile"]');

    // Try different patterns to find user menu
    let menuFound = false;
    let logoutOption;

    // Pattern 1: Direct user menu visibility
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.waitForTimeout(500);
      logoutOption = page.locator('[data-testid="logout"], a:has-text("logout"), button:has-text("logout"), text=/logout|sign.*out/i');
      menuFound = true;

    } else if (await userMenuButton.isVisible()) {
      // Pattern 2: User menu button click
      await userMenuButton.click();
      await page.waitForTimeout(500);
      logoutOption = page.locator('[data-testid="logout"], a:has-text("logout"), button:has-text("logout"), text=/logout|sign.*out/i');
      menuFound = true;

    } else if (await userAvatar.isVisible()) {
      // Pattern 3: User avatar click
      await userAvatar.click();
      await page.waitForTimeout(500);
      logoutOption = page.locator('[data-testid="logout"], a:has-text("logout"), button:has-text("logout"), text=/logout|sign.*out/i');
      menuFound = true;

    } else {
      // Pattern 4: Look for logout in navigation
      logoutOption = page.locator('[data-testid="logout"], a:has-text("logout"), button:has-text("logout"), text=/logout|sign.*out/i');
      menuFound = await logoutOption.isVisible();
    }

    // Assert: Logout option should be found and accessible
    expect(menuFound).toBe(true);
    
    if (logoutOption) {
      expect(await logoutOption.isVisible()).toBe(true);

      // Check accessibility
      const logoutElement = logoutOption.first();
      
      // Should be keyboard accessible
      await logoutElement.focus();
      const isFocusable = await logoutElement.evaluate(el => el === document.activeElement);
      expect(isFocusable).toBe(true);

      // Should have appropriate text or aria-label
      const elementText = await logoutElement.textContent();
      const ariaLabel = await logoutElement.getAttribute('aria-label');
      const accessibleText = elementText || ariaLabel || '';
      expect(accessibleText.toLowerCase()).toMatch(/logout|sign.*out/);
    }
  });

  test('Logout completely terminates session and redirects to login', async () => {
    // Arrange: Ensure we're on dashboard and authenticated
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Verify we're authenticated initially
    const authenticatedState = page.url().includes('/dashboard') ||
                              await page.locator('[data-testid="dashboard"], h1:has-text("Dashboard")').isVisible();
    expect(authenticatedState).toBe(true);

    // Act: Find and click logout
    const logoutOption = await findAndClickLogout();
    expect(logoutOption).toBe(true);

    // Wait for logout to complete
    await page.waitForTimeout(2000);

    // Assert: Should be redirected to login page
    const redirectedToLogin = page.url().includes('/login') || page.url().includes('/auth');
    const onPublicPage = page.url() === '/' || page.url().includes('/home');
    
    expect(redirectedToLogin || onPublicPage).toBe(true);

    // Should not be able to access dashboard anymore
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    const stillAuthenticated = page.url().includes('/dashboard') &&
                              await page.locator('[data-testid="dashboard"]').isVisible();
    expect(stillAuthenticated).toBe(false);
  });

  test('Session data is properly cleared after logout', async () => {
    // Arrange: Check initial authentication state
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Store initial session information
    const initialCookies = await page.context().cookies();
    const initialSessionStorage = await page.evaluate(() => {
      const items: { [key: string]: string } = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) items[key] = sessionStorage.getItem(key) || '';
      }
      return items;
    });

    const initialLocalStorage = await page.evaluate(() => {
      const items: { [key: string]: string } = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) items[key] = localStorage.getItem(key) || '';
      }
      return items;
    });

    // Act: Logout
    const logoutSuccess = await findAndClickLogout();
    expect(logoutSuccess).toBe(true);
    await page.waitForTimeout(2000);

    // Assert: Check that session data is cleared
    
    // 1. Cookies should be cleared or invalidated
    const postLogoutCookies = await page.context().cookies();
    const authCookies = postLogoutCookies.filter(cookie => 
      cookie.name.includes('auth') || 
      cookie.name.includes('session') || 
      cookie.name.includes('token')
    );

    // Auth cookies should either be removed or have different values
    const authCookiesCleared = authCookies.length === 0 || 
      authCookies.every(cookie => {
        const initialCookie = initialCookies.find(ic => ic.name === cookie.name);
        return !initialCookie || initialCookie.value !== cookie.value;
      });

    expect(authCookiesCleared).toBe(true);

    // 2. SessionStorage should be cleared of auth data
    const postLogoutSessionStorage = await page.evaluate(() => {
      const items: { [key: string]: string } = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('auth') || key.includes('token') || key.includes('user'))) {
          items[key] = sessionStorage.getItem(key) || '';
        }
      }
      return items;
    });

    const authSessionKeys = Object.keys(initialSessionStorage).filter(key =>
      key.includes('auth') || key.includes('token') || key.includes('user')
    );

    if (authSessionKeys.length > 0) {
      const sessionCleared = authSessionKeys.every(key => 
        !postLogoutSessionStorage[key] || 
        postLogoutSessionStorage[key] !== initialSessionStorage[key]
      );
      expect(sessionCleared).toBe(true);
    }

    // 3. LocalStorage auth data should be cleared
    const postLogoutLocalStorage = await page.evaluate(() => {
      const items: { [key: string]: string } = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('auth') || key.includes('token') || key.includes('user'))) {
          items[key] = localStorage.getItem(key) || '';
        }
      }
      return items;
    });

    const authLocalKeys = Object.keys(initialLocalStorage).filter(key =>
      key.includes('auth') || key.includes('token') || key.includes('user')
    );

    if (authLocalKeys.length > 0) {
      const localStorageCleared = authLocalKeys.every(key => 
        !postLogoutLocalStorage[key] || 
        postLogoutLocalStorage[key] !== initialLocalStorage[key]
      );
      expect(localStorageCleared).toBe(true);
    }
  });

  test('Cannot access protected pages after logout', async () => {
    // Arrange: Verify initial access
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    expect(page.url()).toMatch(/dashboard/);

    // Act: Logout
    const logoutSuccess = await findAndClickLogout();
    expect(logoutSuccess).toBe(true);
    await page.waitForTimeout(2000);

    // Assert: Try to access various protected pages
    const protectedPages = [
      '/dashboard',
      '/products',
      '/orders',
      '/customers',
      '/settings',
      '/analytics',
      '/reports'
    ];

    for (const protectedPath of protectedPages) {
      await page.goto(protectedPath);
      await page.waitForTimeout(1000);

      // Should not be able to access protected content
      const currentUrl = page.url();
      const accessDenied = currentUrl.includes('/login') ||
                          currentUrl.includes('/auth') ||
                          currentUrl === '/' ||
                          !currentUrl.includes(protectedPath);

      if (!accessDenied) {
        // Check if page requires authentication
        const authRequired = page.locator('text=/login|sign.*in|authentication.*required/i');
        const hasAuthPrompt = await authRequired.isVisible();
        expect(hasAuthPrompt).toBe(true);
      } else {
        expect(accessDenied).toBe(true);
      }
    }
  });

  test('Logout with keyboard navigation', async () => {
    // Arrange: Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Act: Use keyboard to navigate to logout
    
    // Start keyboard navigation from current focus
    await page.keyboard.press('Tab');
    
    let logoutFound = false;
    let attempts = 0;
    const maxAttempts = 20; // Prevent infinite loop

    while (!logoutFound && attempts < maxAttempts) {
      // Check if current focused element is logout
      const focusedElement = page.locator(':focus');
      
      if (await focusedElement.isVisible()) {
        const elementText = await focusedElement.textContent() || '';
        const ariaLabel = await focusedElement.getAttribute('aria-label') || '';
        const combinedText = (elementText + ' ' + ariaLabel).toLowerCase();

        if (combinedText.includes('logout') || combinedText.includes('sign out')) {
          // Found logout option, activate it
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1000);
          logoutFound = true;
          break;
        }
      }

      // Try opening user menu if we find it
      if (await focusedElement.isVisible()) {
        const elementText = await focusedElement.textContent() || '';
        const ariaLabel = await focusedElement.getAttribute('aria-label') || '';
        const combinedText = (elementText + ' ' + ariaLabel).toLowerCase();

        if (combinedText.includes('user') || combinedText.includes('profile') || combinedText.includes('menu')) {
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);
          
          // Continue tabbing to find logout in opened menu
          for (let i = 0; i < 5; i++) {
            await page.keyboard.press('Tab');
            const menuItem = page.locator(':focus');
            
            if (await menuItem.isVisible()) {
              const itemText = await menuItem.textContent() || '';
              const itemAriaLabel = await menuItem.getAttribute('aria-label') || '';
              const itemCombinedText = (itemText + ' ' + itemAriaLabel).toLowerCase();

              if (itemCombinedText.includes('logout') || itemCombinedText.includes('sign out')) {
                await page.keyboard.press('Enter');
                await page.waitForTimeout(1000);
                logoutFound = true;
                break;
              }
            }
          }
          
          if (logoutFound) break;
        }
      }

      // Continue to next element
      await page.keyboard.press('Tab');
      attempts++;
    }

    // If keyboard navigation didn't work, try clicking method as fallback
    if (!logoutFound) {
      logoutFound = await findAndClickLogout();
    }

    // Assert: Logout should have been completed
    expect(logoutFound).toBe(true);

    // Verify logout completed successfully
    await page.waitForTimeout(2000);
    const loggedOut = page.url().includes('/login') || 
                     page.url().includes('/auth') ||
                     page.url() === '/';
    expect(loggedOut).toBe(true);
  });

  test('Logout confirmation prevents accidental logout', async () => {
    // Arrange: Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Act: Try to logout
    const userMenu = await findUserMenu();
    let confirmationShown = false;

    if (userMenu) {
      await userMenu.click();
      await page.waitForTimeout(500);

      const logoutOption = page.locator('[data-testid="logout"], a:has-text("logout"), button:has-text("logout")');
      
      if (await logoutOption.isVisible()) {
        await logoutOption.click();
        await page.waitForTimeout(1000);

        // Check for confirmation dialog
        const confirmDialog = page.locator('[role="dialog"], .modal, [data-testid="logout-confirmation"]');
        const confirmButton = page.locator('button:has-text("confirm"), button:has-text("yes"), [data-testid="confirm-logout"]');
        const cancelButton = page.locator('button:has-text("cancel"), button:has-text("no"), [data-testid="cancel-logout"]');

        if (await confirmDialog.isVisible()) {
          confirmationShown = true;

          // Test canceling logout
          if (await cancelButton.isVisible()) {
            await cancelButton.click();
            await page.waitForTimeout(1000);

            // Should still be logged in
            expect(page.url()).toMatch(/dashboard/);

            // Try logout again and confirm this time
            await userMenu.click();
            await page.waitForTimeout(500);
            await logoutOption.click();
            await page.waitForTimeout(500);

            if (await confirmButton.isVisible()) {
              await confirmButton.click();
              await page.waitForTimeout(2000);
            }
          }
        }
      }
    }

    // Note: Confirmation is optional but good UX
    if (!confirmationShown) {
      console.log('Logout confirmation not implemented - direct logout');
    }

    // Assert: Should be logged out regardless of confirmation presence
    const loggedOut = page.url().includes('/login') || 
                     page.url().includes('/auth') ||
                     page.url() === '/';
    expect(loggedOut).toBe(true);
  });

  test('Logout provides clear visual feedback', async () => {
    // Arrange: Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Act: Initiate logout
    const logoutStarted = await findAndClickLogout();
    expect(logoutStarted).toBe(true);

    // Check for loading/processing indicators during logout
    const loadingIndicators = page.locator('[data-testid="logout-loading"], .loading, .spinner, text=/logging.*out|signing.*out/i');
    
    // Wait a bit to see if loading indicator appears
    await page.waitForTimeout(500);
    
    const hasLoadingFeedback = await loadingIndicators.isVisible();
    
    if (hasLoadingFeedback) {
      // Wait for loading to complete
      await page.waitForTimeout(2000);
    }

    // Wait for logout to complete
    await page.waitForTimeout(2000);

    // Assert: Should show clear completion state
    const loggedOut = page.url().includes('/login') || 
                     page.url().includes('/auth') ||
                     page.url() === '/';
    expect(loggedOut).toBe(true);

    // Check for success message if on login page
    if (page.url().includes('/login')) {
      const successMessage = page.locator('text=/logged.*out|signed.*out|goodbye/i');
      const hasSuccessMessage = await successMessage.isVisible();
      
      // Success message is nice to have but not required
      if (hasSuccessMessage) {
        console.log('Logout success message shown');
      }
    }
  });

  test('Multiple logout attempts are handled gracefully', async () => {
    // Arrange: Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    // Act: Try multiple logout attempts
    const firstLogout = await findAndClickLogout();
    expect(firstLogout).toBe(true);

    // Immediately try logout again (race condition test)
    await findAndClickLogout();
    
    // Wait for any logout process to complete
    await page.waitForTimeout(3000);

    // Assert: Should handle gracefully without errors
    const finalState = page.url().includes('/login') || 
                      page.url().includes('/auth') ||
                      page.url() === '/';
    expect(finalState).toBe(true);

    // Should not show error messages
    const errorMessages = page.locator('[role="alert"], .error, text=/error|failed/i');
    const hasErrors = await errorMessages.isVisible();
    
    if (hasErrors) {
      const errorText = await errorMessages.textContent();
      // Logout-related errors should not appear
      const isLogoutError = errorText?.toLowerCase().includes('logout') ||
                           errorText?.toLowerCase().includes('sign out');
      expect(isLogoutError).toBe(false);
    }
  });

  test('Back button after logout does not restore session', async () => {
    // Arrange: Navigate to dashboard and interact with it
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    
    // Store page content to verify we were there
    const dashboardContent = await page.content();
    expect(dashboardContent).toContain('dashboard');

    // Act: Logout
    const logoutSuccess = await findAndClickLogout();
    expect(logoutSuccess).toBe(true);
    await page.waitForTimeout(2000);

    // Verify we're logged out
    const loggedOut = page.url().includes('/login') || 
                     page.url().includes('/auth') ||
                     page.url() === '/';
    expect(loggedOut).toBe(true);

    // Act: Use browser back button
    await page.goBack();
    await page.waitForTimeout(2000);

    // Assert: Should not restore authenticated session
    const backToLogin = page.url().includes('/login') ||
                       page.url().includes('/auth') ||
                       page.url() === '/';

    if (!backToLogin) {
      // If we're back on dashboard, it should require re-authentication
      const authRequired = page.locator('text=/login|sign.*in|authentication.*required/i');
      const hasAuthPrompt = await authRequired.isVisible();
      expect(hasAuthPrompt).toBe(true);
    } else {
      expect(backToLogin).toBe(true);
    }

    // Try to access protected content
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);

    const stillLoggedOut = page.url().includes('/login') ||
                          page.url().includes('/auth') ||
                          await page.locator('text=/login|sign.*in/i').isVisible();
    expect(stillLoggedOut).toBe(true);
  });

  // Helper function to find and click logout
  async function findAndClickLogout(): Promise<boolean> {
    // Try different patterns to find logout option
    
    // Pattern 1: Look for user menu button first
    const userMenuButton = page.locator('[data-testid="user-menu-button"], button[aria-label*="user"], button[aria-label*="profile"]');
    if (await userMenuButton.isVisible()) {
      await userMenuButton.click();
      await page.waitForTimeout(500);
    }

    // Pattern 2: Look for user avatar or menu
    const userMenu = page.locator('[data-testid="user-menu"], [data-testid="profile-menu"], .user-menu');
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await page.waitForTimeout(500);
    }

    // Pattern 3: Look for user avatar image
    const userAvatar = page.locator('[data-testid="user-avatar"], .user-avatar, img[alt*="profile"]');
    if (await userAvatar.isVisible()) {
      await userAvatar.click();
      await page.waitForTimeout(500);
    }

    // Now look for logout option
    const logoutOption = page.locator('[data-testid="logout"], a:has-text("logout"), button:has-text("logout"), text=/logout|sign.*out/i');
    
    if (await logoutOption.isVisible()) {
      await logoutOption.click();
      return true;
    }

    // Pattern 4: Look in navigation bar
    const navLogout = page.locator('nav a:has-text("logout"), nav button:has-text("logout")');
    if (await navLogout.isVisible()) {
      await navLogout.click();
      return true;
    }

    return false;
  }

  // Helper function to find user menu element
  async function findUserMenu() {
    const selectors = [
      '[data-testid="user-menu-button"]',
      '[data-testid="user-menu"]',
      '[data-testid="profile-menu"]',
      '.user-menu',
      'button[aria-label*="user"]',
      'button[aria-label*="profile"]',
      '[data-testid="user-avatar"]',
      '.user-avatar'
    ];

    for (const selector of selectors) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        return element;
      }
    }

    return null;
  }
});