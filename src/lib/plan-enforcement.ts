// src/lib/plan-enforcement.ts
// Plan Enforcement Middleware
// Checks subscription limits before operations to prevent overages

import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService, type PlanEnforcementResult } from '@/services/subscription-service';
import { getSessionFromRequest } from '@/lib/session-storage';

/**
 * Plan enforcement result with HTTP response
 */
interface EnforcementResponse {
  allowed: boolean;
  response?: NextResponse;
}

/**
 * Middleware to check product creation limits
 */
export async function enforceProductLimit(
  _request: NextRequest, // Prefix with underscore to indicate intentionally unused
  storeId: string
): Promise<EnforcementResponse> {
  const result = await SubscriptionService.canCreateProduct(storeId);

  if (!result.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: {
            code: 'PLAN_LIMIT_EXCEEDED',
            message: result.reason || 'Product limit exceeded',
            details: {
              limit: result.limit,
              current: result.current,
              planName: result.planName,
              type: 'product_limit',
            },
          },
        },
        { status: 402 } // Payment Required
      ),
    };
  }

  return { allowed: true };
}

/**
 * Middleware to check order creation limits
 */
export async function enforceOrderLimit(
  _request: NextRequest, // Prefix with underscore to indicate intentionally unused
  storeId: string
): Promise<EnforcementResponse> {
  const result = await SubscriptionService.canCreateOrder(storeId);

  if (!result.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: {
            code: 'PLAN_LIMIT_EXCEEDED',
            message: result.reason || 'Order limit exceeded',
            details: {
              limit: result.limit,
              current: result.current,
              planName: result.planName,
              type: 'order_limit',
            },
          },
        },
        { status: 402 } // Payment Required
      ),
    };
  }

  return { allowed: true };
}

/**
 * Middleware to check if subscription is active
 */
export async function enforceActiveSubscription(
  _request: NextRequest, // Prefix with underscore to indicate intentionally unused
  storeId: string
): Promise<EnforcementResponse> {
  const isActive = await SubscriptionService.isSubscriptionActive(storeId);

  if (!isActive) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: {
            code: 'SUBSCRIPTION_INACTIVE',
            message: 'Subscription is not active. Please renew your subscription.',
            details: {
              type: 'subscription_inactive',
            },
          },
        },
        { status: 402 } // Payment Required
      ),
    };
  }

  return { allowed: true };
}

/**
 * Generic plan enforcement wrapper for API routes
 */
