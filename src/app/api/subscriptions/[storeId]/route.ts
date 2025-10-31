// src/app/api/subscriptions/[storeId]/route.ts
// GET /api/subscriptions/[storeId] - Retrieve subscription status

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/session-storage';
import { db } from '@/lib/db';
import { SubscriptionService } from '@/services/subscription-service';

/**
 * GET /api/subscriptions/[storeId]
 * Retrieve subscription status and usage for a store
 */
export async function GET(
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
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

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
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        subscriptionEndsAt: true,
        productLimit: true,
        orderLimit: true,
        createdAt: true,
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: { code: 'STORE_NOT_FOUND', message: 'Store not found or access denied' } },
        { status: 404 }
      );
    }

    // Get usage statistics
    const usageStats = await SubscriptionService.getUsageStats(storeId);
    
    if (!usageStats) {
      return NextResponse.json(
        { error: { code: 'USAGE_ERROR', message: 'Failed to retrieve usage statistics' } },
        { status: 500 }
      );
    }

    // Get plan details
    const planDetails = SubscriptionService.getPlanDetails(store.subscriptionPlan);

    // Check if subscription is active
    const isActive = await SubscriptionService.isSubscriptionActive(storeId);

    // Get recommendations
    const recommendations = await SubscriptionService.getRecommendations(storeId);

    return NextResponse.json({
      data: {
        store: {
          id: store.id,
          name: store.name,
          subscriptionPlan: store.subscriptionPlan,
          subscriptionStatus: store.subscriptionStatus,
          trialEndsAt: store.trialEndsAt,
          subscriptionEndsAt: store.subscriptionEndsAt,
          productLimit: store.productLimit,
          orderLimit: store.orderLimit,
          createdAt: store.createdAt,
        },
        plan: planDetails,
        usage: usageStats,
        isActive,
        recommendations,
      },
      message: 'Subscription status retrieved successfully',
    });
  } catch (error) {
    console.error('Error retrieving subscription status:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve subscription status',
        },
      },
      { status: 500 }
    );
  }
}