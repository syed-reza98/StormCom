/**
 * POST /api/webhooks/stripe
 * 
 * Handle Stripe webhook events
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  handlePaymentSucceeded,
  handlePaymentFailed,
  verifyWebhookSignature,
} from '@/services/payment-service';
import {
  generateIdempotencyKey,
  tryAcquireIdempotency,
  markIdempotencySuccess,
  deleteIdempotencyKey,
  getIdempotency,
} from '@/lib/webhook-idempotency';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    
    // Get Stripe signature from headers
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_SIGNATURE',
            message: 'Missing Stripe signature',
          },
        },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    const event = verifyWebhookSignature(body, signature, webhookSecret);

    // Build idempotency key per FR-10Y: webhook:stripe:{entity}:{identifier}
    const source = 'stripe';
    const evt: any = event as any;
    const identifier = evt.id ?? evt.data?.object?.id ?? 'unknown';
    // Normalize entity from event type (e.g., payment_intent.succeeded -> payment)
    const typeRoot = (event.type || '').split('.')[0];
    const entity = typeRoot || 'event';

    const idempotencyKey = generateIdempotencyKey(source, entity, identifier);

    // First, attempt to acquire idempotency placeholder. If unable, return duplicate response
    const acquired = await tryAcquireIdempotency(idempotencyKey, 86400);
    if (!acquired) {
      const existing = await getIdempotency(idempotencyKey);
      return NextResponse.json(
        {
          status: 'duplicate',
          message: 'Webhook already processed',
          originalProcessedAt: existing?.processedAt ?? null,
        },
        { status: 200 }
      );
    }

    try {
      // Handle event based on type
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          await handlePaymentSucceeded(paymentIntent.id);
          // mark success with orderId metadata if available
          await markIdempotencySuccess(idempotencyKey, { orderId: paymentIntent.metadata?.orderId ?? null });
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object;
          await handlePaymentFailed(
            paymentIntent.id,
            paymentIntent.last_payment_error?.code,
            paymentIntent.last_payment_error?.message
          );
          await markIdempotencySuccess(idempotencyKey, { orderId: paymentIntent.metadata?.orderId ?? null, status: 'success' });
          break;
        }

        case 'charge.refunded': {
          // Payment refunded - handled in refundPayment function
          // Refund processing is handled through admin refund API
          await markIdempotencySuccess(idempotencyKey, { status: 'success' });
          break;
        }

        default:
          // Log unhandled events for monitoring
          // In production, send to logging service (e.g., DataDog, Sentry)
          await markIdempotencySuccess(idempotencyKey, { status: 'success' });
          break;
      }

      return NextResponse.json({ received: true });
    } catch (err) {
      // If processing failed, delete the idempotency placeholder to allow retry (or optionally mark failed)
      try {
        await deleteIdempotencyKey(idempotencyKey);
      } catch (delErr) {
        console.error('Failed to cleanup idempotency key after error:', delErr);
      }
      throw err;
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    if (error instanceof Error && error.message.includes('signature')) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_SIGNATURE',
            message: error.message,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: 'WEBHOOK_ERROR',
          message: 'Failed to process webhook',
        },
      },
      { status: 500 }
    );
  }
}
