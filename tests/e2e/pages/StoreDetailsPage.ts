/**
 * Page Object Model for Store Details Page
 * 
 * Provides selectors and methods for interacting with the store details page
 * including tabs navigation, store information display, and management actions.
 */

import { Page, Locator, expect } from '@playwright/test';

export class StoreDetailsPage {
  readonly page: Page;
  
  // Header selectors
  readonly storeName: Locator;
  readonly storeEmail: Locator;
  readonly storeStatus: Locator;
  readonly storePlan: Locator;
  readonly storeUrl: Locator;
  readonly backButton: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly actionsDropdown: Locator;
  
  // Tab navigation
  readonly generalTab: Locator;
  readonly settingsTab: Locator;
  readonly themeTab: Locator;
  readonly billingTab: Locator;
  readonly usersTab: Locator;
  readonly productsTab: Locator;
  readonly ordersTab: Locator;
  readonly analyticsTab: Locator;
  
  // General tab content
  readonly storeInfo: Locator;
  readonly contactInfo: Locator;
  readonly addressInfo: Locator;
  readonly subscriptionInfo: Locator;
  readonly statisticsCards: Locator;
  
  // Quick stats
  readonly totalProducts: Locator;
  readonly totalOrders: Locator;
  readonly totalRevenue: Locator;
  readonly totalCustomers: Locator;
  
  // Actions and modals
  readonly deleteModal: Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelDeleteButton: Locator;
  readonly upgradeModal: Locator;
  readonly assignAdminModal: Locator;
  
  // Status indicators
  readonly trialBanner: Locator;
  readonly expiredBanner: Locator;
  readonly limitWarning: Locator;
  readonly upgradeNotice: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Header elements
    this.storeName = page.locator('[data-testid="store-name"]');
    this.storeEmail = page.locator('[data-testid="store-email"]');
    this.storeStatus = page.locator('[data-testid="store-status"]');
    this.storePlan = page.locator('[data-testid="store-plan"]');
    this.storeUrl = page.locator('[data-testid="store-url"]');
    this.backButton = page.locator('button[aria-label="Back to stores"]');
    this.editButton = page.locator('button').filter({ hasText: /edit/i });
    this.deleteButton = page.locator('button').filter({ hasText: /delete/i });
    this.actionsDropdown = page.locator('[data-testid="store-actions"]');
    
    // Tab navigation
    this.generalTab = page.locator('button[role="tab"]').filter({ hasText: /general/i });
    this.settingsTab = page.locator('button[role="tab"]').filter({ hasText: /settings/i });
    this.themeTab = page.locator('button[role="tab"]').filter({ hasText: /theme/i });
    this.billingTab = page.locator('button[role="tab"]').filter({ hasText: /billing/i });
    this.usersTab = page.locator('button[role="tab"]').filter({ hasText: /users/i });
    this.productsTab = page.locator('button[role="tab"]').filter({ hasText: /products/i });
    this.ordersTab = page.locator('button[role="tab"]').filter({ hasText: /orders/i });
    this.analyticsTab = page.locator('button[role="tab"]').filter({ hasText: /analytics/i });
    
    // Content areas
    this.storeInfo = page.locator('[data-testid="store-info"]');
    this.contactInfo = page.locator('[data-testid="contact-info"]');
    this.addressInfo = page.locator('[data-testid="address-info"]');
    this.subscriptionInfo = page.locator('[data-testid="subscription-info"]');
    this.statisticsCards = page.locator('[data-testid="statistics-cards"]');
    
    // Quick stats
    this.totalProducts = page.locator('[data-testid="total-products"]');
    this.totalOrders = page.locator('[data-testid="total-orders"]');
    this.totalRevenue = page.locator('[data-testid="total-revenue"]');
    this.totalCustomers = page.locator('[data-testid="total-customers"]');
    
    // Modals and overlays
    this.deleteModal = page.locator('[data-testid="delete-store-modal"]');
    this.confirmDeleteButton = page.locator('button').filter({ hasText: /confirm.*delete/i });
    this.cancelDeleteButton = page.locator('button').filter({ hasText: /cancel/i });
    this.upgradeModal = page.locator('[data-testid="upgrade-modal"]');
    this.assignAdminModal = page.locator('[data-testid="assign-admin-modal"]');
    
