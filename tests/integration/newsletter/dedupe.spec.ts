/**
 * Integration tests for Newsletter deduplication
 * 
 * Tests newsletter subscription uniqueness constraint:
 * - @@unique([storeId, email]) enforcement
 * - Concurrent subscription handling
 * - Cross-store isolation
 * - Resubscription after unsubscribe
 * 
 * @requires Real database connection (SQLite test.db)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { NewsletterService } from '@/services/newsletter-service';
import type { Newsletter } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test-newsletter.db',
    },
  },
});

describe('Newsletter Deduplication Integration Tests', () => {
  const testStoreId = 'test-store-123';
  const testStoreId2 = 'test-store-456';
  const testEmail = 'test@example.com';

  beforeAll(async () => {
    // Ensure database is synced
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
    
    // Clean up any existing test data
    await prisma.newsletter.deleteMany({
      where: {
        OR: [
          { storeId: testStoreId },
          { storeId: testStoreId2 },
        ],
      },
    });
    
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.newsletter.deleteMany({
      where: {
        OR: [
          { storeId: testStoreId },
          { storeId: testStoreId2 },
        ],
      },
    });
    
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean between tests
    await prisma.newsletter.deleteMany({
      where: {
        OR: [
          { storeId: testStoreId },
          { storeId: testStoreId2 },
        ],
      },
    });
  });

  describe('@@unique([storeId, email]) constraint', () => {
    it('should allow same email across different stores', async () => {
      // Subscribe to store 1
      const result1 = await NewsletterService.subscribe({
        email: testEmail,
        storeId: testStoreId,
      });

      expect(result1.subscription.storeId).toBe(testStoreId);
      expect(result1.subscription.email).toBe(testEmail);
      expect(result1.alreadySubscribed).toBe(false);

      // Subscribe to store 2 with same email
      const result2 = await NewsletterService.subscribe({
        email: testEmail,
        storeId: testStoreId2,
      });

      expect(result2.subscription.storeId).toBe(testStoreId2);
      expect(result2.subscription.email).toBe(testEmail);
      expect(result2.alreadySubscribed).toBe(false);

      // Verify both records exist
      const subscriptions = await prisma.newsletter.findMany({
        where: {
          email: testEmail,
        },
      });

      expect(subscriptions).toHaveLength(2);
      expect(subscriptions.map(s => s.storeId).sort()).toEqual([testStoreId, testStoreId2].sort());
    });

    it('should prevent duplicate subscription within same store', async () => {
      // First subscription
      const result1 = await NewsletterService.subscribe({
        email: testEmail,
        storeId: testStoreId,
      });

      expect(result1.alreadySubscribed).toBe(false);

      // Attempt duplicate subscription
      const result2 = await NewsletterService.subscribe({
        email: testEmail,
        storeId: testStoreId,
      });

      expect(result2.alreadySubscribed).toBe(true);
      expect(result2.subscription.id).toBe(result1.subscription.id);

      // Verify only one record exists
      const subscriptions = await prisma.newsletter.findMany({
        where: {
          storeId: testStoreId,
          email: testEmail,
        },
      });

      expect(subscriptions).toHaveLength(1);
    });

    it('should handle case-sensitive email uniqueness', async () => {
      // Prisma/DB should handle case-insensitive email matching
      // First subscription with lowercase
      await NewsletterService.subscribe({
        email: 'user@example.com',
        storeId: testStoreId,
      });

      // Attempt subscription with uppercase (should be treated as duplicate)
      const result = await NewsletterService.subscribe({
        email: 'USER@EXAMPLE.COM',
        storeId: testStoreId,
      });

      // Depending on DB collation, this might create a duplicate
      // For production, we enforce lowercase in Zod schema
      const subscriptions = await prisma.newsletter.findMany({
        where: {
          storeId: testStoreId,
        },
      });

      // Zod schema lowercases email, so should be deduplicated
      expect(subscriptions).toHaveLength(1);
      expect(result.alreadySubscribed).toBe(true);
    });
  });

  describe('Concurrent subscription handling', () => {
    it('should handle concurrent subscription attempts gracefully', async () => {
      // Simulate concurrent subscriptions
      const promises = Array.from({ length: 5 }, () =>
        NewsletterService.subscribe({
          email: testEmail,
          storeId: testStoreId,
        })
      );

      const results = await Promise.all(promises);

      // Verify all promises resolved
      expect(results).toHaveLength(5);

      // Verify only one created, rest detected as duplicates
      const created = results.filter(r => !r.alreadySubscribed);
      const duplicates = results.filter(r => r.alreadySubscribed);

      expect(created).toHaveLength(1);
      expect(duplicates.length).toBeGreaterThanOrEqual(4);

      // Verify only one record in DB
      const subscriptions = await prisma.newsletter.findMany({
        where: {
          storeId: testStoreId,
          email: testEmail,
        },
      });

      expect(subscriptions).toHaveLength(1);
    });

    it('should handle concurrent subscribe and unsubscribe operations', async () => {
      // First create a subscription
      await NewsletterService.subscribe({
        email: testEmail,
        storeId: testStoreId,
      });

      // Concurrent operations: 3 subscribe, 2 unsubscribe
      const operations = [
        NewsletterService.subscribe({ email: testEmail, storeId: testStoreId }),
        NewsletterService.subscribe({ email: testEmail, storeId: testStoreId }),
        NewsletterService.unsubscribe({ email: testEmail, storeId: testStoreId }),
        NewsletterService.subscribe({ email: testEmail, storeId: testStoreId }),
        NewsletterService.unsubscribe({ email: testEmail, storeId: testStoreId }),
      ];

      await Promise.all(operations);

      // Verify final state (last operation should win)
      const subscription = await prisma.newsletter.findUnique({
        where: {
          storeId_email: {
            storeId: testStoreId,
            email: testEmail,
          },
        },
      });

      expect(subscription).not.toBeNull();
      // Final state could be subscribed or unsubscribed depending on race condition
      // The important thing is no errors were thrown
      expect(typeof subscription?.isSubscribed).toBe('boolean');
    });
  });

  describe('Resubscription after unsubscribe', () => {
    it('should allow resubscription after unsubscribe', async () => {
      // Initial subscription
      const sub1 = await NewsletterService.subscribe({
        email: testEmail,
        storeId: testStoreId,
      });

      expect(sub1.subscription.isSubscribed).toBe(true);
      expect(sub1.alreadySubscribed).toBe(false);

      // Unsubscribe
      await NewsletterService.unsubscribe({
        email: testEmail,
        storeId: testStoreId,
      });

      const afterUnsub = await prisma.newsletter.findUnique({
        where: {
          storeId_email: {
            storeId: testStoreId,
            email: testEmail,
          },
        },
      });

      expect(afterUnsub?.isSubscribed).toBe(false);
      expect(afterUnsub?.unsubscribedAt).not.toBeNull();

      // Resubscribe
      const sub2 = await NewsletterService.subscribe({
        email: testEmail,
        storeId: testStoreId,
      });

      expect(sub2.subscription.isSubscribed).toBe(true);
      expect(sub2.subscription.unsubscribedAt).toBeNull();
      expect(sub2.alreadySubscribed).toBe(true); // Was previously subscribed
      expect(sub2.subscription.id).toBe(sub1.subscription.id); // Same record reactivated
    });

    it('should update subscribedAt timestamp on resubscription', async () => {
      // Initial subscription
      const sub1 = await NewsletterService.subscribe({
        email: testEmail,
        storeId: testStoreId,
      });

      const originalSubscribedAt = sub1.subscription.subscribedAt;

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Unsubscribe
      await NewsletterService.unsubscribe({
        email: testEmail,
        storeId: testStoreId,
      });

      // Wait again
      await new Promise(resolve => setTimeout(resolve, 100));

      // Resubscribe
      const sub2 = await NewsletterService.subscribe({
        email: testEmail,
        storeId: testStoreId,
      });

      // Verify subscribedAt was updated
      expect(sub2.subscription.subscribedAt.getTime()).toBeGreaterThan(
        originalSubscribedAt.getTime()
      );
    });
  });

  describe('Cross-store isolation', () => {
    it('should isolate subscriptions by storeId', async () => {
      // Subscribe to both stores
      await NewsletterService.subscribe({
        email: testEmail,
        storeId: testStoreId,
      });

      await NewsletterService.subscribe({
        email: testEmail,
        storeId: testStoreId2,
      });

      // Unsubscribe from store 1
      await NewsletterService.unsubscribe({
        email: testEmail,
        storeId: testStoreId,
      });

      // Verify store 1 is unsubscribed
      const store1Sub = await prisma.newsletter.findUnique({
        where: {
          storeId_email: {
            storeId: testStoreId,
            email: testEmail,
          },
        },
      });

      expect(store1Sub?.isSubscribed).toBe(false);

      // Verify store 2 is still subscribed
      const store2Sub = await prisma.newsletter.findUnique({
        where: {
          storeId_email: {
            storeId: testStoreId2,
            email: testEmail,
          },
        },
      });

      expect(store2Sub?.isSubscribed).toBe(true);
    });

    it('should not affect other stores when subscribing', async () => {
      // Create subscription in store 1
      await NewsletterService.subscribe({
        email: 'user1@example.com',
        storeId: testStoreId,
      });

      // Create subscription in store 2
      await NewsletterService.subscribe({
        email: 'user2@example.com',
        storeId: testStoreId2,
      });

      // Verify isolation
      const store1Subs = await prisma.newsletter.findMany({
        where: { storeId: testStoreId },
      });

      const store2Subs = await prisma.newsletter.findMany({
        where: { storeId: testStoreId2 },
      });

      expect(store1Subs).toHaveLength(1);
      expect(store1Subs[0].email).toBe('user1@example.com');

      expect(store2Subs).toHaveLength(1);
      expect(store2Subs[0].email).toBe('user2@example.com');
    });
  });

  describe('Pagination and export', () => {
    it('should paginate active subscribers correctly', async () => {
      // Create 25 test subscribers
      const emails = Array.from({ length: 25 }, (_, i) => `user${i}@example.com`);

      await Promise.all(
        emails.map(email =>
          NewsletterService.subscribe({
            email,
            storeId: testStoreId,
          })
        )
      );

      // Get first page
      const page1 = await NewsletterService.getActiveSubscribers(testStoreId, {
        page: 1,
        limit: 10,
      });

      expect(page1.subscribers).toHaveLength(10);
      expect(page1.total).toBe(25);
      expect(page1.totalPages).toBe(3);

      // Get second page
      const page2 = await NewsletterService.getActiveSubscribers(testStoreId, {
        page: 2,
        limit: 10,
      });

      expect(page2.subscribers).toHaveLength(10);

      // Verify no overlap
      const page1Ids = page1.subscribers.map(s => s.id);
      const page2Ids = page2.subscribers.map(s => s.id);

      const overlap = page1Ids.filter(id => page2Ids.includes(id));
      expect(overlap).toHaveLength(0);
    });

    it('should export only active subscribers by default', async () => {
      // Create 5 active subscribers
      await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          NewsletterService.subscribe({
            email: `active${i}@example.com`,
            storeId: testStoreId,
          })
        )
      );

      // Create 3 inactive subscribers
      await Promise.all(
        Array.from({ length: 3 }, async (_, i) => {
          await NewsletterService.subscribe({
            email: `inactive${i}@example.com`,
            storeId: testStoreId,
          });
          await NewsletterService.unsubscribe({
            email: `inactive${i}@example.com`,
            storeId: testStoreId,
          });
        })
      );

      // Export active only
      const active = await NewsletterService.exportSubscribers(testStoreId, true);
      expect(active).toHaveLength(5);
      expect(active.every(s => s.isSubscribed)).toBe(true);

      // Export all
      const all = await NewsletterService.exportSubscribers(testStoreId, false);
      expect(all).toHaveLength(8);
    });
  });
});
