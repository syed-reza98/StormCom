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
  },
}));

// Import the mocked prisma
import { prisma } from '../../../src/lib/db';

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
      const mockOrders = [
        { totalAmount: 100.50 },
        { totalAmount: 250.75 },
      ];

      prisma.order.findMany.mockResolvedValue(mockOrders);

      // Act
      const result = await analyticsService.getSalesMetrics(storeId, dateRange);

      // Assert
      expect(result).toEqual({
        totalSales: 351.25,
        totalRevenue: 351.25,
        orderCount: 2,
        averageOrderValue: 175.625,
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith({
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
        select: {
          totalAmount: true,
        },
      });
    });

    it('should handle zero sales gracefully', async () => {
      // Arrange
      prisma.order.findMany.mockResolvedValue([]);

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

    it('should handle database errors gracefully', async () => {
      // Arrange
      prisma.order.findMany.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(
        analyticsService.getSalesMetrics(storeId, dateRange)
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('getRevenueByPeriod', () => {
    it('should return revenue data grouped by day', async () => {
      // Arrange
      const mockOrders = [
        {
          createdAt: new Date('2025-01-15T10:00:00Z'),
          totalAmount: 100.00,
        },
        {
          createdAt: new Date('2025-01-15T15:00:00Z'),
          totalAmount: 200.00,
        },
        {
          createdAt: new Date('2025-01-16T10:00:00Z'),
          totalAmount: 150.00,
        },
      ];

      prisma.order.findMany.mockResolvedValue(mockOrders);

      // Act
      const result = await analyticsService.getRevenueByPeriod(storeId, dateRange, 'day');

      // Assert
      expect(result).toEqual([
        {
          date: '2025-01-15',
          revenue: 300.00,
          orderCount: 2,
        },
        {
          date: '2025-01-16',
          revenue: 150.00,
          orderCount: 1,
        },
      ]);
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

      prisma.order.findMany.mockResolvedValue(mockOrders);

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

      prisma.order.findMany.mockResolvedValue(mockOrders);

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
      prisma.order.findMany.mockResolvedValue([]);

      // Act
      const result = await analyticsService.getRevenueByPeriod(storeId, dateRange);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getTopSellingProducts', () => {
    it('should return top selling products', async () => {
      // Arrange
      const mockOrders = [
        {
          orderItems: [
            {
              productId: 'prod1',
              quantity: 2,
              totalPrice: 200.00,
              product: {
                id: 'prod1',
                name: 'Gaming Laptop',
                sku: 'LAPTOP-001',
                price: 1299.99,
                image: 'laptop.jpg',
              },
            },
            {
              productId: 'prod2',
              quantity: 1,
              totalPrice: 50.00,
              product: {
                id: 'prod2',
                name: 'Wireless Mouse',
                sku: 'MOUSE-001',
                price: 49.99,
                image: 'mouse.jpg',
              },
            },
          ],
        },
      ];

      prisma.order.findMany.mockResolvedValue(mockOrders);

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
      const mockProducts = Array.from({ length: 15 }, (_, i) => ({
        orderItems: [
          {
            productId: `prod${i + 1}`,
            quantity: 1,
            totalPrice: 10.00,
            product: {
              id: `prod${i + 1}`,
              name: `Product ${i + 1}`,
              sku: `SKU-${String(i + 1).padStart(3, '0')}`,
              price: 10.00,
              image: null,
            },
          },
        ],
      }));

      prisma.order.findMany.mockResolvedValue(mockProducts);

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
      const mockNewCustomers = [
        { id: 'cust1', createdAt: new Date('2025-01-10') },
        { id: 'cust2', createdAt: new Date('2025-01-20') },
      ];

      prisma.customer.count.mockResolvedValueOnce(mockTotalCustomers);
      prisma.customer.findMany.mockResolvedValue(mockNewCustomers);

      // Act
      const result = await analyticsService.getCustomerMetrics(storeId, dateRange);

      // Assert
      expect(result).toMatchObject({
        totalCustomers: 150,
        newCustomers: 2,
        returningCustomers: 148,
      });

      expect(result.customerRetentionRate).toBeCloseTo(98.67, 2);
    });

    it('should handle zero customers gracefully', async () => {
      // Arrange
      prisma.customer.count.mockResolvedValue(0);
      prisma.customer.findMany.mockResolvedValue([]);

      // Act
      const result = await analyticsService.getCustomerMetrics(storeId, dateRange);

      // Assert
      expect(result).toEqual({
        totalCustomers: 0,
        newCustomers: 0,
        returningCustomers: 0,
        customerRetentionRate: 0,
      });
    });
  });

  describe('getDashboardAnalytics', () => {
    it('should return comprehensive dashboard analytics', async () => {
      // Arrange
      prisma.order.findMany
        .mockResolvedValueOnce([{ totalAmount: 100 }]) // getSalesMetrics
        .mockResolvedValueOnce([{ createdAt: new Date(), totalAmount: 100 }]) // getRevenueByPeriod
        .mockResolvedValueOnce([{ orderItems: [] }]); // getTopSellingProducts

      prisma.customer.count.mockResolvedValue(50);
      prisma.customer.findMany.mockResolvedValue([]);

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
      prisma.order.findMany.mockResolvedValue([]);

      // Act
      const result = await analyticsService.getSalesMetrics('', dateRange);

      // Assert
      expect(result).toBeDefined();
      expect(result.orderCount).toBe(0);
    });

    it('should handle future date ranges', async () => {
      // Arrange
      const futureDateRange = {
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      };

      prisma.order.findMany.mockResolvedValue([]);

      // Act
      const result = await analyticsService.getSalesMetrics(storeId, futureDateRange);

      // Assert
      expect(result.orderCount).toBe(0);
    });

    it('should handle database connection timeouts', async () => {
      // Arrange
      prisma.order.findMany.mockRejectedValue(new Error('Connection timeout'));

      // Act & Assert
      await expect(
        analyticsService.getSalesMetrics(storeId, dateRange)
      ).rejects.toThrow('Connection timeout');
    });
  });

  describe('Performance Considerations', () => {
    it('should use appropriate filters for performance', async () => {
      // Arrange
      prisma.order.findMany.mockResolvedValue([]);

      // Act
      await analyticsService.getSalesMetrics(storeId, dateRange);

      // Assert - Verify query includes proper filters
      expect(prisma.order.findMany).toHaveBeenCalledWith(
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
      prisma.order.findMany.mockResolvedValue([]);

      // Act
      await analyticsService.getSalesMetrics(storeId, dateRange);

      // Assert
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            totalAmount: true,
          },
        })
      );
    });
  });
});