    // Status banners
    this.trialBanner = page.locator('[data-testid="trial-banner"]');
    this.expiredBanner = page.locator('[data-testid="expired-banner"]');
    this.limitWarning = page.locator('[data-testid="limit-warning"]');
    this.upgradeNotice = page.locator('[data-testid="upgrade-notice"]');
  }

  /**
   * Navigate to store details page
   * @param storeId - Store ID
   */
  async goto(storeId: string): Promise<void> {
    await this.page.goto(`/dashboard/stores/${storeId}`);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await expect(this.storeName).toBeVisible();
    await expect(this.generalTab).toBeVisible();
    
    // Wait for statistics to load
    await expect(this.statisticsCards).toBeVisible();
  }

  /**
   * Get store name text
   * @returns Store name locator
   */
  getStoreName(): Locator {
    return this.storeName;
  }

  /**
   * Get store email text
   * @returns Store email locator
   */
  getStoreEmail(): Locator {
    return this.storeEmail;
  }

  /**
   * Get store status badge
   * @returns Store status locator
   */
  getStoreStatus(): Locator {
    return this.storeStatus;
  }

  /**
   * Get store plan badge
   * @returns Store plan locator
   */
  getStorePlan(): Locator {
    return this.storePlan;
  }

  /**
   * Get store URL link
   * @returns Store URL locator
   */
  getStoreUrl(): Locator {
    return this.storeUrl;
  }

  /**
   * Click back button to return to store list
   */
  async clickBack(): Promise<void> {
    await this.backButton.click();
  }

  /**
   * Click edit store button
   */
  async clickEdit(): Promise<void> {
    await this.editButton.click();
  }

  /**
   * Click delete store button
   */
  async clickDeleteStore(): Promise<void> {
    await this.deleteButton.click();
  }

  /**
   * Get delete button locator
   * @returns Delete button locator
   */
  getDeleteButton(): Locator {
    return this.deleteButton;
  }

  /**
   * Click General tab
   */
  async clickGeneralTab(): Promise<void> {
    await this.generalTab.click();
    await expect(this.storeInfo).toBeVisible();
  }

  /**
   * Click Settings tab
   */
  async clickSettingsTab(): Promise<void> {
    await this.settingsTab.click();
  }

  /**
   * Click Theme tab
   */
  async clickThemeTab(): Promise<void> {
    await this.themeTab.click();
  }

  /**
   * Click Billing tab
   */
  async clickBillingTab(): Promise<void> {
    await this.billingTab.click();
  }

  /**
   * Click Users tab
   */
  async clickUsersTab(): Promise<void> {
    await this.usersTab.click();
  }

  /**
   * Click Products tab
   */
  async clickProductsTab(): Promise<void> {
    await this.productsTab.click();
  }

  /**
   * Click Orders tab
   */
  async clickOrdersTab(): Promise<void> {
    await this.ordersTab.click();
  }

  /**
   * Click Analytics tab
   */
  async clickAnalyticsTab(): Promise<void> {
    await this.analyticsTab.click();
  }

  /**
   * Get delete confirmation modal
   * @returns Delete modal locator
   */
  getDeleteModal(): Locator {
    return this.deleteModal;
  }

  /**
   * Confirm store deletion in modal
   */
  async confirmDelete(): Promise<void> {
    await this.confirmDeleteButton.click();
  }

  /**
   * Cancel store deletion in modal
   */
  async cancelDelete(): Promise<void> {
    await this.cancelDeleteButton.click();
  }

  /**
   * Get current tab name
   * @returns Name of currently active tab
   */
  async getCurrentTab(): Promise<string> {
    const activeTab = this.page.locator('button[role="tab"][aria-selected="true"]');
    return await activeTab.textContent() || '';
  }

  /**
   * Get total products count
   * @returns Products count as number
   */
  async getTotalProducts(): Promise<number> {
    const text = await this.totalProducts.textContent();
    return parseInt(text?.replace(/[^\d]/g, '') || '0', 10);
  }

  /**
   * Get total orders count
   * @returns Orders count as number
   */
  async getTotalOrders(): Promise<number> {
    const text = await this.totalOrders.textContent();
    return parseInt(text?.replace(/[^\d]/g, '') || '0', 10);
  }

  /**
   * Get total revenue amount
   * @returns Revenue as string (formatted)
   */
  async getTotalRevenue(): Promise<string> {
    return await this.totalRevenue.textContent() || '$0.00';
  }

  /**
   * Get total customers count
   * @returns Customers count as number
   */
  async getTotalCustomers(): Promise<number> {
    const text = await this.totalCustomers.textContent();
    return parseInt(text?.replace(/[^\d]/g, '') || '0', 10);
  }

  /**
   * Check if trial banner is visible
   * @returns True if trial banner is shown
   */
  async hasTrialBanner(): Promise<boolean> {
    return await this.trialBanner.isVisible();
  }

  /**
   * Check if expired banner is visible
   * @returns True if expired banner is shown
   */
  async hasExpiredBanner(): Promise<boolean> {
    return await this.expiredBanner.isVisible();
  }

  /**
   * Check if limit warning is visible
   * @returns True if limit warning is shown
   */
  async hasLimitWarning(): Promise<boolean> {
    return await this.limitWarning.isVisible();
  }

  /**
   * Check if upgrade notice is visible
   * @returns True if upgrade notice is shown
   */
  async hasUpgradeNotice(): Promise<boolean> {
    return await this.upgradeNotice.isVisible();
  }

  /**
   * Get store information section content
   * @returns Store info text content
   */
  async getStoreInfo(): Promise<string> {
    return await this.storeInfo.textContent() || '';
  }

  /**
   * Get contact information section content
   * @returns Contact info text content
   */
  async getContactInfo(): Promise<string> {
    return await this.contactInfo.textContent() || '';
  }

  /**
   * Get address information section content
   * @returns Address info text content
   */
  async getAddressInfo(): Promise<string> {
    return await this.addressInfo.textContent() || '';
  }

  /**
   * Get subscription information section content
   * @returns Subscription info text content
   */
  async getSubscriptionInfo(): Promise<string> {
    return await this.subscriptionInfo.textContent() || '';
  }

  /**
   * Click store URL to visit store
   */
  async visitStore(): Promise<void> {
    await this.storeUrl.click();
  }

  /**
   * Open actions dropdown
   */
  async openActionsDropdown(): Promise<void> {
    await this.actionsDropdown.click();
  }

  /**
   * Select action from dropdown
   * @param action - Action name (e.g., 'Assign Admin', 'Upgrade Plan')
   */
  async selectAction(action: string): Promise<void> {
    await this.openActionsDropdown();
    await this.page.locator('button[role="menuitem"]').filter({ hasText: action }).click();
  }

  /**
   * Verify tab navigation accessibility
   */
  async verifyTabNavigation(): Promise<void> {
    // Focus first tab
    await this.generalTab.focus();
    await expect(this.generalTab).toBeFocused();
    
    // Use arrow keys to navigate tabs
    await this.page.keyboard.press('ArrowRight');
    await expect(this.settingsTab).toBeFocused();
    
    await this.page.keyboard.press('ArrowRight');
    await expect(this.themeTab).toBeFocused();
    
    // Use Enter to activate tab
    await this.page.keyboard.press('Enter');
    await expect(this.themeTab).toHaveAttribute('aria-selected', 'true');
  }

  /**
   * Wait for statistics to refresh
   */
  async waitForStatisticsUpdate(): Promise<void> {
    // Wait for loading indicators to disappear
    const loadingIndicators = this.page.locator('[data-testid*="loading"]');
    await expect(loadingIndicators).not.toBeVisible();
  }

  /**
   * Check if store is in trial period
   * @returns True if store is in trial
   */
  async isTrialStore(): Promise<boolean> {
    const statusText = await this.storeStatus.textContent();
    return statusText?.toLowerCase().includes('trial') || false;
  }

  /**
   * Check if store subscription is expired
   * @returns True if store is expired
   */
  async isExpiredStore(): Promise<boolean> {
    const statusText = await this.storeStatus.textContent();
    return statusText?.toLowerCase().includes('expired') || false;
  }

  /**
   * Get days remaining in trial (if applicable)
   * @returns Number of days remaining or null
   */
  async getTrialDaysRemaining(): Promise<number | null> {
    if (!await this.hasTrialBanner()) {
      return null;
    }
    
    const bannerText = await this.trialBanner.textContent();
    const match = bannerText?.match(/(\d+)\s+days?\s+remaining/i);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Click upgrade plan button (if visible)
   */
  async clickUpgradePlan(): Promise<void> {
    const upgradeButton = this.page.locator('button').filter({ hasText: /upgrade.*plan/i });
    await upgradeButton.click();
  }

  /**
   * Verify store details match provided data
   * @param expectedData - Expected store data
   */
  async verifyStoreDetails(expectedData: {
    name?: string;
    email?: string;
    status?: string;
    plan?: string;
    url?: string;
  }): Promise<void> {
    if (expectedData.name) {
      await expect(this.storeName).toContainText(expectedData.name);
    }
    
    if (expectedData.email) {
      await expect(this.storeEmail).toContainText(expectedData.email);
    }
    
    if (expectedData.status) {
      await expect(this.storeStatus).toContainText(expectedData.status);
    }
    
    if (expectedData.plan) {
      await expect(this.storePlan).toContainText(expectedData.plan);
    }
    
    if (expectedData.url) {
      await expect(this.storeUrl).toContainText(expectedData.url);
    }
  }
}