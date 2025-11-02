// src/services/notification-service.ts
// NotificationService for managing in-app notifications

import { prisma } from '../lib/prisma';
import { Notification } from '@prisma/client';

/**
 * Notification creation data
 */
export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type: string; // 'order_update', 'low_stock', 'system', etc.
  linkUrl?: string;
  linkText?: string;
}

/**
 * Notification list options
 */
export interface ListNotificationsOptions {
  userId: string;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * NotificationService handles CRUD operations for in-app notifications
 * 
 * **Features**:
 * - Create notifications for users
 * - List notifications with filtering (read/unread)
 * - Mark notifications as read
 * - Delete notifications
 * - Get unread count
 * 
 * **Use Cases**:
 * - US10: In-app notifications for orders, inventory, system events
 * - Real-time user engagement
 * - Notification center UI
 */
export class NotificationService {
  /**
   * Create a new notification for a user
   * 
   * @param data - Notification creation data
   * @returns Created notification
   * 
   * @example
   * ```typescript
   * const notification = await notificationService.create({
   *   userId: 'user-123',
   *   title: 'New Order Received',
   *   message: 'You have a new order #12345',
   *   type: 'order_update',
   *   linkUrl: '/dashboard/orders/12345',
   *   linkText: 'View Order'
   * });
   * ```
   */
  async create(data: CreateNotificationData): Promise<Notification> {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        linkUrl: data.linkUrl,
        linkText: data.linkText,
        isRead: false,
      },
    });

    return notification;
  }

  /**
   * List notifications for a user with optional filtering
   * 
   * @param options - List options (userId, isRead filter, pagination)
   * @returns Array of notifications
   * 
   * @example
   * ```typescript
   * // Get all unread notifications
   * const unread = await notificationService.list({
   *   userId: 'user-123',
   *   isRead: false,
   *   limit: 10
   * });
   * 
   * // Get all notifications (read + unread)
   * const all = await notificationService.list({
   *   userId: 'user-123',
   *   limit: 20,
   *   offset: 0
   * });
   * ```
   */
  async list(options: ListNotificationsOptions): Promise<Notification[]> {
    const { userId, isRead, limit = 50, offset = 0 } = options;

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(isRead !== undefined && { isRead }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return notifications;
  }

  /**
   * Get count of unread notifications for a user
   * 
   * @param userId - User ID
   * @returns Number of unread notifications
   * 
   * @example
   * ```typescript
   * const count = await notificationService.getUnreadCount('user-123');
   * console.log(`You have ${count} unread notifications`);
   * ```
   */
  async getUnreadCount(userId: string): Promise<number> {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return count;
  }

  /**
   * Mark a notification as read
   * 
   * @param id - Notification ID
   * @param userId - User ID (for authorization)
   * @returns Updated notification or null if not found/unauthorized
   * 
   * @example
   * ```typescript
   * const notification = await notificationService.markAsRead(
   *   'notif-123',
   *   'user-123'
   * );
   * ```
   */
  async markAsRead(id: string, userId: string): Promise<Notification | null> {
    // Verify notification belongs to user
    const existing = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return null;
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   * 
   * @param userId - User ID
   * @returns Count of updated notifications
   * 
   * @example
   * ```typescript
   * const count = await notificationService.markAllAsRead('user-123');
   * console.log(`Marked ${count} notifications as read`);
   * ```
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Delete a notification
   * 
   * @param id - Notification ID
   * @param userId - User ID (for authorization)
   * @returns Deleted notification or null if not found/unauthorized
   * 
   * @example
   * ```typescript
   * const deleted = await notificationService.delete('notif-123', 'user-123');
   * ```
   */
  async delete(id: string, userId: string): Promise<Notification | null> {
    // Verify notification belongs to user
    const existing = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return null;
    }

    const notification = await prisma.notification.delete({
      where: { id },
    });

    return notification;
  }

  /**
   * Delete all read notifications for a user (cleanup)
   * 
   * @param userId - User ID
   * @returns Count of deleted notifications
   * 
   * @example
   * ```typescript
   * const count = await notificationService.deleteAllRead('user-123');
   * console.log(`Deleted ${count} read notifications`);
   * ```
   */
  async deleteAllRead(userId: string): Promise<number> {
    const result = await prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true,
      },
    });

    return result.count;
  }

  /**
   * Get a single notification by ID
   * 
   * @param id - Notification ID
   * @param userId - User ID (for authorization)
   * @returns Notification or null if not found/unauthorized
   * 
   * @example
   * ```typescript
   * const notification = await notificationService.getById('notif-123', 'user-123');
   * ```
   */
  async getById(id: string, userId: string): Promise<Notification | null> {
    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    });

    return notification;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
