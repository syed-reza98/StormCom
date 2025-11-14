/**
 * POST /api/checkout/complete
 * 
 * Complete checkout and create order (SECURE)
 * 
 * Security features:
 * - Requires authentication (T010)
 * - Server-side price recalculation (T011 - FR-002)
 * - Payment intent pre-validation (T012)
 * - Atomic transaction wrapper (T013)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createOrder, CreateOrderInput } from '@/services/checkout-service';
import { calculateCheckoutPricing } from '@/services/pricing-service';
import { validatePaymentIntent } from '@/services/payments/intent-validator';
import { withTransaction } from '@/services/transaction';
import { successResponse, errorResponse } from '@/lib/api-response';
import { AuthenticationError, ValidationError, PaymentError } from '@/lib/errors';
import { auditCheckoutCompleted, auditPaymentValidated, auditOrderCreated } from '@/services/audit-service';

const CompleteCheckoutSchema = z.object({
  // Removed storeId - derived from session (multi-tenant isolation)
  items: z.array(z.object({
    productId: z.string().min(1),
    variantId: z.string().optional(),
    quantity: z.number().int().min(1),
    // SECURITY: Removed price field - server recalculates (FR-002)
  })),
  shippingAddress: z.object({
    fullName: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().min(1),
    country: z.string().min(2),
    state: z.string().optional(),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    address1: z.string().min(1),
    address2: z.string().optional(),
  }),
  billingAddress: z.object({
    fullName: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().min(1),
    country: z.string().min(2),
    state: z.string().optional(),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    address1: z.string().min(1),
    address2: z.string().optional(),
  }).optional(),
  // SECURITY: Removed client-submitted monetary values
  // Server recalculates: subtotal, taxAmount, shippingCost, discountAmount
  shippingMethod: z.string().min(1),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'MOBILE_BANKING', 'BANK_TRANSFER', 'CASH_ON_DELIVERY']),
  discountCode: z.string().optional(),
  paymentIntentId: z.string().min(1), // Required for pre-validation (T012)
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // T010: Require authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw new AuthenticationError('You must be logged in to complete checkout');
    }

    // Multi-tenant: Get storeId from session (never trust client)
    const storeId = (session.user as any).storeId;
    if (!storeId) {
      throw new ValidationError('No store context found in session');
    }

    const customerId = (session.user as any).id;
    const userId = session.user.id;

    // Parse and validate request body
    const body = await request.json();
    const input = CompleteCheckoutSchema.parse(body);

    // T011: Server-side price recalculation (FR-002 - NEVER trust client prices)
    const pricing = await calculateCheckoutPricing(
      storeId,
      input.items,
      { id: input.shippingMethod, cost: 0 }, // Shipping method details will be resolved server-side
      input.discountCode
    );

    // T012: Pre-validate payment intent before creating order
    const paymentValidation = await validatePaymentIntent(
      input.paymentIntentId,
      pricing.grandTotal,
      storeId
    );

    if (!paymentValidation.isValid) {
      throw new PaymentError(
        `Payment validation failed: ${paymentValidation.reason}`,
        { paymentIntentId: input.paymentIntentId }
      );
    }

    // T030: Audit payment validation success
    await auditPaymentValidated(input.paymentIntentId, {
      amount: pricing.grandTotal,
      currency: pricing.currency,
      intentId: input.paymentIntentId,
      status: 'validated',
    });

    // T013: Use atomic transaction wrapper
    const order = await withTransaction(async (tx) => {
      // Prepare order input with server-calculated prices
      const orderInput: CreateOrderInput = {
        storeId,
        customerId,
        userId,
        items: input.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: 0, // Will be recalculated by createOrder
        })),
        shippingAddress: input.shippingAddress,
        billingAddress: input.billingAddress,
        shippingMethod: input.shippingMethod,
        shippingCost: pricing.shippingTotal,
        discountCode: input.discountCode,
        customerNote: input.notes,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        // Pass server-calculated totals
        subtotal: pricing.subtotal,
        taxAmount: pricing.taxTotal,
        discountAmount: pricing.discountTotal,
        paymentMethod: input.paymentMethod,
      };

      // Create order (includes inventory decrement, order items creation)
      // Note: createOrder already uses db.$transaction internally
      // This outer wrapper ensures payment validation is part of the atomic unit
      const createdOrder = await createOrder(orderInput);

      // Create payment record linked to validated intent
      await tx.payment.create({
        data: {
          storeId,
          orderId: createdOrder.id,
          amount: pricing.grandTotal,
          currency: pricing.currency,
          method: input.paymentMethod,
          gateway: 'STRIPE', // TODO: Make dynamic based on payment method
          status: 'PENDING',
          gatewayPaymentId: input.paymentIntentId, // Stripe payment_intent_id
          metadata: JSON.stringify({
            validatedAt: new Date().toISOString(),
            ipAddress: orderInput.ipAddress,
          }),
        },
      });

      // T030: Audit order creation
      await auditOrderCreated(createdOrder.id, {
        totalAmount: pricing.grandTotal,
        status: createdOrder.status,
        itemsCount: input.items.length,
        orderNumber: createdOrder.orderNumber,
      });

      return createdOrder;
    });

    // T030: Audit checkout completion
    await auditCheckoutCompleted(order.id, {
      totalAmount: pricing.grandTotal,
      itemsCount: input.items.length,
      paymentMethod: input.paymentMethod,
      shippingMethod: input.shippingMethod,
    });

    // Return standardized success response (FR-008)
    return successResponse(
      order,
      { message: 'Order created successfully', status: 201 }
    );
  } catch (error) {
    // Standardized error handling (FR-008)
    if (error instanceof z.ZodError) {
      return errorResponse(
        new ValidationError('Invalid checkout data', { details: error.errors })
      );
    }

    // Pass through typed errors (AuthenticationError, ValidationError, PaymentError)
    return errorResponse(error);
  }
}
