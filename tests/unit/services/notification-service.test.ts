// tests/unit/services/notification-service.test.ts
// Unit tests for NotificationService

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationService } from '@/services/notification-service';
import { prisma } from '@/lib/prisma';

describe('NotificationService', () => {
  let service: NotificationService;
  let testUserId: string;
  let testNotificationId: string;

  beforeEach(async () => {
    service = new NotificationService();

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'notif-test@example.com',
        name: 'Notification Test User',
        password: 'hashed_password',
        role: 'CUSTOMER',
      },
    });
    testUserId = user.id;
  });

  afterEach(async () => {
    // Clean up test data
    if (testUserId) {
      await prisma.notification.deleteMany({ where: { userId: testUserId } });
      await prisma.user.delete({ where: { id: testUserId } });
    }
  });

  describe('create', () => {
    it('should create a notification successfully', async () => {
      // Act
      const notification = await service.create({
        userId: testUserId,
        title: 'New Order',
        message: 'You have a new order #12345',
        type: 'order_update',
        linkUrl: '/dashboard/orders/12345',
        linkText: 'View Order',
      });

      // Assert
      expect(notification).toBeDefined();
      expect(notification.id).toBeDefined();
      expect(notification.userId).toBe(testUserId);
      expect(notification.title).toBe('New Order');
      expect(notification.message).toBe('You have a new order #12345');
      expect(notification.type).toBe('order_update');
      expect(notification.linkUrl).toBe('/dashboard/orders/12345');
      expect(notification.linkText).toBe('View Order');
      expect(notification.isRead).toBe(false);
      expect(notification.readAt).toBeNull();
      expect(notification.createdAt).toBeInstanceOf(Date);

      testNotificationId = notification.id;
    });

    it('should create notification without link', async () => {
      // Act
      const notification = await service.create({
        userId: testUserId,
        title: 'System Alert',
        message: 'System maintenance scheduled',
        type: 'system',
      });

      // Assert
      expect(notification.linkUrl).toBeNull();
      expect(notification.linkText).toBeNull();
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      // Create test notifications
      await service.create({
        userId: testUserId,
        title: 'Notification 1',
        message: 'Message 1',
        type: 'order_update',
      });

      await service.create({
        userId: testUserId,
        title: 'Notification 2',
        message: 'Message 2',
        type: 'low_stock',
      });

      // Create a read notification
      const readNotif = await service.create({
        userId: testUserId,
        title: 'Notification 3',
        message: 'Message 3',
        type: 'system',
      });

      await prisma.notification.update({
        where: { id: readNotif.id },
        data: { isRead: true, readAt: new Date() },
      });
    });

    it('should list all notifications for a user', async () => {
      // Act
      const notifications = await service.list({ userId: testUserId });

      // Assert
      expect(notifications).toHaveLength(3);
      expect(notifications[0].createdAt.getTime()).toBeGreaterThanOrEqual(
        notifications[1].createdAt.getTime()
      ); // Most recent first
    });

    it('should filter unread notifications', async () => {
      // Act
      const unread = await service.list({ userId: testUserId, isRead: false });

      // Assert
      expect(unread).toHaveLength(2);
      expect(unread.every((n) => !n.isRead)).toBe(true);
    });

    it('should filter read notifications', async () => {
      // Act
      const read = await service.list({ userId: testUserId, isRead: true });

      // Assert
      expect(read).toHaveLength(1);
      expect(read.every((n) => n.isRead)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      // Act
      const limited = await service.list({ userId: testUserId, limit: 2 });

      // Assert
      expect(limited).toHaveLength(2);
    });

    it('should respect offset parameter', async () => {
      // Act
      const all = await service.list({ userId: testUserId });
      const offset = await service.list({ userId: testUserId, offset: 1 });

      // Assert
      expect(offset).toHaveLength(2);
      expect(offset[0].id).toBe(all[1].id);
    });
  });

  describe('getUnreadCount', () => {
    beforeEach(async () => {
      // Create 3 unread notifications
      await service.create({
        userId: testUserId,
        title: 'Unread 1',
        message: 'Message',
        type: 'order_update',
      });

      await service.create({
        userId: testUserId,
        title: 'Unread 2',
        message: 'Message',
        type: 'order_update',
      });

      await service.create({
        userId: testUserId,
        title: 'Unread 3',
        message: 'Message',
        type: 'order_update',
      });

      // Create 1 read notification
      const readNotif = await service.create({
        userId: testUserId,
        title: 'Read',
        message: 'Message',
        type: 'system',
      });

      await prisma.notification.update({
        where: { id: readNotif.id },
        data: { isRead: true, readAt: new Date() },
      });
    });

    it('should return correct unread count', async () => {
      // Act
      const count = await service.getUnreadCount(testUserId);

      // Assert
      expect(count).toBe(3);
    });

    it('should return 0 for user with no unread notifications', async () => {
      // Arrange
      const newUser = await prisma.user.create({
        data: {
          email: 'nonotifs@example.com',
          name: 'No Notifs',
          password: 'hashed',
          role: 'CUSTOMER',
        },
      });

      // Act
      const count = await service.getUnreadCount(newUser.id);

      // Assert
      expect(count).toBe(0);

      // Cleanup
      await prisma.user.delete({ where: { id: newUser.id } });
    });
  });

  describe('markAsRead', () => {
    beforeEach(async () => {
      const notification = await service.create({
        userId: testUserId,
        title: 'Test Notification',
        message: 'Test Message',
        type: 'order_update',
      });
      testNotificationId = notification.id;
    });

    it('should mark notification as read', async () => {
      // Act
      const updated = await service.markAsRead(testNotificationId, testUserId);

      // Assert
      expect(updated).toBeDefined();
      expect(updated!.isRead).toBe(true);
      expect(updated!.readAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent notification', async () => {
      // Act
      const result = await service.markAsRead('non-existent-id', testUserId);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when user does not own notification', async () => {
      // Arrange
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          name: 'Other User',
          password: 'hashed',
          role: 'CUSTOMER',
        },
      });

      // Act
      const result = await service.markAsRead(testNotificationId, otherUser.id);

      // Assert
      expect(result).toBeNull();

      // Cleanup
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('markAllAsRead', () => {
    beforeEach(async () => {
      // Create 3 unread notifications
      await service.create({
        userId: testUserId,
        title: 'Unread 1',
        message: 'Message',
        type: 'order_update',
      });

      await service.create({
        userId: testUserId,
        title: 'Unread 2',
        message: 'Message',
        type: 'order_update',
      });

      await service.create({
        userId: testUserId,
        title: 'Unread 3',
        message: 'Message',
        type: 'order_update',
      });
    });

    it('should mark all notifications as read', async () => {
      // Act
      const count = await service.markAllAsRead(testUserId);

      // Assert
      expect(count).toBe(3);

      const unreadCount = await service.getUnreadCount(testUserId);
      expect(unreadCount).toBe(0);
    });

    it('should return 0 if no unread notifications', async () => {
      // Arrange
      await service.markAllAsRead(testUserId); // Mark all as read first

      // Act
      const count = await service.markAllAsRead(testUserId);

      // Assert
      expect(count).toBe(0);
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      const notification = await service.create({
        userId: testUserId,
        title: 'Test Notification',
        message: 'Test Message',
        type: 'order_update',
      });
      testNotificationId = notification.id;
    });

    it('should delete notification', async () => {
      // Act
      const deleted = await service.delete(testNotificationId, testUserId);

      // Assert
      expect(deleted).toBeDefined();
      expect(deleted!.id).toBe(testNotificationId);

      const found = await service.getById(testNotificationId, testUserId);
      expect(found).toBeNull();
    });

    it('should return null for non-existent notification', async () => {
      // Act
      const result = await service.delete('non-existent-id', testUserId);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when user does not own notification', async () => {
      // Arrange
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          name: 'Other User',
          password: 'hashed',
          role: 'CUSTOMER',
        },
      });

      // Act
      const result = await service.delete(testNotificationId, otherUser.id);

      // Assert
      expect(result).toBeNull();

      // Cleanup
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('deleteAllRead', () => {
    beforeEach(async () => {
      // Create 2 read notifications
      const read1 = await service.create({
        userId: testUserId,
        title: 'Read 1',
        message: 'Message',
        type: 'system',
      });
      await prisma.notification.update({
        where: { id: read1.id },
        data: { isRead: true, readAt: new Date() },
      });

      const read2 = await service.create({
        userId: testUserId,
        title: 'Read 2',
        message: 'Message',
        type: 'system',
      });
      await prisma.notification.update({
        where: { id: read2.id },
        data: { isRead: true, readAt: new Date() },
      });

      // Create 1 unread notification
      await service.create({
        userId: testUserId,
        title: 'Unread',
        message: 'Message',
        type: 'order_update',
      });
    });

    it('should delete all read notifications', async () => {
      // Act
      const count = await service.deleteAllRead(testUserId);

      // Assert
      expect(count).toBe(2);

      const remaining = await service.list({ userId: testUserId });
      expect(remaining).toHaveLength(1);
      expect(remaining[0].isRead).toBe(false);
    });

    it('should return 0 if no read notifications', async () => {
      // Arrange
      await service.deleteAllRead(testUserId); // Delete all read first

      // Act
      const count = await service.deleteAllRead(testUserId);

      // Assert
      expect(count).toBe(0);
    });
  });

  describe('getById', () => {
    beforeEach(async () => {
      const notification = await service.create({
        userId: testUserId,
        title: 'Test Notification',
        message: 'Test Message',
        type: 'order_update',
      });
      testNotificationId = notification.id;
    });

    it('should get notification by ID', async () => {
      // Act
      const notification = await service.getById(testNotificationId, testUserId);

      // Assert
      expect(notification).toBeDefined();
      expect(notification!.id).toBe(testNotificationId);
      expect(notification!.title).toBe('Test Notification');
    });

    it('should return null for non-existent notification', async () => {
      // Act
      const result = await service.getById('non-existent-id', testUserId);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when user does not own notification', async () => {
      // Arrange
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          name: 'Other User',
          password: 'hashed',
          role: 'CUSTOMER',
        },
      });

      // Act
      const result = await service.getById(testNotificationId, otherUser.id);

      // Assert
      expect(result).toBeNull();

      // Cleanup
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });
});
