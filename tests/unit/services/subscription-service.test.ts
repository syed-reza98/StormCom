// tests/unit/services/subscription-service.test.ts
// Unit tests for SubscriptionService

import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { SubscriptionService, SUBSCRIPTION_PLANS } from '@/services/subscription-service';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { db } from '@/lib/db';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    store: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    product: {
      count: vi.fn(),
    },
    order: {
      count: vi.fn(),
    }
  }
}));

const mockDb = db as unknown as {
  store: {
    findUnique: MockedFunction<any>;
    update: MockedFunction<any>;
    findMany: MockedFunction<any>;
  };
  product: {
    count: MockedFunction<any>;
  };
  order: {
    count: MockedFunction<any>;
  };
};

describe('SubscriptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('SUBSCRIPTION_PLANS configuration', () => {
    it('should have correct plan configurations', () => {
      expect(SUBSCRIPTION_PLANS.FREE).toEqual({
        name: 'Free',
        productLimit: 10,
        orderLimit: 100,
        price: 0,
        stripeProductId: null,
        stripePriceId: null,
        features: [
          '10 products',
          '100 orders per month',
          'Basic storefront',
          'Email support'
        ]
      });

      expect(SUBSCRIPTION_PLANS.BASIC).toEqual({
        name: 'Basic',
        productLimit: 100,
        orderLimit: 1000,
        price: 29,
        stripeProductId: process.env.STRIPE_BASIC_PRODUCT_ID,
        stripePriceId: process.env.STRIPE_BASIC_PRICE_ID,
        features: [
          '100 products',
          '1,000 orders per month',
          'Custom themes',
          'Analytics dashboard',
          'Priority email support'
        ]
      });
    });
  });

  describe('getPlanDetails', () => {
    it('should return correct plan details for each plan', () => {
      const freePlan = SubscriptionService.getPlanDetails(SubscriptionPlan.FREE);
      expect(freePlan.name).toBe('Free');
      expect(freePlan.productLimit).toBe(10);

      const basicPlan = SubscriptionService.getPlanDetails(SubscriptionPlan.BASIC);
      expect(basicPlan.name).toBe('Basic');
      expect(basicPlan.productLimit).toBe(100);

      const proPlan = SubscriptionService.getPlanDetails(SubscriptionPlan.PRO);
      expect(proPlan.name).toBe('Pro');
      expect(proPlan.productLimit).toBe(1000);

      const enterprisePlan = SubscriptionService.getPlanDetails(SubscriptionPlan.ENTERPRISE);
      expect(enterprisePlan.name).toBe('Enterprise');
      expect(enterprisePlan.productLimit).toBe(-1);
    });
  });

  describe('getAllPlans', () => {
    it('should return all available plans with IDs', () => {
      const plans = SubscriptionService.getAllPlans();

      expect(plans).toHaveLength(4);
      expect(plans[0]).toMatchObject({
        id: 'FREE',
        name: 'Free',
        productLimit: 10
      });
      expect(plans[1]).toMatchObject({
        id: 'BASIC',
        name: 'Basic',
        productLimit: 100
      });
    });
  });

  describe('canCreateProduct', () => {
    it('should allow product creation when under limit', async () => {
      mockDb.store.findUnique.mockResolvedValue({
        subscriptionPlan: SubscriptionPlan.BASIC,
        productLimit: 100,
        _count: { products: 50 }
      });

      const result = await SubscriptionService.canCreateProduct('store-id');

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(50);
      expect(result.limit).toBe(100);
    });

    it('should deny product creation when at limit', async () => {
      mockDb.store.findUnique.mockResolvedValue({
        subscriptionPlan: SubscriptionPlan.BASIC,
        productLimit: 100,
        _count: { products: 100 }
      });

      const result = await SubscriptionService.canCreateProduct('store-id');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Product limit exceeded');
    });

    it('should allow unlimited products for enterprise plan', async () => {
      mockDb.store.findUnique.mockResolvedValue({
        subscriptionPlan: SubscriptionPlan.ENTERPRISE,
        productLimit: 999999,
        _count: { products: 10000 }
      });

      const result = await SubscriptionService.canCreateProduct('store-id');

      expect(result.allowed).toBe(true);
    });

    it('should return error when store not found', async () => {
      mockDb.store.findUnique.mockResolvedValue(null);

      const result = await SubscriptionService.canCreateProduct('invalid-store-id');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Store not found');
    });
  });

  describe('canCreateOrder', () => {
    it('should allow order creation when under monthly limit', async () => {
      mockDb.store.findUnique.mockResolvedValue({
        subscriptionPlan: SubscriptionPlan.BASIC,
        orderLimit: 1000
      });

      mockDb.order.count.mockResolvedValue(500);

      const result = await SubscriptionService.canCreateOrder('store-id');

      expect(result.allowed).toBe(true);
      expect(result.current).toBe(500);
      expect(result.limit).toBe(1000);
    });

    it('should deny order creation when at monthly limit', async () => {
      mockDb.store.findUnique.mockResolvedValue({
        subscriptionPlan: SubscriptionPlan.BASIC,
        orderLimit: 1000
      });

      mockDb.order.count.mockResolvedValue(1000);

      const result = await SubscriptionService.canCreateOrder('store-id');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Monthly order limit exceeded');
    });

    it('should allow unlimited orders for enterprise plan', async () => {
      mockDb.store.findUnique.mockResolvedValue({
        subscriptionPlan: SubscriptionPlan.ENTERPRISE,
        orderLimit: 999999
      });

      mockDb.order.count.mockResolvedValue(50000);

      const result = await SubscriptionService.canCreateOrder('store-id');

      expect(result.allowed).toBe(true);
    });

    it('should return error when store not found', async () => {
      mockDb.store.findUnique.mockResolvedValue(null);

      const result = await SubscriptionService.canCreateOrder('invalid-store-id');

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Store not found');
    });
  });

  describe('getUsageStats', () => {
    it('should return correct usage statistics', async () => {
      mockDb.store.findUnique.mockResolvedValue({
        subscriptionPlan: SubscriptionPlan.BASIC,
        productLimit: 100,
        orderLimit: 1000,
        _count: { products: 25 }
      });

      mockDb.order.count.mockResolvedValue(450);

      const result = await SubscriptionService.getUsageStats('store-id');

      expect(result).toMatchObject({
        productCount: 25,
        orderCountThisMonth: 450,
        percentageOfProductLimit: 25,
        percentageOfOrderLimit: 45,
        isProductLimitExceeded: false,
        isOrderLimitExceeded: false
      });
    });

    it('should handle unlimited plans correctly', async () => {
      mockDb.store.findUnique.mockResolvedValue({
        subscriptionPlan: SubscriptionPlan.ENTERPRISE,
        productLimit: 999999,
        orderLimit: 999999,
        _count: { products: 5000 }
      });

      mockDb.order.count.mockResolvedValue(25000);

      const result = await SubscriptionService.getUsageStats('store-id');

      expect(result).toMatchObject({
        productCount: 5000,
        orderCountThisMonth: 25000,
        percentageOfProductLimit: 0,
        percentageOfOrderLimit: 0,
        isProductLimitExceeded: false,
        isOrderLimitExceeded: false
      });
    });

    it('should return null when store not found', async () => {
      mockDb.store.findUnique.mockResolvedValue(null);

      const result = await SubscriptionService.getUsageStats('invalid-store-id');

      expect(result).toBeNull();
    });
  });

  describe('isSubscriptionActive', () => {
    it('should return true for active subscription', async () => {
      const mockStore = {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionEndsAt: new Date(Date.now() + 86400000), // Tomorrow
      };
      mockDb.store.findUnique.mockResolvedValue(mockStore);

      const result = await SubscriptionService.isSubscriptionActive('store-id');

      expect(result).toBe(true);
    });

    it('should return false for canceled subscription', async () => {
      const mockStore = {
        subscriptionStatus: SubscriptionStatus.CANCELED,
        subscriptionEndsAt: new Date(Date.now() - 86400000), // Yesterday
      };
      mockDb.store.findUnique.mockResolvedValue(mockStore);

      const result = await SubscriptionService.isSubscriptionActive('store-id');

      expect(result).toBe(false);
    });

    it('should return false for past_due subscription with expired grace period', async () => {
      const pastDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
      mockDb.store.findUnique.mockResolvedValue({
        subscriptionStatus: SubscriptionStatus.PAST_DUE,
        subscriptionEndsAt: pastDate,
        trialEndsAt: null
      });

      const result = await SubscriptionService.isSubscriptionActive('store-id');

      expect(result).toBe(false);
    });

    it('should return true for trial subscription within period', async () => {
      const mockStore = {
        subscriptionStatus: SubscriptionStatus.TRIAL,
        trialEndsAt: new Date(Date.now() + 86400000), // Tomorrow
      };
      mockDb.store.findUnique.mockResolvedValue(mockStore);

      const result = await SubscriptionService.isSubscriptionActive('store-id');

      expect(result).toBe(true);
    });

    it('should return false for expired trial', async () => {
      const mockStore = {
        subscriptionStatus: SubscriptionStatus.TRIAL,
        trialEndsAt: new Date(Date.now() - 86400000), // Yesterday
      };
      mockDb.store.findUnique.mockResolvedValue(mockStore);

      const result = await SubscriptionService.isSubscriptionActive('store-id');

      expect(result).toBe(false);
    });

    it('should return false when store not found', async () => {
      mockDb.store.findUnique.mockResolvedValue(null);

      const result = await SubscriptionService.isSubscriptionActive('invalid-store-id');

      expect(result).toBe(false);
    });
  });

  describe('assignPlan', () => {
    const mockUpdatedStore = {
      id: 'store-id',
      subscriptionPlan: SubscriptionPlan.BASIC,
      subscriptionStatus: SubscriptionStatus.TRIAL,
      productLimit: 100,
      orderLimit: 1000,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    };

    it('should assign plan and update store limits', async () => {
      mockDb.store.update.mockResolvedValue(mockUpdatedStore);

      const result = await SubscriptionService.assignPlan('store-id', SubscriptionPlan.BASIC);

      expect(result).toEqual(mockUpdatedStore);
      expect(mockDb.store.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'store-id' },
          data: expect.objectContaining({
            subscriptionPlan: SubscriptionPlan.BASIC,
            productLimit: 100,
            orderLimit: 1000,
            subscriptionStatus: SubscriptionStatus.TRIAL
          })
        })
      );
    });

    it('should handle enterprise unlimited plan correctly', async () => {
      const enterpriseStore = { 
        ...mockUpdatedStore, 
        subscriptionPlan: SubscriptionPlan.ENTERPRISE,
        productLimit: 999999,
        orderLimit: 999999
      };
      mockDb.store.update.mockResolvedValue(enterpriseStore);

      const result = await SubscriptionService.assignPlan('store-id', SubscriptionPlan.ENTERPRISE);

      expect(result).toEqual(enterpriseStore);
      expect(mockDb.store.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subscriptionPlan: SubscriptionPlan.ENTERPRISE,
            productLimit: 999999,
            orderLimit: 999999
          })
        })
      );
    });

    it('should set FREE plan as ACTIVE status', async () => {
      const freeStore = {
        ...mockUpdatedStore,
        subscriptionPlan: SubscriptionPlan.FREE,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        trialEndsAt: null
      };
      mockDb.store.update.mockResolvedValue(freeStore);

      await SubscriptionService.assignPlan('store-id', SubscriptionPlan.FREE);

      expect(mockDb.store.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subscriptionPlan: SubscriptionPlan.FREE,
            subscriptionStatus: SubscriptionStatus.ACTIVE,
            trialEndsAt: null
          })
        })
      );
    });
  });

  describe('getRecommendations', () => {
    it('should recommend upgrade when approaching limits', async () => {
      mockDb.store.findUnique.mockResolvedValue({
        subscriptionPlan: SubscriptionPlan.FREE,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        productLimit: 10,
        orderLimit: 100,
        _count: { products: 9 }
      });

      mockDb.order.count.mockResolvedValue(85);

      const result = await SubscriptionService.getRecommendations('store-id');

      expect(result.currentPlan).toBe(SubscriptionPlan.FREE);
      expect(result.recommendedPlan).toBe(SubscriptionPlan.BASIC);
      expect(result.urgency).toBe('medium');
    });

    it('should recommend downgrade when underutilizing', async () => {
      mockDb.store.findUnique.mockResolvedValue({
        subscriptionPlan: SubscriptionPlan.PRO,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        productLimit: 1000,
        orderLimit: 10000,
        _count: { products: 50 }
      });

      mockDb.order.count.mockResolvedValue(500);

      const result = await SubscriptionService.getRecommendations('store-id');

      expect(result.currentPlan).toBe(SubscriptionPlan.PRO);
      expect(result.recommendedPlan).toBe(SubscriptionPlan.BASIC);
      expect(result.urgency).toBe('low');
      expect(result.reason).toContain('Consider downgrading to save costs');
    });

    it('should return no recommendation when usage is optimal', async () => {
      mockDb.store.findUnique.mockResolvedValue({
        subscriptionPlan: SubscriptionPlan.BASIC,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        productLimit: 100,
        orderLimit: 1000,
        _count: { products: 50 }
      });

      mockDb.order.count.mockResolvedValue(500);

      const result = await SubscriptionService.getRecommendations('store-id');

      expect(result.currentPlan).toBe(SubscriptionPlan.BASIC);
      expect(result.recommendedPlan).toBeUndefined();
      expect(result.urgency).toBe('low');
    });
  });

  describe('downgrade management', () => {
    it('should identify stores for downgrade', async () => {
      const expiredStores = [
        {
          id: 'store-1',
          subscriptionStatus: SubscriptionStatus.TRIAL,
          trialEndsAt: new Date(Date.now() - 1000)
        },
        {
          id: 'store-2',
          subscriptionStatus: SubscriptionStatus.CANCELED,
          subscriptionEndsAt: new Date(Date.now() - 1000)
        }
      ];

      mockDb.store.findMany.mockResolvedValue(expiredStores);

      const stores = await SubscriptionService.getStoresForDowngrade();

      expect(stores).toHaveLength(2);
      expect(mockDb.store.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                subscriptionStatus: SubscriptionStatus.TRIAL
              }),
              expect.objectContaining({
                subscriptionStatus: SubscriptionStatus.CANCELED
              })
            ])
          })
        })
      );
    });

    it('should downgrade expired stores', async () => {
      const expiredStore = {
        id: 'store-1',
        subscriptionStatus: SubscriptionStatus.TRIAL,
        trialEndsAt: new Date(Date.now() - 1000)
      };

      mockDb.store.findMany.mockResolvedValue([expiredStore]);
      mockDb.store.update.mockResolvedValue({
        ...expiredStore,
        subscriptionPlan: SubscriptionPlan.FREE
      });

      const downgradeCount = await SubscriptionService.downgradeExpiredStores();

      expect(downgradeCount).toBe(1);
      expect(mockDb.store.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'store-1' },
          data: expect.objectContaining({
            subscriptionPlan: SubscriptionPlan.FREE
          })
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDb.store.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(SubscriptionService.canCreateProduct('store-id')).rejects.toThrow(
        'Database connection failed'
      );
    });
  });
});