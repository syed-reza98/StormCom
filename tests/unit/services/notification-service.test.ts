// tests/unit/services/notification-service.test.ts
// Unit tests for NotificationService

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from '@/services/notification-service';
import { prismaMock } from '../../mocks/prisma';

describe('NotificationService', () => {
  let service: NotificationService;
  let testUserId: string;
  let testNotificationId: string;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new NotificationService();
    
    // Set up test IDs
    testUserId = 'test-user-id-123';
    testNotificationId = 'test-notif-id-456';
  });

  describe('create', () => {
    it('should create a notification successfully', async () => {
      // Arrange
      const mockNotification = {
        id: testNotificationId,
        userId: testUserId,
        title: 'New Order',
        message: 'You have a new order #12345',
        type: 'order_update',
        linkUrl: '/dashboard/orders/12345',
        linkText: 'View Order',
        isRead: false,
        readAt: null,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
      };

      prismaMock.notification.create.mockResolvedValue(mockNotification);

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
      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: {
          userId: testUserId,
          title: 'New Order',
          message: 'You have a new order #12345',
          type: 'order_update',
          linkUrl: '/dashboard/orders/12345',
          linkText: 'View Order',
          isRead: false,
        },
      });

      expect(notification).toBeDefined();
      expect(notification.id).toBe(testNotificationId);
      expect(notification.userId).toBe(testUserId);
      expect(notification.title).toBe('New Order');
      expect(notification.message).toBe('You have a new order #12345');
      expect(notification.type).toBe('order_update');
      expect(notification.linkUrl).toBe('/dashboard/orders/12345');
      expect(notification.linkText).toBe('View Order');
      expect(notification.isRead).toBe(false);
      expect(notification.readAt).toBeNull();
      expect(notification.createdAt).toBeInstanceOf(Date);
    });

    it('should create notification without link', async () => {
      // Arrange
      const mockNotification = {
        id: testNotificationId,
        userId: testUserId,
        title: 'System Alert',
        message: 'System maintenance scheduled',
        type: 'system',
        linkUrl: null,
        linkText: null,
        isRead: false,
        readAt: null,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
      };

      prismaMock.notification.create.mockResolvedValue(mockNotification);

      // Act
      const notification = await service.create({
        userId: testUserId,
        title: 'System Alert',
        message: 'System maintenance scheduled',
        type: 'system',
      });

      // Assert
      expect(prismaMock.notification.create).toHaveBeenCalledWith({
        data: {
          userId: testUserId,
          title: 'System Alert',
          message: 'System maintenance scheduled',
          type: 'system',
          linkUrl: undefined,
          linkText: undefined,
          isRead: false,
        },
      });

      expect(notification.linkUrl).toBeNull();
      expect(notification.linkText).toBeNull();
    });
  });

  describe('list', () => {
    const mockNotifications = [
      {
        id: 'notif-1',
        userId: 'test-user-id-123',
        title: 'Notification 1',
        message: 'Message 1',
        type: 'order_update',
        linkUrl: null,
        linkText: null,
        isRead: false,
        readAt: null,
        createdAt: new Date('2025-01-01T10:00:00Z'),
        updatedAt: new Date('2025-01-01T10:00:00Z'),
      },
      {
        id: 'notif-2',
        userId: 'test-user-id-123',
        title: 'Notification 2',
        message: 'Message 2',
        type: 'low_stock',
        linkUrl: null,
        linkText: null,
        isRead: false,
        readAt: null,
        createdAt: new Date('2025-01-01T09:00:00Z'),
        updatedAt: new Date('2025-01-01T09:00:00Z'),
      },
      {
        id: 'notif-3',
        userId: 'test-user-id-123',
        title: 'Notification 3',
        message: 'Message 3',
        type: 'system',
        linkUrl: null,
        linkText: null,
        isRead: true,
        readAt: new Date('2025-01-01T08:30:00Z'),
        createdAt: new Date('2025-01-01T08:00:00Z'),
        updatedAt: new Date('2025-01-01T08:30:00Z'),
      },
    ];

    it('should list all notifications for a user', async () => {
      // Arrange
      prismaMock.notification.findMany.mockResolvedValue(mockNotifications);

      // Act
      const notifications = await service.list({ userId: testUserId });

      // Assert
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });

      expect(notifications).toHaveLength(3);
      expect(notifications[0].createdAt.getTime()).toBeGreaterThanOrEqual(
        notifications[1].createdAt.getTime()
      ); // Most recent first
    });

    it('should filter unread notifications', async () => {
      // Arrange
      const unreadNotifications = mockNotifications.filter(n => !n.isRead);
      prismaMock.notification.findMany.mockResolvedValue(unreadNotifications);

      // Act
      const unread = await service.list({ userId: testUserId, isRead: false });

      // Assert
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: { userId: testUserId, isRead: false },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });

      expect(unread).toHaveLength(2);
      expect(unread.every((n) => !n.isRead)).toBe(true);
    });

    it('should filter read notifications', async () => {
      // Arrange
      const readNotifications = mockNotifications.filter(n => n.isRead);
      prismaMock.notification.findMany.mockResolvedValue(readNotifications);

      // Act
      const read = await service.list({ userId: testUserId, isRead: true });

      // Assert
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: { userId: testUserId, isRead: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });

      expect(read).toHaveLength(1);
      expect(read.every((n) => n.isRead)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      // Arrange
      const limitedNotifications = mockNotifications.slice(0, 2);
      prismaMock.notification.findMany.mockResolvedValue(limitedNotifications);

      // Act
      const limited = await service.list({ userId: testUserId, limit: 2 });

      // Assert
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' },
        take: 2,
        skip: 0,
      });

      expect(limited).toHaveLength(2);
    });

    it('should respect offset parameter', async () => {
      // Arrange
      const offsetNotifications = mockNotifications.slice(1);
      prismaMock.notification.findMany.mockResolvedValue(offsetNotifications);

      // Act
      const offset = await service.list({ userId: testUserId, offset: 1 });

      // Assert
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 1,
      });

      expect(offset).toHaveLength(2);
    });
  });

  describe('getUnreadCount', () => {
    it('should return correct unread count', async () => {
      // Arrange
      prismaMock.notification.count.mockResolvedValue(3);

      // Act
      const count = await service.getUnreadCount(testUserId);

      // Assert
      expect(prismaMock.notification.count).toHaveBeenCalledWith({
        where: {
          userId: testUserId,
          isRead: false,
        },
      });

      expect(count).toBe(3);
    });

    it('should return 0 for user with no unread notifications', async () => {
      // Arrange
      const newUserId = 'new-user-id-789';
      prismaMock.notification.count.mockResolvedValue(0);

      // Act
      const count = await service.getUnreadCount(newUserId);

      // Assert
      expect(prismaMock.notification.count).toHaveBeenCalledWith({
        where: {
          userId: newUserId,
          isRead: false,
        },
      });

      expect(count).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      // Arrange
      const existingNotification = {
        id: testNotificationId,
        userId: testUserId,
        title: 'Test Notification',
        message: 'Test Message',
        type: 'order_update',
        linkUrl: null,
        linkText: null,
        isRead: false,
        readAt: null,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
      };

      const updatedNotification = {
        ...existingNotification,
        isRead: true,
        readAt: new Date('2025-01-01T01:00:00Z'),
      };

      prismaMock.notification.findFirst.mockResolvedValue(existingNotification);
      prismaMock.notification.update.mockResolvedValue(updatedNotification);

      // Act
      const updated = await service.markAsRead(testNotificationId, testUserId);

      // Assert
      expect(prismaMock.notification.findFirst).toHaveBeenCalledWith({
        where: { id: testNotificationId, userId: testUserId },
      });

      expect(prismaMock.notification.update).toHaveBeenCalledWith({
        where: { id: testNotificationId },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });

      expect(updated).toBeDefined();
      expect(updated!.isRead).toBe(true);
      expect(updated!.readAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent notification', async () => {
      // Arrange
      prismaMock.notification.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.markAsRead('non-existent-id', testUserId);

      // Assert
      expect(prismaMock.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 'non-existent-id', userId: testUserId },
      });

      expect(prismaMock.notification.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when user does not own notification', async () => {
      // Arrange
      const otherUserId = 'other-user-id-999';
      prismaMock.notification.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.markAsRead(testNotificationId, otherUserId);

      // Assert
      expect(prismaMock.notification.findFirst).toHaveBeenCalledWith({
        where: { id: testNotificationId, userId: otherUserId },
      });

      expect(prismaMock.notification.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      // Arrange
      prismaMock.notification.updateMany.mockResolvedValue({ count: 3 });
      prismaMock.notification.count.mockResolvedValue(0);

      // Act
      const count = await service.markAllAsRead(testUserId);

      // Assert
      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: testUserId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });

      expect(count).toBe(3);

      const unreadCount = await service.getUnreadCount(testUserId);
      expect(unreadCount).toBe(0);
    });

    it('should return 0 if no unread notifications', async () => {
      // Arrange
      prismaMock.notification.updateMany.mockResolvedValue({ count: 0 });

      // Act
      const count = await service.markAllAsRead(testUserId);

      // Assert
      expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: testUserId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });

      expect(count).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete notification', async () => {
      // Arrange
      const existingNotification = {
        id: testNotificationId,
        userId: testUserId,
        title: 'Test Notification',
        message: 'Test Message',
        type: 'order_update',
        linkUrl: null,
        linkText: null,
        isRead: false,
        readAt: null,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
      };

      prismaMock.notification.findFirst.mockResolvedValueOnce(existingNotification);
      prismaMock.notification.delete.mockResolvedValue(existingNotification);
      prismaMock.notification.findFirst.mockResolvedValueOnce(null); // For getById check

      // Act
      const deleted = await service.delete(testNotificationId, testUserId);

      // Assert
      expect(prismaMock.notification.findFirst).toHaveBeenCalledWith({
        where: { id: testNotificationId, userId: testUserId },
      });

      expect(prismaMock.notification.delete).toHaveBeenCalledWith({
        where: { id: testNotificationId },
      });

      expect(deleted).toBeDefined();
      expect(deleted!.id).toBe(testNotificationId);

      const found = await service.getById(testNotificationId, testUserId);
      expect(found).toBeNull();
    });

    it('should return null for non-existent notification', async () => {
      // Arrange
      prismaMock.notification.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.delete('non-existent-id', testUserId);

      // Assert
      expect(prismaMock.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 'non-existent-id', userId: testUserId },
      });

      expect(prismaMock.notification.delete).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when user does not own notification', async () => {
      // Arrange
      const otherUserId = 'other-user-id-999';
      prismaMock.notification.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.delete(testNotificationId, otherUserId);

      // Assert
      expect(prismaMock.notification.findFirst).toHaveBeenCalledWith({
        where: { id: testNotificationId, userId: otherUserId },
      });

      expect(prismaMock.notification.delete).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('deleteAllRead', () => {
    it('should delete all read notifications', async () => {
      // Arrange
      prismaMock.notification.deleteMany.mockResolvedValueOnce({ count: 2 });
      
      const remainingNotifications = [
        {
          id: 'notif-unread',
          userId: testUserId,
          title: 'Unread',
          message: 'Message',
          type: 'order_update',
          linkUrl: null,
          linkText: null,
          isRead: false,
          readAt: null,
          createdAt: new Date('2025-01-01T00:00:00Z'),
          updatedAt: new Date('2025-01-01T00:00:00Z'),
        },
      ];
      
      prismaMock.notification.findMany.mockResolvedValue(remainingNotifications);

      // Act
      const count = await service.deleteAllRead(testUserId);

      // Assert
      expect(prismaMock.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: testUserId,
          isRead: true,
        },
      });

      expect(count).toBe(2);

      const remaining = await service.list({ userId: testUserId });
      expect(remaining).toHaveLength(1);
      expect(remaining[0].isRead).toBe(false);
    });

    it('should return 0 if no read notifications', async () => {
      // Arrange
      prismaMock.notification.deleteMany.mockResolvedValue({ count: 0 });

      // Act
      const count = await service.deleteAllRead(testUserId);

      // Assert
      expect(prismaMock.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: testUserId,
          isRead: true,
        },
      });

      expect(count).toBe(0);
    });
  });

  describe('getById', () => {
    it('should get notification by ID', async () => {
      // Arrange
      const mockNotification = {
        id: testNotificationId,
        userId: testUserId,
        title: 'Test Notification',
        message: 'Test Message',
        type: 'order_update',
        linkUrl: null,
        linkText: null,
        isRead: false,
        readAt: null,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:00:00Z'),
      };

      prismaMock.notification.findFirst.mockResolvedValue(mockNotification);

      // Act
      const notification = await service.getById(testNotificationId, testUserId);

      // Assert
      expect(prismaMock.notification.findFirst).toHaveBeenCalledWith({
        where: { id: testNotificationId, userId: testUserId },
      });

      expect(notification).toBeDefined();
      expect(notification!.id).toBe(testNotificationId);
      expect(notification!.title).toBe('Test Notification');
    });

    it('should return null for non-existent notification', async () => {
      // Arrange
      prismaMock.notification.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.getById('non-existent-id', testUserId);

      // Assert
      expect(prismaMock.notification.findFirst).toHaveBeenCalledWith({
        where: { id: 'non-existent-id', userId: testUserId },
      });

      expect(result).toBeNull();
    });

    it('should return null when user does not own notification', async () => {
      // Arrange
      const otherUserId = 'other-user-id-999';
      prismaMock.notification.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.getById(testNotificationId, otherUserId);

      // Assert
      expect(prismaMock.notification.findFirst).toHaveBeenCalledWith({
        where: { id: testNotificationId, userId: otherUserId },
      });

      expect(result).toBeNull();
    });
  });
});
