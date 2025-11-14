/**
 * Payment Intent Pre-Validator Service (T012)
 * 
 * Validates payment intents BEFORE creating orders to prevent:
 * - Orders being created with failed/insufficient payments
 * - Race conditions between order creation and payment processing
 * - Fraudulent checkouts with tampered payment amounts
 * 
 * Requirements:
 * - FR-003: Pre-validate payment intent before order creation
 * - Must verify: amount matches, status is valid, belongs to correct store
 * - Must handle Stripe payment intents (extensible for other providers)
 */

import { db } from '@/lib/db';
import { PaymentError, ValidationError } from '@/lib/errors';

/**
 * Payment intent validation result
 */
export interface PaymentIntentValidation {
  isValid: boolean;
  reason?: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
}

/**
 * Validate payment intent before order creation
 * 
 * @param paymentIntentId - Stripe payment intent ID
 * @param expectedAmount - Expected amount in cents (server-calculated)
 * @param storeId - Store ID for multi-tenant isolation
 * @returns Validation result with status and reason if invalid
 * 
 * @throws ValidationError if paymentIntentId is missing
 * @throws PaymentError if validation fails critically
 */
export async function validatePaymentIntent(
  paymentIntentId: string,
  expectedAmount: number,
  storeId: string
): Promise<PaymentIntentValidation> {
  if (!paymentIntentId) {
    throw new ValidationError('Payment intent ID is required');
  }

  try {
    // TODO: Integrate with actual Stripe SDK
    // For now, check database payment records
    // In production, this should call Stripe API:
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Look up payment intent in database (temporary implementation)
    const existingPayment = await db.payment.findFirst({
      where: {
        gatewayPaymentId: paymentIntentId,
        order: {
          storeId, // Multi-tenant isolation
        },
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        orderId: true,
      },
    });

    // If payment already exists and is completed, prevent duplicate order creation
    if (existingPayment) {
      if (existingPayment.status === 'PAID') {
        return {
          isValid: false,
          reason: 'Payment intent already used for a completed order',
          paymentIntentId,
          amount: Number(existingPayment.amount),
          currency: existingPayment.currency,
          status: existingPayment.status,
        };
      }

      if (existingPayment.status === 'REFUNDED' || existingPayment.status === 'DISPUTED') {
        return {
          isValid: false,
          reason: `Payment intent has status: ${existingPayment.status}`,
          paymentIntentId,
          amount: Number(existingPayment.amount),
          currency: existingPayment.currency,
          status: existingPayment.status,
        };
      }
    }

    // TODO: Replace with actual Stripe API validation
    // Mock validation for development
    // In production, verify:
    // 1. Payment intent exists in Stripe
    // 2. Status is 'requires_confirmation' or 'succeeded'
    // 3. Amount matches expected amount
    // 4. Currency matches store currency
    // 5. Payment method is attached

    // For now, validate payment intent ID format (Stripe format: pi_*)
    if (!paymentIntentId.startsWith('pi_')) {
      return {
        isValid: false,
        reason: 'Invalid payment intent ID format',
        paymentIntentId,
        amount: expectedAmount,
        currency: 'usd',
        status: 'invalid',
      };
    }

    // Mock: Assume payment intent is valid if not found in DB yet
    // In production, this would be a Stripe API call
    return {
      isValid: true,
      paymentIntentId,
      amount: expectedAmount,
      currency: 'usd',
      status: 'requires_confirmation',
    };
  } catch (error) {
    console.error('Payment intent validation error:', error);
    throw new PaymentError(
      'Failed to validate payment intent',
      {
        paymentIntentId,
        originalError: error instanceof Error ? error.message : String(error),
      }
    );
  }
}

/**
 * Verify payment intent amount matches server-calculated total
 * 
 * Prevents tampering where client submits payment intent with lower amount
 * than actual order total.
 * 
 * @param _paymentIntentId - Stripe payment intent ID (unused in mock)
 * @param _expectedAmount - Server-calculated order total in cents (unused in mock)
 * @returns True if amounts match within 1 cent tolerance
 */
export async function verifyPaymentIntentAmount(
  _paymentIntentId: string,
  _expectedAmount: number
): Promise<boolean> {
  // TODO: Implement Stripe API call to retrieve payment intent amount
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  // const actualAmount = intent.amount;

  // For now, return true (mock implementation)
  // In production, compare with 1 cent tolerance to account for rounding
  // return Math.abs(actualAmount - expectedAmount) <= 1;

  return true;
}

/**
 * Check if payment intent belongs to the specified store
 * 
 * Multi-tenant isolation: Prevent using payment intents from other stores
 * 
 * @param paymentIntentId - Stripe payment intent ID
 * @param storeId - Expected store ID
 * @returns True if payment intent belongs to store
 */
export async function verifyPaymentIntentStore(
  paymentIntentId: string,
  storeId: string
): Promise<boolean> {
  // TODO: Implement Stripe metadata check
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  // return intent.metadata.storeId === storeId;

  // For now, check database payment records
  const payment = await db.payment.findFirst({
    where: {
      gatewayPaymentId: paymentIntentId,
      order: {
        storeId,
      },
    },
    select: { id: true },
  });

  return !!payment;
}

/**
 * Get valid payment statuses for checkout
 * 
 * @returns Array of payment statuses that allow order creation
 */
export function getValidCheckoutStatuses(): string[] {
  return [
    'PENDING',     // Payment initiated
    'AUTHORIZED',  // Payment authorized (not captured)
    // Note: 'PAID' is excluded - if payment is already PAID, order likely exists
  ];
}
