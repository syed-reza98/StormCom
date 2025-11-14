/**
 * Unit tests for Newsletter Server Actions
 * 
 * Tests newsletter actions with mocked dependencies:
 * - Rate limiting enforcement
 * - Zod validation
 * - Error handling
 * - Success responses
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Newsletter } from '@prisma/client';

// Mock dependencies before imports
vi.mock('@/services/newsletter-service', () => ({
  NewsletterService: {
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  },
}));

vi.mock('@/lib/simple-rate-limit', () => ({
  checkSimpleRateLimit: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

import { subscribeToNewsletter, unsubscribeFromNewsletter } from '@/app/shop/newsletter/actions';
import { NewsletterService } from '@/services/newsletter-service';
import { checkSimpleRateLimit } from '@/lib/simple-rate-limit';
import { headers } from 'next/headers';

describe('Newsletter Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock headers by default
    vi.mocked(headers).mockResolvedValue(new Headers({
      'x-forwarded-for': '192.168.1.1',
      'user-agent': 'Mozilla/5.0',
    }));
  });

  describe('subscribeToNewsletter', () => {
    it('should subscribe new email successfully', async () => {
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

      // Mock rate limit check (not exceeded)
      vi.mocked(checkSimpleRateLimit).mockResolvedValue(null);

      // Mock successful subscription
      vi.mocked(NewsletterService.subscribe).mockResolvedValue({
        subscription: mockNewsletter,
        consentRecord: null,
        alreadySubscribed: false,
      });

      const formData = new FormData();
      formData.append('email', 'user@example.com');
      formData.append('storeId', 'store-123');

      const result = await subscribeToNewsletter(formData);

      expect(result).toEqual({
        success: true,
        message: 'Successfully subscribed to newsletter',
      });

      expect(NewsletterService.subscribe).toHaveBeenCalledWith({
        email: 'user@example.com',
        storeId: 'store-123',
        source: 'newsletter-form',
        metadata: expect.objectContaining({
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
      });
    });

    it('should handle already subscribed email', async () => {
      const mockNewsletter: Newsletter = {
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

      vi.mocked(checkSimpleRateLimit).mockResolvedValue(null);

      vi.mocked(NewsletterService.subscribe).mockResolvedValue({
        subscription: mockNewsletter,
        consentRecord: null,
        alreadySubscribed: true,
      });

      const formData = new FormData();
      formData.append('email', 'user@example.com');
      formData.append('storeId', 'store-123');

      const result = await subscribeToNewsletter(formData);

      expect(result).toEqual({
        success: true,
        message: 'You are already subscribed to our newsletter',
        alreadySubscribed: true,
      });
    });

    it('should enforce rate limiting', async () => {
      const mockRateLimitResponse = new Response(
        JSON.stringify({ error: 'Too many requests' }),
        { status: 429 }
      );

      vi.mocked(checkSimpleRateLimit).mockResolvedValue(mockRateLimitResponse);

      const formData = new FormData();
      formData.append('email', 'user@example.com');
      formData.append('storeId', 'store-123');

      const result = await subscribeToNewsletter(formData);

      expect(result).toEqual({
        success: false,
        error: 'Too many requests. Please try again later.',
      });

      expect(NewsletterService.subscribe).not.toHaveBeenCalled();
    });

    it('should validate email format with Zod', async () => {
      vi.mocked(checkSimpleRateLimit).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('email', 'invalid-email'); // Invalid format
      formData.append('storeId', 'store-123');

      const result = await subscribeToNewsletter(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email');
      expect(NewsletterService.subscribe).not.toHaveBeenCalled();
    });

    it('should validate email length (min 3 chars)', async () => {
      vi.mocked(checkSimpleRateLimit).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('email', 'ab'); // Too short
      formData.append('storeId', 'store-123');

      const result = await subscribeToNewsletter(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(NewsletterService.subscribe).not.toHaveBeenCalled();
    });

    it('should validate email length (max 255 chars)', async () => {
      vi.mocked(checkSimpleRateLimit).mockResolvedValue(null);

      const longEmail = 'a'.repeat(250) + '@example.com'; // > 255 chars

      const formData = new FormData();
      formData.append('email', longEmail);
      formData.append('storeId', 'store-123');

      const result = await subscribeToNewsletter(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(NewsletterService.subscribe).not.toHaveBeenCalled();
    });

    it('should require email field', async () => {
      vi.mocked(checkSimpleRateLimit).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('storeId', 'store-123');
      // Missing email

      const result = await subscribeToNewsletter(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(NewsletterService.subscribe).not.toHaveBeenCalled();
    });

    it('should require storeId field', async () => {
      vi.mocked(checkSimpleRateLimit).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('email', 'user@example.com');
      // Missing storeId

      const result = await subscribeToNewsletter(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(NewsletterService.subscribe).not.toHaveBeenCalled();
    });

    it('should extract DNT header', async () => {
      const headersWithDNT = new Headers({
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Mozilla/5.0',
        'dnt': '1', // Do Not Track enabled
      });

      vi.mocked(headers).mockResolvedValue(headersWithDNT);
      vi.mocked(checkSimpleRateLimit).mockResolvedValue(null);

      vi.mocked(NewsletterService.subscribe).mockResolvedValue({
        subscription: {} as Newsletter,
        consentRecord: null,
        alreadySubscribed: false,
      });

      const formData = new FormData();
      formData.append('email', 'user@example.com');
      formData.append('storeId', 'store-123');

      await subscribeToNewsletter(formData);

      expect(NewsletterService.subscribe).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            dnt: true,
          }),
        })
      );
    });

    it('should handle service errors gracefully', async () => {
      vi.mocked(checkSimpleRateLimit).mockResolvedValue(null);

      vi.mocked(NewsletterService.subscribe).mockRejectedValue(
        new Error('Database connection failed')
      );

      const formData = new FormData();
      formData.append('email', 'user@example.com');
      formData.append('storeId', 'store-123');

      const result = await subscribeToNewsletter(formData);

      expect(result).toEqual({
        success: false,
        error: 'Failed to subscribe to newsletter. Please try again.',
      });
    });
  });

  describe('unsubscribeFromNewsletter', () => {
    it('should unsubscribe successfully', async () => {
      const mockUnsubscribed: Newsletter = {
        id: 'news-123',
        storeId: 'store-123',
        email: 'user@example.com',
        isSubscribed: false,
        subscribedAt: new Date(),
        unsubscribedAt: new Date(),
        source: 'newsletter-form',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(checkSimpleRateLimit).mockResolvedValue(null);

      vi.mocked(NewsletterService.unsubscribe).mockResolvedValue(mockUnsubscribed);

      const formData = new FormData();
      formData.append('email', 'user@example.com');
      formData.append('storeId', 'store-123');

      const result = await unsubscribeFromNewsletter(formData);

      expect(result).toEqual({
        success: true,
        message: 'Successfully unsubscribed from newsletter',
      });

      expect(NewsletterService.unsubscribe).toHaveBeenCalledWith({
        email: 'user@example.com',
        storeId: 'store-123',
        metadata: expect.objectContaining({
          ipAddress: '192.168.1.1',
        }),
      });
    });

    it('should handle non-existent subscription', async () => {
      vi.mocked(checkSimpleRateLimit).mockResolvedValue(null);

      vi.mocked(NewsletterService.unsubscribe).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('email', 'nonexistent@example.com');
      formData.append('storeId', 'store-123');

      const result = await unsubscribeFromNewsletter(formData);

      expect(result).toEqual({
        success: true,
        message: 'Email not found in our mailing list',
      });
    });

    it('should enforce rate limiting', async () => {
      const mockRateLimitResponse = new Response(
        JSON.stringify({ error: 'Too many requests' }),
        { status: 429 }
      );

      vi.mocked(checkSimpleRateLimit).mockResolvedValue(mockRateLimitResponse);

      const formData = new FormData();
      formData.append('email', 'user@example.com');
      formData.append('storeId', 'store-123');

      const result = await unsubscribeFromNewsletter(formData);

      expect(result).toEqual({
        success: false,
        error: 'Too many requests. Please try again later.',
      });

      expect(NewsletterService.unsubscribe).not.toHaveBeenCalled();
    });

    it('should require email field', async () => {
      vi.mocked(checkSimpleRateLimit).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('storeId', 'store-123');
      // Missing email

      const result = await unsubscribeFromNewsletter(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email is required');
      expect(NewsletterService.unsubscribe).not.toHaveBeenCalled();
    });

    it('should require storeId field', async () => {
      vi.mocked(checkSimpleRateLimit).mockResolvedValue(null);

      const formData = new FormData();
      formData.append('email', 'user@example.com');
      // Missing storeId

      const result = await unsubscribeFromNewsletter(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Store ID is required');
      expect(NewsletterService.unsubscribe).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      vi.mocked(checkSimpleRateLimit).mockResolvedValue(null);

      vi.mocked(NewsletterService.unsubscribe).mockRejectedValue(
        new Error('Database connection failed')
      );

      const formData = new FormData();
      formData.append('email', 'user@example.com');
      formData.append('storeId', 'store-123');

      const result = await unsubscribeFromNewsletter(formData);

      expect(result).toEqual({
        success: false,
        error: 'Failed to unsubscribe. Please try again.',
      });
    });
  });
});
