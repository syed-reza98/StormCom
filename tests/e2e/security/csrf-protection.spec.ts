import { test, expect } from '@playwright/test';

/**
 * E2E Tests for CSRF Protection
 * 
 * Tests verify that CSRF (Cross-Site Request Forgery) protection is enforced
 * for all state-changing operations (POST, PUT, PATCH, DELETE) while allowing
 * idempotent operations (GET, HEAD, OPTIONS) to proceed without tokens.
 * 
 * **Security Requirements**:
 * - CSRF tokens MUST be required for POST, PUT, PATCH, DELETE requests
 * - CSRF tokens MUST NOT be required for GET, HEAD, OPTIONS requests
 * - Invalid tokens MUST return 403 Forbidden
 * - Expired tokens MUST return 403 Forbidden
 * - NextAuth routes MUST handle their own CSRF (exempt from middleware)
 * - Webhook routes MUST use signature verification (exempt from CSRF)
 * 
 * @see src/lib/csrf.ts
 * @see proxy.ts
 * @see specs/001-multi-tenant-ecommerce/spec.md (Security Requirements)
 */

test.describe('CSRF Protection', () => {
  let validCsrfToken: string;

  test.beforeEach(async ({ request }) => {
    // Get a valid CSRF token from the API
    const response = await request.get('/api/csrf-token');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    validCsrfToken = body.csrfToken;
    expect(validCsrfToken).toBeTruthy();
  });

  test.describe('POST Requests', () => {
    test('should allow POST with valid CSRF token', async ({ page }) => {
      // Login first to get session
      await page.fill('input[name="email"]', 'admin@stormcom.io');
      await page.fill('input[name="password"]', 'Admin@123');
      
      // Set CSRF token in cookie
      await page.context().addCookies([{
        name: 'csrf-token',
        value: validCsrfToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false, // Local testing
        sameSite: 'Lax',
      }]);

      await page.click('button[type="submit"]');

      // Should succeed (redirect or success message)
      await page.waitForURL(/\/(dashboard|stores)/);
      expect(page.url()).toMatch(/\/(dashboard|stores)/);
    });

    test('should block POST without CSRF token (403 Forbidden)', async ({ page }) => {
      // Attempt to POST to API without CSRF token
      const response = await page.request.post('/api/products', {
        data: {
          name: 'Test Product',
          price: 29.99,
          storeId: 'test-store-id',
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Should return 403 Forbidden
      expect(response.status()).toBe(403);

      const body = await response.json();
      expect(body.error.code).toBe('CSRF_VALIDATION_FAILED');
      expect(body.error.message).toContain('CSRF token validation failed');
    });

    test('should block POST with invalid CSRF token', async ({ page }) => {
      // Use an invalid token format
      const invalidToken = 'invalid-token-format';

      const response = await page.request.post('/api/products', {
        data: {
          name: 'Test Product',
          price: 29.99,
          storeId: 'test-store-id',
        },
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': invalidToken,
        },
      });

      // Should return 403 Forbidden
      expect(response.status()).toBe(403);

      const body = await response.json();
      expect(body.error.code).toBe('CSRF_VALIDATION_FAILED');
    });

    test('should block POST with expired CSRF token', async ({ page }) => {
      // Generate token with past timestamp (25 hours ago = expired)
      const expiredTimestamp = Date.now() - (25 * 60 * 60 * 1000);
      const expiredToken = `abc123:${expiredTimestamp}:def456`;

      const response = await page.request.post('/api/products', {
        data: {
          name: 'Test Product',
          price: 29.99,
          storeId: 'test-store-id',
        },
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': expiredToken,
        },
      });

      // Should return 403 Forbidden
      expect(response.status()).toBe(403);

      const body = await response.json();
      expect(body.error.code).toBe('CSRF_VALIDATION_FAILED');
    });
  });

  test.describe('PUT Requests', () => {
    test('should require CSRF token for PUT requests', async ({ page }) => {
      // Attempt to PUT without CSRF token
      const response = await page.request.put('/api/products/test-id', {
        data: {
          name: 'Updated Product',
          price: 39.99,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Should return 403 Forbidden
      expect(response.status()).toBe(403);

      const body = await response.json();
      expect(body.error.code).toBe('CSRF_VALIDATION_FAILED');
    });

    test('should allow PUT with valid CSRF token', async ({ page, context }) => {
      // Set valid CSRF token
      await context.addCookies([{
        name: 'csrf-token',
        value: validCsrfToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      }]);

      // Mock authenticated request with valid token
      const response = await page.request.put('/api/products/test-id', {
        data: {
          name: 'Updated Product',
          price: 39.99,
        },
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': validCsrfToken,
        },
      });

      // Should either succeed (200/204) or fail for other reasons (not 403)
      expect(response.status()).not.toBe(403);
    });
  });

  test.describe('PATCH Requests', () => {
    test('should require CSRF token for PATCH requests', async ({ page }) => {
      // Attempt to PATCH without CSRF token
      const response = await page.request.patch('/api/products/test-id', {
        data: {
          price: 49.99,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Should return 403 Forbidden
      expect(response.status()).toBe(403);

      const body = await response.json();
      expect(body.error.code).toBe('CSRF_VALIDATION_FAILED');
    });
  });

  test.describe('DELETE Requests', () => {
    test('should require CSRF token for DELETE requests', async ({ page }) => {
      // Attempt to DELETE without CSRF token
      const response = await page.request.delete('/api/products/test-id', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Should return 403 Forbidden
      expect(response.status()).toBe(403);

      const body = await response.json();
      expect(body.error.code).toBe('CSRF_VALIDATION_FAILED');
    });

    test('should allow DELETE with valid CSRF token', async ({ page }) => {
      // Mock authenticated request with valid token
      const response = await page.request.delete('/api/products/test-id', {
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': validCsrfToken,
        },
      });

      // Should either succeed (200/204) or fail for other reasons (not 403)
      expect(response.status()).not.toBe(403);
    });
  });

  test.describe('GET Requests (No CSRF Required)', () => {
    test('should allow GET requests without CSRF token', async ({ page }) => {
      // GET request to public API endpoint
      const response = await page.request.get('/api/products');

      // Should succeed (200) or fail for other reasons (not 403 CSRF error)
      expect(response.status()).not.toBe(403);

      // If 403, should not be CSRF-related
      if (response.status() === 403) {
        const body = await response.json();
        expect(body.error?.code).not.toBe('CSRF_VALIDATION_FAILED');
      }
    });

    test('should allow HEAD requests without CSRF token', async ({ page }) => {
      // HEAD request
      const response = await page.request.head('/api/products');

      // Should succeed or fail for non-CSRF reasons
      expect(response.status()).not.toBe(403);
    });

    test('should allow OPTIONS requests without CSRF token', async ({ page }) => {
      // OPTIONS request (CORS preflight)
      const response = await page.request.fetch('/api/products', {
        method: 'OPTIONS',
      });

      // Should succeed (200/204) or fail for non-CSRF reasons
      expect(response.status()).not.toBe(403);
    });
  });

  test.describe('Exempted Routes', () => {
    test('should exempt NextAuth routes from CSRF middleware', async ({ page }) => {
      // NextAuth handles its own CSRF tokens
      const response = await page.request.post('/api/auth/callback/credentials', {
        data: {
          email: 'test@example.com',
          password: 'test123',
          callbackUrl: '/dashboard',
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Should not return 403 CSRF error
      // (may return 401 or other auth errors, but not 403 CSRF)
      if (response.status() === 403) {
        const body = await response.json();
        expect(body.error?.code).not.toBe('CSRF_VALIDATION_FAILED');
      }
    });

    test('should exempt webhook routes from CSRF (use signature verification)', async ({ page }) => {
      // Webhooks use signature verification, not CSRF tokens
      const response = await page.request.post('/api/webhooks/stripe', {
        data: {
          type: 'payment_intent.succeeded',
          data: { object: { id: 'pi_test' } },
        },
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'test-signature',
        },
      });

      // Should not return 403 CSRF error
      // (may return 400 for invalid signature, but not 403 CSRF)
      if (response.status() === 403) {
        const body = await response.json();
        expect(body.error?.code).not.toBe('CSRF_VALIDATION_FAILED');
      }
    });
  });

  test.describe('Token Delivery Methods', () => {
    test('should accept CSRF token from x-csrf-token header', async ({ page }) => {
      // Send token in custom header (preferred for AJAX requests)
      const response = await page.request.post('/api/products', {
        data: {
          name: 'Test Product',
          price: 29.99,
          storeId: 'test-store-id',
        },
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': validCsrfToken,
        },
      });

      // Should either succeed or fail for non-CSRF reasons
      expect(response.status()).not.toBe(403);
    });

    test('should accept CSRF token from csrf-token cookie', async ({ page, context }) => {
      // Set token in cookie (for form submissions)
      await context.addCookies([{
        name: 'csrf-token',
        value: validCsrfToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      }]);

      const response = await page.request.post('/api/products', {
        data: {
          name: 'Test Product',
          price: 29.99,
          storeId: 'test-store-id',
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Should either succeed or fail for non-CSRF reasons
      expect(response.status()).not.toBe(403);
    });

    test('should prefer header over cookie when both present', async ({ page, context }) => {
      // Set invalid token in cookie
      await context.addCookies([{
        name: 'csrf-token',
        value: 'invalid-cookie-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      }]);

      // Send valid token in header (should take precedence)
      const response = await page.request.post('/api/products', {
        data: {
          name: 'Test Product',
          price: 29.99,
          storeId: 'test-store-id',
        },
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': validCsrfToken,
        },
      });

      // Should either succeed or fail for non-CSRF reasons (header takes precedence)
      expect(response.status()).not.toBe(403);
    });
  });

  test.describe('Error Response Format', () => {
    test('should return structured error for CSRF failures', async ({ page }) => {
      const response = await page.request.post('/api/products', {
        data: {
          name: 'Test Product',
          price: 29.99,
          storeId: 'test-store-id',
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status()).toBe(403);

      const body = await response.json();

      // Verify error structure
      expect(body).toHaveProperty('error');
      expect(body.error).toHaveProperty('code', 'CSRF_VALIDATION_FAILED');
      expect(body.error).toHaveProperty('message');
      expect(body.error).toHaveProperty('timestamp');

      // Timestamp should be valid ISO 8601
      expect(() => new Date(body.error.timestamp)).not.toThrow();
    });

    test('should include appropriate headers in CSRF error response', async ({ page }) => {
      const response = await page.request.post('/api/products', {
        data: {
          name: 'Test Product',
          price: 29.99,
          storeId: 'test-store-id',
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status()).toBe(403);

      // Verify Content-Type header
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');
    });
  });

  test.describe('Integration with Authentication', () => {
    test('should validate CSRF even for authenticated requests', async ({ page, context }) => {
      // Simulate authenticated session (cookie)
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'valid-session-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      }]);

      // Attempt authenticated request without CSRF token
      const response = await page.request.post('/api/products', {
        data: {
          name: 'Test Product',
          price: 29.99,
          storeId: 'test-store-id',
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Should still require CSRF token (authentication != authorization for CSRF)
      expect(response.status()).toBe(403);

      const body = await response.json();
      expect(body.error.code).toBe('CSRF_VALIDATION_FAILED');
    });
  });

  test.describe('Token Lifecycle', () => {
    test('should accept token within TTL (24 hours)', async ({ page, request }) => {
      // Get a fresh token (will be valid for 24 hours)
      const tokenResponse = await request.get('/api/csrf-token');
      const { csrfToken: freshToken } = await tokenResponse.json();

      const response = await page.request.post('/api/products', {
        data: {
          name: 'Test Product',
          price: 29.99,
          storeId: 'test-store-id',
        },
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': freshToken,
        },
      });

      // Should not return 403 CSRF error (token still valid)
      expect(response.status()).not.toBe(403);
    });

    test('should reject token beyond TTL (>24 hours)', async ({ page }) => {
      // Generate token with old timestamp (25 hours ago)
      const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000);
      const expiredToken = `abc123:${oldTimestamp}:def456`;

      const response = await page.request.post('/api/products', {
        data: {
          name: 'Test Product',
          price: 29.99,
          storeId: 'test-store-id',
        },
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': expiredToken,
        },
      });

      // Should return 403 Forbidden
      expect(response.status()).toBe(403);

      const body = await response.json();
      expect(body.error.code).toBe('CSRF_VALIDATION_FAILED');
    });
  });
});
