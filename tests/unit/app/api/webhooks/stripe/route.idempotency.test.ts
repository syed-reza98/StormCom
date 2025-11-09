import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/server to provide NextResponse.json used by the route
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: any) => ({
      json: async () => body,
      status: init?.status ?? 200,
    }),
  },
}));

// Mock next/headers to provide stripe-signature header
vi.mock('next/headers', () => ({
  headers: () => ({
    get: (name: string) => {
      if (name === 'stripe-signature') return 'sig-test';
      return null;
    },
  }),
}));

// Mock payment-service functions
vi.mock('@/services/payment-service', () => ({
  verifyWebhookSignature: vi.fn((payload: string) => {
    // parse payload if it's JSON string with event
    try {
      return JSON.parse(payload);
    } catch (e) {
      return { id: 'evt_test', type: 'payment_intent.succeeded', data: { object: { id: 'pi_test', metadata: { orderId: 'order-123' } } } };
    }
  }),
  handlePaymentSucceeded: vi.fn(async (_paymentIntentId: string) => {
    // noop (resolve)
    return;
  }),
  handlePaymentFailed: vi.fn(async () => {
    return;
  }),
}));

// Ensure KV env is not set so the devStore fallback is used
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;

// Import the handler and helpers after mocks so imports are hoisted correctly
import { POST } from '@/app/api/webhooks/stripe/route';
import { generateIdempotencyKey, getIdempotency } from '@/lib/webhook-idempotency';

beforeEach(() => {
  // No-op; idempotency devStore is module-scoped and will be clean per test process
});

describe('Stripe webhook idempotency', () => {
  it('processes a new webhook and records idempotency metadata', async () => {
    const event = {
      id: 'evt_1',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_1', metadata: { orderId: 'order-123' } } },
    };

    const body = JSON.stringify(event);

    const req = {
      text: async () => body,
    } as any;

    const res = await POST(req as any);
    const json = await res.json();

    expect(json).toEqual({ received: true });

    const key = generateIdempotencyKey('stripe', 'payment_intent', 'evt_1');
    const meta = await getIdempotency(key);
    expect(meta).toBeTruthy();
    expect(meta?.status).toBe('success');
    expect(meta?.orderId).toBe('order-123');
  });

  it('returns duplicate for repeated deliveries', async () => {
    const event = {
      id: 'evt_dup',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_dup', metadata: { orderId: 'order-999' } } },
    };

    const body = JSON.stringify(event);
    const req = { text: async () => body } as any;

    // First delivery - should process
    const first = await POST(req as any);
    const firstJson = await first.json();
    expect(firstJson).toEqual({ received: true });

    // Second delivery - should be detected as duplicate
    const second = await POST(req as any);
    const secondJson = await second.json();
    expect(secondJson.status).toBe('duplicate');
    expect(secondJson.message).toBe('Webhook already processed');
    expect(secondJson.originalProcessedAt).toBeTruthy();
  });

  it('cleans up placeholder on processing failure and returns error', async () => {
    // Modify the mocked handler to throw for this test
    const svc = await import('@/services/payment-service');
    (svc.handlePaymentSucceeded as any).mockImplementationOnce(async () => {
      throw new Error('processing failed');
    });

    const event = {
      id: 'evt_fail',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_fail', metadata: { orderId: 'order-fail' } } },
    };

    const body = JSON.stringify(event);
    const req = { text: async () => body } as any;

    const resp = await POST(req as any);
    const data = await resp.json();
    // Should return webhook error
    expect(data.error).toBeTruthy();

    // Ensure idempotency key was removed so retries permitted
    const key = generateIdempotencyKey('stripe', 'payment_intent', 'evt_fail');
    const meta = await getIdempotency(key);
    expect(meta).toBeNull();
  });
});
