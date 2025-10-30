/**
 * Unit tests for PaymentService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import {
  createPaymentIntent,
  handlePaymentSucceeded,
  handlePaymentFailed,
  refundPayment,
  verifyWebhookSignature,
} from '@/services/payment-service';

// Create shared Stripe mock instance
const mockStripeInstance = {
  paymentIntents: {
    create: vi.fn(),
    retrieve: vi.fn(),
  },
  refunds: {
    create: vi.fn(),
  },
  webhooks: {
    constructEvent: vi.fn(),
  },
};

// Mock Stripe
vi.mock('stripe', () => {
  const MockStripe = vi.fn(() => mockStripeInstance);
  return { default: MockStripe };
});

// Mock Prisma client
vi.mock('@/lib/db', () => ({
  db: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('PaymentService - createPaymentIntent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create payment intent successfully', async () => {
    const mockOrder = {
      id: 'order-123',
      orderNumber: 'ORD-00001',
      totalAmount: 70.32,
      storeId: 'store-456',
      customerId: 'customer-789',
    };

    vi.mocked(db.order.findUnique).mockResolvedValue(mockOrder as any);

    const mockPaymentIntent = {
      id: 'pi_123',
      client_secret: 'pi_123_secret',
      amount: 7032,
      currency: 'usd',
      metadata: {
        orderId: 'order-123',
        orderNumber: 'ORD-00001',
        storeId: 'store-456',
      },
    };

    mockStripeInstance.paymentIntents.create.mockResolvedValue(mockPaymentIntent as any);

    vi.mocked(db.payment.create).mockResolvedValue({
      id: 'payment-1',
      storeId: 'store-456',
      orderId: 'order-123',
      amount: 70.32,
      currency: 'usd',
      status: 'PENDING',
    } as any);

    const result = await createPaymentIntent({
      orderId: 'order-123',
      amount: 70.32,
      currency: 'usd',
    });

    expect(result.clientSecret).toBe('pi_123_secret');
    expect(result.paymentIntentId).toBe('pi_123');
    expect(result.amount).toBe(70.32);
    expect(db.payment.create).toHaveBeenCalled();
  });

  it('should throw error when order not found', async () => {
    vi.mocked(db.order.findUnique).mockResolvedValue(null);

    await expect(
      createPaymentIntent({
        orderId: 'invalid-order',
        amount: 100,
      })
    ).rejects.toThrow('Order invalid-order not found');
  });

  it('should convert amount to cents correctly', async () => {
    const mockOrder = {
      id: 'order-123',
      orderNumber: 'ORD-00001',
      totalAmount: 99.99,
      storeId: 'store-456',
    };

    vi.mocked(db.order.findUnique).mockResolvedValue(mockOrder as any);

    mockStripeInstance.paymentIntents.create.mockResolvedValue({
      id: 'pi_123',
      client_secret: 'secret',
      amount: 9999,
      currency: 'usd',
      metadata: {},
    } as any);

    vi.mocked(db.payment.create).mockResolvedValue({} as any);

    await createPaymentIntent({
      orderId: 'order-123',
      amount: 99.99,
    });

    expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 9999, // 99.99 * 100
      })
    );
  });
});

describe('PaymentService - handlePaymentSucceeded', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update payment and order status on success', async () => {
    const mockPaymentIntent = {
      id: 'pi_123',
      metadata: { orderId: 'order-123' },
      latest_charge: 'ch_456',
    };

    mockStripeInstance.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent as any);

    vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
      const mockTx = {
        payment: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        order: {
          update: vi.fn().mockResolvedValue({}),
        },
      };
      return callback(mockTx);
    });

    await handlePaymentSucceeded('pi_123');

    expect(db.$transaction).toHaveBeenCalled();
  });

  it('should throw error when orderId missing from metadata', async () => {
    const mockPaymentIntent = {
      id: 'pi_123',
      metadata: {},
    };

    mockStripeInstance.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent as any);

    await expect(handlePaymentSucceeded('pi_123')).rejects.toThrow(
      'Order ID not found in payment intent metadata'
    );
  });
});

describe('PaymentService - handlePaymentFailed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update payment and order status on failure', async () => {
    const mockPaymentIntent = {
      id: 'pi_123',
      metadata: { orderId: 'order-123' },
    };

    mockStripeInstance.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent as any);

    vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
      const mockTx = {
        payment: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        order: {
          update: vi.fn().mockResolvedValue({}),
        },
      };
      return callback(mockTx);
    });

    await handlePaymentFailed('pi_123', 'card_declined', 'Your card was declined');

    expect(db.$transaction).toHaveBeenCalled();
  });
});

describe('PaymentService - refundPayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process full refund successfully', async () => {
    const mockPayment = {
      id: 'payment-123',
      status: 'PAID',
      amount: 100,
      gatewayPaymentId: 'pi_123',
      orderId: 'order-123',
      order: {
        id: 'order-123',
        orderNumber: 'ORD-00001',
        totalAmount: 100,
      },
    };

    vi.mocked(db.payment.findUnique).mockResolvedValue(mockPayment as any);

    mockStripeInstance.refunds.create.mockResolvedValue({
      id: 'ref_123',
      amount: 10000,
      status: 'succeeded',
    } as any);

    vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
      const mockTx = {
        payment: {
          update: vi.fn().mockResolvedValue({}),
        },
        order: {
          update: vi.fn().mockResolvedValue({}),
        },
      };
      return callback(mockTx);
    });

    await refundPayment({
      paymentId: 'payment-123',
      reason: 'Customer request',
    });

    expect(db.$transaction).toHaveBeenCalled();
  });

  it('should process partial refund', async () => {
    const mockPayment = {
      id: 'payment-123',
      status: 'PAID',
      amount: 100,
      gatewayPaymentId: 'pi_123',
      orderId: 'order-123',
      order: {
        id: 'order-123',
        orderNumber: 'ORD-00001',
        totalAmount: 100,
      },
    };

    vi.mocked(db.payment.findUnique).mockResolvedValue(mockPayment as any);

    mockStripeInstance.refunds.create.mockResolvedValue({
      id: 'ref_123',
      amount: 5000,
      status: 'succeeded',
    } as any);

    vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
      const mockTx = {
        payment: { update: vi.fn() },
        order: { update: vi.fn() },
      };
      return callback(mockTx);
    });

    await refundPayment({
      paymentId: 'payment-123',
      amount: 50, // Partial refund
      reason: 'Partial return',
    });

    expect(mockStripeInstance.refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 5000, // 50 * 100
      })
    );
  });

  it('should throw error when payment not found', async () => {
    vi.mocked(db.payment.findUnique).mockResolvedValue(null);

    await expect(
      refundPayment({
        paymentId: 'invalid-payment',
      })
    ).rejects.toThrow('Payment invalid-payment not found');
  });

  it('should throw error when payment not completed', async () => {
    const mockPayment = {
      id: 'payment-123',
      status: 'PENDING',
      amount: 100,
    };

    vi.mocked(db.payment.findUnique).mockResolvedValue(mockPayment as any);

    await expect(
      refundPayment({
        paymentId: 'payment-123',
      })
    ).rejects.toThrow('Can only refund completed payments');
  });

  it('should throw error when payment intent ID missing', async () => {
    const mockPayment = {
      id: 'payment-123',
      status: 'PAID',
      amount: 100,
      gatewayPaymentId: null,
      order: {},
    };

    vi.mocked(db.payment.findUnique).mockResolvedValue(mockPayment as any);

    await expect(
      refundPayment({
        paymentId: 'payment-123',
      })
    ).rejects.toThrow('Payment intent ID not found');
  });
});

describe('PaymentService - verifyWebhookSignature', () => {
  it('should verify valid webhook signature', () => {
    const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
    const signature = 'valid_signature';
    const secret = 'webhook_secret';

    const mockEvent = {
      type: 'payment_intent.succeeded',
      data: { object: {} },
    };

    mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as any);

    const result = verifyWebhookSignature(payload, signature, secret);

    expect(result).toEqual(mockEvent);
    expect(mockStripeInstance.webhooks.constructEvent).toHaveBeenCalledWith(
      payload,
      signature,
      secret
    );
  });

  it('should throw error for invalid signature', () => {
    const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
    const signature = 'invalid_signature';
    const secret = 'webhook_secret';

    mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    expect(() => {
      verifyWebhookSignature(payload, signature, secret);
    }).toThrow('Webhook signature verification failed: Invalid signature');
  });
});
