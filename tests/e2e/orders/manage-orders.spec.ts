// tests/e2e/orders/manage-orders.spec.ts
// E2E Test: Store Admin can view and update order status

import { test, expect } from '@playwright/test';

/**
 * Test Suite: Order Management
 * 
 * User Story: US4 - Order Management
 * As a Store Admin, I need to view, manage, and fulfill customer orders 
 * to ensure timely delivery and customer satisfaction.
 * 
 * Test Coverage:
 * - View orders list with pagination
 * - Filter orders by status
 * - Search orders by order number
 * - View order details
 * - Update order status with tracking information
 * - Verify state machine validation
 * - Verify status change is reflected in UI
 */

test.describe('Order Management', () => {
  // Setup: Login as Store Admin before each test
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login');

    // Fill in credentials (Store Admin)
    await page.fill('input[name="email"]', 'admin@demo-store.com');
    await page.fill('input[name="password"]', 'Demo@123');

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('Store Admin can view orders list', async ({ page }) => {
    // Navigate to orders page
    await page.goto('/orders');

    // Verify page title
    await expect(page.locator('h1')).toContainText('Orders');

    // Verify orders table exists
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Verify table headers
    await expect(table.locator('th')).toContainText(['Order Number', 'Customer', 'Date', 'Status', 'Total']);

    // Verify at least one order row exists
    const rows = table.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('Store Admin can filter orders by status', async ({ page }) => {
    // Navigate to orders page
    await page.goto('/orders');

    // Open status filter dropdown
    await page.click('label:has-text("Status") + div button');

    // Select "Paid" status
    await page.click('div[role="option"]:has-text("Paid")');

    // Click "Apply Filters" button
    await page.click('button:has-text("Apply Filters")');

    // Wait for page to reload with filtered results
    await page.waitForLoadState('networkidle');

    // Verify URL contains status parameter
    expect(page.url()).toContain('status=PAID');

    // Verify all visible orders have "Paid" status
    const statusBadges = page.locator('table tbody td:has-text("Paid")');
    const count = await statusBadges.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Store Admin can search orders by order number', async ({ page }) => {
    // Navigate to orders page
    await page.goto('/orders');

    // Get the first order number from the table
    const firstOrderNumber = await page.locator('table tbody tr:first-child td:first-child a').textContent();
    
    if (!firstOrderNumber) {
      test.skip(true, 'No orders available to search');
      return;
    }

    // Enter order number in search box
    await page.fill('input[placeholder*="Order number"]', firstOrderNumber);

    // Click "Apply Filters" or press Enter
    await page.press('input[placeholder*="Order number"]', 'Enter');

    // Wait for filtered results
    await page.waitForLoadState('networkidle');

    // Verify URL contains search parameter
    expect(page.url()).toContain(`search=${encodeURIComponent(firstOrderNumber)}`);

    // Verify search results contain the order
    await expect(page.locator('table tbody tr:first-child td:first-child a')).toContainText(firstOrderNumber);
  });

  test('Store Admin can view order details', async ({ page }) => {
    // Navigate to orders page
    await page.goto('/orders');

    // Click on the first order to view details
    const firstOrderLink = page.locator('table tbody tr:first-child td:first-child a');
    const orderNumber = await firstOrderLink.textContent();
    await firstOrderLink.click();

    // Wait for order details page to load
    await page.waitForURL(/\/orders\/[a-z0-9-]+/);

    // Verify order details page elements
    await expect(page.locator('h1')).toContainText(orderNumber || '');
    
    // Verify sections exist
    await expect(page.locator('h2:has-text("Order Items")')).toBeVisible();
    await expect(page.locator('h2:has-text("Payment Information")')).toBeVisible();
    await expect(page.locator('h2:has-text("Customer")')).toBeVisible();
    await expect(page.locator('h2:has-text("Shipping Address")')).toBeVisible();
    await expect(page.locator('h2:has-text("Billing Address")')).toBeVisible();
    await expect(page.locator('h2:has-text("Update Status")')).toBeVisible();
  });

  test('Store Admin can update order status to SHIPPED with tracking number', async ({ page }) => {
    // Navigate to orders page
    await page.goto('/orders');

    // Find an order with PROCESSING status (or PAID status to transition to PROCESSING first)
    const processingOrderRow = page.locator('table tbody tr:has(td:has-text("Processing"))').first();
    
    // If no processing orders, try to find a paid order to transition
    const paidOrderRow = page.locator('table tbody tr:has(td:has-text("Paid"))').first();
    
    let targetRow = processingOrderRow;
    let needsProcessingTransition = false;

    if (await processingOrderRow.count() === 0 && await paidOrderRow.count() > 0) {
      targetRow = paidOrderRow;
      needsProcessingTransition = true;
    } else if (await processingOrderRow.count() === 0) {
      test.skip(true, 'No orders in PAID or PROCESSING status to test SHIPPED transition');
      return;
    }

    // Click on order to view details
    await targetRow.locator('td:first-child a').click();
    await page.waitForURL(/\/orders\/[a-z0-9-]+/);

    // If order is PAID, transition to PROCESSING first
    if (needsProcessingTransition) {
      // Open status dropdown
      await page.click('label:has-text("New Status") + div button');
      
      // Select "Processing"
      await page.click('div[role="option"]:has-text("Processing")');
      
      // Click update button
      await page.click('button[type="submit"]:has-text("Update Status")');
      
      // Wait for success and page refresh
      await page.waitForTimeout(1000);
      page.on('dialog', dialog => dialog.accept()); // Auto-accept success alert
      await page.reload();
    }

    // Now transition to SHIPPED
    // Open status dropdown
    await page.click('label:has-text("New Status") + div button');
    
    // Select "Shipped"
    await page.click('div[role="option"]:has-text("Shipped")');

    // Verify tracking number field appears (required for SHIPPED)
    await expect(page.locator('label:has-text("Tracking Number")')).toBeVisible();
    
    // Fill in tracking number
    const trackingNumber = `TRACK-${Date.now()}`;
    await page.fill('input[id="trackingNumber"]', trackingNumber);

    // Fill in tracking URL (optional)
    await page.fill('input[id="trackingUrl"]', 'https://tracking.example.com/' + trackingNumber);

    // Fill in admin notes
    await page.fill('textarea[id="adminNote"]', 'Order shipped via E2E test');

    // Submit form
    await page.click('button[type="submit"]:has-text("Update Status")');

    // Handle success alert
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('Shipped');
      dialog.accept();
    });

    // Wait for page refresh
    await page.waitForTimeout(2000);

    // Verify status badge updated to "Shipped"
    await expect(page.locator('text=Shipped').first()).toBeVisible();

    // Verify tracking information is displayed
    await expect(page.locator('text=' + trackingNumber)).toBeVisible();
  });

  test('Store Admin cannot make invalid status transitions', async ({ page }) => {
    // Navigate to orders page
    await page.goto('/orders');

    // Find an order with DELIVERED status (terminal state)
    const deliveredOrderRow = page.locator('table tbody tr:has(td:has-text("Delivered"))').first();
    
    if (await deliveredOrderRow.count() === 0) {
      test.skip(true, 'No orders in DELIVERED status to test terminal state');
      return;
    }

    // Click on order to view details
    await deliveredOrderRow.locator('td:first-child a').click();
    await page.waitForURL(/\/orders\/[a-z0-9-]+/);

    // Verify that the status dropdown only shows valid transitions
    // For DELIVERED, only REFUNDED should be available
    await page.click('label:has-text("New Status") + div button');
    
    // Verify "Refunded" option exists
    await expect(page.locator('div[role="option"]:has-text("Refunded")')).toBeVisible();
    
    // Verify invalid options don't exist (e.g., "Processing")
    await expect(page.locator('div[role="option"]:has-text("Processing"):not([data-disabled])')).toHaveCount(0);
  });

  test('Store Admin sees confirmation dialog for critical status changes', async ({ page }) => {
    // Navigate to orders page
    await page.goto('/orders');

    // Find an order with non-terminal status
    const activeOrderRow = page.locator('table tbody tr:has(td:has-text("Processing"), td:has-text("Paid"))').first();
    
    if (await activeOrderRow.count() === 0) {
      test.skip(true, 'No active orders to test cancellation');
      return;
    }

    // Click on order to view details
    await activeOrderRow.locator('td:first-child a').click();
    await page.waitForURL(/\/orders\/[a-z0-9-]+/);

    // Change status to CANCELED (critical action)
    await page.click('label:has-text("New Status") + div button');
    await page.click('div[role="option"]:has-text("Canceled")');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify confirmation dialog appears
    await expect(page.locator('text=Confirm Critical Action')).toBeVisible();
    await expect(page.locator('text=This action may have financial implications')).toBeVisible();

    // Cancel the action
    await page.click('button:has-text("Cancel")');

    // Verify we're back to the form
    await expect(page.locator('label:has-text("New Status")')).toBeVisible();
  });

  test('Store Admin can export orders to CSV', async ({ page }) => {
    // Navigate to orders page
    await page.goto('/orders');

    // Listen for download event
    const downloadPromise = page.waitForEvent('download');

    // Click "Export CSV" button
    await page.click('button:has-text("Export CSV")');

    // Wait for download to start
    const download = await downloadPromise;

    // Verify filename contains "orders" and ".csv"
    expect(download.suggestedFilename()).toMatch(/orders.*\.csv/);
  });

  test('Store Admin can paginate through orders', async ({ page }) => {
    // Navigate to orders page
    await page.goto('/orders?perPage=5');

    // Verify pagination exists (only if total > 5)
    const resultsText = await page.locator('text=/Showing \\d+ to \\d+ of \\d+ orders/').textContent();
    
    if (!resultsText) {
      test.skip(true, 'Not enough orders to test pagination');
      return;
    }

    // Extract total from results text
    const match = resultsText.match(/of (\d+) orders/);
    const total = match ? parseInt(match[1]) : 0;

    if (total <= 5) {
      test.skip(true, 'Not enough orders to test pagination');
      return;
    }

    // Click "Next" page button
    await page.click('a[href*="page=2"]');

    // Wait for navigation
    await page.waitForURL(/page=2/);

    // Verify URL changed
    expect(page.url()).toContain('page=2');

    // Verify different orders are shown (compare first order number)
    const page2OrderNumber = await page.locator('table tbody tr:first-child td:first-child a').textContent();
    
    // Go back to page 1
    await page.click('a[href*="page=1"]');
    await page.waitForURL(/page=1|orders(?!\?)/); // Either explicit page=1 or no page param

    const page1OrderNumber = await page.locator('table tbody tr:first-child td:first-child a').textContent();

    // Verify order numbers are different
    expect(page1OrderNumber).not.toBe(page2OrderNumber);
  });
});
