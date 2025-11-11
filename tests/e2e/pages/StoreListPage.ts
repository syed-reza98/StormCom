/**
 * Page Object Model for Store List Page
 * 
 * Provides selectors and methods for interacting with the store list page
 * including search, filtering, pagination, and navigation.
 */

import { Page, Locator, expect } from '@playwright/test';

export class StoreListPage {
  readonly page: Page;
  
  // Main selectors
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly clearSearchButton: Locator;
  readonly createStoreButton: Locator;
  readonly storesTable: Locator;
  readonly loadingSpinner: Locator;
  readonly emptyState: Locator;
  
  // Filter selectors
  readonly planFilter: Locator;
  readonly statusFilter: Locator;
  readonly countryFilter: Locator;
  readonly clearFiltersButton: Locator;
  
  // Pagination selectors
  readonly paginationInfo: Locator;
  readonly prevPageButton: Locator;
  readonly nextPageButton: Locator;
  readonly pageNumbers: Locator;
  
  // Action selectors
  readonly bulkSelectAll: Locator;
  readonly bulkActions: Locator;
  readonly exportButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Search and create
    this.searchInput = page.locator('input[placeholder*="search"]').first();
    this.searchButton = page.locator('button[type="submit"]').filter({ hasText: /search/i });
    this.clearSearchButton = page.locator('button').filter({ hasText: /clear/i });
    this.createStoreButton = page.getByRole('link', { name: /create store/i });
    
    // Main content
    this.storesTable = page.locator('[data-testid="stores-table"]');
    this.loadingSpinner = page.locator('[data-testid="loading"]');
    this.emptyState = page.locator('[data-testid="empty-state"]');
    
    // Filters
    this.planFilter = page.locator('select[name="plan"]');
    this.statusFilter = page.locator('select[name="status"]');
    this.countryFilter = page.locator('select[name="country"]');
    this.clearFiltersButton = page.locator('button').filter({ hasText: /clear filters/i });
    
    // Pagination
    this.paginationInfo = page.locator('[data-testid="pagination-info"]');
    this.prevPageButton = page.locator('button[aria-label="Previous page"]');
    this.nextPageButton = page.locator('button[aria-label="Next page"]');
    this.pageNumbers = page.locator('[data-testid="page-numbers"]');
    
