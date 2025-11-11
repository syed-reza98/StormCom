/**
 * POST /api/checkout/shipping
 * 
 * Calculate shipping options for cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateShipping, ShippingAddress, CartItem } from '@/services/checkout-service';

const ShippingOptionsSchema = z.object({
  storeId: z.string().min(1),
  shippingAddress: z.object({
    country: z.string().min(2),
    state: z.string().optional(),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    address1: z.string().min(1),
    address2: z.string().optional(),
  }),
  cartItems: z.array(z.object({
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
    const input = ShippingOptionsSchema.parse(body);

    // Calculate shipping options
    const options = await calculateShipping(
      input.storeId,
      input.shippingAddress as ShippingAddress,
      input.cartItems as CartItem[]
    );

    return NextResponse.json({
      data: options,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid shipping data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Shipping calculation error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to calculate shipping',
        },
      },
      { status: 500 }
    );
  }
}
