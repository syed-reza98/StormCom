/**
 * Stripe Payment Gateway Client
 * Handles payment processing, refunds, and webhooks
 */

import Stripe from 'stripe';

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export interface PaymentIntentData {
  amount: number; // Amount in cents
  currency: string;
  customerId?: string;
  metadata?: Record<string, string>;
  description?: string;
}

export interface RefundData {
  paymentIntentId: string;
  amount?: number; // Amount in cents, full refund if not specified
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
}

/**
 * Create a payment intent
 */
export async function createPaymentIntent(data: PaymentIntentData): Promise<Stripe.PaymentIntent> {
  try {
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(data.amount),
      currency: data.currency.toLowerCase(),
      customer: data.customerId,
      metadata: data.metadata,
      description: data.description,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Stripe payment intent creation failed:', error);
    throw new Error('Failed to create payment intent');
  }
}

/**
 * Confirm a payment intent
 */
export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId?: string
): Promise<Stripe.PaymentIntent> {
  try {
    const paymentIntent = await stripeClient.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });

    return paymentIntent;
  } catch (error) {
    console.error('Stripe payment confirmation failed:', error);
    throw new Error('Failed to confirm payment');
  }
}

/**
 * Retrieve a payment intent
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  try {
    return await stripeClient.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error('Stripe payment intent retrieval failed:', error);
    throw new Error('Failed to retrieve payment intent');
  }
}

/**
 * Create a refund
 */
export async function createRefund(data: RefundData): Promise<Stripe.Refund> {
  try {
    const refund = await stripeClient.refunds.create({
      payment_intent: data.paymentIntentId,
      amount: data.amount,
      reason: data.reason,
    });

    return refund;
  } catch (error) {
    console.error('Stripe refund creation failed:', error);
    throw new Error('Failed to create refund');
  }
}

/**
 * Create a customer
 */
export async function createCustomer(data: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Customer> {
  try {
    const customer = await stripeClient.customers.create({
      email: data.email,
      name: data.name,
      metadata: data.metadata,
    });

    return customer;
  } catch (error) {
    console.error('Stripe customer creation failed:', error);
    throw new Error('Failed to create customer');
  }
}

/**
 * Retrieve a customer
 */
export async function getCustomer(customerId: string): Promise<Stripe.Customer> {
  try {
    return await stripeClient.customers.retrieve(customerId) as Stripe.Customer;
  } catch (error) {
    console.error('Stripe customer retrieval failed:', error);
    throw new Error('Failed to retrieve customer');
  }
}

/**
 * Create a payment method
 */
export async function createPaymentMethod(data: {
  type: 'card';
  card: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
  };
}): Promise<Stripe.PaymentMethod> {
  try {
    return await stripeClient.paymentMethods.create(data);
  } catch (error) {
    console.error('Stripe payment method creation failed:', error);
    throw new Error('Failed to create payment method');
  }
}

/**
 * Attach payment method to customer
 */
export async function attachPaymentMethod(
  paymentMethodId: string,
  customerId: string
): Promise<Stripe.PaymentMethod> {
  try {
    return await stripeClient.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  } catch (error) {
    console.error('Stripe payment method attachment failed:', error);
    throw new Error('Failed to attach payment method');
  }
}

/**
 * List customer payment methods
 */
export async function listCustomerPaymentMethods(
  customerId: string
): Promise<Stripe.PaymentMethod[]> {
  try {
    const paymentMethods = await stripeClient.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return paymentMethods.data;
  } catch (error) {
    console.error('Stripe payment methods listing failed:', error);
    throw new Error('Failed to list payment methods');
  }
}

/**
 * Construct webhook event from request
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  try {
    return stripeClient.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook construction failed:', error);
    throw new Error('Invalid webhook signature');
  }
}

export { stripeClient };
export default stripeClient;