    // Bulk actions
    this.bulkSelectAll = page.locator('input[type="checkbox"][aria-label="Select all stores"]');
    this.bulkActions = page.locator('[data-testid="bulk-actions"]');
    this.exportButton = page.locator('button').filter({ hasText: /export/i });
  }

  /**
   * Navigate to store list page
   */
  async goto(): Promise<void> {
    await this.page.goto('/dashboard/stores');
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    // Wait for the page heading
    await expect(this.page.getByRole('heading', { name: /stores/i })).toBeVisible();
    
    // Wait for either the table or empty state to be visible
    await expect(this.storesTable.or(this.emptyState)).toBeVisible();
    
    // Ensure loading spinner is gone
    await expect(this.loadingSpinner).not.toBeVisible();
  }

  /**
   * Search for stores by query
   * @param query - Search query
   */
  async searchStores(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchButton.click();
    await this.waitForSearchResults();
  }

  /**
   * Wait for search results to load
   */
  async waitForSearchResults(): Promise<void> {
    // Wait for loading to finish
    await expect(this.loadingSpinner).not.toBeVisible();
    
    // Wait for table or empty state
    await expect(this.storesTable.or(this.emptyState)).toBeVisible();
  }

  /**
   * Clear search query
   */
  async clearSearch(): Promise<void> {
    await this.clearSearchButton.click();
    await this.waitForSearchResults();
  }

  /**
   * Filter stores by subscription plan
   * @param plan - Subscription plan (FREE, BASIC, PRO, ENTERPRISE)
   */
  async filterByPlan(plan: string): Promise<void> {
    await this.planFilter.selectOption(plan);
    await this.waitForSearchResults();
  }

  /**
   * Filter stores by status
   * @param status - Store status (ACTIVE, TRIAL, EXPIRED, CANCELED)
   */
  async filterByStatus(status: string): Promise<void> {
    await this.statusFilter.selectOption(status);
    await this.waitForSearchResults();
  }

  /**
   * Filter stores by country
   * @param country - Country code (US, CA, GB, etc.)
   */
  async filterByCountry(country: string): Promise<void> {
    await this.countryFilter.selectOption(country);
    await this.waitForSearchResults();
  }

  /**
   * Clear all filters
   */
  async clearFilters(): Promise<void> {
    await this.clearFiltersButton.click();
    await this.waitForSearchResults();
  }

  /**
   * Click create store button
   */
  async clickCreateStore(): Promise<void> {
    await this.createStoreButton.click();
  }

  /**
   * Get store row by store ID
   * @param storeId - Store ID
   * @returns Store row locator
   */
  getStoreRow(storeId: string): Locator {
    return this.page.locator(`[data-testid="store-row-${storeId}"]`);
  }

  /**
   * Get store name cell for a specific store
   * @param storeId - Store ID
   * @returns Store name locator
   */
  getStoreName(storeId: string): Locator {
    return this.getStoreRow(storeId).locator('[data-testid="store-name"]');
  }

  /**
   * Get store email cell for a specific store
   * @param storeId - Store ID
   * @returns Store email locator
   */
  getStoreEmail(storeId: string): Locator {
    return this.getStoreRow(storeId).locator('[data-testid="store-email"]');
  }

  /**
   * Get store plan badge for a specific store
   * @param storeId - Store ID
   * @returns Store plan locator
   */
  getStorePlan(storeId: string): Locator {
    return this.getStoreRow(storeId).locator('[data-testid="store-plan"]');
  }

  /**
   * Get store status badge for a specific store
   * @param storeId - Store ID
   * @returns Store status locator
   */
  getStoreStatus(storeId: string): Locator {
    return this.getStoreRow(storeId).locator('[data-testid="store-status"]');
  }

  /**
   * Get store actions dropdown for a specific store
   * @param storeId - Store ID
   * @returns Actions dropdown locator
   */
  getStoreActions(storeId: string): Locator {
    return this.getStoreRow(storeId).locator('[data-testid="store-actions"]');
  }

  /**
   * Click on a store to navigate to details
   * @param storeId - Store ID
   */
  async clickStore(storeId: string): Promise<void> {
    await this.getStoreName(storeId).click();
  }

  /**
   * Open actions dropdown for a store
   * @param storeId - Store ID
   */
  async openStoreActions(storeId: string): Promise<void> {
    await this.getStoreActions(storeId).click();
  }

  /**
   * Edit store from actions dropdown
   * @param storeId - Store ID
   */
  async editStore(storeId: string): Promise<void> {
    await this.openStoreActions(storeId);
    await this.page.locator('button[role="menuitem"]').filter({ hasText: /edit/i }).click();
  }

  /**
   * Delete store from actions dropdown
   * @param storeId - Store ID
   */
  async deleteStore(storeId: string): Promise<void> {
    await this.openStoreActions(storeId);
    await this.page.locator('button[role="menuitem"]').filter({ hasText: /delete/i }).click();
  }

  /**
   * Get current page number
   * @returns Current page number
   */
  async getCurrentPage(): Promise<number> {
    const activePageButton = this.pageNumbers.locator('button[aria-current="page"]');
    const pageText = await activePageButton.textContent();
    return parseInt(pageText || '1', 10);
  }

  /**
   * Go to specific page
   * @param pageNumber - Page number to navigate to
   */
  async goToPage(pageNumber: number): Promise<void> {
    const pageButton = this.pageNumbers.locator(`button[aria-label="Page ${pageNumber}"]`);
    await pageButton.click();
    await this.waitForSearchResults();
  }

  /**
   * Go to next page
   */
  async goToNextPage(): Promise<void> {
    await this.nextPageButton.click();
    await this.waitForSearchResults();
  }

  /**
   * Go to previous page
   */
  async goToPreviousPage(): Promise<void> {
    await this.prevPageButton.click();
    await this.waitForSearchResults();
  }

  /**
   * Check if next page button is enabled
   * @returns True if next page is available
   */
  async hasNextPage(): Promise<boolean> {
    return !(await this.nextPageButton.isDisabled());
  }

  /**
   * Check if previous page button is enabled
   * @returns True if previous page is available
   */
  async hasPreviousPage(): Promise<boolean> {
    return !(await this.prevPageButton.isDisabled());
  }

  /**
   * Get pagination info text (e.g., "Showing 1-10 of 25 stores")
   * @returns Pagination info text
   */
  async getPaginationInfo(): Promise<string> {
    return await this.paginationInfo.textContent() || '';
  }

  /**
   * Get total number of stores from pagination info
   * @returns Total store count
   */
  async getTotalStores(): Promise<number> {
    const paginationText = await this.getPaginationInfo();
    const match = paginationText.match(/of (\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Select all stores using bulk select checkbox
   */
  async selectAllStores(): Promise<void> {
    await this.bulkSelectAll.check();
  }

  /**
   * Select individual store checkbox
   * @param storeId - Store ID
   */
  async selectStore(storeId: string): Promise<void> {
    const checkbox = this.getStoreRow(storeId).locator('input[type="checkbox"]');
    await checkbox.check();
  }

  /**
   * Get selected store count
   * @returns Number of selected stores
   */
  async getSelectedCount(): Promise<number> {
    const checkboxes = this.storesTable.locator('input[type="checkbox"]:checked');
    return await checkboxes.count() - 1; // Subtract 1 for the "select all" checkbox
  }

  /**
   * Export selected stores
   */
  async exportStores(): Promise<void> {
    await this.exportButton.click();
    
    // Wait for download to start (in real tests, handle download)
    await this.page.waitForTimeout(1000);
  }

  /**
   * Check if table has any stores
   * @returns True if stores are present
   */
  async hasStores(): Promise<boolean> {
    const rowCount = await this.storesTable.locator('tbody tr').count();
    return rowCount > 0;
  }

  /**
   * Check if empty state is shown
   * @returns True if empty state is visible
   */
  async isEmpty(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  /**
   * Get all visible store IDs on current page
   * @returns Array of store IDs
   */
  async getVisibleStoreIds(): Promise<string[]> {
    const rows = this.storesTable.locator('tbody tr[data-testid^="store-row-"]');
    const count = await rows.count();
    const storeIds: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const testId = await row.getAttribute('data-testid');
      if (testId) {
        const storeId = testId.replace('store-row-', '');
        storeIds.push(storeId);
      }
    }
    
    return storeIds;
  }

  /**
   * Verify table sorting by column
   * @param column - Column name to sort by
   * @param direction - Sort direction ('asc' or 'desc')
   */
  async sortByColumn(column: string, direction: 'asc' | 'desc' = 'asc'): Promise<void> {
    const columnHeader = this.page.locator(`th button[data-column="${column}"]`);
    
    // Click once for ascending, twice for descending
    await columnHeader.click();
    if (direction === 'desc') {
      await columnHeader.click();
    }
    
    await this.waitForSearchResults();
  }

  /**
   * Verify keyboard navigation works correctly
   */
  async verifyKeyboardNavigation(): Promise<void> {
    // Focus search input
    await this.searchInput.focus();
    await expect(this.searchInput).toBeFocused();
    
    // Tab to search button
    await this.page.keyboard.press('Tab');
    await expect(this.searchButton).toBeFocused();
    
    // Tab to filters
    await this.page.keyboard.press('Tab');
    await expect(this.planFilter).toBeFocused();
    
    // Tab to create button
    await this.page.keyboard.press('Tab');
    await this.page.keyboard.press('Tab'); // Skip other filters
    await this.page.keyboard.press('Tab');
    await expect(this.createStoreButton).toBeFocused();
  }

  /**
   * Search using Enter key
   * @param query - Search query
   */
  async searchWithEnter(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.waitForSearchResults();
  }
}