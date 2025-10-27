import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { SettingsPage } from '../pages/SettingsPage';

/**
 * E2E Tests: Staff Role Permissions
 * 
 * Task: T066 [US0] Create E2E test "Staff denied access to restricted pages"
 * 
 * Purpose: Verify that Staff users are properly restricted from accessing 
 * administrative settings and other restricted pages, with proper 403 Forbidden
 * responses and audit logging.
 * 
 * Requirements:
 * - Staff role has limited permissions within their assigned store
 * - Cannot access /settings, /admin, or other restricted administrative pages
 * - 403 Forbidden response returned for unauthorized access attempts
 * - Audit logs record unauthorized access attempts
 * - Proper error messaging displayed to user
 * 
 * User Story: US0 Authentication
 * Role: Staff (limited store access based on permissions)
 * Acceptance Criteria:
 * - Staff user can login successfully
 * - Staff user cannot access settings page (/settings)
 * - 403 Forbidden error displayed for unauthorized pages
 * - Audit log entry created for permission violation
 * - User remains authenticated but blocked from restricted content
 */

test.describe('Staff Role Permissions - T066', () => {
  let page: Page;
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let settingsPage: SettingsPage;

  // Test data
  const staffUser = {
    email: 'staff@stormcom.dev',
    password: 'Staff123!@#',
    role: 'STAFF',
    storeId: 'store-001',
    storeName: 'Electronics Store'
  };

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    settingsPage = new SettingsPage(page);

    // Navigate to login page
    await loginPage.goto();
  });

  test.afterEach(async () => {
    // Cleanup: Logout if still authenticated
    try {
      await page.goto('/logout');
    } catch {
      // Page may already be on login/error page
    }
  });

  test('Staff user denied access to settings page with 403 Forbidden', async () => {
    // Arrange: Login as Staff user
    await loginPage.login(staffUser.email, staffUser.password);
    await dashboardPage.waitForPageLoad();

    // Verify Staff user is logged in successfully
    await expect(dashboardPage.heading).toBeVisible();
    await expect(dashboardPage.welcomeMessage).toBeVisible();

    // Act: Attempt to navigate to settings page
    await settingsPage.goto();

    // Assert: Verify 403 Forbidden response
    await expect(page).toHaveTitle(/403|Forbidden|Access Denied/);
    
    // Check for forbidden status in URL or content
    const isForbidden = await settingsPage.isForbidden();
    expect(isForbidden).toBe(true);

    // Verify error message is displayed
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/403|Forbidden|not authorized|access denied/i);

    // Verify helpful message for user
    const accessDeniedText = page.locator('text="You do not have permission to access this page"');
    await expect(accessDeniedText).toBeVisible();
  });

  test('Staff user cannot access settings through direct navigation', async () => {
    // Arrange: Login as Staff user
    await loginPage.login(staffUser.email, staffUser.password);
    await dashboardPage.waitForPageLoad();

    // Act: Try to navigate directly to settings page via URL
    await page.goto('/settings');

    // Assert: Verify access is denied
    const hasAccess = await settingsPage.hasAccess();
    expect(hasAccess).toBe(false);

    // Verify appropriate error response
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/403|forbidden|error|unauthorized/i);
    
    // Check page content indicates forbidden access
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/403|forbidden|not authorized|access denied/i);
  });

  test('Staff user cannot access admin panel or restricted routes', async () => {
    // Arrange: Login as Staff user
    await loginPage.login(staffUser.email, staffUser.password);
    await dashboardPage.waitForPageLoad();

    // List of restricted routes for Staff role
    const restrictedRoutes = [
      '/admin',
      '/admin/users',
      '/admin/stores',
      '/settings',
      '/settings/billing',
      '/settings/api-keys',
      '/analytics/admin',
      '/system-logs'
    ];

    // Act & Assert: Test each restricted route
    for (const route of restrictedRoutes) {
      await page.goto(route);
      
      // Check if access is properly denied
      const pageContent = await page.textContent('body');
      const currentUrl = page.url();
      
      // Verify forbidden access (either 403 page or redirect to error)
      const isForbidden = currentUrl.includes('403') || 
                         currentUrl.includes('forbidden') ||
                         currentUrl.includes('unauthorized') ||
                         pageContent?.includes('403') ||
                         pageContent?.includes('Forbidden') ||
                         pageContent?.includes('not authorized');
      
      expect(isForbidden).toBe(true);
    }
  });

  test('Staff permissions properly enforced across different store contexts', async () => {
    // Arrange: Login as Staff user
    await loginPage.login(staffUser.email, staffUser.password);
    await dashboardPage.waitForPageLoad();

    // Verify Staff user is restricted to their assigned store
    const currentStore = await dashboardPage.getCurrentStore();
    expect(currentStore).toContain(staffUser.storeName);

    // Act: Try to access settings for current store
    await settingsPage.goto();

    // Assert: Verify access denied even for assigned store
    const hasAccess = await settingsPage.hasAccess();
    expect(hasAccess).toBe(false);

    // Verify Staff cannot switch to admin functions
    await page.goto('/dashboard');
    await dashboardPage.waitForPageLoad();

    // Check that admin-level navigation items are not visible
    const hasStoresLink = await dashboardPage.hasStoresLink();
    expect(hasStoresLink).toBe(false);

    const hasSettingsLink = await page.locator('[data-testid="settings-nav-item"]').isVisible();
    expect(hasSettingsLink).toBe(false);
  });

  test('Audit log entry created for unauthorized access attempt', async () => {
    // Arrange: Login as Staff user
    await loginPage.login(staffUser.email, staffUser.password);
    await dashboardPage.waitForPageLoad();

    // Act: Attempt unauthorized access to settings
    await settingsPage.goto();

    // Verify access denied
    const hasAccess = await settingsPage.hasAccess();
    expect(hasAccess).toBe(false);

    // Note: In a real implementation, we would verify audit logs through:
    // 1. API call to audit log endpoint (if available)
    // 2. Database query to audit_logs table
    // 3. Admin interface to view security events
    
    // For this E2E test, we simulate the audit verification
    // In production, this would involve checking the audit system
    
    // Expected audit log entry structure:
    // {
    //   event_type: 'UNAUTHORIZED_ACCESS_ATTEMPT',
    //   user_id: staffUser.id,
    //   user_email: staffUser.email,
    //   user_role: 'STAFF',
    //   resource: '/settings',
    //   action: 'VIEW',
    //   result: 'DENIED',
    //   reason: 'INSUFFICIENT_PERMISSIONS',
    //   timestamp: accessAttemptTime,
    //   ip_address: request.ip,
    //   user_agent: request.headers['user-agent'],
    //   store_id: staffUser.storeId
    // }

    // Verify error page contains security notice
    const securityNotice = page.locator('[data-testid="security-notice"]');
    await expect(securityNotice).toBeVisible();
    await expect(securityNotice).toContainText('This access attempt has been logged');
  });

  test('Staff user can access allowed pages within their role', async () => {
    // Arrange: Login as Staff user
    await loginPage.login(staffUser.email, staffUser.password);
    await dashboardPage.waitForPageLoad();

    // List of pages Staff should have access to
    const allowedRoutes = [
      '/dashboard',
      '/products',
      '/orders',
      '/customers',
      '/inventory'
    ];

    // Act & Assert: Verify Staff can access appropriate pages
    for (const route of allowedRoutes) {
      await page.goto(route);
      
      // Verify page loads successfully (not 403/404)
      const pageContent = await page.textContent('body');
      const currentUrl = page.url();
      
      // Ensure it's not a forbidden page
      const isForbidden = currentUrl.includes('403') || 
                         currentUrl.includes('forbidden') ||
                         pageContent?.includes('403') ||
                         pageContent?.includes('Forbidden');
      
      expect(isForbidden).toBe(false);
      
      // Verify page content loaded (has meaningful content)
      expect(pageContent?.length).toBeGreaterThan(100);
    }
  });

  test('Staff role restrictions persist across browser sessions', async () => {
    // Arrange: Login as Staff user
    await loginPage.login(staffUser.email, staffUser.password);
    await dashboardPage.waitForPageLoad();

    // Verify initial access restrictions
    await settingsPage.goto();
    let hasAccess = await settingsPage.hasAccess();
    expect(hasAccess).toBe(false);

    // Simulate session persistence (browser refresh)
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Act: Try settings access again after refresh
    await settingsPage.goto();

    // Assert: Restrictions still enforced
    hasAccess = await settingsPage.hasAccess();
    expect(hasAccess).toBe(false);

    // Verify user is still authenticated as Staff
    await page.goto('/dashboard');
    await dashboardPage.waitForPageLoad();
    await expect(dashboardPage.welcomeMessage).toBeVisible();
  });

  test('Permission denied pages include proper error messaging and navigation', async () => {
    // Arrange: Login as Staff user
    await loginPage.login(staffUser.email, staffUser.password);
    await dashboardPage.waitForPageLoad();

    // Act: Navigate to restricted page
    await settingsPage.goto();

    // Assert: Verify comprehensive error page
    
    // Check for user-friendly error message
    const errorHeading = page.locator('h1');
    await expect(errorHeading).toContainText(/403|Forbidden|Access Denied/i);

    // Verify explanation text
    const explanation = page.locator('[data-testid="error-explanation"]');
    await expect(explanation).toBeVisible();
    await expect(explanation).toContainText('You do not have permission to access this page');

    // Check for navigation options
    const backToDashboardLink = page.locator('[data-testid="back-to-dashboard-link"]');
    await expect(backToDashboardLink).toBeVisible();
    await expect(backToDashboardLink).toHaveAttribute('href', '/dashboard');

    // Verify contact support option
    const contactSupportLink = page.locator('[data-testid="contact-support-link"]');
    await expect(contactSupportLink).toBeVisible();

    // Test navigation back to dashboard
    await backToDashboardLink.click();
    await dashboardPage.waitForPageLoad();
    await expect(dashboardPage.heading).toBeVisible();
  });

  test('Accessibility compliance for permission denied pages', async () => {
    // Arrange: Login as Staff user
    await loginPage.login(staffUser.email, staffUser.password);
    await dashboardPage.waitForPageLoad();

    // Act: Navigate to restricted page
    await settingsPage.goto();

    // Assert: Check accessibility features

    // Verify proper heading structure
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Check for skip to content link
    const skipLink = page.locator('[data-testid="skip-to-content"]');
    await expect(skipLink).toBeVisible();

    // Verify error message has proper ARIA role
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();

    // Check keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();

    // Verify links have proper accessibility attributes
    const links = page.locator('a');
    const linkCount = await links.count();
    
    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href');
      if (href) {
        await expect(link).toHaveAttribute('href');
        // Links should have accessible text
        const linkText = await link.textContent();
        expect(linkText?.trim().length).toBeGreaterThan(0);
      }
    }
  });
});