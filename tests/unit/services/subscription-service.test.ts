// tests/unit/services/subscription-service.test.ts
// Unit tests for SubscriptionService

import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { SubscriptionService, SUBSCRIPTION_PLANS } from '@/services/subscription-service';
import { db } from '@/lib/db';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    store: {
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    product: {
      count: vi.fn(),
    },
    order: {
      count: vi.fn(),
    },
  },
}));

const mockDb = db as {
  store: {
    findUnique: MockedFunction<any>;
    update: MockedFunction<any>;
    count: MockedFunction<any>;
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
        price: 0,
        productLimit: 10,
        orderLimit: 100,
        features: [
          'Up to 10 products',
          'Up to 100 orders/month',
          'Basic analytics',
          'Email support',
        ],
      });

      expect(SUBSCRIPTION_PLANS.BASIC).toEqual({
        name: 'Basic',
        price: 29,
        productLimit: 100,
        orderLimit: 1000,
        features: [
          'Up to 100 products',
          'Up to 1,000 orders/month',
          'Advanced analytics',
          'Priority email support',
          'Custom domain',
        ],
      });

      expect(SUBSCRIPTION_PLANS.PRO).toEqual({
        name: 'Pro',
        price: 79,
        productLimit: 1000,
        orderLimit: 10000,
        features: [
          'Up to 1,000 products',
          'Up to 10,000 orders/month',
          'Premium analytics',
          'Phone & chat support',
          'API access',
          'Multi-location inventory',
        ],
      });

      expect(SUBSCRIPTION_PLANS.ENTERPRISE).toEqual({
        name: 'Enterprise',
        price: 199,
        productLimit: -1, // Unlimited
        orderLimit: -1, // Unlimited
        features: [
          'Unlimited products',
          'Unlimited orders',
          'Custom analytics',
          'Dedicated account manager',
          'Custom integrations',
          'Advanced security',
        ],
      });
    });
  });

  describe('getPlanDetails', () => {
    it('should return correct plan details for each plan', () => {
      expect(SubscriptionService.getPlanDetails(SubscriptionPlan.FREE)).toEqual(
        SUBSCRIPTION_PLANS.FREE
      );
      expect(SubscriptionService.getPlanDetails(SubscriptionPlan.BASIC)).toEqual(
        SUBSCRIPTION_PLANS.BASIC
      );
      expect(SubscriptionService.getPlanDetails(SubscriptionPlan.PRO)).toEqual(
        SUBSCRIPTION_PLANS.PRO
      );
      expect(SubscriptionService.getPlanDetails(SubscriptionPlan.ENTERPRISE)).toEqual(
        SUBSCRIPTION_PLANS.ENTERPRISE
      );
    });

    it('should throw error for invalid plan', () => {
      expect(() => {
        SubscriptionService.getPlanDetails('INVALID_PLAN' as SubscriptionPlan);
      }).toThrow('Invalid subscription plan: INVALID_PLAN');
    });
  });

  describe('canCreateProduct', () => {
    it('should allow product creation when under limit', async () => {
      const mockStore = {
        productLimit: 10,
      };
      mockDb.store.findUnique.mockResolvedValue(mockStore);
      mockDb.product.count.mockResolvedValue(5);

      const result = await SubscriptionService.canCreateProduct('store-id');

      expect(result).toEqual({
        allowed: true,
        limit: 10,
        current: 5,
        remaining: 5,
      });
      expect(mockDb.store.findUnique).toHaveBeenCalledWith({
        where: { id: 'store-id' },
        select: { productLimit: true },
      });
      expect(mockDb.product.count).toHaveBeenCalledWith({
        where: { storeId: 'store-id', deletedAt: null },
      });
    });

    it('should deny product creation when at limit', async () => {
      const mockStore = {
        productLimit: 10,
      };
      mockDb.store.findUnique.mockResolvedValue(mockStore);
      mockDb.product.count.mockResolvedValue(10);

      const result = await SubscriptionService.canCreateProduct('store-id');

      expect(result).toEqual({
        allowed: false,
        limit: 10,
        current: 10,
        remaining: 0,
        reason: 'Product limit exceeded (10/10). Upgrade your plan to add more products.',
      });
    });

    it('should allow unlimited products for enterprise plan', async () => {
      const mockStore = {
        productLimit: 999999, // Enterprise limit
      };
      mockDb.store.findUnique.mockResolvedValue(mockStore);
      mockDb.product.count.mockResolvedValue(5000);

      const result = await SubscriptionService.canCreateProduct('store-id');

      expect(result).toEqual({
        allowed: true,
        limit: 999999,
        current: 5000,
        remaining: 994999,
      });
    });

    it('should throw error when store not found', async () => {
      mockDb.store.findUnique.mockResolvedValue(null);

      await expect(SubscriptionService.canCreateProduct('invalid-store-id')).rejects.toThrow(
        'Store not found'
      );
    });
  });

  describe('canCreateOrder', () => {
    it('should allow order creation when under monthly limit', async () => {
      const mockStore = {
        orderLimit: 100,
      };
      mockDb.store.findUnique.mockResolvedValue(mockStore);
      mockDb.order.count.mockResolvedValue(50);

      const result = await SubscriptionService.canCreateOrder('store-id');

      expect(result).toEqual({
        allowed: true,
        limit: 100,
        current: 50,
        remaining: 50,
      });

      // Verify monthly date range calculation
      const callArgs = mockDb.order.count.mock.calls[0][0];
      expect(callArgs.where.storeId).toBe('store-id');
      expect(callArgs.where.deletedAt).toBe(null);
      expect(callArgs.where.createdAt.gte).toBeInstanceOf(Date);
      expect(callArgs.where.createdAt.lt).toBeInstanceOf(Date);
    });

    it('should deny order creation when at monthly limit', async () => {
      const mockStore = {
        orderLimit: 100,
      };
      mockDb.store.findUnique.mockResolvedValue(mockStore);
      mockDb.order.count.mockResolvedValue(100);

      const result = await SubscriptionService.canCreateOrder('store-id');

      expect(result).toEqual({
        allowed: false,
        limit: 100,
        current: 100,
        remaining: 0,
        reason: 'Monthly order limit exceeded (100/100). Upgrade your plan to process more orders.',
      });
    });

    it('should allow unlimited orders for enterprise plan', async () => {
      const mockStore = {
        orderLimit: 999999, // Enterprise limit
      };
      mockDb.store.findUnique.mockResolvedValue(mockStore);
      mockDb.order.count.mockResolvedValue(15000);

      const result = await SubscriptionService.canCreateOrder('store-id');

      expect(result).toEqual({
        allowed: true,
        limit: 999999,
        current: 15000,
        remaining: 984999,
      });
    });

    it('should throw error when store not found', async () => {
      mockDb.store.findUnique.mockResolvedValue(null);

      await expect(SubscriptionService.canCreateOrder('invalid-store-id')).rejects.toThrow(
        'Store not found'
      );
    });
  });

  describe('getUsageStatistics', () => {
    it('should return correct usage statistics', async () => {
      const mockStore = {
        subscriptionPlan: SubscriptionPlan.BASIC,
        productLimit: 100,
        orderLimit: 1000,
      };
      mockDb.store.findUnique.mockResolvedValue(mockStore);
      mockDb.product.count.mockResolvedValue(75);
      mockDb.order.count.mockResolvedValue(450);

      const result = await SubscriptionService.getUsageStatistics('store-id');

      expect(result).toEqual({
        plan: SubscriptionPlan.BASIC,
        products: {
          used: 75,
          limit: 100,
          percentage: 75,
        },
        orders: {
          used: 450,
          limit: 1000,
          percentage: 45,
        },
        isNearLimit: true, // 75% is above 70% threshold
      });
    });

    it('should handle unlimited plans correctly', async () => {
      const mockStore = {
        subscriptionPlan: SubscriptionPlan.ENTERPRISE,
        productLimit: 999999,
        orderLimit: 999999,
      };
      mockDb.store.findUnique.mockResolvedValue(mockStore);
      mockDb.product.count.mockResolvedValue(5000);
      mockDb.order.count.mockResolvedValue(25000);

      const result = await SubscriptionService.getUsageStatistics('store-id');

      expect(result).toEqual({
        plan: SubscriptionPlan.ENTERPRISE,
        products: {
          used: 5000,
          limit: -1, // Unlimited
          percentage: 0,
        },
        orders: {
          used: 25000,
          limit: -1, // Unlimited
          percentage: 0,
        },
        isNearLimit: false,
      });
    });

    it('should throw error when store not found', async () => {
      mockDb.store.findUnique.mockResolvedValue(null);

      await expect(SubscriptionService.getUsageStatistics('invalid-store-id')).rejects.toThrow(
        'Store not found'
      );
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

    it('should return false for past_due subscription with expired end date', async () => {
      const mockStore = {
        subscriptionStatus: SubscriptionStatus.PAST_DUE,
        subscriptionEndsAt: new Date(Date.now() - 86400000), // Yesterday
      };
      mockDb.store.findUnique.mockResolvedValue(mockStore);

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

    it('should throw error when store not found', async () => {
      mockDb.store.findUnique.mockResolvedValue(null);

      await expect(SubscriptionService.isSubscriptionActive('invalid-store-id')).rejects.toThrow(
        'Store not found'
      );
    });
  });

  describe('assignPlan', () => {
    it('should assign plan and update store limits', async () => {
      const mockUpdatedStore = {
        id: 'store-id',
        subscriptionPlan: SubscriptionPlan.BASIC,
        productLimit: 100,
        orderLimit: 1000,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      };
      mockDb.store.update.mockResolvedValue(mockUpdatedStore);

      const result = await SubscriptionService.assignPlan('store-id', SubscriptionPlan.BASIC);

      expect(result).toEqual(mockUpdatedStore);
      expect(mockDb.store.update).toHaveBeenCalledWith({
        where: { id: 'store-id' },
        data: {
          subscriptionPlan: SubscriptionPlan.BASIC,
          productLimit: 100,
          orderLimit: 1000,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should handle enterprise unlimited plan correctly', async () => {
      const mockUpdatedStore = {
        id: 'store-id',
        subscriptionPlan: SubscriptionPlan.ENTERPRISE,
        productLimit: 999999,
        orderLimit: 999999,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      };
      mockDb.store.update.mockResolvedValue(mockUpdatedStore);

      const result = await SubscriptionService.assignPlan('store-id', SubscriptionPlan.ENTERPRISE);

      expect(result).toEqual(mockUpdatedStore);
      expect(mockDb.store.update).toHaveBeenCalledWith({
        where: { id: 'store-id' },
        data: {
          subscriptionPlan: SubscriptionPlan.ENTERPRISE,
          productLimit: 999999, // Converted from -1
          orderLimit: 999999, // Converted from -1
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should set trial status for non-free plans', async () => {
      const mockUpdatedStore = {
        id: 'store-id',
        subscriptionPlan: SubscriptionPlan.PRO,
        productLimit: 1000,
        orderLimit: 10000,
        subscriptionStatus: SubscriptionStatus.TRIAL,
      };
      mockDb.store.update.mockResolvedValue(mockUpdatedStore);

      await SubscriptionService.assignPlan('store-id', SubscriptionPlan.PRO);

      expect(mockDb.store.update).toHaveBeenCalledWith({
        where: { id: 'store-id' },
        data: {
          subscriptionPlan: SubscriptionPlan.PRO,
          productLimit: 1000,
          orderLimit: 10000,
          subscriptionStatus: SubscriptionStatus.TRIAL, // Trial for paid plans
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('getRecommendedPlan', () => {
    it('should recommend BASIC when products exceed FREE limit', async () => {
      const mockStore = {
        subscriptionPlan: SubscriptionPlan.FREE,
        productLimit: 10,
        orderLimit: 100,
      };
      mockDb.store.findUnique.mockResolvedValue(mockStore);
      mockDb.product.count.mockResolvedValue(15); // Exceeds FREE limit
      mockDb.order.count.mockResolvedValue(50);

      const result = await SubscriptionService.getRecommendedPlan('store-id');

      expect(result).toEqual({
        currentPlan: SubscriptionPlan.FREE,
        recommendedPlan: SubscriptionPlan.BASIC,
        reason: 'Your current usage exceeds the FREE plan limits',
        details: {
          products: { used: 15, limit: 10, exceeds: true },
          orders: { used: 50, limit: 100, exceeds: false },
        },
      });
    });

    it('should recommend PRO when orders exceed BASIC limit', async () => {
      const mockStore = {
        subscriptionPlan: SubscriptionPlan.BASIC,
        productLimit: 100,
        orderLimit: 1000,
      };
      mockDb.store.findUnique.mockResolvedValue(mockStore);
      mockDb.product.count.mockResolvedValue(75);
      mockDb.order.count.mockResolvedValue(1200); // Exceeds BASIC limit

      const result = await SubscriptionService.getRecommendedPlan('store-id');

      expect(result).toEqual({
        currentPlan: SubscriptionPlan.BASIC,
        recommendedPlan: SubscriptionPlan.PRO,
        reason: 'Your current usage exceeds the BASIC plan limits',
        details: {
          products: { used: 75, limit: 100, exceeds: false },
          orders: { used: 1200, limit: 1000, exceeds: true },
        },
      });
    });

    it('should recommend ENTERPRISE when usage exceeds PRO limit', async () => {
      const mockStore = {
        subscriptionPlan: SubscriptionPlan.PRO,
        productLimit: 1000,
        orderLimit: 10000,
      };
      mockDb.store.findUnique.mockResolvedValue(mockStore);
      mockDb.product.count.mockResolvedValue(1500); // Exceeds PRO limit
      mockDb.order.count.mockResolvedValue(8000);

      const result = await SubscriptionService.getRecommendedPlan('store-id');

      expect(result).toEqual({
        currentPlan: SubscriptionPlan.PRO,
        recommendedPlan: SubscriptionPlan.ENTERPRISE,
        reason: 'Your current usage exceeds the PRO plan limits',
        details: {
          products: { used: 1500, limit: 1000, exceeds: true },
          orders: { used: 8000, limit: 10000, exceeds: false },
        },
      });
    });

    it('should return null when no upgrade needed', async () => {
      const mockStore = {
        subscriptionPlan: SubscriptionPlan.BASIC,
        productLimit: 100,
        orderLimit: 1000,
      };
      mockDb.store.findUnique.mockResolvedValue(mockStore);
      mockDb.product.count.mockResolvedValue(50);
      mockDb.order.count.mockResolvedValue(300);

      const result = await SubscriptionService.getRecommendedPlan('store-id');

      expect(result).toBeNull();
    });

    it('should return null for enterprise plan', async () => {
      const mockStore = {
        subscriptionPlan: SubscriptionPlan.ENTERPRISE,
        productLimit: 999999,
        orderLimit: 999999,
      };
      mockDb.store.findUnique.mockResolvedValue(mockStore);
      mockDb.product.count.mockResolvedValue(5000);
      mockDb.order.count.mockResolvedValue(25000);

      const result = await SubscriptionService.getRecommendedPlan('store-id');

      expect(result).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDb.store.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(SubscriptionService.canCreateProduct('store-id')).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle invalid store ID format', async () => {
      await expect(SubscriptionService.canCreateProduct('')).rejects.toThrow();
    });
  });
});