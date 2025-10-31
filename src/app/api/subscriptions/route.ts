// src/app/api/subscriptions/route.ts
// POST /api/subscriptions - Create Stripe checkout session for subscription

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionFromRequest } from '@/lib/session-storage';
import { SubscriptionPlan } from '@prisma/client';
import { createSubscriptionCheckoutSession } from '@/lib/stripe-subscription';
import { db } from '@/lib/db';

/**
 * Request schema for creating subscription checkout session
 */
const createSubscriptionSchema = z.object({
  plan: z.nativeEnum(SubscriptionPlan),
  storeId: z.string().uuid(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  trialDays: z.number().min(0).max(30).optional().default(14),
});

/**
 * POST /api/subscriptions
 * Create a Stripe checkout session for subscription upgrade
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createSubscriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { plan, storeId, successUrl, cancelUrl, trialDays } = validation.data;

    // Verify user has access to the store
    const store = await db.store.findFirst({
      where: {
        id: storeId,
        OR: [
          { users: { some: { id: session.userId } } },
          { admins: { some: { id: session.userId } } },
        ],
        deletedAt: null,
      },
      include: {
        users: {
          where: { id: session.userId },
          select: { id: true, email: true, name: true, role: true },
        },
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied to store' } },
        { status: 403 }
      );
    }

    // Don't allow downgrading to FREE plan through Stripe
    if (plan === SubscriptionPlan.FREE) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_PLAN',
            message: 'Cannot create checkout session for FREE plan',
          },
        },
        { status: 400 }
      );
    }

    // Check if store already has this plan
    if (store.subscriptionPlan === plan) {
      return NextResponse.json(
        {
          error: {
            code: 'ALREADY_SUBSCRIBED',
            message: `Store is already subscribed to ${plan} plan`,
          },
        },
        { status: 400 }
      );
    }

    const user = store.users[0];
    if (!user) {
      return NextResponse.json(
        { error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Create Stripe checkout session
    const checkoutSession = await createSubscriptionCheckoutSession({
      storeId,
      plan,
      successUrl,
      cancelUrl,
      trialDays,
    });

    return NextResponse.json({
      data: {
        sessionId: checkoutSession.id,
        sessionUrl: checkoutSession.url,
        plan,
        storeId,
      },
      message: 'Checkout session created successfully',
    });
  } catch (error) {
    console.error('Error creating subscription checkout session:', error);

    // Handle specific Stripe errors
    if (error instanceof Error) {
      if (error.message.includes('Stripe price ID not configured')) {
        return NextResponse.json(
          {
            error: {
              code: 'CONFIGURATION_ERROR',
              message: 'Subscription plan is not properly configured',
            },
          },
          { status: 500 }
        );
      }

      if (error.message.includes('No such price')) {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_PRICE',
              message: 'Invalid subscription plan configuration',
            },
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create checkout session',
        },
      },
      { status: 500 }
    );
  }
}