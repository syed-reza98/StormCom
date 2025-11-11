/**
 * Unit Tests: AnalyticsService
 * 
 * Tests analytics service functions for sales metrics, revenue analytics,
 * customer insights, and product performance data.
 * 
 * Test Coverage:
 * - Sales metrics calculation and aggregation
 * - Revenue analytics with date grouping
 * - Customer acquisition and retention metrics
 * - Top-selling products analytics
 * - Error handling and edge cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService, type DateRange } from '../../../src/services/analytics-service';

// Mock the database at the top level
vi.mock('../../../src/lib/db', () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
    customer: {
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    orderItem: {
      groupBy: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
    },
    $queryRawUnsafe: vi.fn(),
  },
}));

// Import the mocked prisma
import { prisma } from '../../../src/lib/db';

// Create typed mock wrappers
const mockPrisma = {
  order: {
    findMany: vi.mocked(prisma.order.findMany),
    count: vi.mocked(prisma.order.count),
    aggregate: vi.mocked(prisma.order.aggregate),
    groupBy: vi.mocked(prisma.order.groupBy),
  },
  customer: {
    findMany: vi.mocked(prisma.customer.findMany),
    count: vi.mocked(prisma.customer.count),
    groupBy: vi.mocked(prisma.customer.groupBy),
  },
  orderItem: {
    groupBy: vi.mocked(prisma.orderItem.groupBy),
  },
  product: {
    findMany: vi.mocked(prisma.product.findMany),
  },
  $queryRawUnsafe: vi.mocked(prisma.$queryRawUnsafe),
};

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  const storeId = 'test-store-id';
  const dateRange: DateRange = {
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    analyticsService = new AnalyticsService();
  });

  describe('getSalesMetrics', () => {
    it('should return correct sales metrics for valid date range', async () => {
      // Arrange
      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: {
          totalAmount: 351.25,
        },
        _count: 2,
      } as any);

      // Act
      const result = await analyticsService.getSalesMetrics(storeId, dateRange);

      // Assert
      expect(result).toEqual({
        totalSales: 351.25,
        totalRevenue: 351.25,
        orderCount: 2,
        averageOrderValue: 175.625,
      });

      expect(mockPrisma.order.aggregate).toHaveBeenCalledWith({
        where: {
          storeId,
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
          status: {
            in: ['PROCESSING', 'SHIPPED', 'DELIVERED'],
          },
          deletedAt: null,
        },
        _sum: {
          totalAmount: true,
        },
        _count: true,
      });
    });

    it('should handle zero sales gracefully', async () => {
      // Arrange
      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: {
          totalAmount: null,
        },
        _count: 0,
      } as any);

      // Act
      const result = await analyticsService.getSalesMetrics(storeId, dateRange);

      // Assert
      expect(result).toEqual({
        totalSales: 0,
        totalRevenue: 0,
        orderCount: 0,
        averageOrderValue: 0,
      });
    });

    it('should return revenue data grouped by week', async () => {
      // Arrange
      const mockOrders = [
        {
          createdAt: new Date('2025-01-15T10:00:00Z'), // Wednesday
          totalAmount: 100.00,
        },
        {
          createdAt: new Date('2025-01-17T10:00:00Z'), // Friday (same week)
          totalAmount: 200.00,
        },
      ];

      mockPrisma.order.findMany.mockResolvedValue(mockOrders as any);

      // Act
      const result = await analyticsService.getRevenueByPeriod(storeId, dateRange, 'week');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        revenue: 300.00,
        orderCount: 2,
      });
    });

    it('should return revenue data grouped by month', async () => {
      // Arrange
      const mockOrders = [
        {
          createdAt: new Date('2025-01-15T10:00:00Z'),
          totalAmount: 100.00,
        },
        {
          createdAt: new Date('2025-01-25T10:00:00Z'),
          totalAmount: 200.00,
        },
      ];

      mockPrisma.order.findMany.mockResolvedValue(mockOrders as any);

      // Act
      const result = await analyticsService.getRevenueByPeriod(storeId, dateRange, 'month');

      // Assert
      expect(result).toEqual([
        {
          date: '2025-01',
          revenue: 300.00,
          orderCount: 2,
        },
      ]);
    });

    it('should handle empty order data', async () => {
      // Arrange
      mockPrisma.order.findMany.mockResolvedValue([] as any);

      // Act
      const result = await analyticsService.getRevenueByPeriod(storeId, dateRange, 'day');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getTopSellingProducts', () => {
    it('should return top selling products', async () => {
      // Arrange
      const mockGroupByResults = [
        {
          productId: 'prod1',
          _sum: { quantity: 2, totalAmount: 200.00 },
          _count: { _all: 1 },
        },
        {
          productId: 'prod2',
          _sum: { quantity: 1, totalAmount: 50.00 },
          _count: { _all: 1 },
        },
      ];

      const mockProducts = [
        { id: 'prod1', name: 'Gaming Laptop' },
        { id: 'prod2', name: 'Wireless Mouse' },
      ];

      mockPrisma.orderItem.groupBy.mockResolvedValue(mockGroupByResults as any);
      mockPrisma.product.findMany.mockResolvedValue(mockProducts as any);

      // Act
      const result = await analyticsService.getTopSellingProducts(storeId, dateRange, 10);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'prod1',
        name: 'Gaming Laptop',
        totalQuantity: 2,
        totalRevenue: 200.00,
        orderCount: 1,
      });
    });

    it('should limit results correctly', async () => {
      // Arrange
      const mockGroupByResults = Array.from({ length: 5 }, (_, i) => ({
        productId: `prod${i + 1}`,
        _sum: { quantity: 1, totalAmount: 10.00 },
        _count: { _all: 1 },
      }));

      const mockProducts = Array.from({ length: 5 }, (_, i) => ({
        id: `prod${i + 1}`,
        name: `Product ${i + 1}`,
      }));

      mockPrisma.orderItem.groupBy.mockResolvedValue(mockGroupByResults as any);
      mockPrisma.product.findMany.mockResolvedValue(mockProducts as any);

      // Act
      const result = await analyticsService.getTopSellingProducts(storeId, dateRange, 5);

      // Assert
      expect(result).toHaveLength(5);
    });
  });

  describe('getCustomerMetrics', () => {
    it('should return customer acquisition metrics', async () => {
      // Arrange
      const mockTotalCustomers = 150;
      const mockNewCustomers = 2;
      
      // Mock in order of calls:
      // 1. Total customers count
      mockPrisma.customer.count.mockResolvedValueOnce(mockTotalCustomers);
      // 2. New customers count
      mockPrisma.customer.count.mockResolvedValueOnce(mockNewCustomers);
      // 3. Previous period customer count
      mockPrisma.customer.count.mockResolvedValueOnce(100);
      // 4. Returning customers raw query
      mockPrisma.$queryRawUnsafe.mockResolvedValueOnce([{ count: 2 }] as any);

      // Act
      const result = await analyticsService.getCustomerMetrics(storeId, dateRange);

      // Assert
      expect(result).toMatchObject({
        totalCustomers: 150,
        newCustomers: 2,
        returningCustomers: 2,
      });

      expect(result.customerRetentionRate).toBeDefined();
    });

    it('should handle zero customers gracefully', async () => {
      // Arrange
      // Mock getSalesMetrics (calls order.aggregate)
      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: null },
        _count: 0,
      } as any);
      
      // Mock getRevenueByPeriod (calls order.findMany)
      mockPrisma.order.findMany.mockResolvedValue([] as any);
      
      // Mock getTopSellingProducts (calls orderItem.groupBy and product.findMany)
      mockPrisma.orderItem.groupBy.mockResolvedValue([] as any);
      mockPrisma.product.findMany.mockResolvedValue([] as any);
      
      // Mock getCustomerMetrics (calls customer.count x3 and $queryRawUnsafe)
      mockPrisma.customer.count.mockResolvedValue(0); // all customer.count calls
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: 0 }] as any);

      // Act
      const result = await analyticsService.getDashboardAnalytics(storeId, dateRange);

      // Assert
      expect(result).toHaveProperty('salesMetrics');
      expect(result).toHaveProperty('revenueData');
      expect(result).toHaveProperty('topProducts');
      expect(result).toHaveProperty('customerMetrics');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid store ID', async () => {
      // Arrange
      vi.clearAllMocks(); // Ensure clean mock state
      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: null },
        _count: 0,
      } as any);

      // Act
      const result = await analyticsService.getSalesMetrics('invalid-store', dateRange);

      // Assert
      expect(result).toBeDefined();
      expect(result.orderCount).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.averageOrderValue).toBe(0);
    });

    it('should handle future date ranges', async () => {
      // Arrange
      const futureDateRange = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      };

      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: null },
        _count: 0,
      } as any);

      // Act
      const result = await analyticsService.getSalesMetrics(storeId, futureDateRange);

      // Assert
      expect(result.orderCount).toBe(0);
    });

    it('should handle database connection timeouts', async () => {
      // Arrange
      mockPrisma.order.aggregate.mockRejectedValue(new Error('Connection timeout'));

      // Act & Assert
      await expect(
        analyticsService.getSalesMetrics(storeId, dateRange)
      ).rejects.toThrow('Connection timeout');
    });
  });

  describe('Performance Considerations', () => {
    it('should use appropriate filters for performance', async () => {
      // Arrange
      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: null },
        _count: 0,
      } as any);

      // Act
      await analyticsService.getSalesMetrics(storeId, dateRange);

      // Assert - Verify query includes proper filters
      expect(mockPrisma.order.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            storeId: expect.any(String),
            deletedAt: null,
            status: {
              in: ['PROCESSING', 'SHIPPED', 'DELIVERED'],
            },
          }),
        })
      );
    });

    it('should limit data selection to required fields only', async () => {
      // Arrange
      mockPrisma.order.aggregate.mockResolvedValue({
        _sum: {
          totalAmount: 0,
        },
        _count: 0,
      } as any);

      // Act
      await analyticsService.getSalesMetrics(storeId, dateRange);

      // Assert
      expect(mockPrisma.order.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          _sum: {
            totalAmount: true,
          },
          _count: true,
        })
      );
    });
  });
});
