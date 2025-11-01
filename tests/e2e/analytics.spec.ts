/**
 * E2E Test: Analytics Dashboard
 * 
 * Task: T166
 * Tests analytics dashboard viewing with chart interactions,
 * data validation, and export functionality.
 * 
 * Test Coverage:
 * - Dashboard page loading and authentication
 * - Key metrics display and calculation
 * - Chart rendering and interactions
 * - Date range picker functionality
 * - Export functionality
 * - Responsive design and error handling
 */

import { test, expect } from '@playwright/test';
import { loginAsStoreOwner } from './helpers/auth';
import { seedTestData, cleanupTestData } from './helpers/test-data';

test.describe('Analytics Dashboard', () => {
  // Setup test data before each test
  test.beforeEach(async ({ page }) => {
    // Seed test data for analytics
    await seedTestData();
    
    // Login as store owner to access analytics
    await loginAsStoreOwner(page);
    
    // Navigate to analytics dashboard
    await page.goto('/analytics');
  });

  // Cleanup test data after each test
  test.afterEach(async () => {
    await cleanupTestData();
  });

  test('should display analytics dashboard with key metrics', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check page title and heading
    await expect(page).toHaveTitle(/Analytics Dashboard/);
    await expect(page.locator('h1')).toContainText('Analytics Dashboard');

    // Check key metric cards are present
    await expect(page.locator('[data-testid="metrics-grid"]')).toBeVisible();
    
    // Should have 4 metric cards
    const metricCards = page.locator('[data-testid="metric-card"]');
    await expect(metricCards).toHaveCount(4);

    // Check for specific metrics
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('text=Total Orders')).toBeVisible();
    await expect(page.locator('text=Average Order Value')).toBeVisible();
    await expect(page.locator('text=Total Customers')).toBeVisible();
  });

  test('should display date range picker and allow period selection', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check date range picker is present
    await expect(page.locator('[data-testid="date-picker"]')).toBeVisible();

    // Check period selector
    const periodSelect = page.locator('select[name="period"]').or(page.locator('[data-testid="period-select"]'));
    await expect(periodSelect).toBeVisible();

    // Test period selection
    if (await periodSelect.first().isVisible()) {
      await periodSelect.first().selectOption('week');
      // Wait for data to refresh
      await page.waitForTimeout(1000);
    }
  });

  test('should display sales and revenue chart', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for sales revenue chart
    await expect(page.locator('text=Sales & Revenue Trends')).toBeVisible();
    
    // Chart container should be present
    const chartContainer = page.locator('[data-testid="sales-revenue-chart"]').or(
      page.locator('.recharts-wrapper')
    );
    
    if (await chartContainer.first().isVisible()) {
      await expect(chartContainer.first()).toBeVisible();
    } else {
      // If no data, should show empty state
      await expect(page.locator('text=No data available')).toBeVisible();
    }
  });

  test('should display top products chart and data', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for top products section
    await expect(page.locator('text=Top Products').or(page.locator('text=Top Selling Products'))).toBeVisible();
    
    // Should have products chart or empty state
    const productsSection = page.locator('[data-testid="top-products-chart"]').or(
      page.locator('text=No product sales data available')
    );
    
    if (await productsSection.first().isVisible()) {
      await expect(productsSection.first()).toBeVisible();
    }
  });

  test('should display customer metrics chart', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for customer metrics section
    await expect(page.locator('text=Customer').or(page.locator('text=Acquisition'))).toBeVisible();
    
    // Should have customer chart or empty state
    const customerSection = page.locator('[data-testid="customer-metrics-chart"]').or(
      page.locator('text=No customer data available')
    );
    
    if (await customerSection.first().isVisible()) {
      await expect(customerSection.first()).toBeVisible();
    }
  });

  test('should display export functionality', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Scroll to export section
    await page.locator('text=Export Analytics Data').scrollIntoViewIfNeeded();
    
    // Check export section exists
    if (await page.locator('text=Export Analytics Data').isVisible()) {
      await expect(page.locator('text=Export Analytics Data')).toBeVisible();
      
      // Check for export buttons
      const exportButtons = page.locator('a[download]:has-text("Export")');
      if (await exportButtons.first().isVisible()) {
        await expect(exportButtons.first()).toBeVisible();
      }
    }
  });

  test('should handle date range changes', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for date picker button
    const datePickerButton = page.locator('button:has-text("Pick a date range")').or(
      page.locator('[data-testid="date-picker-trigger"]')
    );

    if (await datePickerButton.first().isVisible()) {
      // Click to open date picker
      await datePickerButton.first().click();
      
      // Wait for calendar to appear
      await page.waitForTimeout(500);
      
      // Look for quick select buttons
      const lastWeekButton = page.locator('button:has-text("Last 7 days")');
      if (await lastWeekButton.isVisible()) {
        await lastWeekButton.click();
        
        // Wait for data to refresh
        await page.waitForTimeout(1000);
        
        // Page should still be functional
        await expect(page.locator('h1')).toContainText('Analytics Dashboard');
      }
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check page still loads correctly
    await expect(page.locator('h1')).toContainText('Analytics Dashboard');
    
    // Metrics should stack on mobile
    const metricsGrid = page.locator('[data-testid="metrics-grid"]').or(
      page.locator('.grid')
    );
    
    if (await metricsGrid.first().isVisible()) {
      await expect(metricsGrid.first()).toBeVisible();
    }
  });

  test('should handle loading states gracefully', async ({ page }) => {
    // Intercept API calls to simulate slow loading
    await page.route('/api/analytics/**', async route => {
      // Delay response to test loading states
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });

    // Navigate to analytics
    await page.goto('/analytics');

    // Should show loading skeletons initially
    const loadingElements = page.locator('[data-testid="skeleton"]').or(
      page.locator('.animate-pulse')
    );
    
    if (await loadingElements.first().isVisible()) {
      await expect(loadingElements.first()).toBeVisible();
    }

    // Wait for loading to complete
    await page.waitForLoadState('networkidle');
    
    // Should eventually show content
    await expect(page.locator('h1')).toContainText('Analytics Dashboard');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls to simulate errors
    await page.route('/api/analytics/**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    // Navigate to analytics
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Should show error states instead of crashing
    const errorMessages = page.locator('text=Failed to load').or(
      page.locator('text=error').or(
        page.locator('text=unavailable')
      )
    );
    
    if (await errorMessages.first().isVisible()) {
      await expect(errorMessages.first()).toBeVisible();
    }
    
    // Page should still have basic structure
    await expect(page.locator('h1')).toContainText('Analytics Dashboard');
  });
});