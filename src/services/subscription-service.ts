// src/services/subscription-service.ts
// Subscription Management Service
// Handles plan assignment, limit enforcement, and usage tracking

import { db } from '@/lib/db';
import { 
  SubscriptionPlan, 
  SubscriptionStatus,
  type Store
} from '@prisma/client';

/**
 * Subscription plan definitions with limits and features
 */
export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    productLimit: 10,
    orderLimit: 100, // per month
    price: 0,
    stripeProductId: null,
    stripePriceId: null,
    features: [
      '10 products',
      '100 orders per month',
      'Basic storefront',
      'Email support'
    ]
  },
  BASIC: {
    name: 'Basic',
    productLimit: 100,
    orderLimit: 1000, // per month
    price: 29, // USD per month
    stripeProductId: process.env.STRIPE_BASIC_PRODUCT_ID,
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID,
    features: [
      '100 products',
      '1,000 orders per month',
      'Custom themes',
      'Analytics dashboard',
      'Priority email support'
    ]
  },
  PRO: {
    name: 'Pro',
    productLimit: 1000,
    orderLimit: 10000, // per month
    price: 99, // USD per month
    stripeProductId: process.env.STRIPE_PRO_PRODUCT_ID,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      '1,000 products',
      '10,000 orders per month',
      'Advanced analytics',
      'Marketing automation',
      'Phone support'
    ]
  },
  ENTERPRISE: {
    name: 'Enterprise',
    productLimit: -1, // unlimited
    orderLimit: -1, // unlimited
    price: 299, // USD per month
    stripeProductId: process.env.STRIPE_ENTERPRISE_PRODUCT_ID,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    features: [
      'Unlimited products',
      'Unlimited orders',
      'Custom integrations',
      'Dedicated account manager',
      '24/7 priority support'
    ]
  }
} as const;

/**
 * Current usage statistics for a store
 */
export interface UsageStats {
  productCount: number;
  orderCountThisMonth: number;
  percentageOfProductLimit: number;
  percentageOfOrderLimit: number;
  isProductLimitExceeded: boolean;
  isOrderLimitExceeded: boolean;
  daysUntilReset: number; // For order limit reset
}

/**
 * Plan enforcement result
 */
export interface PlanEnforcementResult {
  allowed: boolean;
  reason?: string;
  limit?: number;
  current?: number;
  planName?: string;
}

/**
 * Subscription service class
 */
export class SubscriptionService {
  /**
   * Get subscription plan details
   */
  static getPlanDetails(plan: SubscriptionPlan) {
    return SUBSCRIPTION_PLANS[plan];
  }

