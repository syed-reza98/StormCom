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

    // Handle event based on type
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        await handlePaymentSucceeded(paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        await handlePaymentFailed(
          paymentIntent.id,
          paymentIntent.last_payment_error?.code,
          paymentIntent.last_payment_error?.message
        );
        break;
      }

      case 'charge.refunded': {
        // Payment refunded - handled in refundPayment function
        // Refund processing is handled through admin refund API
        break;
      }

      default:
        // Log unhandled events for monitoring
        // In production, send to logging service (e.g., DataDog, Sentry)
        break;
    }

    return NextResponse.json({ received: true });
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
