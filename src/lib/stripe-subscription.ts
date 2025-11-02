// src/lib/stripe-subscription.ts
// Stripe Subscription Integration
// Handles plan creation, checkout sessions, and subscription webhooks

import Stripe from 'stripe';
import { logger } from '@/lib/logger';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { SUBSCRIPTION_PLANS } from '@/services/subscription-service';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

/**
 * Initialize Stripe with secret key
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

/**
 * Create a Stripe checkout session for subscription (test-compatible version)
 */
export async function createSubscriptionCheckoutSession({
  priceId,
  storeId,
  customerId,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  storeId: string;
  customerId?: string;
  successUrl?: string;
  cancelUrl?: string;
}): Promise<Stripe.Checkout.Session> {
  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    throw new Error('NEXT_PUBLIC_BASE_URL is required');
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const defaultSuccessUrl = successUrl || `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
  const defaultCancelUrl = cancelUrl || `${baseUrl}/subscription/plans?storeId=${storeId}`;

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: defaultSuccessUrl,
    cancel_url: defaultCancelUrl,
    metadata: {
      storeId,
    },
    subscription_data: {
      metadata: {
        storeId,
      },
    },
  };

  // If customer ID provided, use it
  if (customerId) {
    sessionParams.customer = customerId;
  } else {
    // Allow customer creation during checkout
    sessionParams.customer_creation = 'always';
  }

  return await stripe.checkout.sessions.create(sessionParams);
}

/**
 * Create a customer portal session for subscription management (test-compatible version)
 */
export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  if (!customerId) {
    throw new Error('Customer ID is required');
  }
  if (!returnUrl) {
    throw new Error('Return URL is required');
  }

  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Map Stripe subscription status to Prisma SubscriptionStatus (test-compatible version)
 */
export function mapStripeStatusToPrisma(
  stripeStatus: string
): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return SubscriptionStatus.ACTIVE;
    case 'trialing':
      return SubscriptionStatus.TRIAL;
    case 'past_due':
      return SubscriptionStatus.PAST_DUE;
    case 'canceled':
    case 'unpaid':
    case 'incomplete_expired':
      return SubscriptionStatus.CANCELED;
    case 'paused':
      return SubscriptionStatus.PAST_DUE;
    case 'incomplete':
    default:
      return SubscriptionStatus.TRIAL;
  }
}

/**
 * Handle Stripe webhook events (test-compatible version)
 */
export async function handleStripeWebhook({
  body,
  signature,
}: {
  body: string;
  signature: string;
}): Promise<{ received: boolean }> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('Stripe webhook secret is not configured');
  }

  try {
    const event = verifyWebhookSignature(body, signature, webhookSecret);

    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  } catch (error) {
    logger.error('Webhook error:', error);
    throw error;
  }
}

/**
 * Create a Stripe customer
 */
export async function createStripeCustomer({
  email,
  name,
  storeId,
}: {
  email: string;
  name: string;
  storeId: string;
}): Promise<Stripe.Customer> {
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      storeId,
    },
  });
}

/**
 * Get Stripe subscription details
 */
export async function getStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['customer', 'items.data.price.product'],
  });
}

/**
 * Cancel a Stripe subscription
 */
export async function cancelStripeSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription> {
  if (cancelAtPeriodEnd) {
    // Cancel at the end of the current billing period
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  } else {
    // Cancel immediately
    return await stripe.subscriptions.cancel(subscriptionId);
  }
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateStripeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Update subscription to a different plan
 */
export async function updateSubscriptionPlan(
  subscriptionId: string,
  newPlan: SubscriptionPlan
): Promise<Stripe.Subscription> {
  const planDetails = SUBSCRIPTION_PLANS[newPlan];

  if (!planDetails.stripePriceId) {
    throw new Error(`Stripe price ID not configured for plan: ${newPlan}`);
  }

  // Get current subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  if (!subscription.items.data[0]) {
    throw new Error('Subscription has no items');
  }

  // Update the subscription item to the new price
  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: planDetails.stripePriceId,
      },
    ],
    proration_behavior: 'create_prorations', // Prorate the charges
  });
}

/**
 * Get upcoming invoice for a subscription
 */
export async function getUpcomingInvoice(
  subscriptionId: string
): Promise<Stripe.UpcomingInvoice> {
  return await stripe.invoices.retrieveUpcoming({
    subscription: subscriptionId,
  });
}

/**
 * Get invoice history for a customer
 */
export async function getInvoiceHistory(
  customerId: string,
  limit: number = 10
): Promise<Stripe.Invoice[]> {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
    status: 'paid',
  });

  return invoices.data;
}

/**
 * Map Stripe subscription status to our SubscriptionStatus enum
 */
export function mapStripeStatusToSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status
): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return SubscriptionStatus.ACTIVE;
    case 'trialing':
      return SubscriptionStatus.TRIAL;
    case 'past_due':
      return SubscriptionStatus.PAST_DUE;
    case 'canceled':
    case 'unpaid':
      return SubscriptionStatus.CANCELED;
    case 'paused':
      return SubscriptionStatus.PAUSED;
    default:
      return SubscriptionStatus.CANCELED;
  }
}

/**
 * Map Stripe price ID to our SubscriptionPlan enum
 */
export function mapStripePriceToSubscriptionPlan(priceId: string): SubscriptionPlan {
  for (const [plan, details] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (details.stripePriceId === priceId) {
      return plan as SubscriptionPlan;
    }
  }
  
  // Default to FREE if price not recognized
  return SubscriptionPlan.FREE;
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    throw new Error(`Webhook signature verification failed: ${error}`);
  }
}

/**
 * Handle subscription created webhook
 */
export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
): Promise<void> {
  const storeId = subscription.metadata.storeId;
  const planFromMetadata = subscription.metadata.plan as SubscriptionPlan;

  if (!storeId) {
    throw new Error('Store ID not found in subscription metadata');
  }

  // The SubscriptionService will handle updating the store
  // This is called from the webhook handler
  logger.info(`Subscription created for store ${storeId}:`, {
    subscriptionId: subscription.id,
    plan: planFromMetadata,
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end,
  });
}

/**
 * Handle subscription updated webhook
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const storeId = subscription.metadata.storeId;

  if (!storeId) {
    throw new Error('Store ID not found in subscription metadata');
  }

  logger.info(`Subscription updated for store ${storeId}:`, {
    subscriptionId: subscription.id,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodEnd: subscription.current_period_end,
  });
}

/**
 * Handle subscription deleted webhook
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const storeId = subscription.metadata.storeId;

  if (!storeId) {
    throw new Error('Store ID not found in subscription metadata');
  }

  logger.info(`Subscription deleted for store ${storeId}:`, {
    subscriptionId: subscription.id,
    canceledAt: subscription.canceled_at,
  });
}

/**
 * Handle invoice payment succeeded webhook
 */
export async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<void> {
  if (!invoice.subscription) {
    return; // Not a subscription invoice
  }

  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  );

  const storeId = subscription.metadata.storeId;

  if (!storeId) {
    throw new Error('Store ID not found in subscription metadata');
  }

  logger.info(`Invoice payment succeeded for store ${storeId}:`, {
    subscriptionId: subscription.id,
    invoiceId: invoice.id,
    amountPaid: invoice.amount_paid,
    currency: invoice.currency,
  });
}

/**
 * Handle invoice payment failed webhook
 */
export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  if (!invoice.subscription) {
    return; // Not a subscription invoice
  }

  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  );

  const storeId = subscription.metadata.storeId;

  if (!storeId) {
    throw new Error('Store ID not found in subscription metadata');
  }

  logger.warn(`Invoice payment failed for store ${storeId}:`, {
    subscriptionId: subscription.id,
    invoiceId: invoice.id,
    amountDue: invoice.amount_due,
    currency: invoice.currency,
    attemptCount: invoice.attempt_count,
  });
}

/**
 * Get subscription usage for metered billing (if needed in the future)
 */
export async function getSubscriptionUsage(
  subscriptionItemId: string
): Promise<Stripe.UsageRecordSummary[]> {
  const usageRecords = await stripe.subscriptionItems.listUsageRecordSummaries(
    subscriptionItemId
  );

  return usageRecords.data;
}

/**
 * Create usage record for metered billing (if needed in the future)
 */
export async function createUsageRecord(
  subscriptionItemId: string,
  quantity: number,
  timestamp?: number
): Promise<Stripe.UsageRecord> {
  return await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
    quantity,
    timestamp: timestamp || Math.floor(Date.now() / 1000),
    action: 'increment',
  });
}

export default {
  createSubscriptionCheckoutSession,
  createStripeCustomer,
  getStripeSubscription,
  cancelStripeSubscription,
  reactivateStripeSubscription,
  updateSubscriptionPlan,
  createCustomerPortalSession,
  getUpcomingInvoice,
  getInvoiceHistory,
  mapStripeStatusToSubscriptionStatus,
  mapStripePriceToSubscriptionPlan,
  verifyWebhookSignature,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed,
  getSubscriptionUsage,
  createUsageRecord,
};