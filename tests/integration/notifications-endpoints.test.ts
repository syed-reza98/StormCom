// tests/integration/notifications-endpoints.test.ts
// Integration tests for Notifications API endpoints

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { GET as getNotifications } from '@/app/api/notifications/route';
import { PUT as markAsRead } from '@/app/api/notifications/[id]/read/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { UserRole } from '@prisma/client';

// Mock NextAuth.js
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

describe('Notifications API Endpoints', () => {
  let testUserId: string;
  let testNotificationId: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.notification.deleteMany({ where: { user: { email: 'notif-api-test@example.com' } } });
    await prisma.user.deleteMany({ where: { email: 'notif-api-test@example.com' } });

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'notif-api-test@example.com',
        name: 'Notification API Test User',
        password: 'hashed_password',
        role: UserRole.CUSTOMER,
      },
    });
    testUserId = user.id;

    // Create test notifications
    await prisma.notification.createMany({
      data: [
        {
          userId: testUserId,
          title: 'Notification 1',
          message: 'First notification',
          type: 'order_update',
          isRead: false,
        },
        {
          userId: testUserId,
          title: 'Notification 2',
          message: 'Second notification',
          type: 'low_stock',
          isRead: false,
        },
        {
          userId: testUserId,
          title: 'Notification 3',
          message: 'Third notification (read)',
          type: 'system',
          isRead: true,
          readAt: new Date(),
        },
      ],
    });

    // Get one notification ID for testing
    const notif = await prisma.notification.findFirst({
      where: { userId: testUserId, isRead: false },
    });
    testNotificationId = notif!.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await prisma.notification.deleteMany({ where: { userId: testUserId } });
      await prisma.user.delete({ where: { id: testUserId } });
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/notifications', () => {
    it('should retrieve all notifications successfully', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue({
        userId: testUserId,
        email: 'notif-api-test@example.com',
        role: 'CUSTOMER',
        storeId: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,        lastAccessedAt: Date.now(),      });

      const request = new Request('http://localhost:3000/api/notifications', {
        method: 'GET',
      });

      // Act
      const response = await getNotifications(request as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.notifications).toHaveLength(3);
      expect(data.data.unreadCount).toBe(2);
      expect(data.data.notifications[0].createdAt).toBeDefined();
    });

    it('should filter unread notifications', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue({
        userId: testUserId,
        email: 'notif-api-test@example.com',
        role: 'CUSTOMER',
        storeId: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,        lastAccessedAt: Date.now(),      });

      const request = new Request('http://localhost:3000/api/notifications?isRead=false', {
        method: 'GET',
      });

      // Act
      const response = await getNotifications(request as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.notifications).toHaveLength(2);
      expect(data.data.notifications.every((n: any) => !n.isRead)).toBe(true);
    });

    it('should filter read notifications', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue({
        userId: testUserId,
        email: 'notif-api-test@example.com',
        role: 'CUSTOMER',
        storeId: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,        lastAccessedAt: Date.now(),      });

      const request = new Request('http://localhost:3000/api/notifications?isRead=true', {
        method: 'GET',
      });

      // Act
      const response = await getNotifications(request as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.notifications).toHaveLength(1);
      expect(data.data.notifications.every((n: any) => n.isRead)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue({
        userId: testUserId,
        email: 'notif-api-test@example.com',
        role: 'CUSTOMER',
        storeId: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,        lastAccessedAt: Date.now(),      });

      const request = new Request('http://localhost:3000/api/notifications?limit=2', {
        method: 'GET',
      });

      // Act
      const response = await getNotifications(request as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.notifications).toHaveLength(2);
    });

    it('should reject invalid limit parameter', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue({
        userId: testUserId,
        email: 'notif-api-test@example.com',
        role: 'CUSTOMER',
        storeId: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,        lastAccessedAt: Date.now(),      });

      const request = new Request('http://localhost:3000/api/notifications?limit=999', {
        method: 'GET',
      });

      // Act
      const response = await getNotifications(request as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('Invalid limit parameter');
    });

    it('should require authentication', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/notifications', {
        method: 'GET',
      });

      // Act
      const response = await getNotifications(request as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('PUT /api/notifications/[id]/read', () => {
    it('should mark notification as read successfully', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue({
        userId: testUserId,
        email: 'notif-api-test@example.com',
        role: 'CUSTOMER',
        storeId: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,        lastAccessedAt: Date.now(),      });

      const request = new Request(`http://localhost:3000/api/notifications/${testNotificationId}/read`, {
        method: 'PUT',
      });

      // Act
      const response = await markAsRead(request as any, { params: Promise.resolve({ id: testNotificationId }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.isRead).toBe(true);
      expect(data.data.readAt).toBeDefined();
      expect(data.message).toContain('marked as read');
    });

    it('should return 404 for non-existent notification', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue({
        userId: testUserId,
        email: 'notif-api-test@example.com',
        role: 'CUSTOMER',
        storeId: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,        lastAccessedAt: Date.now(),      });

      const request = new Request('http://localhost:3000/api/notifications/non-existent-id/read', {
        method: 'PUT',
      });

      // Act
      const response = await markAsRead(request as any, { params: Promise.resolve({ id: 'non-existent-id' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should require authentication', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new Request(`http://localhost:3000/api/notifications/${testNotificationId}/read`, {
        method: 'PUT',
      });

      // Act
      const response = await markAsRead(request as any, { params: Promise.resolve({ id: testNotificationId }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should prevent marking notification from another user', async () => {
      // Arrange
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-notif-user@example.com',
          name: 'Other User',
          password: 'hashed',
          role: UserRole.CUSTOMER,
        },
      });

      vi.mocked(getServerSession).mockResolvedValue({
        userId: otherUser.id,
        email: 'other-notif-user@example.com',
        role: 'CUSTOMER',
        storeId: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,        lastAccessedAt: Date.now(),      });

      const request = new Request(`http://localhost:3000/api/notifications/${testNotificationId}/read`, {
        method: 'PUT',
      });

      // Act
      const response = await markAsRead(request as any, { params: Promise.resolve({ id: testNotificationId }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);

      // Cleanup
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });
});
