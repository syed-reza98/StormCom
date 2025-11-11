/**
 * POST /api/checkout/complete
 * 
 * Complete checkout and create order
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createOrder, CreateOrderInput } from '@/services/checkout-service';

const CompleteCheckoutSchema = z.object({
  storeId: z.string().min(1),
  customerId: z.string().min(1),
  items: z.array(z.object({
    productId: z.string().min(1),
    variantId: z.string().optional(),
    quantity: z.number().int().min(1),
    price: z.number().min(0),
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
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0),
  shippingCost: z.number().min(0),
  discountAmount: z.number().default(0),
  shippingMethod: z.string().min(1),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER']),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const input = CompleteCheckoutSchema.parse(body);

    // Create order
    const order = await createOrder(input as CreateOrderInput);

    return NextResponse.json({
      data: order,
      message: 'Order created successfully',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid checkout data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('stock')) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: error.message,
            },
          },
          { status: 400 }
        );
      }
    }

    console.error('Checkout completion error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to complete checkout',
        },
      },
      { status: 500 }
    );
  }
}
