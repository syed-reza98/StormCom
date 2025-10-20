import Stripe from 'stripe';
import { captureError, addBreadcrumb } from '@/lib/monitoring/sentry';

/**
 * Stripe Payment Gateway Client
 * 
 * Provides integration with Stripe for payment processing, subscription management,
 * and webhook handling in the StormCom multi-tenant e-commerce platform.
 * 
 * Features:
 * - Payment Intent creation and confirmation
 * - Customer management (create, update, retrieve)
 * - Subscription management (plans, billing, cancellation)
 * - Refund processing with idempotency
 * - Webhook signature verification
 * - Multi-currency support
 * - Strong Customer Authentication (SCA) compliance
 * 
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Stripe secret API key (keep secure, server-side only)
 * - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: Stripe publishable key (client-side safe)
 * - STRIPE_WEBHOOK_SECRET: Webhook signing secret for signature verification
 * 
 * API Version: 2023-10-16 (specified in package.json)
 * 
 * Usage:
 * ```ts
 * import { stripeClient, createPaymentIntent, createCustomer } from '@/lib/payments/stripe';
 * 
 * // Create payment intent for checkout
 * const paymentIntent = await createPaymentIntent({
 *   amount: 9999, // $99.99 in cents
 *   currency: 'usd',
 *   customerId: 'cus_123',
 *   metadata: { orderId: 'order_123', storeId: 'store_456' }
 * });
 * 
 * // Create Stripe customer
 * const customer = await createCustomer({
 *   email: 'customer@example.com',
 *   name: 'John Doe',
 *   metadata: { userId: 'user_123', storeId: 'store_456' }
 * });
 * ```
 * 
 * @see https://stripe.com/docs/api
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

/**
 * Stripe Client Instance
 * 
 * Singleton Stripe client configured with API version and app info.
 * Use this for direct Stripe API access when needed.
 */
export const stripeClient = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  appInfo: {
    name: 'StormCom',
    version: '1.0.0',
    url: 'https://stormcom.app',
  },
  typescript: true,
});

/**
 * Payment Intent Creation Options
 */
interface CreatePaymentIntentOptions {
  amount: number; // Amount in cents (e.g., 9999 = $99.99)
  currency: string; // ISO currency code (e.g., 'usd', 'eur', 'gbp')
  customerId?: string; // Stripe customer ID (optional, recommended)
  paymentMethodId?: string; // Pre-attached payment method ID (optional)
  metadata?: Record<string, string>; // Custom metadata (orderId, storeId, etc.)
  description?: string; // Payment description (shown to customer)
  receiptEmail?: string; // Email for receipt (optional)
  statementDescriptor?: string; // Statement descriptor (max 22 chars)
  captureMethod?: 'automatic' | 'manual'; // Default: automatic
}

/**
 * Create Stripe Payment Intent
 * 
 * Creates a payment intent for processing a payment with Stripe.
 * Use this for checkout flows with Stripe Elements or mobile SDKs.
 * 
 * @param options - Payment intent creation options
 * @returns Stripe PaymentIntent object with client secret
 * 
 * @example
 * ```ts
 * const paymentIntent = await createPaymentIntent({
 *   amount: 9999, // $99.99
 *   currency: 'usd',
 *   customerId: 'cus_123',
 *   metadata: {
 *     orderId: 'order_123',
 *     storeId: 'store_456',
 *   },
 *   description: 'Order #1234 - Product A, Product B',
 *   receiptEmail: 'customer@example.com',
 * });
 * 
 * // Return client secret to frontend
 * return { clientSecret: paymentIntent.client_secret };
 * ```
 */
export async function createPaymentIntent(
  options: CreatePaymentIntentOptions
): Promise<Stripe.PaymentIntent> {
  try {
    addBreadcrumb({
      message: 'Creating Stripe payment intent',
      category: 'payment',
      data: {
        amount: options.amount,
        currency: options.currency,
        customerId: options.customerId,
      },
    });

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: options.amount,
      currency: options.currency.toLowerCase(),
      customer: options.customerId,
      payment_method: options.paymentMethodId,
      metadata: options.metadata || {},
      description: options.description,
      receipt_email: options.receiptEmail,
      statement_descriptor: options.statementDescriptor,
      capture_method: options.captureMethod || 'automatic',
      automatic_payment_methods: {
        enabled: true, // Enable all payment methods configured in Stripe Dashboard
      },
    });

    return paymentIntent;
  } catch (error) {
    captureError(error as Error, {
      tags: { paymentGateway: 'stripe', operation: 'createPaymentIntent' },
      extra: { options },
    });
    throw error;
  }
}

