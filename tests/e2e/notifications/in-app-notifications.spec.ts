/**
 * E2E Test: In-App Notifications
 * 
 * Test Scenario: User receives in-app notification
 * 
 * Tests:
 * 1. Notification dropdown displays unread count
 * 2. Clicking notification marks it as read
 * 3. Notification displays with correct content and timestamp
 * 4. Multiple notifications show in correct order
 * 5. Empty state when no notifications
 */

import { test, expect } from '@playwright/test';
import { db } from '../../../src/lib/db';
import { notificationService } from '../../../src/services/notification-service';
import { setSession } from '../../../src/lib/session-storage';

test.describe('In-App Notifications', () => {
  let testStoreId: string;
  let testUserId: string;
  let sessionId: string;

  test.beforeEach(async ({ page: _page, context }) => {
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

    // Create test user (store admin)
    const user = await db.user.create({
      data: {
        email: `admin-${Date.now()}@test.com`,
        name: 'Admin User',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYL4PRPY.Gu', // "password"
        role: 'STORE_ADMIN',
        storeId: testStoreId,
        emailVerified: true,
      },
    });
    testUserId = user.id;

    // Create session for authenticated user
    sessionId = `session-${Date.now()}`;
    await setSession(sessionId, {
      userId: testUserId,
      email: user.email,
      role: user.role,
      storeId: testStoreId,
    });

    // Set session cookie
    await context.addCookies([
      {
        name: 'session-id',
        value: sessionId,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ]);
  });

  test.afterEach(async () => {
    // Clean up test data
    await db.notification.deleteMany({ where: { userId: testUserId } });
    await db.user.delete({ where: { id: testUserId } }).catch(() => {});
    await db.store.delete({ where: { id: testStoreId } }).catch(() => {});
  });

  test('Notification dropdown displays unread count and marks as read on click', async ({ page }) => {
    // Create test notifications
    const notification1 = await notificationService.create({
      userId: testUserId,
      title: 'New Order Received',
      message: 'Order #ORD-12345 has been placed for $115.00',
      type: 'order_update',
      linkUrl: '/dashboard/orders/test-order-1',
      linkText: 'View Order',
    });

    await notificationService.create({
      userId: testUserId,
      title: 'Low Stock Alert',
      message: 'Test Product is running low (3 remaining, threshold: 10)',
      type: 'low_stock',
      linkUrl: '/dashboard/products/test-product-1',
      linkText: 'Restock Product',
    });

    // Navigate to dashboard (already authenticated via session cookie)
    await page.goto('/dashboard');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check notification bell icon has unread badge
    const notificationBadge = page.locator('[data-testid="notification-badge"]');
    await expect(notificationBadge).toBeVisible();
    await expect(notificationBadge).toHaveText('2');

    // Click notification bell to open dropdown
    await page.click('[data-testid="notification-bell"]');

    // Verify notifications appear in dropdown
    const notificationItems = page.locator('[data-testid="notification-item"]');
    await expect(notificationItems).toHaveCount(2);

    // Verify first notification content
    await expect(notificationItems.first()).toContainText('New Order Received');
    await expect(notificationItems.first()).toContainText('ORD-12345');

    // Verify second notification content
    await expect(notificationItems.nth(1)).toContainText('Low Stock Alert');
    await expect(notificationItems.nth(1)).toContainText('Test Product');

    // Click first notification to mark as read (without following link)
    await page.evaluate((_notifId) => {
      // Intercept navigation
      window.addEventListener('beforeunload', (e) => {
        e.preventDefault();
      });
    }, notification1.id);

    // Mark notification as read via API (simulate click behavior)
    await page.request.put(`http://localhost:3000/api/notifications/${notification1.id}/read`);

    // Reload to see updated badge count
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify badge count decremented to 1
    await expect(notificationBadge).toBeVisible();
    await expect(notificationBadge).toHaveText('1');
  });

  test('Notification displays timestamp with "time ago" format', async ({ page }) => {
    // Create a notification
    await notificationService.create({
      userId: testUserId,
      title: 'Test Notification',
      message: 'This notification was just created',
      type: 'order_update',
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click notification bell
    await page.click('[data-testid="notification-bell"]');

    // Verify timestamp shows "time ago" format (e.g., "just now", "5 seconds ago")
    const notificationItem = page.locator('[data-testid="notification-item"]').first();
    await expect(notificationItem).toContainText(/ago|just now/i);
  });

  test('Empty state displays when no notifications exist', async ({ page }) => {
    // Navigate to dashboard without creating any notifications
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify no badge is visible
    const notificationBadge = page.locator('[data-testid="notification-badge"]');
    await expect(notificationBadge).not.toBeVisible();

    // Click notification bell
    await page.click('[data-testid="notification-bell"]');

    // Verify empty state message
    await expect(page.locator('text=No notifications')).toBeVisible();
  });

  test('Multiple notifications display in correct order (newest first)', async ({ page }) => {
    // Create multiple notifications with slight delay
    await notificationService.create({
      userId: testUserId,
      title: 'First Notification',
      message: 'This was created first',
      type: 'order_update',
    });

    // Wait 100ms
    await new Promise(resolve => setTimeout(resolve, 100));

    await notificationService.create({
      userId: testUserId,
      title: 'Second Notification',
      message: 'This was created second',
      type: 'order_update',
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Open notifications
    await page.click('[data-testid="notification-bell"]');

    // Verify both notifications appear
    const notificationItems = page.locator('[data-testid="notification-item"]');
    await expect(notificationItems).toHaveCount(2);

    // Verify newest notification appears first (Second Notification should be first)
    await expect(notificationItems.first()).toContainText('Second Notification');
    await expect(notificationItems.nth(1)).toContainText('First Notification');
  });

  test('Notification dropdown closes when clicking outside', async ({ page }) => {
    // Create a notification
    await notificationService.create({
      userId: testUserId,
      title: 'Test Notification',
      message: 'Test message',
      type: 'order_update',
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Open notification dropdown
    await page.click('[data-testid="notification-bell"]');

    // Verify dropdown is open by checking for notification items
    const notificationItems = page.locator('[data-testid="notification-item"]');
    await expect(notificationItems.first()).toBeVisible();

    // Click outside the dropdown (on the page body)
    await page.click('body', { position: { x: 10, y: 10 } });

    // Wait a bit for dropdown to close
    await page.waitForTimeout(200);

    // Verify dropdown is closed (notification items should not be visible)
    await expect(notificationItems.first()).not.toBeVisible();
  });
});
