// tests/unit/hooks/use-plan-enforcement.test.ts
// Unit tests for plan enforcement hooks

import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePlanEnforcement, useCanCreateProduct, useCanCreateOrder } from '@/hooks/use-plan-enforcement';
import { SubscriptionService } from '@/services/subscription-service';

// Mock SubscriptionService
vi.mock('@/services/subscription-service', () => ({
  SubscriptionService: {
    canCreateProduct: vi.fn(),
    canCreateOrder: vi.fn(),
    getUsageStatistics: vi.fn(),
    getPlanDetails: vi.fn(),
  },
}));

const mockCanCreateProduct = SubscriptionService.canCreateProduct as MockedFunction<any>;
const mockCanCreateOrder = SubscriptionService.canCreateOrder as MockedFunction<any>;
const mockGetUsageStatistics = SubscriptionService.getUsageStatistics as MockedFunction<any>;
const mockGetPlanDetails = SubscriptionService.getPlanDetails as MockedFunction<any>;

describe('Plan Enforcement Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('usePlanEnforcement', () => {
    it('should fetch plan details and usage statistics', async () => {
      mockGetPlanDetails.mockResolvedValue({
        plan: 'BASIC',
        limits: { products: 100, orders: 1000 },
        status: 'ACTIVE',
      });

      mockGetUsageStatistics.mockResolvedValue({
        products: { current: 25, limit: 100, percentage: 25 },
        orders: { current: 150, limit: 1000, percentage: 15 },
      });

      const { result } = renderHook(() => usePlanEnforcement('store-123'));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.planDetails).toMatchObject({
        plan: 'BASIC',
        limits: { products: 100, orders: 1000 },
        status: 'ACTIVE',
      });

      expect(result.current.usage).toMatchObject({
        products: { current: 25, limit: 100, percentage: 25 },
        orders: { current: 150, limit: 1000, percentage: 15 },
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle errors when fetching plan details', async () => {
      mockGetPlanDetails.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => usePlanEnforcement('store-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch plan details');
      expect(result.current.planDetails).toBeNull();
      expect(result.current.usage).toBeNull();
    });

    it('should handle errors when fetching usage statistics', async () => {
      mockGetPlanDetails.mockResolvedValue({
        plan: 'BASIC',
        limits: { products: 100, orders: 1000 },
        status: 'ACTIVE',
      });

      mockGetUsageStatistics.mockRejectedValue(new Error('Usage calculation error'));

      const { result } = renderHook(() => usePlanEnforcement('store-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch usage statistics');
      expect(result.current.planDetails).toMatchObject({
        plan: 'BASIC',
        limits: { products: 100, orders: 1000 },
        status: 'ACTIVE',
      });
      expect(result.current.usage).toBeNull();
    });

    it('should handle missing storeId', async () => {
      const { result } = renderHook(() => usePlanEnforcement(''));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Store ID is required');
      expect(result.current.planDetails).toBeNull();
      expect(result.current.usage).toBeNull();
    });

    it('should refetch data when storeId changes', async () => {
      mockGetPlanDetails.mockResolvedValue({
        plan: 'FREE',
        limits: { products: 10, orders: 100 },
        status: 'ACTIVE',
      });

      mockGetUsageStatistics.mockResolvedValue({
        products: { current: 5, limit: 10, percentage: 50 },
        orders: { current: 25, limit: 100, percentage: 25 },
      });

      const { result, rerender } = renderHook(
        (storeId) => usePlanEnforcement(storeId),
        { initialProps: 'store-123' }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetPlanDetails).toHaveBeenCalledWith('store-123');

      // Change storeId
      rerender('store-456');

      await waitFor(() => {
        expect(mockGetPlanDetails).toHaveBeenCalledWith('store-456');
      });
    });
  });

  describe('useCanCreateProduct', () => {
    it('should return true when product creation is allowed', async () => {
      mockCanCreateProduct.mockResolvedValue(true);

      const { result } = renderHook(() => useCanCreateProduct('store-123'));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canCreate).toBe(true);
      expect(result.current.error).toBeNull();
      expect(mockCanCreateProduct).toHaveBeenCalledWith('store-123');
    });

    it('should return false when product limit is reached', async () => {
      mockCanCreateProduct.mockResolvedValue(false);

      const { result } = renderHook(() => useCanCreateProduct('store-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canCreate).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle errors when checking product creation limit', async () => {
      mockCanCreateProduct.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useCanCreateProduct('store-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canCreate).toBe(false); // Default to false on error
      expect(result.current.error).toBe('Failed to check product creation limit');
    });

    it('should handle missing storeId', async () => {
      const { result } = renderHook(() => useCanCreateProduct(''));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canCreate).toBe(false);
      expect(result.current.error).toBe('Store ID is required');
    });

    it('should refetch when storeId changes', async () => {
      mockCanCreateProduct.mockResolvedValue(true);

      const { result, rerender } = renderHook(
        (storeId) => useCanCreateProduct(storeId),
        { initialProps: 'store-123' }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockCanCreateProduct).toHaveBeenCalledWith('store-123');

      // Change storeId
      rerender('store-456');

      await waitFor(() => {
        expect(mockCanCreateProduct).toHaveBeenCalledWith('store-456');
      });
    });
  });

  describe('useCanCreateOrder', () => {
    it('should return true when order creation is allowed', async () => {
      mockCanCreateOrder.mockResolvedValue(true);

      const { result } = renderHook(() => useCanCreateOrder('store-123'));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canCreate).toBe(true);
      expect(result.current.error).toBeNull();
      expect(mockCanCreateOrder).toHaveBeenCalledWith('store-123');
    });

    it('should return false when order limit is reached', async () => {
      mockCanCreateOrder.mockResolvedValue(false);

      const { result } = renderHook(() => useCanCreateOrder('store-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canCreate).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle errors when checking order creation limit', async () => {
      mockCanCreateOrder.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useCanCreateOrder('store-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canCreate).toBe(false); // Default to false on error
      expect(result.current.error).toBe('Failed to check order creation limit');
    });

    it('should handle missing storeId', async () => {
      const { result } = renderHook(() => useCanCreateOrder(''));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.canCreate).toBe(false);
      expect(result.current.error).toBe('Store ID is required');
    });

    it('should refetch when storeId changes', async () => {
      mockCanCreateOrder.mockResolvedValue(true);

      const { result, rerender } = renderHook(
        (storeId) => useCanCreateOrder(storeId),
        { initialProps: 'store-123' }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockCanCreateOrder).toHaveBeenCalledWith('store-123');

      // Change storeId
      rerender('store-456');

      await waitFor(() => {
        expect(mockCanCreateOrder).toHaveBeenCalledWith('store-456');
      });
    });
  });

  describe('Hook interactions and edge cases', () => {
    it('should handle concurrent hook usage', async () => {
      mockGetPlanDetails.mockResolvedValue({
        plan: 'PRO',
        limits: { products: 1000, orders: 10000 },
        status: 'ACTIVE',
      });

      mockGetUsageStatistics.mockResolvedValue({
        products: { current: 500, limit: 1000, percentage: 50 },
        orders: { current: 2000, limit: 10000, percentage: 20 },
      });

      mockCanCreateProduct.mockResolvedValue(true);
      mockCanCreateOrder.mockResolvedValue(true);

      const { result: planResult } = renderHook(() => usePlanEnforcement('store-123'));
      const { result: productResult } = renderHook(() => useCanCreateProduct('store-123'));
      const { result: orderResult } = renderHook(() => useCanCreateOrder('store-123'));

      await waitFor(() => {
        expect(planResult.current.loading).toBe(false);
        expect(productResult.current.loading).toBe(false);
        expect(orderResult.current.loading).toBe(false);
      });

      expect(planResult.current.planDetails?.plan).toBe('PRO');
      expect(productResult.current.canCreate).toBe(true);
      expect(orderResult.current.canCreate).toBe(true);
    });

    it('should handle network timeouts gracefully', async () => {
      const timeoutError = new Error('Network timeout');
      (timeoutError as any).code = 'ETIMEDOUT';
      
      mockGetPlanDetails.mockRejectedValue(timeoutError);

      const { result } = renderHook(() => usePlanEnforcement('store-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch plan details');
    });

    it('should handle rapid storeId changes', async () => {
      mockCanCreateProduct.mockResolvedValue(true);

      const { result, rerender } = renderHook(
        (storeId) => useCanCreateProduct(storeId),
        { initialProps: 'store-123' }
      );

      // Rapid changes
      rerender('store-456');
      rerender('store-789');
      rerender('store-abc');

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have called with the latest storeId
      expect(mockCanCreateProduct).toHaveBeenCalledWith('store-abc');
    });
  });
});