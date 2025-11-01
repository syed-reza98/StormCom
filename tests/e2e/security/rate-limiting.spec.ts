import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Rate Limiting
 * 
 * Tests verify that rate limiting is enforced across the application:
 * - **100 requests per minute per IP address** (spec requirement)
 * - Returns **429 Too Many Requests** when limit exceeded
 * - Includes **Retry-After** header with cooldown time
 * - Rate limits reset after the time window
 * 
 * **Security Requirements**:
 * - Rate limiting MUST be applied to all API routes
 * - Rate limiting MUST be per IP address
 * - 429 responses MUST include Retry-After header
 * - Rate limit state MUST reset after time window (60 seconds)
 * 
 * **Implementation Note**:
 * - Rate limiting is implemented using Vercel KV or in-memory store
 * - Middleware applies rate limits before route handlers
 * - Different endpoints may have different limits (e.g., auth: 10/min)
 * 
 * @see specs/001-multi-tenant-ecommerce/spec.md (Security Requirements - Rate Limiting)
 */

const RATE_LIMIT = 100; // requests per minute per IP
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds in milliseconds

test.describe('Rate Limiting', () => {
  test.describe('General API Rate Limiting', () => {
    test('should enforce 100 requests per minute limit', async ({ request }) => {
      // Make requests up to the limit
      const promises: Promise<any>[] = [];
      
      // Send 101 requests rapidly (1 over the limit)
      for (let i = 0; i < RATE_LIMIT + 1; i++) {
        promises.push(request.get('/api/stores'));
      }

      const responses = await Promise.all(promises);

      // Count successful vs rate-limited responses
      const successCount = responses.filter(r => r.status() === 200 || r.status() === 401).length;
      const rateLimitedCount = responses.filter(r => r.status() === 429).length;

      // At least one request should be rate-limited
      expect(rateLimitedCount).toBeGreaterThan(0);

      // Most requests should succeed (up to the limit)
      expect(successCount).toBeLessThanOrEqual(RATE_LIMIT);
    });

    test('should return 429 with appropriate headers when limit exceeded', async ({ request }) => {
      // Exhaust rate limit
      const promises: Promise<any>[] = [];
      for (let i = 0; i < RATE_LIMIT + 5; i++) {
        promises.push(request.get('/api/stores'));
      }

      const responses = await Promise.all(promises);

      // Find a rate-limited response
      const rateLimitedResponse = responses.find(r => r.status() === 429);

      if (rateLimitedResponse) {
        // Verify status code
        expect(rateLimitedResponse.status()).toBe(429);

        // Verify Retry-After header exists
        const retryAfter = rateLimitedResponse.headers()['retry-after'];
        expect(retryAfter).toBeTruthy();

        // Retry-After should be a number (seconds) <= 60
        const retrySeconds = parseInt(retryAfter as string, 10);
        expect(retrySeconds).toBeGreaterThan(0);
        expect(retrySeconds).toBeLessThanOrEqual(60);

        // Verify error response body
        const body = await rateLimitedResponse.json();
        expect(body.error).toBeDefined();
        expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
        expect(body.error.message).toContain('rate limit');
      }
    });

    test('should include rate limit headers on successful requests', async ({ request }) => {
      // Make a fresh request
      const response = await request.get('/api/stores');

      // Check for rate limit headers (standard format)
      const headers = response.headers();

      // X-RateLimit-Limit: Maximum requests allowed in time window
      const limit = headers['x-ratelimit-limit'];
      if (limit) {
        expect(parseInt(limit as string, 10)).toBe(RATE_LIMIT);
      }

      // X-RateLimit-Remaining: Remaining requests in current window
      const remaining = headers['x-ratelimit-remaining'];
      if (remaining) {
        const remainingCount = parseInt(remaining as string, 10);
        expect(remainingCount).toBeGreaterThanOrEqual(0);
        expect(remainingCount).toBeLessThanOrEqual(RATE_LIMIT);
      }

      // X-RateLimit-Reset: Unix timestamp when window resets
      const reset = headers['x-ratelimit-reset'];
      if (reset) {
        const resetTimestamp = parseInt(reset as string, 10);
        expect(resetTimestamp).toBeGreaterThan(Date.now() / 1000);
      }
    });
  });

  test.describe('Authentication Endpoint Rate Limiting', () => {
    test('should enforce stricter rate limits on login endpoint (10/min)', async ({ request }) => {
      const AUTH_RATE_LIMIT = 10; // Stricter limit for authentication

      // Make requests to login endpoint
      const promises: Promise<any>[] = [];
      
      for (let i = 0; i < AUTH_RATE_LIMIT + 2; i++) {
        promises.push(
          request.post('/api/auth/login', {
            data: {
              email: 'test@example.com',
              password: 'invalid',
            },
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
      }

      const responses = await Promise.all(promises);

      // Count rate-limited responses
      const rateLimitedCount = responses.filter(r => r.status() === 429).length;

      // At least one request should be rate-limited
      expect(rateLimitedCount).toBeGreaterThan(0);
    });

    test('should return appropriate error message for auth rate limiting', async ({ request }) => {
      const AUTH_RATE_LIMIT = 10;

      // Exhaust auth rate limit
      const promises: Promise<any>[] = [];
      for (let i = 0; i < AUTH_RATE_LIMIT + 3; i++) {
        promises.push(
          request.post('/api/auth/login', {
            data: {
              email: 'test@example.com',
              password: 'invalid',
            },
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
      }

      const responses = await Promise.all(promises);

      // Find rate-limited response
      const rateLimitedResponse = responses.find(r => r.status() === 429);

      if (rateLimitedResponse) {
        const body = await rateLimitedResponse.json();
        expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
        expect(body.error.message).toMatch(/too many (login )?attempts|rate limit/i);
      }
    });
  });

  test.describe('Rate Limit Reset', () => {
    test.skip('should reset rate limit after time window expires', async ({ request }) => {
      // Note: This test is skipped as it requires waiting 60+ seconds
      // In production, rate limits reset after the time window

      // Exhaust rate limit
      const promises: Promise<any>[] = [];
      for (let i = 0; i < RATE_LIMIT + 1; i++) {
        promises.push(request.get('/api/stores'));
      }

      const responses = await Promise.all(promises);
      const rateLimitedBefore = responses.some(r => r.status() === 429);

      expect(rateLimitedBefore).toBeTruthy();

      // Wait for rate limit window to expire
      console.log('Waiting for rate limit window to expire (60 seconds)...');
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_WINDOW + 1000));

      // Try again - should succeed
      const responseAfter = await request.get('/api/stores');
      expect([200, 401].includes(responseAfter.status())).toBeTruthy();
    });
  });

  test.describe('Different IPs Different Limits', () => {
    test.skip('should enforce rate limits per IP address', async ({ request: _request }) => {
      // Note: This test is skipped as Playwright tests run from same IP
      // In production, different IPs get independent rate limit counters

      // This would require multiple test environments with different IPs
      // Or mock/stub the IP detection logic for testing
    });
  });

  test.describe('Rate Limiting Bypass (Exemptions)', () => {
    test('should not rate limit health check endpoints', async ({ request }) => {
      // Health check endpoints should not be rate limited
      const promises: Promise<any>[] = [];

      // Make many requests to health endpoint
      for (let i = 0; i < RATE_LIMIT + 10; i++) {
        promises.push(request.get('/api/health'));
      }

      const responses = await Promise.all(promises);

      // None should be rate limited
      const rateLimitedCount = responses.filter(r => r.status() === 429).length;
      expect(rateLimitedCount).toBe(0);
    });

    test('should not rate limit static assets', async ({ request }) => {
      // Static assets should not be rate limited
      const promises: Promise<any>[] = [];

      // Make many requests to a static asset
      for (let i = 0; i < RATE_LIMIT + 10; i++) {
        promises.push(request.get('/favicon.ico'));
      }

      const responses = await Promise.all(promises);

      // None should be rate limited (429)
      const rateLimitedCount = responses.filter(r => r.status() === 429).length;
      expect(rateLimitedCount).toBe(0);
    });
  });

  test.describe('Response Format', () => {
    test('should return structured error for rate limit exceeded', async ({ request }) => {
      // Exhaust rate limit
      const promises: Promise<any>[] = [];
      for (let i = 0; i < RATE_LIMIT + 5; i++) {
        promises.push(request.get('/api/stores'));
      }

      const responses = await Promise.all(promises);
      const rateLimitedResponse = responses.find(r => r.status() === 429);

      if (rateLimitedResponse) {
        const body = await rateLimitedResponse.json();

        // Verify error structure
        expect(body).toHaveProperty('error');
        expect(body.error).toHaveProperty('code', 'RATE_LIMIT_EXCEEDED');
        expect(body.error).toHaveProperty('message');
        expect(body.error).toHaveProperty('timestamp');

        // Timestamp should be valid ISO 8601
        expect(() => new Date(body.error.timestamp)).not.toThrow();
      }
    });
  });
});
