/**
 * PaymentService: Stripe integration for payment processing
 * 
 * Handles:
 * - Creating Stripe payment intents
 * - Processing webhook events (payment succeeded, failed)
 * - Recording payments in database
 * - Processing refunds
 */

import Stripe from 'stripe';
import { db } from '@/lib/db';

// Lazily initialize Stripe to avoid build-time crashes when env is missing
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  // Allow a safe dummy key in test to enable mocking without env setup
  const key =
    process.env.STRIPE_SECRET_KEY ||
    (process.env.NODE_ENV === 'test' ? 'sk_test_dummy' : undefined);

  if (!_stripe) {
    if (!key) {
      throw new Error('Stripe secret key not configured');
    }
    _stripe = new Stripe(key, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    });
  }
  return _stripe;
}

/**
 * Payment intent creation input
 */
export interface CreatePaymentIntentInput {
  orderId: string;
  amount: number; // in dollars
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

/**
 * Payment intent result
 */
export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

/**
 * Refund input
 */
export interface RefundPaymentInput {
  paymentId: string;
  amount?: number; // Optional partial refund amount
  reason?: string;
}

/**
 * Create Stripe payment intent for order
 */
export async function createPaymentIntent(
  input: CreatePaymentIntentInput
): Promise<PaymentIntentResult> {
  // Get order to verify amount and store
  const order = await db.order.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      storeId: true,
      customerId: true,
    },
  });

  if (!order) {
    throw new Error(`Order ${input.orderId} not found`);
  }

  // Convert amount to cents (Stripe uses smallest currency unit)
  const amountInCents = Math.round(input.amount * 100);

  // Create Stripe payment intent
  const paymentIntent = await getStripe().paymentIntents.create({
    amount: amountInCents,
    currency: input.currency ?? 'usd',
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      storeId: order.storeId,
      ...input.metadata,
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  // Create payment record in database
  await db.payment.create({
    data: {
      storeId: order.storeId,
      orderId: order.id,
      amount: input.amount,
      currency: input.currency ?? 'usd',
      status: 'PENDING',
      method: 'CREDIT_CARD',
      gateway: 'STRIPE',
      gatewayPaymentId: paymentIntent.id,
      gatewayCustomerId: input.customerId,
      metadata: paymentIntent.metadata as any,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
    amount: input.amount,
    currency: input.currency ?? 'usd',
  };
}

/**
 * Handle Stripe payment succeeded webhook
 */
export async function handlePaymentSucceeded(
  paymentIntentId: string
): Promise<void> {
  // Retrieve payment intent from Stripe
  const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);

  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) {
    throw new Error('Order ID not found in payment intent metadata');
  }

  // Update payment status in database
  await db.$transaction(async (tx) => {
    // Update payment record
    await tx.payment.updateMany({
      where: {
        gatewayPaymentId: paymentIntentId,
      },
      data: {
        // Prisma PaymentStatus uses 'PAID' for completed captured payments
        status: 'PAID',
        gatewayChargeId: paymentIntent.latest_charge as string,
      },
    });

    // Update order payment status
    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'PAID',
        status: 'PROCESSING', // Move order to processing
      },
    });
  });
}

/**
 * Handle Stripe payment failed webhook
 */
export async function handlePaymentFailed(
  paymentIntentId: string,
  failureCode?: string,
  failureMessage?: string
): Promise<void> {
  // Retrieve payment intent from Stripe
  const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);

  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) {
    throw new Error('Order ID not found in payment intent metadata');
  }

  // Update payment status in database
  await db.$transaction(async (tx) => {
    // Update payment record
    await tx.payment.updateMany({
      where: {
        gatewayPaymentId: paymentIntentId,
      },
      data: {
        status: 'FAILED',
        failureCode,
        failureMessage,
      },
    });

    // Update order payment status
    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'FAILED',
      },
    });
  });
}

/**
 * Process refund for payment
 */
export async function refundPayment(
  input: RefundPaymentInput
): Promise<void> {
  // Get payment record
  const payment = await db.payment.findUnique({
    where: { id: input.paymentId },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
        },
      },
    },
  });

  if (!payment) {
    throw new Error(`Payment ${input.paymentId} not found`);
  }

  if (payment.status !== 'PAID') {
    throw new Error('Can only refund completed payments');
  }

  if (!payment.gatewayPaymentId) {
    throw new Error('Payment intent ID not found');
  }

  // Calculate refund amount (default to full amount)
  const refundAmount = input.amount ?? Number(payment.amount);
  const refundAmountCents = Math.round(refundAmount * 100);

  // Create Stripe refund
  await getStripe().refunds.create({
    payment_intent: payment.gatewayPaymentId,
    amount: refundAmountCents,
    reason: input.reason as any,
    metadata: {
      orderId: payment.orderId,
      orderNumber: payment.order.orderNumber,
    },
  });

  // Update payment record
  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: input.paymentId },
      data: {
        status: 'REFUNDED',
        refundedAmount: refundAmount,
        refundedAt: new Date(),
      },
    });

    // Update order payment status
    await tx.order.update({
      where: { id: payment.orderId },
        data: {
        paymentStatus: 'REFUNDED',
        // Prisma OrderStatus uses 'CANCELED' (single L)
        status: 'CANCELED',
        canceledAt: new Date(),
        cancelReason: input.reason ?? 'Refund processed',
      },
    });
  });
}

/**
 * Get payment by order ID
 */
export async function getPaymentByOrderId(orderId: string) {
  return db.payment.findFirst({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  try {
    return getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${(err as Error).message}`);
  }
}