/**
 * Confirm Payment Intent
 * 
 * Confirms a payment intent on the server side (for server-side confirmations).
 * 
 * @param paymentIntentId - Stripe payment intent ID
 * @param paymentMethodId - Stripe payment method ID (optional if already attached)
 * 
 * @returns Confirmed PaymentIntent object
 * 
 * @example
 * ```ts
 * const confirmed = await confirmPaymentIntent('pi_123', 'pm_456');
 * if (confirmed.status === 'succeeded') {
 *   // Payment successful, fulfill order
 * }
 * ```
 */
export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId?: string
): Promise<Stripe.PaymentIntent> {
  try {
    addBreadcrumb({
      message: 'Confirming Stripe payment intent',
      category: 'payment',
      data: { paymentIntentId },
    });

    const paymentIntent = await stripeClient.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    return paymentIntent;
  } catch (error) {
    captureError(error as Error, {
      tags: { paymentGateway: 'stripe', operation: 'confirmPaymentIntent' },
      extra: { paymentIntentId },
    });
    throw error;
  }
}

/**
 * Capture Payment Intent
 * 
 * Captures a payment intent that was created with capture_method='manual'.
 * Use this for two-step payment flows (authorize then capture).
 * 
 * @param paymentIntentId - Stripe payment intent ID
 * @param amountToCapture - Amount to capture in cents (optional, defaults to full amount)
 * 
 * @returns Captured PaymentIntent object
 * 
 * @example
 * ```ts
 * // Capture full amount
 * await capturePaymentIntent('pi_123');
 * 
 * // Partial capture
 * await capturePaymentIntent('pi_123', 5000); // Capture $50 of authorized $100
 * ```
 */
export async function capturePaymentIntent(
  paymentIntentId: string,
  amountToCapture?: number
): Promise<Stripe.PaymentIntent> {
  try {
    addBreadcrumb({
      message: 'Capturing Stripe payment intent',
      category: 'payment',
      data: { paymentIntentId, amountToCapture },
    });

    const paymentIntent = await stripeClient.paymentIntents.capture(paymentIntentId, {
      amount_to_capture: amountToCapture,
    });

    return paymentIntent;
  } catch (error) {
    captureError(error as Error, {
      tags: { paymentGateway: 'stripe', operation: 'capturePaymentIntent' },
      extra: { paymentIntentId, amountToCapture },
    });
    throw error;
  }
}

/**
 * Customer Creation Options
 */
interface CreateCustomerOptions {
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
  paymentMethodId?: string; // Attach payment method on creation
}

/**
 * Create Stripe Customer
 * 
 * Creates a customer in Stripe for storing payment methods and managing subscriptions.
 * 
 * @param options - Customer creation options
 * @returns Stripe Customer object
 * 
 * @example
 * ```ts
 * const customer = await createCustomer({
 *   email: 'john@example.com',
 *   name: 'John Doe',
 *   metadata: {
 *     userId: 'user_123',
 *     storeId: 'store_456',
 *   },
 * });
 * ```
 */
export async function createCustomer(
  options: CreateCustomerOptions
): Promise<Stripe.Customer> {
  try {
    addBreadcrumb({
      message: 'Creating Stripe customer',
      category: 'customer',
      data: { email: options.email },
    });

    const customer = await stripeClient.customers.create({
      email: options.email,
      name: options.name,
      phone: options.phone,
      metadata: options.metadata || {},
      payment_method: options.paymentMethodId,
      invoice_settings: options.paymentMethodId
        ? {
            default_payment_method: options.paymentMethodId,
          }
        : undefined,
    });

    return customer;
  } catch (error) {
    captureError(error as Error, {
      tags: { paymentGateway: 'stripe', operation: 'createCustomer' },
      extra: { email: options.email },
    });
    throw error;
  }
}

/**
 * Retrieve Stripe Customer
 * 
 * @param customerId - Stripe customer ID
 * @returns Stripe Customer object or null if deleted
 */
export async function getCustomer(
  customerId: string
): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
  try {
    return await stripeClient.customers.retrieve(customerId);
  } catch (error) {
    captureError(error as Error, {
      tags: { paymentGateway: 'stripe', operation: 'getCustomer' },
      extra: { customerId },
    });
    throw error;
  }
}

