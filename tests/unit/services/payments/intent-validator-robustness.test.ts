/**
 * Payment Intent Validator Robustness Tests
 * 
 * T041: Payment pre-validation robustness
 * 
 * Tests:
 * - Idempotency key handling (prevent duplicate validations)
 * - Retry with exponential backoff for transient errors
 * - Timeout handling (30-second limit)
 * - Provider outage resilience
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validatePaymentIntent,
  clearIdempotencyCache,
  getIdempotencyCacheSize,
} from '@/services/payments/intent-validator';
import { db } from '@/lib/db';
import { PaymentError } from '@/lib/errors';

describe('Payment Intent Validator Robustness (T041)', () => {
  let storeId: string;

  beforeEach(async () => {
    // Create test store
    const store = await db.store.create({
      data: {
        name: 'Test Store',
        slug: 'test-store',
        email: 'test-store@example.com',
        currency: 'USD',
        timezone: 'America/New_York',
      },
    });
    storeId = store.id;

    // Clear idempotency cache
    clearIdempotencyCache();
  });

  afterEach(async () => {
    // Clean up test data
    await db.payment.deleteMany({ where: { order: { storeId } } });
    await db.order.deleteMany({ where: { storeId } });
    await db.store.deleteMany({ where: { id: storeId } });
    
    clearIdempotencyCache();
    vi.clearAllMocks();
  });

  describe('idempotency key handling', () => {
    it('should cache validation result with idempotency key', async () => {
      const paymentIntentId = 'pi_test_123';
      const idempotencyKey = 'checkout_session_abc';

      // First call - fresh validation
      const result1 = await validatePaymentIntent(
        paymentIntentId,
        1000,
        storeId,
        idempotencyKey
      );

      expect(result1.isValid).toBe(true);
      expect(getIdempotencyCacheSize()).toBe(1);

      // Second call - should return cached result
      const result2 = await validatePaymentIntent(
        paymentIntentId,
        1000,
        storeId,
        idempotencyKey
      );

      expect(result2).toEqual(result1);
      expect(getIdempotencyCacheSize()).toBe(1); // Still 1 entry
    });

    it('should not cache without idempotency key', async () => {
      const paymentIntentId = 'pi_test_456';

      await validatePaymentIntent(paymentIntentId, 1000, storeId);

      expect(getIdempotencyCacheSize()).toBe(0); // No cache entry
    });

    it('should use separate cache entries for different idempotency keys', async () => {
      const paymentIntentId1 = 'pi_test_789';
      const paymentIntentId2 = 'pi_test_101';

      await validatePaymentIntent(paymentIntentId1, 1000, storeId, 'key1');
      await validatePaymentIntent(paymentIntentId2, 2000, storeId, 'key2');

      expect(getIdempotencyCacheSize()).toBe(2);
    });

    it('should prevent duplicate validations for concurrent requests', async () => {
      const paymentIntentId = 'pi_test_concurrent';
      const idempotencyKey = 'concurrent_test';

      // Simulate concurrent requests with same idempotency key
      const results = await Promise.all([
        validatePaymentIntent(paymentIntentId, 1000, storeId, idempotencyKey),
        validatePaymentIntent(paymentIntentId, 1000, storeId, idempotencyKey),
        validatePaymentIntent(paymentIntentId, 1000, storeId, idempotencyKey),
      ]);

      // All should return same result
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);

      // Only 1 cache entry
      expect(getIdempotencyCacheSize()).toBe(1);
    });
  });

  describe('retry logic for transient errors', () => {
    it('should retry on timeout error', async () => {
      const paymentIntentId = 'pi_test_timeout';

      // Mock database to fail first 2 attempts with timeout
      let attempts = 0;
      const originalFindFirst = db.payment.findFirst;
      vi.spyOn(db.payment, 'findFirst').mockImplementation(async () => {
        attempts++;
        if (attempts <= 2) {
          throw new Error('ETIMEDOUT: Connection timed out');
        }
        return originalFindFirst.call(db.payment, { where: {} }) as Promise<null>;
      });

      const result = await validatePaymentIntent(paymentIntentId, 1000, storeId);

      expect(result.isValid).toBe(true);
      expect(attempts).toBe(3); // 2 failures + 1 success
    });

    it('should retry on rate limit error', async () => {
      const paymentIntentId = 'pi_test_rate_limit';

      let attempts = 0;
      vi.spyOn(db.payment, 'findFirst').mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error('rate_limit: Too many requests');
        }
        return null;
      });

      const result = await validatePaymentIntent(paymentIntentId, 1000, storeId);

      expect(result.isValid).toBe(true);
      expect(attempts).toBe(2); // 1 failure + 1 success
    });

    it('should retry on 503 Service Unavailable', async () => {
      const paymentIntentId = 'pi_test_503';

      let attempts = 0;
      vi.spyOn(db.payment, 'findFirst').mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error('HTTP 503: Service temporarily unavailable');
        }
        return null;
      });

      const result = await validatePaymentIntent(paymentIntentId, 1000, storeId);

      expect(result.isValid).toBe(true);
      expect(attempts).toBe(2);
    });

    it('should NOT retry on non-transient errors', async () => {
      const paymentIntentId = 'pi_test_permanent';

      let attempts = 0;
      vi.spyOn(db.payment, 'findFirst').mockImplementation(async () => {
        attempts++;
        throw new Error('Permanent error: Invalid API key');
      });

      await expect(
        validatePaymentIntent(paymentIntentId, 1000, storeId)
      ).rejects.toThrow('Invalid API key');

      expect(attempts).toBe(1); // No retries for permanent errors
    });

    it('should fail after max retry attempts', async () => {
      const paymentIntentId = 'pi_test_max_retries';

      let attempts = 0;
      vi.spyOn(db.payment, 'findFirst').mockImplementation(async () => {
        attempts++;
        throw new Error('ETIMEDOUT: Always fails');
      });

      await expect(
        validatePaymentIntent(paymentIntentId, 1000, storeId)
      ).rejects.toThrow(PaymentError);

      expect(attempts).toBe(3); // Max 3 attempts
    });

    it('should apply exponential backoff between retries', async () => {
      const paymentIntentId = 'pi_test_backoff';
      const delays: number[] = [];
      let lastTime = Date.now();

      let attempts = 0;
      vi.spyOn(db.payment, 'findFirst').mockImplementation(async () => {
        const now = Date.now();
        if (attempts > 0) {
          delays.push(now - lastTime);
        }
        lastTime = now;
        attempts++;

        if (attempts <= 2) {
          throw new Error('ETIMEDOUT');
        }
        return null;
      });

      await validatePaymentIntent(paymentIntentId, 1000, storeId);

      expect(delays.length).toBe(2); // 2 delays (between 3 attempts)
      expect(delays[0]).toBeGreaterThanOrEqual(100); // First delay ~100ms (2^0 * 100)
      expect(delays[1]).toBeGreaterThanOrEqual(200); // Second delay ~200ms (2^1 * 100)
      expect(delays[1]).toBeGreaterThan(delays[0]); // Exponential increase
    }, 10000); // 10s timeout for this test
  });

  describe('timeout handling', () => {
    it('should timeout after 30 seconds', async () => {
      const paymentIntentId = 'pi_test_long_timeout';

      // Mock slow database query (35 seconds)
      vi.spyOn(db.payment, 'findFirst').mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(null), 35000))
      );

      const startTime = Date.now();
      
      await expect(
        validatePaymentIntent(paymentIntentId, 1000, storeId)
      ).rejects.toThrow(PaymentError);

      const duration = Date.now() - startTime;
      
      // Should fail around 30s (allow 35s for retry overhead)
      expect(duration).toBeLessThan(35000);
    }, 40000); // 40s test timeout

    it('should timeout each retry attempt independently', async () => {
      const paymentIntentId = 'pi_test_retry_timeout';

      let attempts = 0;
      vi.spyOn(db.payment, 'findFirst').mockImplementation(
        () => new Promise((resolve) => {
          attempts++;
          // Each attempt takes 31 seconds (exceeds timeout)
          setTimeout(() => resolve(null), 31000);
        })
      );

      const startTime = Date.now();
      
      await expect(
        validatePaymentIntent(paymentIntentId, 1000, storeId)
      ).rejects.toThrow('timeout');

      const duration = Date.now() - startTime;
      
      // First attempt should timeout before retry
      expect(duration).toBeLessThan(35000);
      expect(attempts).toBe(1); // Only 1 attempt (timeout is not transient)
    }, 40000);
  });

  describe('provider outage resilience', () => {
    it('should handle complete provider outage', async () => {
      const paymentIntentId = 'pi_test_outage';

      // Simulate provider completely down
      vi.spyOn(db.payment, 'findFirst').mockImplementation(async () => {
        throw new Error('ENOTFOUND: Provider unreachable');
      });

      await expect(
        validatePaymentIntent(paymentIntentId, 1000, storeId)
      ).rejects.toThrow(PaymentError);
    });

    it('should recover from temporary outage', async () => {
      const paymentIntentId = 'pi_test_temp_outage';

      let attempts = 0;
      vi.spyOn(db.payment, 'findFirst').mockImplementation(async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error('ECONNRESET: Provider connection reset');
        }
        if (attempts === 2) {
          throw new Error('503: Service temporarily unavailable');
        }
        return null; // Provider recovered
      });

      const result = await validatePaymentIntent(paymentIntentId, 1000, storeId);

      expect(result.isValid).toBe(true);
      expect(attempts).toBe(3); // 2 failures + 1 success
    });

    it('should validate from cached result if provider is down', async () => {
      const paymentIntentId = 'pi_test_cached_outage';
      const idempotencyKey = 'outage_test';

      // First call - successful validation
      const result1 = await validatePaymentIntent(
        paymentIntentId,
        1000,
        storeId,
        idempotencyKey
      );

      expect(result1.isValid).toBe(true);

      // Simulate provider outage
      vi.spyOn(db.payment, 'findFirst').mockImplementation(async () => {
        throw new Error('ENOTFOUND: Provider unreachable');
      });

      // Second call - should return cached result (no provider call)
      const result2 = await validatePaymentIntent(
        paymentIntentId,
        1000,
        storeId,
        idempotencyKey
      );

      expect(result2).toEqual(result1);
      expect(result2.isValid).toBe(true);
    });
  });

  describe('integration with existing validation logic', () => {
    it('should detect already-used payment intent', async () => {
      const paymentIntentId = 'pi_test_used';

      // Create order with payment
      const userId = 'user_123';
      await db.user.create({
        data: {
          id: userId,
          email: 'test@example.com',
          name: 'Test User',
          password: 'hashed',
          role: 'CUSTOMER',
        },
      });

      const shippingAddr = await db.address.create({
        data: {
          firstName: 'Test',
          lastName: 'User',
          address1: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'US',
        },
      });

      const order = await db.order.create({
        data: {
          storeId,
          userId,
          orderNumber: 'ORD-USED',
          status: 'DELIVERED',
          subtotal: 1000,
          taxAmount: 0,
          shippingAmount: 0,
          discountAmount: 0,
          totalAmount: 1000,
          shippingAddressId: shippingAddr.id,
          billingAddressId: shippingAddr.id,
        },
      });

      await db.payment.create({
        data: {
          storeId,
          orderId: order.id,
          amount: 1000,
          currency: 'USD',
          status: 'PAID',
          gatewayPaymentId: paymentIntentId,
          gateway: 'STRIPE',
          method: 'CREDIT_CARD',
        },
      });

      // Validate - should fail (already used)
      const result = await validatePaymentIntent(paymentIntentId, 1000, storeId);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('already used');
    });

    it('should validate payment intent format', async () => {
      const invalidId = 'invalid_format';

      const result = await validatePaymentIntent(invalidId, 1000, storeId);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Invalid payment intent ID format');
    });

    it('should accept valid payment intent', async () => {
      const validId = 'pi_valid_123';

      const result = await validatePaymentIntent(validId, 1000, storeId);

      expect(result.isValid).toBe(true);
      expect(result.paymentIntentId).toBe(validId);
      expect(result.status).toBe('requires_confirmation');
    });
  });

  describe('performance under load', () => {
    it('should handle concurrent validations efficiently', async () => {
      const startTime = Date.now();

      // 50 concurrent validations
      const promises = Array.from({ length: 50 }, (_, i) =>
        validatePaymentIntent(`pi_concurrent_${i}`, 1000, storeId)
      );

      const results = await Promise.all(promises);

      const duration = Date.now() - startTime;

      expect(results).toHaveLength(50);
      expect(results.every((r) => r.isValid)).toBe(true);
      
      // Should complete in reasonable time (< 5 seconds)
      expect(duration).toBeLessThan(5000);
    });

    it('should benefit from idempotency cache under load', async () => {
      const idempotencyKey = 'load_test';

      // First validation (uncached)
      const start1 = Date.now();
      await validatePaymentIntent('pi_load_test', 1000, storeId, idempotencyKey);
      const duration1 = Date.now() - start1;

      // 100 subsequent validations (all cached)
      const start2 = Date.now();
      await Promise.all(
        Array.from({ length: 100 }, () =>
          validatePaymentIntent('pi_load_test', 1000, storeId, idempotencyKey)
        )
      );
      const duration2 = Date.now() - start2;

      // Cached validations should be much faster
      expect(duration2).toBeLessThan(duration1);
      expect(duration2).toBeLessThan(100); // < 100ms for 100 cached validations
    });
  });
});
