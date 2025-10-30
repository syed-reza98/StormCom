/**
 * POST /api/checkout/payment-intent
 * 
 * Create Stripe payment intent for order
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createPaymentIntent } from '@/services/payment-service';

const PaymentIntentSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().min(0),
  currency: z.string().default('usd'),
  customerId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const input = PaymentIntentSchema.parse(body);

    // Create payment intent
    const result = await createPaymentIntent(input);

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid payment data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create payment intent',
        },
      },
      { status: 500 }
    );
  }
}
