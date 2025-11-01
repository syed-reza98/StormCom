// tests/e2e/audit/audit-logging.spec.ts
// E2E tests for audit logging functionality

import { test, expect } from '@playwright/test';

/**
 * Test Suite: Audit Logging E2E Tests
 * 
 * Purpose: Verify that critical system actions are properly logged and accessible
 * through the audit logs interface.
 * 
 * Covered Scenarios:
 * - Product CRUD operations trigger audit logs
 * - Audit logs contain correct entity information
 * - Multi-tenant isolation (users cannot access other store logs)
 * - Audit logs UI displays and filters correctly
 */

test.describe('Audit Logging', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Store Admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Wait for successful login
    await page.waitForURL('/dashboard');
  });

  // ============================================================================
  // PRODUCT AUDIT LOG TESTS
  // ============================================================================

  test('should create audit log when product is created', async ({ page }) => {
    // Navigate to products page
    await page.goto('/dashboard/products');
    
    // Create new product
    await page.click('text=Add Product');
    await page.fill('input[name="name"]', 'Test Audit Product');
    await page.fill('input[name="sku"]', 'TEST-AUDIT-001');
    await page.fill('input[name="price"]', '29.99');
    await page.fill('textarea[name="description"]', 'Test product for audit logging');
    await page.click('button[type="submit"]');
    
    // Wait for product creation
    await page.waitForSelector('text=Product created successfully', { timeout: 5000 });
    
    // Navigate to audit logs
    await page.goto('/dashboard/audit-logs');
    
    // Verify audit log entry exists
    await expect(page.locator('text=CREATE')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Product')).toBeVisible();
    await expect(page.locator('text=Test Audit Product')).toBeVisible();
  });

  test('should create audit log when product is updated', async ({ page }) => {
    // Navigate to products page
    await page.goto('/dashboard/products');
    
    // Click first product to edit
    await page.click('table tbody tr:first-child a');
    
    // Update product name
    const originalName = await page.inputValue('input[name="name"]');
    const newName = `${originalName} - Updated`;
    await page.fill('input[name="name"]', newName);
    await page.click('button[type="submit"]');
    
    // Wait for update confirmation
    await page.waitForSelector('text=Product updated successfully', { timeout: 5000 });
    
    // Navigate to audit logs
    await page.goto('/dashboard/audit-logs');
    
    // Filter by UPDATE action
    await page.selectOption('select[id="action"]', 'UPDATE');
    await page.click('button:has-text("Apply Filters")');
    
    // Verify audit log entry
    await expect(page.locator('text=UPDATE')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Product')).toBeVisible();
  });

  test('should create audit log when product is deleted', async ({ page }) => {
    // Navigate to products page
    await page.goto('/dashboard/products');
    
    // Delete first product (soft delete)
    await page.click('table tbody tr:first-child button[aria-label="Delete"]');
    await page.click('button:has-text("Confirm")');
    
    // Wait for deletion confirmation
    await page.waitForSelector('text=Product deleted successfully', { timeout: 5000 });
    
    // Navigate to audit logs
    await page.goto('/dashboard/audit-logs');
    
    // Filter by DELETE action
    await page.selectOption('select[id="action"]', 'DELETE');
    await page.click('button:has-text("Apply Filters")');
    
    // Verify audit log entry
    await expect(page.locator('text=DELETE')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Product')).toBeVisible();
  });

  // ============================================================================
  // AUDIT LOG CHANGES TRACKING TESTS
  // ============================================================================

  test('should show changes in audit log details', async ({ page }) => {
    // Navigate to products page
    await page.goto('/dashboard/products');
    
    // Update product price
    await page.click('table tbody tr:first-child a');
    const originalPrice = await page.inputValue('input[name="price"]');
    const newPrice = (parseFloat(originalPrice) + 10).toFixed(2);
    await page.fill('input[name="price"]', newPrice);
    await page.click('button[type="submit"]');
    
    // Wait for update confirmation
    await page.waitForSelector('text=Product updated successfully', { timeout: 5000 });
    
    // Navigate to audit logs
    await page.goto('/dashboard/audit-logs');
    
    // Expand first audit log entry
    await page.click('button[aria-label="Expand row"]:first-of-type');
    
    // Verify changes are displayed
    await expect(page.locator('text=price')).toBeVisible({ timeout: 5000 });
    await expect(page.locator(`text=${originalPrice}`)).toBeVisible();
    await expect(page.locator(`text=${newPrice}`)).toBeVisible();
    await expect(page.locator('text=Old Value')).toBeVisible();
    await expect(page.locator('text=New Value')).toBeVisible();
  });

  // ============================================================================
  // MULTI-TENANT ISOLATION TESTS
  // ============================================================================

  test('should only show audit logs for current store', async ({ page, context }) => {
    // Get current user's store ID from session
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'session');
    const storeId = sessionCookie?.value; // Simplified - actual implementation would decode JWT
    
    // Navigate to audit logs
    await page.goto('/dashboard/audit-logs');
    
    // Wait for logs to load
    await page.waitForTimeout(1000);
    
    // Verify URL includes storeId parameter for non-SUPER_ADMIN
    const url = page.url();
    if (!url.includes('SUPER_ADMIN')) {
      expect(url).toContain(`storeId=${storeId}`);
    }
    
    // Verify no error messages about unauthorized access
    await expect(page.locator('text=403')).not.toBeVisible();
    await expect(page.locator('text=Forbidden')).not.toBeVisible();
  });

  test('should not allow access to other store audit logs', async ({ page }) => {
    // Navigate to audit logs with different storeId
    await page.goto('/dashboard/audit-logs?storeId=unauthorized-store-123');
    
    // For STORE_ADMIN/STAFF, should either redirect or show error
    // Verify either empty state or error message
    const hasError = await page.locator('text=403').isVisible();
    const isEmpty = await page.locator('text=No audit logs found').isVisible();
    
    expect(hasError || isEmpty).toBeTruthy();
  });

  // ============================================================================
  // AUDIT LOG FILTERING TESTS
  // ============================================================================

  test('should filter audit logs by entity type', async ({ page }) => {
    // Navigate to audit logs
    await page.goto('/dashboard/audit-logs');
    
    // Select Product entity type
    await page.selectOption('select[id="entityType"]', 'Product');
    await page.click('button:has-text("Apply Filters")');
    
    // Wait for filtered results
    await page.waitForTimeout(1000);
    
    // Verify URL contains filter parameter
    expect(page.url()).toContain('entityType=Product');
    
    // Verify all visible logs are for Product entity
    const entityCells = page.locator('table tbody td:nth-child(3)');
    const count = await entityCells.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const text = await entityCells.nth(i).textContent();
        expect(text).toContain('Product');
      }
    }
  });

  test('should filter audit logs by date range', async ({ page }) => {
    // Navigate to audit logs
    await page.goto('/dashboard/audit-logs');
    
    // Set date range (last 7 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    await page.fill('input[id="startDate"]', startDate);
    await page.fill('input[id="endDate"]', endDate);
    await page.click('button:has-text("Apply Filters")');
    
    // Wait for filtered results
    await page.waitForTimeout(1000);
    
    // Verify URL contains date filters
    expect(page.url()).toContain(`startDate=${startDate}`);
    expect(page.url()).toContain(`endDate=${endDate}`);
  });

  test('should reset all filters when reset button clicked', async ({ page }) => {
    // Navigate to audit logs
    await page.goto('/dashboard/audit-logs');
    
    // Apply multiple filters
    await page.selectOption('select[id="entityType"]', 'Product');
    await page.selectOption('select[id="action"]', 'UPDATE');
    await page.click('button:has-text("Apply Filters")');
    
    // Verify filters are applied
    expect(page.url()).toContain('entityType=Product');
    expect(page.url()).toContain('action=UPDATE');
    
    // Click reset button
    await page.click('button:has-text("Reset Filters")');
    
    // Wait for page reload
    await page.waitForTimeout(1000);
    
    // Verify filters are cleared from URL
    expect(page.url()).not.toContain('entityType=Product');
    expect(page.url()).not.toContain('action=UPDATE');
  });

  // ============================================================================
  // AUDIT LOG UI TESTS
  // ============================================================================

  test('should display audit logs table with correct columns', async ({ page }) => {
    // Navigate to audit logs
    await page.goto('/dashboard/audit-logs');
    
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 5000 });
    
    // Verify table headers
    await expect(page.locator('th:has-text("Action")')).toBeVisible();
    await expect(page.locator('th:has-text("Entity")')).toBeVisible();
    await expect(page.locator('th:has-text("User")')).toBeVisible();
    await expect(page.locator('th:has-text("IP Address")')).toBeVisible();
    await expect(page.locator('th:has-text("Timestamp")')).toBeVisible();
  });

  test('should paginate audit logs when more than 50 entries', async ({ page }) => {
    // Navigate to audit logs
    await page.goto('/dashboard/audit-logs');
    
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 5000 });
    
    // Check if pagination controls are visible
    const hasPagination = await page.locator('text=Showing').isVisible();
    
    if (hasPagination) {
      // Verify pagination text
      await expect(page.locator('text=/Showing \\d+ to \\d+ of \\d+ logs/')).toBeVisible();
      
      // Check if next page button exists
      const hasNextPage = await page.locator('button:has-text("Next")').isVisible();
      
      if (hasNextPage) {
        // Click next page
        await page.click('button:has-text("Next")');
        
        // Verify URL updated with page parameter
        await page.waitForTimeout(500);
        expect(page.url()).toContain('page=2');
      }
    }
  });

  test('should export audit logs to CSV', async ({ page }) => {
    // Navigate to audit logs
    await page.goto('/dashboard/audit-logs');
    
    // Wait for page to load
    await page.waitForSelector('button:has-text("Export CSV")', { timeout: 5000 });
    
    // Setup download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click export button
    await page.click('button:has-text("Export CSV")');
    
    // Wait for download to start
    const download = await downloadPromise;
    
    // Verify download was initiated
    expect(download).toBeTruthy();
    expect(download.suggestedFilename()).toMatch(/audit-logs.*\.csv/);
  });

  // ============================================================================
  // ACCESS CONTROL TESTS
  // ============================================================================

  test('should deny access to audit logs for non-admin users', async ({ page }) => {
    // Logout current user
    await page.goto('/dashboard');
    await page.click('button[aria-label="User menu"]');
    await page.click('text=Sign Out');
    
    // Login as regular staff member
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'staff@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Try to access audit logs
    await page.goto('/dashboard/audit-logs');
    
    // Should redirect to dashboard or show unauthorized
    await page.waitForTimeout(1000);
    
    const isRedirected = page.url().includes('/dashboard') && !page.url().includes('/audit-logs');
    const hasError = await page.locator('text=403').isVisible() || 
                     await page.locator('text=Unauthorized').isVisible();
    
    expect(isRedirected || hasError).toBeTruthy();
  });
});
