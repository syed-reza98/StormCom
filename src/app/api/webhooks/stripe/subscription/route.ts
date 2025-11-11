// src/app/api/webhooks/stripe/subscription/route.ts
// POST /api/webhooks/stripe/subscription - Handle Stripe subscription webhooks

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { 
  verifyWebhookSignature,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed,
  mapStripeStatusToSubscriptionStatus,
  mapStripePriceToSubscriptionPlan,
  stripe,
} from '@/lib/stripe-subscription';
import { SubscriptionService } from '@/services/subscription-service';
import type Stripe from 'stripe';
import { logger } from '@/lib/logger';

/**
 * POST /api/webhooks/stripe/subscription
 * Handle Stripe subscription webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No Stripe signature found' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error('STRIPE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(body, signature, webhookSecret);

    logger.info(`Received Stripe webhook: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        
        // Update our database
        const storeId = subscription.metadata.storeId;
        if (storeId) {
          const plan = mapStripePriceToSubscriptionPlan(
            subscription.items.data[0]?.price?.id || ''
          );
          const status = mapStripeStatusToSubscriptionStatus(subscription.status);
          
          await SubscriptionService.assignPlan(storeId, plan);
          await SubscriptionService.updateSubscriptionStatus(
            storeId,
            status,
            new Date(subscription.current_period_end * 1000)
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        
        // Update our database
        const storeId = subscription.metadata.storeId;
        if (storeId) {
          const plan = mapStripePriceToSubscriptionPlan(
            subscription.items.data[0]?.price?.id || ''
          );
          const status = mapStripeStatusToSubscriptionStatus(subscription.status);
          
          await SubscriptionService.assignPlan(storeId, plan);
          await SubscriptionService.updateSubscriptionStatus(
            storeId,
            status,
            new Date(subscription.current_period_end * 1000)
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        
        // Downgrade to FREE plan
        const storeId = subscription.metadata.storeId;
        if (storeId) {
          await SubscriptionService.assignPlan(storeId, 'FREE');
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        
        // Update subscription status to ACTIVE if it was past due
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          const storeId = subscription.metadata.storeId;
          
          if (storeId) {
            const status = mapStripeStatusToSubscriptionStatus(subscription.status);
            await SubscriptionService.updateSubscriptionStatus(
              storeId,
              status,
              new Date(subscription.current_period_end * 1000)
            );
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        
        // Update subscription status to PAST_DUE
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          const storeId = subscription.metadata.storeId;
          
          if (storeId) {
            const status = mapStripeStatusToSubscriptionStatus(subscription.status);
            await SubscriptionService.updateSubscriptionStatus(
              storeId,
              status,
              new Date(subscription.current_period_end * 1000)
            );
          }
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logger.info('Checkout session completed:', {
          sessionId: session.id,
          storeId: session.metadata?.storeId,
          plan: session.metadata?.plan,
        });
        
        // The subscription.created event will handle the actual plan assignment
        break;
      }

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Error processing Stripe webhook:', error);

    if (error instanceof Error && error.message.includes('signature verification failed')) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Export GET method to handle webhook endpoint verification
export async function GET() {
  return NextResponse.json({ 
    status: 'Stripe subscription webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}