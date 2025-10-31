// tests/unit/app/api/subscription/checkout/route.test.ts
// Unit tests for subscription checkout API route

import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/subscription/checkout/route';
import { getSessionFromRequest } from '@/lib/auth-helpers';
import { createSubscriptionCheckoutSession } from '@/lib/stripe-subscription';

// Mock dependencies
vi.mock('@/lib/auth-helpers', () => ({
  getSessionFromRequest: vi.fn(),
}));

vi.mock('@/lib/stripe-subscription', () => ({
  createSubscriptionCheckoutSession: vi.fn(),
}));

const mockGetSessionFromRequest = getSessionFromRequest as MockedFunction<typeof getSessionFromRequest>;
const mockCreateCheckoutSession = createSubscriptionCheckoutSession as MockedFunction<typeof createSubscriptionCheckoutSession>;

describe('/api/subscription/checkout POST', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/subscription/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  it('should create checkout session successfully', async () => {
    mockRequest = createMockRequest({
      priceId: 'price_basic_monthly',
    });

    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    mockCreateCheckoutSession.mockResolvedValue({
      id: 'cs_test_session_id',
      url: 'https://checkout.stripe.com/pay/cs_test_session_id',
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      data: {
        sessionId: 'cs_test_session_id',
        url: 'https://checkout.stripe.com/pay/cs_test_session_id',
      },
    });

    expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
      priceId: 'price_basic_monthly',
      storeId: 'store-123',
      customerId: undefined,
    });
  });

  it('should create checkout session with customer ID', async () => {
    mockRequest = createMockRequest({
      priceId: 'price_pro_monthly',
      customerId: 'cus_customer_id',
    });

    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    mockCreateCheckoutSession.mockResolvedValue({
      id: 'cs_test_session_id',
      url: 'https://checkout.stripe.com/pay/cs_test_session_id',
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith({
      priceId: 'price_pro_monthly',
      storeId: 'store-123',
      customerId: 'cus_customer_id',
    });
  });

  it('should return 401 when user is not authenticated', async () => {
    mockRequest = createMockRequest({
      priceId: 'price_basic_monthly',
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

  it('should return 400 when priceId is missing', async () => {
    mockRequest = createMockRequest({});

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
        message: 'Price ID is required',
      },
    });
  });

  it('should return 400 when priceId is empty string', async () => {
    mockRequest = createMockRequest({
      priceId: '',
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
        message: 'Price ID is required',
      },
    });
  });

  it('should return 400 when storeId is missing from session', async () => {
    mockRequest = createMockRequest({
      priceId: 'price_basic_monthly',
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

  it('should return 400 when request body is invalid JSON', async () => {
    mockRequest = new NextRequest('http://localhost:3000/api/subscription/checkout', {
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

  it('should handle Stripe API errors', async () => {
    mockRequest = createMockRequest({
      priceId: 'price_basic_monthly',
    });

    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    mockCreateCheckoutSession.mockRejectedValue(new Error('Stripe API Error'));

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toMatchObject({
      error: {
        code: 'STRIPE_ERROR',
        message: 'Failed to create checkout session',
      },
    });
  });

  it('should handle invalid price ID from Stripe', async () => {
    mockRequest = createMockRequest({
      priceId: 'price_invalid',
    });

    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    const stripeError = new Error('No such price: price_invalid');
    (stripeError as any).type = 'StripeInvalidRequestError';
    mockCreateCheckoutSession.mockRejectedValue(stripeError);

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      error: {
        code: 'INVALID_PRICE_ID',
        message: 'Invalid price ID provided',
      },
    });
  });

  it('should handle Stripe rate limiting', async () => {
    mockRequest = createMockRequest({
      priceId: 'price_basic_monthly',
    });

    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    const rateLimitError = new Error('Too many requests');
    (rateLimitError as any).type = 'StripeRateLimitError';
    mockCreateCheckoutSession.mockRejectedValue(rateLimitError);

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

  it('should validate priceId format', async () => {
    mockRequest = createMockRequest({
      priceId: 'invalid-format',
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
        message: 'Invalid price ID format',
      },
    });
  });

  it('should handle empty request body', async () => {
    mockRequest = new NextRequest('http://localhost:3000/api/subscription/checkout', {
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

  it('should handle checkout session creation without URL', async () => {
    mockRequest = createMockRequest({
      priceId: 'price_basic_monthly',
    });

    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    // Simulate Stripe session without URL
    mockCreateCheckoutSession.mockResolvedValue({
      id: 'cs_test_session_id',
      url: null,
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toMatchObject({
      error: {
        code: 'STRIPE_ERROR',
        message: 'Failed to generate checkout URL',
      },
    });
  });
});