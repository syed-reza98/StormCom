// tests/unit/app/api/subscription/portal/route.test.ts
// Unit tests for subscription customer portal API route

import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/subscription/portal/route';
import { getSessionFromRequest } from '@/lib/auth-helpers';
import { createCustomerPortalSession } from '@/lib/stripe-subscription';

// Mock dependencies
vi.mock('@/lib/auth-helpers', () => ({
  getSessionFromRequest: vi.fn(),
}));

vi.mock('@/lib/stripe-subscription', () => ({
  createCustomerPortalSession: vi.fn(),
}));

const mockGetSessionFromRequest = getSessionFromRequest as MockedFunction<typeof getSessionFromRequest>;
const mockCreatePortalSession = createCustomerPortalSession as MockedFunction<typeof createCustomerPortalSession>;

describe('/api/subscription/portal POST', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/subscription/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  it('should create customer portal session successfully', async () => {
    mockRequest = createMockRequest({
      customerId: 'cus_customer_id',
      returnUrl: 'https://example.com/subscription/billing',
    });

    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    mockCreatePortalSession.mockResolvedValue({
      id: 'bps_test_portal_id',
      url: 'https://billing.stripe.com/session/bps_test_portal_id',
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      data: {
        sessionId: 'bps_test_portal_id',
        url: 'https://billing.stripe.com/session/bps_test_portal_id',
      },
    });

    expect(mockCreatePortalSession).toHaveBeenCalledWith({
      customerId: 'cus_customer_id',
      returnUrl: 'https://example.com/subscription/billing',
    });
  });

  it('should use default return URL when not provided', async () => {
    mockRequest = createMockRequest({
      customerId: 'cus_customer_id',
    });

    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    mockCreatePortalSession.mockResolvedValue({
      id: 'bps_test_portal_id',
      url: 'https://billing.stripe.com/session/bps_test_portal_id',
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockCreatePortalSession).toHaveBeenCalledWith({
      customerId: 'cus_customer_id',
      returnUrl: expect.stringContaining('/subscription/billing'),
    });
  });

  it('should return 401 when user is not authenticated', async () => {
    mockRequest = createMockRequest({
      customerId: 'cus_customer_id',
    });

    mockGetSessionFromRequest.mockResolvedValue(null);

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toMatchObject({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  });

  it('should return 400 when customerId is missing', async () => {
    mockRequest = createMockRequest({
      returnUrl: 'https://example.com/subscription/billing',
    });

    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Customer ID is required',
      },
    });
  });

  it('should return 400 when customerId is empty string', async () => {
    mockRequest = createMockRequest({
      customerId: '',
      returnUrl: 'https://example.com/subscription/billing',
    });

    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Customer ID is required',
      },
    });
  });

  it('should return 400 when storeId is missing from session', async () => {
    mockRequest = createMockRequest({
      customerId: 'cus_customer_id',
    });

    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: null,
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      error: {
        code: 'MISSING_STORE_ID',
        message: 'Store ID is required',
      },
    });
  });

  it('should handle invalid request body JSON', async () => {
    mockRequest = new NextRequest('http://localhost:3000/api/subscription/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });

    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
      },
    });
  });

  it('should handle empty request body', async () => {
    mockRequest = new NextRequest('http://localhost:3000/api/subscription/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '',
    });

    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request body is required',
      },
    });
  });

  it('should handle Stripe API errors', async () => {
    mockRequest = createMockRequest({
      customerId: 'cus_customer_id',
    });

    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    mockCreatePortalSession.mockRejectedValue(new Error('Stripe API Error'));

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toMatchObject({
      error: {
        code: 'STRIPE_ERROR',
        message: 'Failed to create customer portal session',
      },
    });
  });

  it('should handle invalid customer ID from Stripe', async () => {
    mockRequest = createMockRequest({
      customerId: 'cus_invalid',
    });

    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    const stripeError = new Error('No such customer: cus_invalid');
    (stripeError as any).type = 'StripeInvalidRequestError';
    mockCreatePortalSession.mockRejectedValue(stripeError);

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      error: {
        code: 'INVALID_CUSTOMER_ID',
        message: 'Invalid customer ID provided',
      },
    });
  });

  it('should validate customer ID format', async () => {
    mockRequest = createMockRequest({
      customerId: 'invalid-format',
    });

    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid customer ID format',
      },
    });
  });

  it('should validate return URL format', async () => {
    mockRequest = createMockRequest({
      customerId: 'cus_customer_id',
      returnUrl: 'invalid-url',
    });

    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid return URL format',
      },
    });
  });

  it('should handle portal session creation without URL', async () => {
    mockRequest = createMockRequest({
      customerId: 'cus_customer_id',
    });

    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    // Simulate Stripe portal session without URL
    mockCreatePortalSession.mockResolvedValue({
      id: 'bps_test_portal_id',
      url: null,
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toMatchObject({
      error: {
        code: 'STRIPE_ERROR',
        message: 'Failed to generate portal URL',
      },
    });
  });

  it('should handle Stripe rate limiting', async () => {
    mockRequest = createMockRequest({
      customerId: 'cus_customer_id',
    });

    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    const rateLimitError = new Error('Too many requests');
    (rateLimitError as any).type = 'StripeRateLimitError';
    mockCreatePortalSession.mockRejectedValue(rateLimitError);

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data).toMatchObject({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests, please try again later',
      },
    });
  });
});