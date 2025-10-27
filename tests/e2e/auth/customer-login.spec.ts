import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { AccountPage } from '../pages/AccountPage';

/**
 * E2E Tests: Customer Login and Account Redirect
 * 
 * Task: T068 [US0] Create E2E test "Customer redirected to account page"
 * 
 * Purpose: Verify that Customer role users are properly redirected to their
 * account page after login, with access to order history and account features.
 * 
 * Requirements:
 * - Customer role redirects to /account after successful login
 * - Account page displays customer information and order history
 * - Customer cannot access admin dashboard (/dashboard)
 * - Proper role-based navigation and permissions
 * - Customer-facing features accessible (orders, profile, settings)
 * 
 * User Story: US0 Authentication
 * Role: Customer (storefront access only)
 * Acceptance Criteria:
 * - Customer login redirects to /account page
 * - Account page shows customer name, email, and member since date
 * - Order history section is visible and accessible
 * - Customer cannot access /dashboard or admin functions
 * - Navigation includes customer-appropriate links only
 */

test.describe('Customer Login and Account Redirect - T068', () => {
  let page: Page;
  let loginPage: LoginPage;
  let accountPage: AccountPage;

  // Test data for customer user
  const customerUser = {
    email: 'customer@stormcom.dev',
    password: 'Customer123!@#',
    role: 'CUSTOMER',
    firstName: 'John',
    lastName: 'Customer',
    storeSubdomain: 'electronics',
    storeName: 'Electronics Store'
  };

  // Test data for customer with order history
  const customerWithOrders = {
    email: 'customer.orders@stormcom.dev',
    password: 'Customer123!@#',
    role: 'CUSTOMER',
    firstName: 'Jane',
    lastName: 'Shopper',
    storeSubdomain: 'electronics',
    orderCount: 3
  };

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    loginPage = new LoginPage(page);
    accountPage = new AccountPage(page);

    // Navigate to login page for the specific store
    await loginPage.goto();
  });

  test.afterEach(async () => {
    // Cleanup: Logout and clear session
    try {
      await accountPage.logout();
    } catch {
      // May already be logged out
    }
    
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('Customer login redirects to account page', async () => {
    // Act: Login as Customer
    await loginPage.login(customerUser.email, customerUser.password);

    // Assert: Verify redirect to account page
    await page.waitForURL(/\/account/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/account/);
    
    // Verify account page loads correctly
    await accountPage.waitForLoad();
    await expect(accountPage.pageTitle).toBeVisible();
    await expect(accountPage.pageTitle).toHaveText('My Account');
  });

  test('Account page displays customer information correctly', async () => {
    // Arrange: Login as Customer
    await loginPage.login(customerUser.email, customerUser.password);
    await page.waitForURL(/\/account/);
    await accountPage.waitForLoad();

    // Act: Get customer information from account page
    const customerInfo = await accountPage.getCustomerInfo();

    // Assert: Verify customer information is displayed
    expect(customerInfo.email).toBe(customerUser.email);
    expect(customerInfo.name).toContain(customerUser.firstName);
    
    // Verify profile section is visible
    await expect(accountPage.profileSection).toBeVisible();
    await expect(accountPage.customerEmail).toContainText(customerUser.email);
    
    // Check member since date is displayed
    if (customerInfo.memberSince) {
      expect(customerInfo.memberSince.length).toBeGreaterThan(0);
      await expect(accountPage.memberSince).toBeVisible();
    }
  });

  test('Customer can access order history section', async () => {
    // Arrange: Login as Customer
    await loginPage.login(customerUser.email, customerUser.password);
    await page.waitForURL(/\/account/);
    await accountPage.waitForLoad();

    // Act: Navigate to order history
    await accountPage.navigateToOrderHistory();

    // Assert: Verify order history section is accessible
    await expect(accountPage.orderHistorySection).toBeVisible();
    
    // Check if customer has orders or shows "no orders" message
    const hasOrders = await accountPage.hasOrderHistory();
    
    if (hasOrders) {
      // Verify order table is displayed
      await expect(accountPage.orderHistoryTable).toBeVisible();
      await expect(accountPage.orderRows.first()).toBeVisible();
    } else {
      // Verify "no orders" message is shown
      await expect(accountPage.noOrdersMessage).toBeVisible();
      await expect(accountPage.noOrdersMessage).toContainText(/no orders/i);
    }
  });

  test('Customer with existing orders can view order history', async () => {
    // Arrange: Login as Customer with order history
    await loginPage.login(customerWithOrders.email, customerWithOrders.password);
    await page.waitForURL(/\/account/);
    await accountPage.waitForLoad();

    // Act: Navigate to order history
    await accountPage.navigateToOrderHistory();

    // Assert: Verify orders are displayed
    const hasOrders = await accountPage.hasOrderHistory();
    expect(hasOrders).toBe(true);

    // Get order list
    const orders = await accountPage.getOrders();
    expect(orders.length).toBeGreaterThan(0);
    
    // Verify order data structure
    for (const order of orders) {
      expect(order.orderNumber).toBeTruthy();
      expect(order.status).toBeTruthy();
      expect(order.total).toBeTruthy();
      expect(order.date).toBeTruthy();
    }

    // Verify order table accessibility
    await expect(accountPage.orderHistoryTable).toHaveAttribute('role', 'table');
  });

  test('Customer cannot access admin dashboard', async () => {
    // Arrange: Login as Customer
    await loginPage.login(customerUser.email, customerUser.password);
    await page.waitForURL(/\/account/);

    // Act: Attempt to navigate to admin dashboard
    await page.goto('/dashboard');

    // Assert: Verify access is denied or redirected
    await page.waitForTimeout(2000); // Wait for any redirect/error

    const currentUrl = page.url();
    
    // Should either:
    // 1. Be redirected back to account page
    // 2. Show 403/forbidden error
    // 3. Show 404 not found
    // Should NOT show admin dashboard
    
    const isOnAccountPage = currentUrl.includes('/account');
    const isForbidden = currentUrl.includes('403') || currentUrl.includes('forbidden');
    const isNotFound = currentUrl.includes('404');
    const isDashboard = currentUrl.includes('/dashboard');
    
    expect(isDashboard).toBe(false);
    expect(isOnAccountPage || isForbidden || isNotFound).toBe(true);
  });

  test('Customer navigation includes appropriate customer-facing links', async () => {
    // Arrange: Login as Customer
    await loginPage.login(customerUser.email, customerUser.password);
    await page.waitForURL(/\/account/);
    await accountPage.waitForLoad();

    // Assert: Verify customer navigation tabs are present
    await expect(accountPage.navigationTabs).toBeVisible();
    await expect(accountPage.ordersTab).toBeVisible();
    await expect(accountPage.settingsTab).toBeVisible();
    await expect(accountPage.profileTab).toBeVisible();

    // Verify navigation accessibility
    await expect(accountPage.ordersTab).toHaveAttribute('role', 'tab');
    await expect(accountPage.settingsTab).toHaveAttribute('role', 'tab');
    await expect(accountPage.profileTab).toHaveAttribute('role', 'tab');

    // Check that admin-specific navigation is NOT present
    const adminNavItems = page.locator('[data-testid*="admin"], [href*="/admin"], [href*="/stores"]');
    await expect(adminNavItems).toHaveCount(0);
  });

  test('Customer can navigate between account sections', async () => {
    // Arrange: Login as Customer
    await loginPage.login(customerUser.email, customerUser.password);
    await page.waitForURL(/\/account/);
    await accountPage.waitForLoad();

    // Act & Assert: Test navigation between sections

    // Navigate to Profile tab
    await accountPage.navigateToProfile();
    await expect(accountPage.profileSection).toBeVisible();

    // Navigate to Order History tab
    await accountPage.navigateToOrderHistory();
    await expect(accountPage.orderHistorySection).toBeVisible();

    // Navigate to Settings tab
    await accountPage.navigateToSettings();
    await expect(accountPage.settingsSection).toBeVisible();

    // Verify active tab indication
    const activeTab = page.locator('[role="tab"][aria-selected="true"]');
    await expect(activeTab).toBeVisible();
  });

  test('Customer can search and filter order history', async () => {
    // Arrange: Login as Customer with orders
    await loginPage.login(customerWithOrders.email, customerWithOrders.password);
    await page.waitForURL(/\/account/);
    await accountPage.waitForLoad();
    await accountPage.navigateToOrderHistory();

    // Skip if no orders exist
    const hasOrders = await accountPage.hasOrderHistory();
    if (!hasOrders) {
      test.skip('No orders available for search/filter testing');
    }

    // Act: Test order search functionality
    const orders = await accountPage.getOrders();
    if (orders.length > 0) {
      const firstOrder = orders[0];
      
      // Search by order number
      await accountPage.searchOrders(firstOrder.orderNumber);
      
      // Verify search results
      const filteredOrders = await accountPage.getOrders();
      expect(filteredOrders.some(order => 
        order.orderNumber.includes(firstOrder.orderNumber)
      )).toBe(true);
      
      // Clear search
      await accountPage.clearFilters();
    }

    // Test status filter if dropdown exists
    const statusFilterExists = await accountPage.orderStatusFilter.isVisible();
    if (statusFilterExists) {
      await accountPage.filterOrdersByStatus('COMPLETED');
      // Verify filtered results show only completed orders
      const statusFilteredOrders = await accountPage.getOrders();
      statusFilteredOrders.forEach(order => {
        expect(order.status.toLowerCase()).toContain('completed');
      });
    }
  });

  test('Customer can view individual order details', async () => {
    // Arrange: Login as Customer with orders
    await loginPage.login(customerWithOrders.email, customerWithOrders.password);
    await page.waitForURL(/\/account/);
    await accountPage.waitForLoad();
    await accountPage.navigateToOrderHistory();

    // Skip if no orders exist
    const hasOrders = await accountPage.hasOrderHistory();
    if (!hasOrders) {
      test.skip('No orders available for detail viewing');
    }

    // Act: Click on first order to view details
    const orders = await accountPage.getOrders();
    if (orders.length > 0) {
      const firstOrder = orders[0];
      await accountPage.viewOrderDetails(firstOrder.orderNumber);

      // Assert: Verify navigation to order details page
      await page.waitForURL(/\/account\/orders\/[^\/]+/);
      
      // Verify order details page loads
      const orderDetailsHeading = page.locator('h1, h2', { hasText: /order.*#|order.*details/i });
      await expect(orderDetailsHeading).toBeVisible();
    }
  });

  test('Customer account page accessibility compliance', async () => {
    // Arrange: Login as Customer
    await loginPage.login(customerUser.email, customerUser.password);
    await page.waitForURL(/\/account/);
    await accountPage.waitForLoad();

    // Act & Assert: Check accessibility features
    await accountPage.validateAccessibility();

    // Additional accessibility checks
    
    // Verify skip to content link
    const skipLink = page.locator('[data-testid="skip-to-content"]');
    await expect(skipLink).toBeVisible();

    // Check heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);

    // Verify keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'INPUT', 'SELECT']).toContain(focusedElement);

    // Check ARIA landmarks
    const landmarks = page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]');
    const landmarkCount = await landmarks.count();
    expect(landmarkCount).toBeGreaterThan(0);
  });

  test('Customer logout functionality works correctly', async () => {
    // Arrange: Login as Customer
    await loginPage.login(customerUser.email, customerUser.password);
    await page.waitForURL(/\/account/);
    await accountPage.waitForLoad();

    // Act: Logout using account page logout button
    await accountPage.logout();

    // Assert: Verify redirect to login page
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/login/);

    // Verify user is actually logged out (no session)
    const sessionCookies = await page.context().cookies();
    const authSession = sessionCookies.find(cookie => 
      cookie.name.includes('session') || cookie.name.includes('auth')
    );
    expect(authSession?.value).toBeFalsy();

    // Verify cannot access account page without login
    await page.goto('/account');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/login/);
  });

  test('Customer session persists across page refreshes', async () => {
    // Arrange: Login as Customer
    await loginPage.login(customerUser.email, customerUser.password);
    await page.waitForURL(/\/account/);
    await accountPage.waitForLoad();

    // Act: Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Assert: Verify still on account page and authenticated
    expect(page.url()).toMatch(/\/account/);
    await accountPage.waitForLoad();
    
    // Verify customer info still accessible
    const customerInfo = await accountPage.getCustomerInfo();
    expect(customerInfo.email).toBe(customerUser.email);
  });

  test('Customer can navigate back to storefront', async () => {
    // Arrange: Login as Customer
    await loginPage.login(customerUser.email, customerUser.password);
    await page.waitForURL(/\/account/);
    await accountPage.waitForLoad();

    // Act: Navigate back to storefront
    const backToStoreVisible = await accountPage.backToStoreButton.isVisible();
    
    if (backToStoreVisible) {
      await accountPage.backToStore();
      
      // Assert: Verify navigation to storefront
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      
      // Should be on store homepage or product catalog
      expect(currentUrl).not.toMatch(/\/account/);
      expect(currentUrl).not.toMatch(/\/login/);
      
      // Verify storefront elements are present
      const storeContent = page.locator('[data-testid*="product"], [data-testid*="store"], .storefront');
      const hasStoreContent = await storeContent.count() > 0;
      expect(hasStoreContent).toBe(true);
    } else {
      // If no back to store button, check for alternative navigation
      const storeLink = page.locator('a[href="/"], a[href*="store"], [data-testid="store-home-link"]');
      const hasStoreLink = await storeLink.count() > 0;
      expect(hasStoreLink).toBe(true);
    }
  });
});