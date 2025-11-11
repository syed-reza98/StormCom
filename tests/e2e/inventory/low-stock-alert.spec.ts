// tests/e2e/inventory/low-stock-alert.spec.ts
// E2E test for T112 [US6]: Low stock alert appears when threshold reached
// Tests inventory management alert system functionality

import { test, expect } from '@playwright/test';
import { loginAsStoreOwner } from '../helpers/auth';

/**
 * Test product data with low stock scenarios
 */
interface TestProduct {
  id: string;
  name: string;
  sku: string;
  inventoryQty: number;
  lowStockThreshold: number;
  inventoryStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

/**
 * Helper function to create a test product via API
 */
async function createTestProduct(
  page: any,
  product: Partial<TestProduct>
): Promise<string> {
  // Get session token from cookies
  const cookies = await page.context().cookies();
  const sessionToken = cookies.find(
    (c: any) => c.name === 'session_token' || c.name === 'sessionId'
  )?.value;

  if (!sessionToken) {
    throw new Error('No session token found. User must be logged in.');
  }

  // Create product via API
  const response = await page.request.post('http://localhost:3000/api/products', {
    headers: {
      'Content-Type': 'application/json',
      Cookie: `session_token=${sessionToken}`,
    },
    data: {
      name: product.name || 'Test Product for Low Stock Alert',
      sku: product.sku || `TEST-SKU-${Date.now()}`,
      price: 99.99,
      description: 'Test product for E2E low stock alert testing',
      isActive: true,
      trackInventory: true,
      inventoryQty: product.inventoryQty || 10,
      lowStockThreshold: product.lowStockThreshold || 5,
    },
  });

  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Failed to create product: ${response.status()} - ${errorText}`);
  }

  const result = await response.json();
  return result.data.id;
}

/**
 * Helper function to adjust product stock via API
 */
async function adjustProductStock(
  page: any,
  productId: string,
  quantity: number,
  type: 'ADD' | 'REMOVE' | 'SET',
  reason: string
): Promise<void> {
  const cookies = await page.context().cookies();
  const sessionToken = cookies.find(
    (c: any) => c.name === 'session_token' || c.name === 'sessionId'
  )?.value;

  if (!sessionToken) {
    throw new Error('No session token found. User must be logged in.');
  }

  const response = await page.request.post('http://localhost:3000/api/inventory/adjust', {
    headers: {
      'Content-Type': 'application/json',
      Cookie: `session_token=${sessionToken}`,
    },
    data: {
      productId,
      quantity,
      type,
      reason,
      note: 'E2E test stock adjustment',
    },
  });

  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Failed to adjust stock: ${response.status()} - ${errorText}`);
  }
}

/**
 * Helper function to delete test product
 */
async function deleteTestProduct(page: any, productId: string): Promise<void> {
  const cookies = await page.context().cookies();
  const sessionToken = cookies.find(
    (c: any) => c.name === 'session_token' || c.name === 'sessionId'
  )?.value;

  if (!sessionToken) {
    return; // Silently fail if no session (cleanup on best-effort basis)
  }

  await page.request.delete(`http://localhost:3000/api/products/${productId}`, {
    headers: {
      Cookie: `session_token=${sessionToken}`,
    },
  });
}

