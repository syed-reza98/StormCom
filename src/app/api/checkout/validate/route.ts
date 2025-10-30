/**
 * POST /api/checkout/validate
 * 
 * Validates cart items before checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateCart, CartItem } from '@/services/checkout-service';

const ValidateCartSchema = z.object({
  storeId: z.string().min(1),
  items: z.array(z.object({
    productId: z.string().min(1),
    variantId: z.string().optional(),
    quantity: z.number().int().min(1),
    price: z.number().min(0),
  })),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const input = ValidateCartSchema.parse(body);

    // Validate cart
    const result = await validateCart(input.storeId, input.items as CartItem[]);

    return NextResponse.json({
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid cart data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Cart validation error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to validate cart',
        },
      },
      { status: 500 }
    );
  }
}
