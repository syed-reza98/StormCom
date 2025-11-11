import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Customer Account page
 * Represents the customer-facing account dashboard with order history
 * Used in: customer-login.spec.ts (T068)
 * 
 * Routes covered: /account, /account/orders, /account/settings
 */
export class AccountPage {
  readonly page: Page;

  // Navigation elements
  readonly pageTitle: Locator;
  readonly navigationTabs: Locator;
  readonly ordersTab: Locator;
  readonly settingsTab: Locator;
  readonly profileTab: Locator;

  // Profile section elements
  readonly profileSection: Locator;
  readonly customerName: Locator;
  readonly customerEmail: Locator;
  readonly memberSince: Locator;

  // Order history elements
  readonly orderHistorySection: Locator;
  readonly orderHistoryTable: Locator;
  readonly orderRows: Locator;
  readonly noOrdersMessage: Locator;
  readonly orderNumberLinks: Locator;
  readonly orderStatusBadges: Locator;
  readonly orderTotalPrices: Locator;
  readonly orderDates: Locator;

  // Order filters and search
  readonly orderSearchInput: Locator;
  readonly orderStatusFilter: Locator;
  readonly orderDateFilter: Locator;
  readonly searchButton: Locator;
  readonly clearFiltersButton: Locator;

  // Pagination (if enabled)
  readonly paginationContainer: Locator;
  readonly nextPageButton: Locator;
  readonly prevPageButton: Locator;
  readonly pageNumbers: Locator;

  // Account settings elements
  readonly settingsSection: Locator;
  readonly changePasswordButton: Locator;
  readonly updateProfileButton: Locator;
  readonly emailPreferencesButton: Locator;

  // Header and user menu
  readonly userMenuTrigger: Locator;
  readonly logoutButton: Locator;
  readonly backToStoreButton: Locator;

  // Loading and error states
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation elements
    this.pageTitle = page.locator('h1', { hasText: 'My Account' });
    this.navigationTabs = page.locator('[role="tablist"]');
    this.ordersTab = page.locator('[role="tab"]', { hasText: 'Order History' });
    this.settingsTab = page.locator('[role="tab"]', { hasText: 'Settings' });
    this.profileTab = page.locator('[role="tab"]', { hasText: 'Profile' });

    // Profile section elements
    this.profileSection = page.locator('[data-testid="profile-section"]');
    this.customerName = page.locator('[data-testid="customer-name"]');
    this.customerEmail = page.locator('[data-testid="customer-email"]');
    this.memberSince = page.locator('[data-testid="member-since"]');

    // Order history elements
    this.orderHistorySection = page.locator('[data-testid="order-history-section"]');
    this.orderHistoryTable = page.locator('[data-testid="order-history-table"]');
    this.orderRows = page.locator('[data-testid="order-row"]');
    this.noOrdersMessage = page.locator('[data-testid="no-orders-message"]');
    this.orderNumberLinks = page.locator('[data-testid="order-number-link"]');
    this.orderStatusBadges = page.locator('[data-testid="order-status-badge"]');
    this.orderTotalPrices = page.locator('[data-testid="order-total-price"]');
    this.orderDates = page.locator('[data-testid="order-date"]');

    // Order filters and search
    this.orderSearchInput = page.locator('[data-testid="order-search-input"]');
    this.orderStatusFilter = page.locator('[data-testid="order-status-filter"]');
    this.orderDateFilter = page.locator('[data-testid="order-date-filter"]');
    this.searchButton = page.locator('[data-testid="search-orders-button"]');
    this.clearFiltersButton = page.locator('[data-testid="clear-filters-button"]');

    // Pagination
    this.paginationContainer = page.locator('[data-testid="pagination"]');
    this.nextPageButton = page.locator('[data-testid="next-page-button"]');
    this.prevPageButton = page.locator('[data-testid="prev-page-button"]');
    this.pageNumbers = page.locator('[data-testid="page-number"]');

    // Account settings elements
    this.settingsSection = page.locator('[data-testid="settings-section"]');
    this.changePasswordButton = page.locator('[data-testid="change-password-button"]');
    this.updateProfileButton = page.locator('[data-testid="update-profile-button"]');
    this.emailPreferencesButton = page.locator('[data-testid="email-preferences-button"]');

    // Header and user menu
    this.userMenuTrigger = page.locator('[data-testid="user-menu-trigger"]');
    this.logoutButton = page.locator('[data-testid="logout-button"]');
    this.backToStoreButton = page.locator('[data-testid="back-to-store-button"]');

    // Loading and error states
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  /**
   * Navigate to the account page
   * @param storeSubdomain - Store subdomain for multi-tenant routing
   */
  async goto(storeSubdomain: string): Promise<void> {
    await this.page.goto(`http://${storeSubdomain}.localhost:3000/account`);
  }

  /**
   * Wait for the page to load completely
   */
  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Switch to the order history tab
   */
  async navigateToOrderHistory(): Promise<void> {
    await this.ordersTab.click();
    await this.orderHistorySection.waitFor({ state: 'visible' });
  }