  /**
   * Get all available plans
   */
  static getAllPlans() {
    return Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
      id: key as SubscriptionPlan,
      ...plan
    }));
  }

  /**
   * Check if a store can create a new product
   */
  static async canCreateProduct(storeId: string): Promise<PlanEnforcementResult> {
    const store = await db.store.findUnique({
      where: { id: storeId },
      select: {
        subscriptionPlan: true,
        productLimit: true,
        _count: {
          select: {
            products: {
              where: {
                deletedAt: null // Only count active products
              }
            }
          }
        }
      }
    });

    if (!store) {
      return {
        allowed: false,
        reason: 'Store not found'
      };
    }

    const planDetails = this.getPlanDetails(store.subscriptionPlan);
    const currentProductCount = store._count.products;

    // Enterprise plan has unlimited products
    if (store.subscriptionPlan === SubscriptionPlan.ENTERPRISE) {
      return { allowed: true };
    }

    const isAllowed = currentProductCount < store.productLimit;

    return {
      allowed: isAllowed,
      reason: isAllowed ? undefined : `Product limit exceeded. Upgrade to increase limit.`,
      limit: store.productLimit,
      current: currentProductCount,
      planName: planDetails.name
    };
  }

  /**
   * Check if a store can create a new order
   */
  static async canCreateOrder(storeId: string): Promise<PlanEnforcementResult> {
    const store = await db.store.findUnique({
      where: { id: storeId },
      select: {
        subscriptionPlan: true,
        orderLimit: true
      }
    });

    if (!store) {
      return {
        allowed: false,
        reason: 'Store not found'
      };
    }

    // Enterprise plan has unlimited orders
    if (store.subscriptionPlan === SubscriptionPlan.ENTERPRISE) {
      return { allowed: true };
    }

    // Get order count for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const currentOrderCount = await db.order.count({
      where: {
        storeId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    const planDetails = this.getPlanDetails(store.subscriptionPlan);
    const isAllowed = currentOrderCount < store.orderLimit;

    return {
      allowed: isAllowed,
      reason: isAllowed ? undefined : `Monthly order limit exceeded. Upgrade to increase limit.`,
      limit: store.orderLimit,
      current: currentOrderCount,
      planName: planDetails.name
    };
  }

  /**
   * Get current usage statistics for a store
   */
  static async getUsageStats(storeId: string): Promise<UsageStats | null> {
    const store = await db.store.findUnique({
      where: { id: storeId },
      select: {
        subscriptionPlan: true,
        productLimit: true,
        orderLimit: true,
        _count: {
          select: {
            products: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      }
    });

    if (!store) return null;

    // Get order count for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const orderCountThisMonth = await db.order.count({
      where: {
        storeId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    const productCount = store._count.products;

    // Calculate days until next month (order limit reset)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // For enterprise plan (unlimited), return special values
    if (store.subscriptionPlan === SubscriptionPlan.ENTERPRISE) {
      return {
        productCount,
        orderCountThisMonth,
        percentageOfProductLimit: 0, // No limit
        percentageOfOrderLimit: 0, // No limit
        isProductLimitExceeded: false,
        isOrderLimitExceeded: false,
        daysUntilReset
      };
    }

    const percentageOfProductLimit = (productCount / store.productLimit) * 100;
    const percentageOfOrderLimit = (orderCountThisMonth / store.orderLimit) * 100;

    return {
      productCount,
      orderCountThisMonth,
      percentageOfProductLimit,
      percentageOfOrderLimit,
      isProductLimitExceeded: productCount >= store.productLimit,
      isOrderLimitExceeded: orderCountThisMonth >= store.orderLimit,
      daysUntilReset
    };
  }

  /**
   * Assign a subscription plan to a store
   */
  static async assignPlan(
    storeId: string,
    plan: SubscriptionPlan,
    _stripeSubscriptionId?: string // Prefix with underscore to indicate intentionally unused
  ): Promise<Store> {
    const planDetails = this.getPlanDetails(plan);

    const store = await db.store.update({
      where: { id: storeId },
      data: {
        subscriptionPlan: plan,
        productLimit: planDetails.productLimit === -1 ? 999999 : planDetails.productLimit,
        orderLimit: planDetails.orderLimit === -1 ? 999999 : planDetails.orderLimit,
        subscriptionStatus: plan === SubscriptionPlan.FREE 
          ? SubscriptionStatus.ACTIVE 
          : SubscriptionStatus.TRIAL,
        // If upgrading from free trial, set trial end date
        trialEndsAt: plan !== SubscriptionPlan.FREE 
          ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
          : null,
        updatedAt: new Date()
      }
    });

    // TODO: Create audit log entry
    // await AuditService.log(storeId, 'UPDATE', 'Store', storeId, {
    //   action: 'plan_assigned',
    //   oldPlan: store.subscriptionPlan,
    //   newPlan: plan,
    //   stripeSubscriptionId
    // });

    return store;
  }

  /**
   * Update subscription status
   */
  static async updateSubscriptionStatus(
    storeId: string,
    status: SubscriptionStatus,
    subscriptionEndsAt?: Date
  ): Promise<Store> {
    const store = await db.store.update({
      where: { id: storeId },
      data: {
        subscriptionStatus: status,
        subscriptionEndsAt,
        updatedAt: new Date()
      }
    });

    return store;
  }

  /**
   * Cancel subscription (set to end at period end)
   */
  static async cancelSubscription(storeId: string, endDate: Date): Promise<Store> {
    const store = await db.store.update({
      where: { id: storeId },
      data: {
        subscriptionStatus: SubscriptionStatus.CANCELED,
        subscriptionEndsAt: endDate,
        updatedAt: new Date()
      }
    });

    return store;
  }

  /**
   * Get stores that need to be downgraded (trial expired, subscription ended)
   */
  static async getStoresForDowngrade(): Promise<Store[]> {
    const now = new Date();
    
    return await db.store.findMany({
      where: {
        OR: [
          // Trial expired
          {
            subscriptionStatus: SubscriptionStatus.TRIAL,
            trialEndsAt: {
              lte: now
            }
          },
          // Subscription ended
          {
            subscriptionStatus: SubscriptionStatus.CANCELED,
            subscriptionEndsAt: {
              lte: now
            }
          },
          // Past due for too long (30 days)
          {
            subscriptionStatus: SubscriptionStatus.PAST_DUE,
            subscriptionEndsAt: {
              lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        ],
        deletedAt: null
      }
    });
  }

  /**
   * Downgrade stores to FREE plan (typically called by a background job)
   */
  static async downgradeExpiredStores(): Promise<number> {
    const storesToDowngrade = await this.getStoresForDowngrade();
    let downgradeCount = 0;

    for (const store of storesToDowngrade) {
      try {
        await this.assignPlan(store.id, SubscriptionPlan.FREE);
        downgradeCount++;
      } catch (error) {
        console.error(`Failed to downgrade store ${store.id}:`, error);
        // Continue with other stores
      }
    }

    return downgradeCount;
  }

  /**
   * Check if a store's subscription is active
   */
  static async isSubscriptionActive(storeId: string): Promise<boolean> {
    const store = await db.store.findUnique({
      where: { id: storeId },
      select: {
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        trialEndsAt: true
      }
    });

    if (!store) return false;

    const now = new Date();

    switch (store.subscriptionStatus) {
      case SubscriptionStatus.ACTIVE:
        return true;
      case SubscriptionStatus.TRIAL:
        return !store.trialEndsAt || store.trialEndsAt > now;
      case SubscriptionStatus.PAST_DUE:
        // Grace period of 7 days
        return !store.subscriptionEndsAt || 
               store.subscriptionEndsAt > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case SubscriptionStatus.CANCELED:
        return !store.subscriptionEndsAt || store.subscriptionEndsAt > now;
      case SubscriptionStatus.PAUSED:
        return false;
      default:
        return false;
    }
  }

  /**
   * Get subscription upgrade/downgrade recommendations
   */
  static async getRecommendations(storeId: string): Promise<{
    currentPlan: SubscriptionPlan;
    recommendedPlan?: SubscriptionPlan;
    reason?: string;
    urgency: 'low' | 'medium' | 'high';
  }> {
    const store = await db.store.findUnique({
      where: { id: storeId },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true
      }
    });

    if (!store) {
      throw new Error('Store not found');
    }

    const usage = await this.getUsageStats(storeId);
    if (!usage) {
      throw new Error('Unable to get usage stats');
    }

    const currentPlan = store.subscriptionPlan;

    // If approaching limits (>80%), recommend upgrade
    if (usage.percentageOfProductLimit > 80 || usage.percentageOfOrderLimit > 80) {
      const nextPlan = this.getNextPlanUp(currentPlan);
      if (nextPlan) {
        return {
          currentPlan,
          recommendedPlan: nextPlan,
          reason: 'Approaching plan limits',
          urgency: usage.percentageOfProductLimit > 90 || usage.percentageOfOrderLimit > 90 
            ? 'high' 
            : 'medium'
        };
      }
    }

    // If significantly under-utilizing (< 25% for 3+ months), could recommend downgrade
    if (usage.percentageOfProductLimit < 25 && usage.percentageOfOrderLimit < 25) {
      const lowerPlan = this.getNextPlanDown(currentPlan);
      if (lowerPlan) {
        return {
          currentPlan,
          recommendedPlan: lowerPlan,
          reason: 'Consider downgrading to save costs',
          urgency: 'low'
        };
      }
    }

    return {
      currentPlan,
      urgency: 'low'
    };
  }

  /**
   * Get the next plan up from current plan
   */
  private static getNextPlanUp(currentPlan: SubscriptionPlan): SubscriptionPlan | null {
    const planOrder = [
      SubscriptionPlan.FREE,
      SubscriptionPlan.BASIC,
      SubscriptionPlan.PRO,
      SubscriptionPlan.ENTERPRISE
    ];

    const currentIndex = planOrder.indexOf(currentPlan);
    return currentIndex < planOrder.length - 1 ? planOrder[currentIndex + 1] : null;
  }

  /**
   * Get the next plan down from current plan
   */
  private static getNextPlanDown(currentPlan: SubscriptionPlan): SubscriptionPlan | null {
    const planOrder = [
      SubscriptionPlan.FREE,
      SubscriptionPlan.BASIC,
      SubscriptionPlan.PRO,
      SubscriptionPlan.ENTERPRISE
    ];

    const currentIndex = planOrder.indexOf(currentPlan);
    return currentIndex > 0 ? planOrder[currentIndex - 1] : null;
  }
}

export default SubscriptionService;