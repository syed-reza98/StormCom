// src/app/api/subscriptions/[storeId]/cancel/route.ts
// POST /api/subscriptions/[storeId]/cancel - Cancel subscription

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/db';
import { SubscriptionService } from '@/services/subscription-service';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

/**
 * Request schema for canceling subscription
 */
const cancelSubscriptionSchema = z.object({
  cancelAtPeriodEnd: z.boolean().default(true),
  reason: z.string().optional(),
});

/**
 * POST /api/subscriptions/[storeId]/cancel
 * Cancel a subscription (downgrade to FREE plan)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;

    // Validate storeId format
    if (!storeId || typeof storeId !== 'string') {
      return NextResponse.json(
        { error: { code: 'INVALID_STORE_ID', message: 'Valid store ID is required' } },
        { status: 400 }
      );
    }

    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = cancelSubscriptionSchema.safeParse(body);

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

    const { cancelAtPeriodEnd, reason: _reason } = validation.data; // Prefix with underscore to indicate intentionally unused

    // Verify user has access to the store and is admin
    const store = await db.store.findFirst({
      where: {
        id: storeId,
        OR: [
          { admins: { some: { id: session.user.id } } },
          { users: { some: { id: session.user.id, role: 'STORE_ADMIN' } } },
        ],
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: { code: 'STORE_NOT_FOUND', message: 'Store not found or insufficient permissions' } },
        { status: 404 }
      );
    }

    // Check if already on FREE plan
    if (store.subscriptionPlan === SubscriptionPlan.FREE) {
      return NextResponse.json(
        {
          error: {
            code: 'ALREADY_FREE',
            message: 'Store is already on the FREE plan',
          },
        },
        { status: 400 }
      );
    }

    // Check if already canceled
    if (store.subscriptionStatus === SubscriptionStatus.CANCELED) {
      return NextResponse.json(
        {
          error: {
            code: 'ALREADY_CANCELED',
            message: 'Subscription is already canceled',
          },
        },
        { status: 400 }
      );
    }

    let cancelDate: Date;

    if (cancelAtPeriodEnd) {
      // Cancel at the end of current billing period
      cancelDate = store.subscriptionEndsAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now if no end date
    } else {
      // Cancel immediately
      cancelDate = new Date();
    }

    // Update subscription status in database
    const updatedStore = await SubscriptionService.cancelSubscription(storeId, cancelDate);

    // If canceling immediately, downgrade to FREE plan
    if (!cancelAtPeriodEnd) {
      await SubscriptionService.assignPlan(storeId, SubscriptionPlan.FREE);
    }

    // TODO: Cancel Stripe subscription if exists
    // This would require storing the Stripe subscription ID in the database
    // For now, we'll just update our internal status

    // TODO: Send cancellation email notification
    // await EmailService.sendCancellationEmail(store.email, {
    //   storeName: store.name,
    //   cancelDate,
    //   reason
    // });

    // TODO: Create audit log entry
    // await AuditService.log(storeId, 'UPDATE', 'Store', storeId, {
    //   action: 'subscription_canceled',
    //   cancelAtPeriodEnd,
    //   cancelDate,
    //   reason,
    //   oldStatus: store.subscriptionStatus,
    //   newStatus: updatedStore.subscriptionStatus
    // });

    return NextResponse.json({
      data: {
        storeId: updatedStore.id,
        subscriptionStatus: updatedStore.subscriptionStatus,
        subscriptionEndsAt: updatedStore.subscriptionEndsAt,
        cancelAtPeriodEnd,
        message: cancelAtPeriodEnd
          ? `Subscription will be canceled on ${cancelDate.toLocaleDateString()}`
          : 'Subscription canceled immediately',
      },
      message: 'Subscription canceled successfully',
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to cancel subscription',
        },
      },
      { status: 500 }
    );
  }
}