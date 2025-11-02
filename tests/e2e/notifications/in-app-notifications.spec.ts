/**
 * E2E Test: In-App Notifications
 * 
 * Test Scenario: User receives in-app notification
 * 
 * Tests:
 * 1. Store admin receives notification when new order is placed
 * 2. Notification appears in dropdown with correct count
 * 3. Clicking notification marks it as read
 * 4. Notification links to correct order page
 * 5. Customer receives notification when order ships
 * 6. Store admin receives low stock alert
 */

import { test, expect } from '@playwright/test';
import { db } from '@/lib/db';
import { notificationService } from '@/services/notification-service';

test.describe('In-App Notifications', () => {
  let testStoreId: string;
  let adminUserId: string;
  let customerUserId: string;
  let productId: string;

  test.beforeEach(async ({ page }) => {
    // Create test store
    const store = await db.store.create({
      data: {
        name: 'Test Notification Store',
        slug: `test-notif-store-${Date.now()}`,
        email: 'test@notifications.com',
        currency: 'USD',
        subscriptionPlan: 'PRO',
        subscriptionStatus: 'ACTIVE',
      },
    });
    testStoreId = store.id;

    // Create admin user
    const admin = await db.user.create({
      data: {
        email: `admin-${Date.now()}@test.com`,
        name: 'Admin User',
        password: 'hashed_password',
        role: 'STORE_ADMIN',
        storeId: testStoreId,
        emailVerified: true,
      },
    });
    adminUserId = admin.id;

    // Create customer user
    const customer = await db.user.create({
      data: {
        email: `customer-${Date.now()}@test.com`,
        name: 'Customer User',
        password: 'hashed_password',
        role: 'CUSTOMER',
        storeId: testStoreId,
        emailVerified: true,
      },
    });
    customerUserId = customer.id;

    // Create test product
    const product = await db.product.create({
      data: {
        storeId: testStoreId,
        name: 'Test Product',
        slug: `test-product-${Date.now()}`,
        description: 'Product for notification tests',
        price: 100,
        inventoryQty: 5,
        lowStockThreshold: 10,
        inventoryStatus: 'IN_STOCK',
        trackInventory: true,
        isActive: true,
      },
    });
    productId = product.id;
  });

  test.afterEach(async () => {
    // Clean up test data
    await db.notification.deleteMany({ where: { userId: { in: [adminUserId, customerUserId] } } });
    await db.product.deleteMany({ where: { storeId: testStoreId } });
    await db.user.deleteMany({ where: { storeId: testStoreId } });
    await db.store.delete({ where: { id: testStoreId } });
  });

  test('Store admin receives notification when new order is placed', async ({ page }) => {
    // Login as admin
    // Note: You'll need to implement proper login flow based on your auth setup
    await page.goto('/login');
    await page.fill('input[name="email"]', `admin-${Date.now()}@test.com`);
    await page.fill('input[name="password"]', 'test_password');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForURL('/dashboard');

    // Create a new order (simulate order placement)
    const order = await db.order.create({
      data: {
        storeId: testStoreId,
        customerId: customerUserId,
        userId: customerUserId,
        orderNumber: `ORD-${Date.now()}`,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        shippingStatus: 'PENDING',
        subtotal: 100,
        taxAmount: 10,
        shippingAmount: 5,
        totalAmount: 115,
      },
    });

    // Manually trigger notification (simulating order creation workflow)
    await notificationService.create({
      userId: adminUserId,
      title: 'New Order Received',
      message: `Order #${order.orderNumber} has been placed for $${Number(order.totalAmount).toFixed(2)}`,
      type: 'order_update',
      linkUrl: `/dashboard/orders/${order.id}`,
      linkText: 'View Order',
    });

    // Reload page to fetch new notification
    await page.reload();

    // Check notification bell icon has unread badge
    const notificationBadge = page.locator('[data-testid="notification-badge"]');
    await expect(notificationBadge).toBeVisible();
    await expect(notificationBadge).toHaveText('1');

    // Click notification bell
    await page.click('[data-testid="notification-bell"]');

    // Verify notification appears in dropdown
    const notificationItem = page.locator('[data-testid="notification-item"]').first();
    await expect(notificationItem).toBeVisible();
    await expect(notificationItem).toContainText('New Order Received');
    await expect(notificationItem).toContainText(order.orderNumber);

    // Click notification to mark as read
    await notificationItem.click();

    // Verify navigated to order page
    await page.waitForURL(`/dashboard/orders/${order.id}`);

    // Verify badge count decremented
    await page.goBack();
    await expect(notificationBadge).not.toBeVisible(); // Badge should be hidden when count is 0
  });

  test('Customer receives notification when order ships', async ({ page }) => {
    // Create an order
    const order = await db.order.create({
      data: {
        storeId: testStoreId,
        customerId: customerUserId,
        userId: customerUserId,
        orderNumber: `ORD-${Date.now()}`,
        status: 'PAID',
        paymentStatus: 'PAID',
        shippingStatus: 'PENDING',
        subtotal: 100,
        taxAmount: 10,
        shippingAmount: 5,
        totalAmount: 115,
        trackingNumber: 'TRACK123456',
      },
    });

    // Login as customer
    await page.goto('/login');
    await page.fill('input[name="email"]', `customer-${Date.now()}@test.com`);
    await page.fill('input[name="password"]', 'test_password');
    await page.click('button[type="submit"]');

    // Simulate order shipment and notification creation
    await notificationService.create({
      userId: customerUserId,
      title: 'Order Shipped',
      message: `Your order #${order.orderNumber} has been shipped. Tracking: ${order.trackingNumber}`,
      type: 'order_update',
      linkUrl: `/orders/${order.id}`,
      linkText: 'Track Order',
    });

    // Reload page to fetch notification
    await page.reload();

    // Check notification appears
    const notificationBadge = page.locator('[data-testid="notification-badge"]');
    await expect(notificationBadge).toBeVisible();
    await expect(notificationBadge).toHaveText('1');

    // Open notification dropdown
    await page.click('[data-testid="notification-bell"]');

    // Verify notification content
    const notificationItem = page.locator('[data-testid="notification-item"]').first();
    await expect(notificationItem).toContainText('Order Shipped');
    await expect(notificationItem).toContainText(order.orderNumber);
    await expect(notificationItem).toContainText('TRACK123456');

    // Click notification
    await notificationItem.click();

    // Verify navigated to order tracking page
    await page.waitForURL(`/orders/${order.id}`);
  });

  test('Store admin receives low stock alert', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', `admin-${Date.now()}@test.com`);
    await page.fill('input[name="password"]', 'test_password');
    await page.click('button[type="submit"]');

    await page.waitForURL('/dashboard');

    // Simulate low stock scenario
    await db.product.update({
      where: { id: productId },
      data: {
        inventoryQty: 3, // Below threshold of 10
        inventoryStatus: 'LOW_STOCK',
      },
    });

    // Manually create low stock notification
    const product = await db.product.findUnique({ where: { id: productId } });
    await notificationService.create({
      userId: adminUserId,
      title: 'Low Stock Alert',
      message: `${product!.name} is running low (${product!.inventoryQty} remaining, threshold: ${product!.lowStockThreshold})`,
      type: 'low_stock',
      linkUrl: `/dashboard/products/${productId}`,
      linkText: 'Restock Product',
    });

    // Reload page
    await page.reload();

    // Check notification badge
    const notificationBadge = page.locator('[data-testid="notification-badge"]');
    await expect(notificationBadge).toBeVisible();

    // Open dropdown
    await page.click('[data-testid="notification-bell"]');

    // Verify low stock notification
    const notificationItem = page.locator('[data-testid="notification-item"]').first();
    await expect(notificationItem).toContainText('Low Stock Alert');
    await expect(notificationItem).toContainText('Test Product');
    await expect(notificationItem).toContainText('3 remaining');

    // Click to view product
    await notificationItem.click();

    // Verify navigated to product page
    await page.waitForURL(`/dashboard/products/${productId}`);
  });

  test('Notification dropdown shows time ago and read/unread status', async ({ page }) => {
    // Create multiple notifications
    await notificationService.create({
      userId: adminUserId,
      title: 'Test Notification 1',
      message: 'This is unread',
      type: 'order_update',
    });

    const readNotification = await notificationService.create({
      userId: adminUserId,
      title: 'Test Notification 2',
      message: 'This is read',
      type: 'order_update',
    });

    // Mark second notification as read
    await notificationService.markAsRead(readNotification.id, adminUserId);

    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', `admin-${Date.now()}@test.com`);
    await page.fill('input[name="password"]', 'test_password');
    await page.click('button[type="submit"]');

    await page.waitForURL('/dashboard');

    // Open notifications
    await page.click('[data-testid="notification-bell"]');

    // Verify unread count badge shows 1 (only first notification is unread)
    const notificationBadge = page.locator('[data-testid="notification-badge"]');
    await expect(notificationBadge).toHaveText('1');

    // Verify time ago is displayed
    const notificationItems = page.locator('[data-testid="notification-item"]');
    await expect(notificationItems.first()).toContainText('ago'); // Should show "X minutes ago", etc.

    // Verify unread has different styling (e.g., bold or background color)
    const firstNotification = notificationItems.first();
    const secondNotification = notificationItems.nth(1);
    
    // Unread should have specific styling
    await expect(firstNotification).toHaveCSS('font-weight', '600'); // or other unread indicator
    
    // Read should have different styling
    await expect(secondNotification).not.toHaveCSS('font-weight', '600');
  });

  test('Notification badge updates in real-time with polling', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', `admin-${Date.now()}@test.com`);
    await page.fill('input[name="password"]', 'test_password');
    await page.click('button[type="submit"]');

    await page.waitForURL('/dashboard');

    // Initially no notifications
    const notificationBadge = page.locator('[data-testid="notification-badge"]');
    await expect(notificationBadge).not.toBeVisible();

    // Create a notification after page load
    await notificationService.create({
      userId: adminUserId,
      title: 'New Notification',
      message: 'This should appear after polling',
      type: 'order_update',
    });

    // Wait for polling interval (30 seconds by default, but you can reduce in test env)
    // Assuming polling interval is set to 5 seconds for testing
    await page.waitForTimeout(6000);

    // Verify badge appears
    await expect(notificationBadge).toBeVisible();
    await expect(notificationBadge).toHaveText('1');
  });
});