  /**
   * Switch to the settings tab
   */
  async navigateToSettings(): Promise<void> {
    await this.settingsTab.click();
    await this.settingsSection.waitFor({ state: 'visible' });
  }

  /**
   * Switch to the profile tab
   */
  async navigateToProfile(): Promise<void> {
    await this.profileTab.click();
    await this.profileSection.waitFor({ state: 'visible' });
  }

  /**
   * Get customer information from the profile section
   */
  async getCustomerInfo(): Promise<{
    name: string;
    email: string;
    memberSince?: string;
  }> {
    const name = await this.customerName.textContent() || '';
    const email = await this.customerEmail.textContent() || '';
    const memberSince = await this.memberSince.textContent();

    return {
      name: name.trim(),
      email: email.trim(),
      memberSince: memberSince?.trim()
    };
  }

  /**
   * Check if order history is displayed
   */
  async hasOrderHistory(): Promise<boolean> {
    try {
      await this.orderHistoryTable.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      // Check if "no orders" message is shown instead
      await this.noOrdersMessage.waitFor({ state: 'visible' });
      return false;
    }
  }

  /**
   * Get all visible orders from the order history table
   */
  async getOrders(): Promise<Array<{
    orderNumber: string;
    status: string;
    total: string;
    date: string;
  }>> {
    await this.orderHistoryTable.waitFor({ state: 'visible' });
    
    const orders = [];
    const orderCount = await this.orderRows.count();

    for (let i = 0; i < orderCount; i++) {
      const row = this.orderRows.nth(i);
      const orderNumber = await row.locator('[data-testid="order-number-link"]').textContent() || '';
      const status = await row.locator('[data-testid="order-status-badge"]').textContent() || '';
      const total = await row.locator('[data-testid="order-total-price"]').textContent() || '';
      const date = await row.locator('[data-testid="order-date"]').textContent() || '';

      orders.push({
        orderNumber: orderNumber.trim(),
        status: status.trim(),
        total: total.trim(),
        date: date.trim()
      });
    }

    return orders;
  }

  /**
   * Search for orders by order number or customer name
   */
  async searchOrders(searchTerm: string): Promise<void> {
    await this.orderSearchInput.fill(searchTerm);
    await this.searchButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Filter orders by status
   */
  async filterOrdersByStatus(status: string): Promise<void> {
    await this.orderStatusFilter.selectOption(status);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Clear all applied filters
   */
  async clearFilters(): Promise<void> {
    await this.clearFiltersButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click on an order to view details
   */
  async viewOrderDetails(orderNumber: string): Promise<void> {
    await this.page.locator(`[data-testid="order-number-link"]`, { hasText: orderNumber }).click();
  }

  /**
   * Logout from the user menu
   */
  async logout(): Promise<void> {
    await this.userMenuTrigger.click();
    await this.logoutButton.click();
  }

  /**
   * Navigate back to the storefront
   */
  async backToStore(): Promise<void> {
    await this.backToStoreButton.click();
  }

  /**
   * Validate the page is properly loaded and accessible
   */
  async validateAccessibility(): Promise<void> {
    // Check page title is present and has correct text
    await expect(this.pageTitle).toBeVisible();
    await expect(this.pageTitle).toHaveText('My Account');

    // Check navigation tabs are accessible
    await expect(this.navigationTabs).toBeVisible();
    await expect(this.ordersTab).toHaveAttribute('role', 'tab');
    await expect(this.settingsTab).toHaveAttribute('role', 'tab');

    // Check ARIA labels exist on interactive elements
    await expect(this.userMenuTrigger).toHaveAttribute('aria-label');
    
    // Verify keyboard navigation works
    await this.ordersTab.focus();
    await expect(this.ordersTab).toBeFocused();
  }

  /**
   * Validate customer is properly authenticated and authorized
   */
  async validateCustomerAccess(expectedEmail: string): Promise<void> {
    await this.waitForLoad();
    
    // Validate customer info is displayed
    const customerInfo = await this.getCustomerInfo();
    expect(customerInfo.email).toBe(expectedEmail);
    
    // Validate account sections are visible
    await expect(this.navigationTabs).toBeVisible();
    await expect(this.profileSection).toBeVisible();
  }

  /**
   * Validate order history is accessible and properly formatted
   */
  async validateOrderHistory(): Promise<void> {
    await this.navigateToOrderHistory();
    
    const hasOrders = await this.hasOrderHistory();
    
    if (hasOrders) {
      // Validate table structure and accessibility
      await expect(this.orderHistoryTable).toBeVisible();
      await expect(this.orderHistoryTable).toHaveAttribute('role', 'table');
      
      // Validate at least one order is displayed
      await expect(this.orderRows.first()).toBeVisible();
      
      // Validate order links are accessible
      const firstOrderLink = this.orderNumberLinks.first();
      await expect(firstOrderLink).toBeVisible();
      await expect(firstOrderLink).toHaveAttribute('href');
    } else {
      // Validate "no orders" message is displayed
      await expect(this.noOrdersMessage).toBeVisible();
      await expect(this.noOrdersMessage).toContainText('no orders');
    }
  }
}