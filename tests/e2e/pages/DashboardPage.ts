/**
 * Page Object Model for Dashboard Page
 * 
 * Provides selectors and methods for interacting with the main dashboard,
 * store selector, navigation, and role-based access verification.
 */

import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  
  // Dashboard elements
  readonly heading: Locator;
  readonly welcomeMessage: Locator;
  readonly storeSelector: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  
  // Navigation
  readonly productsLink: Locator;
  readonly ordersLink: Locator;
  readonly customersLink: Locator;
  readonly settingsLink: Locator;
  readonly storesLink: Locator; // Only for Super Admin
  
  // Content
  readonly statsCards: Locator;
  readonly recentOrders: Locator;
  readonly storeName: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main elements
    this.heading = page.locator('h1').first();
    this.welcomeMessage = page.locator('text=/welcome/i').first();
    this.storeSelector = page.locator('select[name="storeId"]');
    this.userMenu = page.locator('[aria-label="User menu"]');
    this.logoutButton = page.locator('button:has-text("Logout")');
    
    // Navigation links
    this.productsLink = page.getByRole('link', { name: /products/i });
    this.ordersLink = page.getByRole('link', { name: /orders/i });
    this.customersLink = page.getByRole('link', { name: /customers/i });
    this.settingsLink = page.getByRole('link', { name: /settings/i });
    this.storesLink = page.getByRole('link', { name: /stores/i });
    
    // Content areas
    this.statsCards = page.locator('[data-testid="stats-card"]');
    this.recentOrders = page.locator('[data-testid="recent-orders"]');
    this.storeName = page.locator('[data-testid="current-store-name"]');
  }

  async goto(storeId?: string): Promise<void> {
    const url = storeId ? `/dashboard?storeId=${storeId}` : '/dashboard';
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForPageLoad(): Promise<void> {
    await this.heading.waitFor({ state: 'visible', timeout: 10000 });
  }

  async selectStore(storeId: string): Promise<void> {
    await this.storeSelector.selectOption(storeId);
    await this.page.waitForLoadState('networkidle');
  }

  async getCurrentStore(): Promise<string | null> {
    return await this.storeName.textContent();
  }

  async getAvailableStores(): Promise<string[]> {
    const options = await this.storeSelector.locator('option').allTextContents();
    return options;
  }

  async hasStoreSelector(): Promise<boolean> {
    return await this.storeSelector.isVisible();
  }

  async hasStoresLink(): Promise<boolean> {
    return await this.storesLink.isVisible();
  }

  async navigateToProducts(): Promise<void> {
    await this.productsLink.click();
    await this.page.waitForURL(/\/products/);
  }

  async navigateToOrders(): Promise<void> {
    await this.ordersLink.click();
    await this.page.waitForURL(/\/orders/);
  }

  async navigateToSettings(): Promise<void> {
    await this.settingsLink.click();
    await this.page.waitForURL(/\/settings/);
  }

  async navigateToStores(): Promise<void> {
    await this.storesLink.click();
    await this.page.waitForURL(/\/stores/);
  }

  async logout(): Promise<void> {
    await this.userMenu.click();
    await this.logoutButton.click();
    await this.page.waitForURL(/\/login/);
  }
}