export function withPlanEnforcement(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>,
  options: {
    checkProductLimit?: boolean;
    checkOrderLimit?: boolean;
    checkActiveSubscription?: boolean;
    requireStoreId?: boolean;
  } = {}
) {
  return async (request: NextRequest, context: any) => {
    try {
      // Extract storeId from different sources
      let storeId: string | undefined;

      // Try to get from URL params first
      if (context.params) {
        const params = await context.params;
        storeId = params.storeId || params.id;
      }

      // Try to get from request body if not in params
      if (!storeId && request.method !== 'GET') {
        try {
          const body = await request.json();
          storeId = body.storeId;
          // Recreate request with consumed body
          request = new NextRequest(request.url, {
            method: request.method,
            headers: request.headers,
            body: JSON.stringify(body),
          });
        } catch {
          // Body might not be JSON or already consumed
        }
      }

      // Try to get from query params
      if (!storeId) {
        const url = new URL(request.url);
        storeId = url.searchParams.get('storeId') || undefined;
      }

      // Try to get from session if still not found
      if (!storeId) {
        const session = await getSessionFromRequest(request);
        if (session?.storeId) {
          storeId = session.storeId;
        }
      }

      if (options.requireStoreId && !storeId) {
        return NextResponse.json(
          {
            error: {
              code: 'STORE_ID_REQUIRED',
              message: 'Store ID is required for this operation',
            },
          },
          { status: 400 }
        );
      }

      if (storeId) {
        // Check active subscription first
        if (options.checkActiveSubscription) {
          const activeCheck = await enforceActiveSubscription(request, storeId);
          if (!activeCheck.allowed) {
            return activeCheck.response!;
          }
        }

        // Check product limit
        if (options.checkProductLimit) {
          const productCheck = await enforceProductLimit(request, storeId);
          if (!productCheck.allowed) {
            return productCheck.response!;
          }
        }

        // Check order limit
        if (options.checkOrderLimit) {
          const orderCheck = await enforceOrderLimit(request, storeId);
          if (!orderCheck.allowed) {
            return orderCheck.response!;
          }
        }
      }

      // All checks passed, proceed with original handler
      return await handler(request, context);
    } catch (error) {
      console.error('Plan enforcement error:', error);
      return NextResponse.json(
        {
          error: {
            code: 'ENFORCEMENT_ERROR',
            message: 'Failed to check plan limits',
          },
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Specific enforcement wrappers for common scenarios
 */

/**
 * Wrapper for product creation endpoints
 */
export function withProductLimitEnforcement(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return withPlanEnforcement(handler, {
    checkProductLimit: true,
    checkActiveSubscription: true,
    requireStoreId: true,
  });
}

/**
 * Wrapper for order creation endpoints
 */
export function withOrderLimitEnforcement(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return withPlanEnforcement(handler, {
    checkOrderLimit: true,
    checkActiveSubscription: true,
    requireStoreId: true,
  });
}

/**
 * Wrapper for any operation requiring active subscription
 */
export function withActiveSubscriptionEnforcement(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return withPlanEnforcement(handler, {
    checkActiveSubscription: true,
    requireStoreId: true,
  });
}

/**
 * Check plan limits and return user-friendly messages
 */
export async function checkPlanLimits(storeId: string): Promise<{
  productLimit: PlanEnforcementResult;
  orderLimit: PlanEnforcementResult;
  isActive: boolean;
}> {
  const [productLimit, orderLimit, isActive] = await Promise.all([
    SubscriptionService.canCreateProduct(storeId),
    SubscriptionService.canCreateOrder(storeId),
    SubscriptionService.isSubscriptionActive(storeId),
  ]);

  return {
    productLimit,
    orderLimit,
    isActive,
  };
}

/**
 * Get upgrade recommendations based on usage
 */
export async function getUpgradeRecommendations(storeId: string) {
  try {
    const [usageStats, recommendations] = await Promise.all([
      SubscriptionService.getUsageStats(storeId),
      SubscriptionService.getRecommendations(storeId),
    ]);

    if (!usageStats) {
      return null;
    }

    return {
      usage: usageStats,
      recommendations,
      shouldUpgrade: 
        usageStats.isProductLimitExceeded || 
        usageStats.isOrderLimitExceeded ||
        usageStats.percentageOfProductLimit > 80 ||
        usageStats.percentageOfOrderLimit > 80,
    };
  } catch (error) {
    console.error('Error getting upgrade recommendations:', error);
    return null;
  }
}

/**
 * Plan enforcement error types for consistent error handling
 */
export const PLAN_ENFORCEMENT_ERRORS = {
  PRODUCT_LIMIT_EXCEEDED: 'PRODUCT_LIMIT_EXCEEDED',
  ORDER_LIMIT_EXCEEDED: 'ORDER_LIMIT_EXCEEDED',
  SUBSCRIPTION_INACTIVE: 'SUBSCRIPTION_INACTIVE',
  STORE_ID_REQUIRED: 'STORE_ID_REQUIRED',
  ENFORCEMENT_ERROR: 'ENFORCEMENT_ERROR',
} as const;

export type PlanEnforcementError = typeof PLAN_ENFORCEMENT_ERRORS[keyof typeof PLAN_ENFORCEMENT_ERRORS];

/**
 * Utility to check if an error is a plan enforcement error
 */
export function isPlanEnforcementError(error: any): error is { code: PlanEnforcementError } {
  return error && 
         typeof error.code === 'string' && 
         Object.values(PLAN_ENFORCEMENT_ERRORS).includes(error.code as PlanEnforcementError);
}

export default {
  enforceProductLimit,
  enforceOrderLimit,
  enforceActiveSubscription,
  withPlanEnforcement,
  withProductLimitEnforcement,
  withOrderLimitEnforcement,
  withActiveSubscriptionEnforcement,
  checkPlanLimits,
  getUpgradeRecommendations,
  PLAN_ENFORCEMENT_ERRORS,
  isPlanEnforcementError,
};