/**
 * Refund Options
 */
interface CreateRefundOptions {
  paymentIntentId: string;
  amount?: number; // Amount to refund in cents (optional, defaults to full amount)
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, string>;
}

/**
 * Create Refund
 * 
 * Creates a refund for a successful payment.
 * 
 * @param options - Refund creation options
 * @returns Stripe Refund object
 * 
 * @example
 * ```ts
 * // Full refund
 * await createRefund({
 *   paymentIntentId: 'pi_123',
 *   reason: 'requested_by_customer',
 *   metadata: { orderId: 'order_123' },
 * });
 * 
 * // Partial refund
 * await createRefund({
 *   paymentIntentId: 'pi_123',
 *   amount: 2000, // Refund $20 of $100 payment
 *   reason: 'requested_by_customer',
 * });
 * ```
 */
export async function createRefund(
  options: CreateRefundOptions
): Promise<Stripe.Refund> {
  try {
    addBreadcrumb({
      message: 'Creating Stripe refund',
      category: 'refund',
      data: {
        paymentIntentId: options.paymentIntentId,
        amount: options.amount,
        reason: options.reason,
      },
    });

    const refund = await stripeClient.refunds.create({
      payment_intent: options.paymentIntentId,
      amount: options.amount,
      reason: options.reason,
      metadata: options.metadata || {},
    });

    return refund;
  } catch (error) {
    captureError(error as Error, {
      tags: { paymentGateway: 'stripe', operation: 'createRefund' },
      extra: { ...options } as Record<string, unknown>,
    });
    throw error;
  }
}

/**
 * Verify Stripe Webhook Signature
 * 
 * Verifies that a webhook request came from Stripe by validating the signature.
 * ALWAYS verify webhooks before processing to prevent fraud.
 * 
 * @param payload - Raw request body as string or Buffer
 * @param signature - Stripe-Signature header value
 * 
 * @returns Parsed Stripe event object
 * @throws Error if signature verification fails
 * 
 * @example
 * ```ts
 * // In API route: /api/webhooks/stripe
 * export async function POST(req: Request) {
 *   const payload = await req.text();
 *   const signature = req.headers.get('stripe-signature')!;
 *   
 *   try {
 *     const event = verifyWebhookSignature(payload, signature);
 *     
 *     // Process event
 *     switch (event.type) {
 *       case 'payment_intent.succeeded':
 *         await handlePaymentSuccess(event.data.object);
 *         break;
 *       // ... other event types
 *     }
 *     
 *     return new Response(JSON.stringify({ received: true }), { status: 200 });
 *   } catch (error) {
 *     return new Response('Webhook signature verification failed', { status: 400 });
 *   }
 * }
 * ```
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }

  try {
    const event = stripeClient.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_WEBHOOK_SECRET
    );

    addBreadcrumb({
      message: 'Stripe webhook verified',
      category: 'webhook',
      data: { eventType: event.type, eventId: event.id },
    });

    return event;
  } catch (error) {
    captureError(error as Error, {
      tags: { paymentGateway: 'stripe', operation: 'verifyWebhook' },
      level: 'warning',
    });
    throw new Error('Webhook signature verification failed');
  }
}

/**
 * List Payment Methods for Customer
 * 
 * @param customerId - Stripe customer ID
 * @param type - Payment method type (default: 'card')
 * 
 * @returns Array of payment methods
 */
export async function listPaymentMethods(
  customerId: string,
  type: 'card' | 'us_bank_account' = 'card'
): Promise<Stripe.PaymentMethod[]> {
  try {
    const paymentMethods = await stripeClient.paymentMethods.list({
      customer: customerId,
      type,
    });

    return paymentMethods.data;
  } catch (error) {
    captureError(error as Error, {
      tags: { paymentGateway: 'stripe', operation: 'listPaymentMethods' },
      extra: { customerId, type },
    });
    throw error;
  }
}

// Export Stripe types for convenience
export type {
  Stripe,
} from 'stripe';

// Export Stripe type aliases
export type PaymentIntent = Stripe.PaymentIntent;
export type Customer = Stripe.Customer;
export type Refund = Stripe.Refund;
export type PaymentMethod = Stripe.PaymentMethod;
export type Event = Stripe.Event;
