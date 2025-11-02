/**
 * POST /api/checkout/payment-intent
 * 
 * Create Stripe payment intent for order
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createPaymentIntent } from '@/services/payment-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

const PaymentIntentSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().min(0),
  currency: z.string().default('usd'),
  customerId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authentication: ensure user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Validate input
    const input = PaymentIntentSchema.parse(body);

    // Verify order exists and belongs to the same store/user
    const order = await db.order.findUnique({ where: { id: input.orderId }, select: { id: true, storeId: true, customerId: true } });
    if (!order) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Order not found' } }, { status: 404 });
    }

    // If session contains storeId enforce same-store scope
    const sessionStoreId = (session.user as any).storeId;
    if (sessionStoreId && order.storeId !== sessionStoreId) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Order does not belong to your store' } }, { status: 403 });
    }

    // If user-based ownership is available, enforce customer ownership
    if ((session.user as any).id && order.customerId && (session.user as any).id !== order.customerId) {
      // allow store-admins via storeId check above
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You do not own this order' } }, { status: 403 });
    }

    // Create payment intent
    const result = await createPaymentIntent(input);

    return NextResponse.json({ data: result });
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
    logger.error('Payment intent creation error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create payment intent' } }, { status: 500 });
  }
}
