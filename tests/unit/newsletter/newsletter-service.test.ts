/**
 * Unit tests for NewsletterService
 * 
 * Tests newsletter subscription logic with mocked Prisma client.
 * Verifies:
 * - Subscription creation
 * - Deduplication logic
 * - Unsubscribe flow
 * - Audit logging integration
 * - DNT header handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NewsletterService } from '@/services/newsletter-service';
import type { Newsletter, ConsentRecord } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    newsletter: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      newsletter: {
        upsert: vi.fn(),
        update: vi.fn(),
      },
    })),
  },
}));

// Mock AuditLogService
vi.mock('@/services/audit-log-service', () => ({
  AuditLogService: {
    create: vi.fn(),
  },
}));

import { prisma } from '@/lib/db';
import { AuditLogService } from '@/services/audit-log-service';

describe('NewsletterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('subscribe', () => {
    it('should create new subscription for first-time subscriber', async () => {
      const mockNewsletter: Newsletter = {
        id: 'news-123',
        storeId: 'store-123',
        email: 'user@example.com',
        isSubscribed: true,
        subscribedAt: new Date(),
        unsubscribedAt: null,
        source: 'newsletter-form',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock no existing subscription
      vi.mocked(prisma.newsletter.findUnique).mockResolvedValue(null);

      // Mock transaction returning new subscription
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          newsletter: {
            upsert: vi.fn().mockResolvedValue(mockNewsletter),
          },
        };
        return callback(tx);
      });

      const result = await NewsletterService.subscribe({
        email: 'user@example.com',
        storeId: 'store-123',
        source: 'newsletter-form',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          dnt: false,
        },
      });

      expect(result.subscription).toEqual(mockNewsletter);
      expect(result.alreadySubscribed).toBe(false);
      expect(AuditLogService.create).toHaveBeenCalledWith(
        'CREATE',
        'Newsletter',
        mockNewsletter.id,
        expect.objectContaining({
          storeId: 'store-123',
          metadata: {
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
          },
        })
      );
    });

    it('should return early if already subscribed', async () => {
      const mockExisting: Newsletter = {
        id: 'news-123',
        storeId: 'store-123',
        email: 'user@example.com',
        isSubscribed: true,
        subscribedAt: new Date(),
        unsubscribedAt: null,
        source: 'checkout-form',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.newsletter.findUnique).mockResolvedValue(mockExisting);

      const result = await NewsletterService.subscribe({
        email: 'user@example.com',
        storeId: 'store-123',
      });

      expect(result.subscription).toEqual(mockExisting);
      expect(result.alreadySubscribed).toBe(true);
      expect(result.consentRecord).toBeNull();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should reactivate previously unsubscribed email', async () => {
      const mockUnsubscribed: Newsletter = {
        id: 'news-123',
        storeId: 'store-123',
        email: 'user@example.com',
        isSubscribed: false,
        subscribedAt: new Date('2025-01-01'),
        unsubscribedAt: new Date('2025-01-15'),
        source: 'newsletter-form',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockReactivated: Newsletter = {
        ...mockUnsubscribed,
        isSubscribed: true,
        subscribedAt: new Date(),
        unsubscribedAt: null,
      };

      vi.mocked(prisma.newsletter.findUnique).mockResolvedValue(mockUnsubscribed);

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          newsletter: {
            upsert: vi.fn().mockResolvedValue(mockReactivated),
          },
        };
        return callback(tx);
      });

      const result = await NewsletterService.subscribe({
        email: 'user@example.com',
        storeId: 'store-123',
      });

      expect(result.subscription.isSubscribed).toBe(true);
      expect(result.subscription.unsubscribedAt).toBeNull();
      expect(result.alreadySubscribed).toBe(true); // Was previously subscribed
    });

    it('should honor DNT (Do Not Track) header', async () => {
      const mockNewsletter: Newsletter = {
        id: 'news-123',
        storeId: 'store-123',
        email: 'user@example.com',
        isSubscribed: true,
        subscribedAt: new Date(),
        unsubscribedAt: null,
        source: 'newsletter-form',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.newsletter.findUnique).mockResolvedValue(null);

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          newsletter: {
            upsert: vi.fn().mockResolvedValue(mockNewsletter),
          },
        };
        return callback(tx);
      });

      const result = await NewsletterService.subscribe({
        email: 'user@example.com',
        storeId: 'store-123',
        metadata: {
          dnt: true, // Do Not Track enabled
        },
      });

      expect(result.consentRecord).toBeNull();
      expect(result.subscription).toEqual(mockNewsletter);
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe active subscriber', async () => {
      const mockSubscription: Newsletter = {
        id: 'news-123',
        storeId: 'store-123',
        email: 'user@example.com',
        isSubscribed: true,
        subscribedAt: new Date(),
        unsubscribedAt: null,
        source: 'newsletter-form',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUnsubscribed: Newsletter = {
        ...mockSubscription,
        isSubscribed: false,
        unsubscribedAt: new Date(),
      };

      vi.mocked(prisma.newsletter.findUnique).mockResolvedValue(mockSubscription);

      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          newsletter: {
            update: vi.fn().mockResolvedValue(mockUnsubscribed),
          },
        };
        return callback(tx);
      });

      const result = await NewsletterService.unsubscribe({
        email: 'user@example.com',
        storeId: 'store-123',
        metadata: {
          ipAddress: '192.168.1.1',
        },
      });

      expect(result).toEqual(mockUnsubscribed);
      expect(AuditLogService.create).toHaveBeenCalledWith(
        'UPDATE',
        'Newsletter',
        mockSubscription.id,
        expect.objectContaining({
          storeId: 'store-123',
          changes: expect.objectContaining({
            isSubscribed: { old: true, new: false },
          }),
        })
      );
    });

    it('should return null if subscription not found', async () => {
      vi.mocked(prisma.newsletter.findUnique).mockResolvedValue(null);

      const result = await NewsletterService.unsubscribe({
        email: 'nonexistent@example.com',
        storeId: 'store-123',
      });

      expect(result).toBeNull();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('getSubscription', () => {
    it('should return subscription by storeId and email', async () => {
      const mockNewsletter: Newsletter = {
        id: 'news-123',
        storeId: 'store-123',
        email: 'user@example.com',
        isSubscribed: true,
        subscribedAt: new Date(),
        unsubscribedAt: null,
        source: 'newsletter-form',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.newsletter.findUnique).mockResolvedValue(mockNewsletter);

      const result = await NewsletterService.getSubscription(
        'user@example.com',
        'store-123'
      );

      expect(result).toEqual(mockNewsletter);
      expect(prisma.newsletter.findUnique).toHaveBeenCalledWith({
        where: {
          storeId_email: {
            storeId: 'store-123',
            email: 'user@example.com',
          },
        },
      });
    });
  });

  describe('getActiveSubscribers', () => {
    it('should return paginated list of active subscribers', async () => {
      const mockSubscribers: Newsletter[] = [
        {
          id: 'news-1',
          storeId: 'store-123',
          email: 'user1@example.com',
          isSubscribed: true,
          subscribedAt: new Date(),
          unsubscribedAt: null,
          source: 'newsletter-form',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'news-2',
          storeId: 'store-123',
          email: 'user2@example.com',
          isSubscribed: true,
          subscribedAt: new Date(),
          unsubscribedAt: null,
          source: 'checkout-form',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.newsletter.findMany).mockResolvedValue(mockSubscribers);
      vi.mocked(prisma.newsletter.count).mockResolvedValue(25);

      const result = await NewsletterService.getActiveSubscribers('store-123', {
        page: 1,
        limit: 10,
      });

      expect(result.subscribers).toEqual(mockSubscribers);
      expect(result.total).toBe(25);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(3);
    });

    it('should enforce maximum limit of 1000 per page', async () => {
      vi.mocked(prisma.newsletter.findMany).mockResolvedValue([]);
      vi.mocked(prisma.newsletter.count).mockResolvedValue(0);

      await NewsletterService.getActiveSubscribers('store-123', {
        limit: 5000, // Attempt to exceed max
      });

      expect(prisma.newsletter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1000, // Should be clamped to 1000
        })
      );
    });
  });

  describe('exportSubscribers', () => {
    it('should export all active subscribers by default', async () => {
      const mockSubscribers: Newsletter[] = [
        {
          id: 'news-1',
          storeId: 'store-123',
          email: 'user1@example.com',
          isSubscribed: true,
          subscribedAt: new Date(),
          unsubscribedAt: null,
          source: 'newsletter-form',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.newsletter.findMany).mockResolvedValue(mockSubscribers);

      const result = await NewsletterService.exportSubscribers('store-123');

      expect(result).toEqual(mockSubscribers);
      expect(prisma.newsletter.findMany).toHaveBeenCalledWith({
        where: {
          storeId: 'store-123',
          isSubscribed: true,
        },
        orderBy: {
          subscribedAt: 'desc',
        },
      });
    });

    it('should export all subscribers when activeOnly is false', async () => {
      vi.mocked(prisma.newsletter.findMany).mockResolvedValue([]);

      await NewsletterService.exportSubscribers('store-123', false);

      expect(prisma.newsletter.findMany).toHaveBeenCalledWith({
        where: {
          storeId: 'store-123',
        },
        orderBy: {
          subscribedAt: 'desc',
        },
      });
    });
  });
});