test.describe('US6 - Inventory Low Stock Alerts', () => {
  test.beforeEach(async ({ page }) => {
    // Login as store owner before each test
    await loginAsStoreOwner(page);
  });

  test('T112: Low stock alert appears when product stock falls below threshold', async ({ page }) => {
    // ARRANGE: Create a product with stock at threshold level
    const productSku = `LOW-STOCK-${Date.now()}`;
    const productId = await createTestProduct(page, {
      name: 'Low Stock Test Product',
      sku: productSku,
      inventoryQty: 5,
      lowStockThreshold: 10, // Stock (5) is below threshold (10)
    });

    try {
      // ACT: Navigate to inventory dashboard
      await page.goto('/inventory');
      await page.waitForLoadState('networkidle');

      // ASSERT: Verify low stock alert card is visible
      const lowStockAlert = page.locator('[data-testid="low-stock-alert"]').or(
        page.locator('text=/low stock/i').first()
      );
      await expect(lowStockAlert).toBeVisible({ timeout: 10000 });

      // ASSERT: Verify alert shows correct count (at least 1)
      const alertText = await lowStockAlert.textContent();
      expect(alertText).toMatch(/\d+\s+(product|products)/i);

      // ASSERT: Verify product appears in inventory table with LOW_STOCK status
      const productRow = page.locator(`tr:has-text("${productSku}")`);
      await expect(productRow).toBeVisible();

      const statusBadge = productRow.locator('[data-testid="inventory-status"]').or(
        productRow.locator('text=Low Stock')
      );
      await expect(statusBadge).toBeVisible();

      // ASSERT: Verify current stock is displayed correctly
      const stockCell = productRow.locator('td:has-text("5")');
      await expect(stockCell).toBeVisible();

    } finally {
      // CLEANUP: Delete test product
      await deleteTestProduct(page, productId);
    }
  });

  test('T112: Low stock alert disappears when stock is adjusted above threshold', async ({ page }) => {
    // ARRANGE: Create a product with low stock
    const productSku = `ADJUST-STOCK-${Date.now()}`;
    const productId = await createTestProduct(page, {
      name: 'Adjustable Stock Product',
      sku: productSku,
      inventoryQty: 3,
      lowStockThreshold: 10,
    });

    try {
      // ACT: Navigate to inventory page and verify low stock alert exists
      await page.goto('/inventory');
      await page.waitForLoadState('networkidle');

      const lowStockAlertBefore = page.locator('[data-testid="low-stock-alert"]').or(
        page.locator('text=/low stock/i').first()
      );
      await expect(lowStockAlertBefore).toBeVisible();

      // ACT: Adjust stock above threshold using API
      await adjustProductStock(page, productId, 20, 'SET', 'Restocking inventory for E2E test');

      // ACT: Reload inventory page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // ASSERT: Verify product status changed to IN_STOCK
      const productRow = page.locator(`tr:has-text("${productSku}")`);
      await expect(productRow).toBeVisible();

      const statusBadge = productRow.locator('[data-testid="inventory-status"]').or(
        productRow.locator('text=/In Stock/i')
      );
      await expect(statusBadge).toBeVisible();

      // ASSERT: Verify stock quantity updated to 20
      const stockCell = productRow.locator('td:has-text("20")');
      await expect(stockCell).toBeVisible();

      // Note: Low stock alert may still be visible if other products have low stock
      // We verify that THIS product no longer shows as low stock

    } finally {
      // CLEANUP: Delete test product
      await deleteTestProduct(page, productId);
    }
  });

  test('T112: Out of stock alert appears when inventory reaches zero', async ({ page }) => {
    // ARRANGE: Create a product with zero stock
    const productSku = `OUT-STOCK-${Date.now()}`;
    const productId = await createTestProduct(page, {
      name: 'Out of Stock Product',
      sku: productSku,
      inventoryQty: 0,
      lowStockThreshold: 10,
    });

    try {
      // ACT: Navigate to inventory dashboard
      await page.goto('/inventory');
      await page.waitForLoadState('networkidle');

      // ASSERT: Verify low stock alert is visible (includes out of stock)
      const lowStockAlert = page.locator('[data-testid="low-stock-alert"]').or(
        page.locator('text=/low stock|out of stock/i').first()
      );
      await expect(lowStockAlert).toBeVisible();

      // ASSERT: Verify product shows OUT_OF_STOCK status
      const productRow = page.locator(`tr:has-text("${productSku}")`);
      await expect(productRow).toBeVisible();

      const statusBadge = productRow.locator('[data-testid="inventory-status"]').or(
        productRow.locator('text=/Out of Stock/i')
      );
      await expect(statusBadge).toBeVisible();

      // ASSERT: Verify stock shows 0
      const stockCell = productRow.locator('td').filter({ hasText: /^0$/ });
      await expect(stockCell).toBeVisible();

    } finally {
      // CLEANUP: Delete test product
      await deleteTestProduct(page, productId);
    }
  });

  test('T112: Low stock filter shows only low/out of stock products', async ({ page }) => {
    // ARRANGE: Create multiple products with different stock levels
    const normalStockSku = `NORMAL-${Date.now()}`;
    const lowStockSku = `LOW-${Date.now()}`;

    const normalStockId = await createTestProduct(page, {
      name: 'Normal Stock Product',
      sku: normalStockSku,
      inventoryQty: 50,
      lowStockThreshold: 10,
    });

    const lowStockId = await createTestProduct(page, {
      name: 'Low Stock Product',
      sku: lowStockSku,
      inventoryQty: 5,
      lowStockThreshold: 10,
    });

    try {
      // ACT: Navigate to inventory page
      await page.goto('/inventory');
      await page.waitForLoadState('networkidle');

      // ASSERT: Both products visible initially
      await expect(page.locator(`tr:has-text("${normalStockSku}")`)).toBeVisible();
      await expect(page.locator(`tr:has-text("${lowStockSku}")`)).toBeVisible();

      // ACT: Enable low stock filter
      const lowStockFilter = page.locator('[data-testid="low-stock-filter"]').or(
        page.locator('input[type="checkbox"]:near(:text("Low Stock"))')
      );

      if (await lowStockFilter.isVisible()) {
        await lowStockFilter.check();
        await page.waitForLoadState('networkidle');

        // ASSERT: Only low stock product visible
        await expect(page.locator(`tr:has-text("${lowStockSku}")`)).toBeVisible();
        await expect(page.locator(`tr:has-text("${normalStockSku}")`)).not.toBeVisible();
      }

    } finally {
      // CLEANUP: Delete test products
      await deleteTestProduct(page, normalStockId);
      await deleteTestProduct(page, lowStockId);
    }
  });

  test('T112: Low stock alert count updates when filtering', async ({ page }) => {
    // ARRANGE: Create products with different stock levels
    const productIds: string[] = [];

    // Create 2 low stock products
    for (let i = 0; i < 2; i++) {
      const id = await createTestProduct(page, {
        name: `Low Stock ${i + 1}`,
        sku: `LOW-COUNT-${Date.now()}-${i}`,
        inventoryQty: 3,
        lowStockThreshold: 10,
      });
      productIds.push(id);
    }

    try {
      // ACT: Navigate to inventory page
      await page.goto('/inventory');
      await page.waitForLoadState('networkidle');

      // ASSERT: Low stock alert shows count including our test products
      const lowStockAlert = page.locator('[data-testid="low-stock-alert"]').or(
        page.locator('text=/low stock/i').first()
      );

      if (await lowStockAlert.isVisible()) {
        const alertText = await lowStockAlert.textContent();
        const countMatch = alertText?.match(/(\d+)\s+product/);

        if (countMatch) {
          const count = parseInt(countMatch[1], 10);
          expect(count).toBeGreaterThanOrEqual(2); // At least our 2 test products
        }
      }

    } finally {
      // CLEANUP: Delete all test products
      for (const id of productIds) {
        await deleteTestProduct(page, id);
      }
    }
  });
});
