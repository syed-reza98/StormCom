/**
 * Unit Tests: Idempotency Infrastructure
 * 
 * Tests for request idempotency handling to prevent duplicate operations.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getCachedIdempotentResult,
  cacheIdempotentResult,
  requireIdempotencyKey,
  getIdempotencyKey,
  clearDevCache,
  getDevCacheSize,
} from '@/lib/idempotency';
import { NextRequest } from 'next/server';

describe('Idempotency Infrastructure', () => {
  beforeEach(() => {
    clearDevCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearDevCache();
  });

  describe('getCachedIdempotentResult', () => {
    it('should return null for non-existent key', async () => {
      const result = await getCachedIdempotentResult('non-existent-key');
      expect(result).toBeNull();
    });

    it('should return cached value for existing key', async () => {
      const testData = { id: '123', status: 'completed' };
      await cacheIdempotentResult('test-key-1', testData);

      const result = await getCachedIdempotentResult<typeof testData>('test-key-1');
      expect(result).toEqual(testData);
    });

    it('should return null for expired key', async () => {
      const testData = { id: '456', status: 'pending' };
      
      // Cache with 1 second TTL
      await cacheIdempotentResult('test-key-2', testData, { ttlSeconds: 1 });

      // Wait 1.5 seconds for expiration
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const result = await getCachedIdempotentResult('test-key-2');
      expect(result).toBeNull();
    });

    it('should handle complex objects', async () => {
      const complexData = {
        order: {
          id: 'order-123',
          items: [
            { id: 'item-1', quantity: 2, price: 1999 },
            { id: 'item-2', quantity: 1, price: 4999 },
          ],
          total: 8997,
          customer: {
            id: 'cust-456',
            email: 'test@example.com',
            name: 'Test User',
          },
        },
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'web',
        },
      };

      await cacheIdempotentResult('complex-key', complexData);

      const result = await getCachedIdempotentResult<typeof complexData>('complex-key');
      expect(result).toEqual(complexData);
    });

    it('should handle null values', async () => {
      await cacheIdempotentResult('null-key', null);

      const result = await getCachedIdempotentResult('null-key');
      // Null is a valid cached value (distinguishes from cache miss)
      expect(result).toBeNull();
    });

    it('should handle undefined gracefully', async () => {
      await cacheIdempotentResult('undefined-key', undefined as any);

      const result = await getCachedIdempotentResult('undefined-key');
      expect(result).toBeUndefined();
    });
  });

  describe('cacheIdempotentResult', () => {
    it('should cache result with default TTL', async () => {
      const testData = { status: 'success' };
      await cacheIdempotentResult('ttl-test-1', testData);

      const result = await getCachedIdempotentResult('ttl-test-1');
      expect(result).toEqual(testData);
    });

    it('should cache result with custom TTL', async () => {
      const testData = { status: 'success' };
      await cacheIdempotentResult('ttl-test-2', testData, { ttlSeconds: 3600 });

      const result = await getCachedIdempotentResult('ttl-test-2');
      expect(result).toEqual(testData);
    });

    it('should overwrite existing cached value', async () => {
      const firstData = { status: 'pending' };
      const secondData = { status: 'completed' };

      await cacheIdempotentResult('overwrite-key', firstData);
      await cacheIdempotentResult('overwrite-key', secondData);

      const result = await getCachedIdempotentResult('overwrite-key');
      expect(result).toEqual(secondData);
    });

    it('should handle multiple concurrent cache operations', async () => {
      const operations = Array.from({ length: 100 }, (_, i) => ({
        key: `concurrent-key-${i}`,
        value: { id: i, data: `test-${i}` },
      }));

      await Promise.all(
        operations.map((op) => cacheIdempotentResult(op.key, op.value))
      );

      const results = await Promise.all(
        operations.map((op) => getCachedIdempotentResult(op.key))
      );

      results.forEach((result, i) => {
        expect(result).toEqual(operations[i].value);
      });
    });

    it('should increment cache size', async () => {
      expect(getDevCacheSize()).toBe(0);

      await cacheIdempotentResult('key-1', { data: 'test1' });
      expect(getDevCacheSize()).toBe(1);

      await cacheIdempotentResult('key-2', { data: 'test2' });
      expect(getDevCacheSize()).toBe(2);

      await cacheIdempotentResult('key-3', { data: 'test3' });
      expect(getDevCacheSize()).toBe(3);
    });
  });

  describe('requireIdempotencyKey', () => {
    it('should extract valid idempotency key from request', () => {
      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'idempotency-key': 'valid-key-12345678',
        },
      });

      const key = requireIdempotencyKey(request);
      expect(key).toBe('valid-key-12345678');
    });

    it('should throw error if idempotency key is missing', () => {
      const request = new NextRequest('https://example.com/api/test');

      expect(() => requireIdempotencyKey(request)).toThrow(
        'Idempotency-Key header required for PUT/PATCH requests'
      );
    });

    it('should throw error if idempotency key is too short', () => {
      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'idempotency-key': 'short',
        },
      });

      expect(() => requireIdempotencyKey(request)).toThrow(
        'Idempotency-Key must be between 8 and 255 characters'
      );
    });

    it('should throw error if idempotency key is too long', () => {
      const longKey = 'a'.repeat(256);
      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'idempotency-key': longKey,
        },
      });

      expect(() => requireIdempotencyKey(request)).toThrow(
        'Idempotency-Key must be between 8 and 255 characters'
      );
    });

    it('should accept idempotency key with exactly 8 characters', () => {
      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'idempotency-key': '12345678',
        },
      });

      const key = requireIdempotencyKey(request);
      expect(key).toBe('12345678');
    });

    it('should accept idempotency key with exactly 255 characters', () => {
      const maxKey = 'a'.repeat(255);
      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'idempotency-key': maxKey,
        },
      });

      const key = requireIdempotencyKey(request);
      expect(key).toBe(maxKey);
    });

    it('should accept UUID format idempotency keys', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'idempotency-key': uuid,
        },
      });

      const key = requireIdempotencyKey(request);
      expect(key).toBe(uuid);
    });

    it('should accept custom format idempotency keys', () => {
      const customKey = 'order-123-2025-01-29-12:00:00';
      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'idempotency-key': customKey,
        },
      });

      const key = requireIdempotencyKey(request);
      expect(key).toBe(customKey);
    });
  });

  describe('getIdempotencyKey', () => {
    it('should return key if present and valid', () => {
      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'idempotency-key': 'valid-key-12345678',
        },
      });

      const key = getIdempotencyKey(request);
      expect(key).toBe('valid-key-12345678');
    });

    it('should return null if key is missing', () => {
      const request = new NextRequest('https://example.com/api/test');

      const key = getIdempotencyKey(request);
      expect(key).toBeNull();
    });

    it('should return null if key is too short', () => {
      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'idempotency-key': 'short',
        },
      });

      const key = getIdempotencyKey(request);
      expect(key).toBeNull();
    });

    it('should return null if key is too long', () => {
      const longKey = 'a'.repeat(256);
      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'idempotency-key': longKey,
        },
      });

      const key = getIdempotencyKey(request);
      expect(key).toBeNull();
    });

    it('should return key if exactly 8 characters', () => {
      const request = new NextRequest('https://example.com/api/test', {
        headers: {
          'idempotency-key': '12345678',
        },
      });

      const key = getIdempotencyKey(request);
      expect(key).toBe('12345678');
    });
  });

  describe('clearDevCache', () => {
    it('should clear all cached entries', async () => {
      await cacheIdempotentResult('key-1', { data: 'test1' });
      await cacheIdempotentResult('key-2', { data: 'test2' });
      await cacheIdempotentResult('key-3', { data: 'test3' });

      expect(getDevCacheSize()).toBe(3);

      clearDevCache();

      expect(getDevCacheSize()).toBe(0);

      const result1 = await getCachedIdempotentResult('key-1');
      const result2 = await getCachedIdempotentResult('key-2');
      const result3 = await getCachedIdempotentResult('key-3');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
    });
  });

  describe('Cache Isolation', () => {
    it('should maintain separate entries for different keys', async () => {
      const data1 = { id: '1', value: 'first' };
      const data2 = { id: '2', value: 'second' };
      const data3 = { id: '3', value: 'third' };

      await cacheIdempotentResult('isolated-key-1', data1);
      await cacheIdempotentResult('isolated-key-2', data2);
      await cacheIdempotentResult('isolated-key-3', data3);

      const result1 = await getCachedIdempotentResult('isolated-key-1');
      const result2 = await getCachedIdempotentResult('isolated-key-2');
      const result3 = await getCachedIdempotentResult('isolated-key-3');

      expect(result1).toEqual(data1);
      expect(result2).toEqual(data2);
      expect(result3).toEqual(data3);

      // Verify no cross-contamination
      expect(result1).not.toEqual(result2);
      expect(result1).not.toEqual(result3);
      expect(result2).not.toEqual(result3);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle order status update idempotency', async () => {
      const orderUpdate = {
        id: 'order-123',
        status: 'SHIPPED',
        trackingNumber: 'TRACK-456',
        updatedAt: new Date().toISOString(),
      };

      const idempotencyKey = 'order-123-status-update-20250129';

      // First request - cache result
      await cacheIdempotentResult(idempotencyKey, orderUpdate);

      // Duplicate request - retrieve cached result
      const cachedResult = await getCachedIdempotentResult(idempotencyKey);

      expect(cachedResult).toEqual(orderUpdate);
    });

    it('should handle payment processing idempotency', async () => {
      const paymentResult = {
        id: 'payment-789',
        amount: 9999,
        currency: 'USD',
        status: 'COMPLETED',
        transactionId: 'txn-abc123',
        processedAt: new Date().toISOString(),
      };

      const idempotencyKey = 'payment-789-process-20250129-12:00:00';

      await cacheIdempotentResult(idempotencyKey, paymentResult);

      // Simulate retry after network timeout
      const retryResult = await getCachedIdempotentResult(idempotencyKey);

      expect(retryResult).toEqual(paymentResult);
      // Verify no duplicate payment processing would occur
    });

    it('should handle store theme update idempotency', async () => {
      const themeUpdate = {
        id: 'theme-store-123',
        primaryColor: '#0066CC',
        secondaryColor: '#FF6600',
        mode: 'LIGHT',
        updatedAt: new Date().toISOString(),
      };

      const idempotencyKey = 'store-123-theme-update-v2';

      await cacheIdempotentResult(idempotencyKey, themeUpdate);

      // CDN retry after timeout
      const cachedTheme = await getCachedIdempotentResult(idempotencyKey);

      expect(cachedTheme).toEqual(themeUpdate);
      // Prevents CDN cache thrashing from duplicate updates
    });

    it('should handle high-frequency updates with different keys', async () => {
      const updates = Array.from({ length: 50 }, (_, i) => ({
        key: `product-update-${i}-${Date.now()}`,
        data: {
          productId: `product-${i}`,
          stock: Math.floor(Math.random() * 100),
          updatedAt: new Date().toISOString(),
        },
      }));

      // Simulate concurrent updates
      await Promise.all(
        updates.map((update) => cacheIdempotentResult(update.key, update.data))
      );

      // Verify all updates cached correctly
      const results = await Promise.all(
        updates.map((update) => getCachedIdempotentResult(update.key))
      );

      results.forEach((result, i) => {
        expect(result).toEqual(updates[i].data);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string values', async () => {
      await cacheIdempotentResult('empty-string-key', '');

      const result = await getCachedIdempotentResult('empty-string-key');
      expect(result).toBe('');
    });

    it('should handle number values', async () => {
      await cacheIdempotentResult('number-key', 42);

      const result = await getCachedIdempotentResult('number-key');
      expect(result).toBe(42);
    });

    it('should handle boolean values', async () => {
      await cacheIdempotentResult('boolean-true-key', true);
      await cacheIdempotentResult('boolean-false-key', false);

      const trueResult = await getCachedIdempotentResult('boolean-true-key');
      const falseResult = await getCachedIdempotentResult('boolean-false-key');

      expect(trueResult).toBe(true);
      expect(falseResult).toBe(false);
    });

    it('should handle array values', async () => {
      const arrayData = [1, 2, 3, 'four', { five: 5 }];
      await cacheIdempotentResult('array-key', arrayData);

      const result = await getCachedIdempotentResult('array-key');
      expect(result).toEqual(arrayData);
    });

    it('should handle Date objects (serialized)', async () => {
      const dateData = { timestamp: new Date().toISOString() };
      await cacheIdempotentResult('date-key', dateData);

      const result = await getCachedIdempotentResult('date-key');
      expect(result).toEqual(dateData);
    });
  });
});
