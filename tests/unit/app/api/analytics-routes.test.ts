/**
 * Unit Tests: Analytics API Routes
 * 
 * Tests all analytics API endpoints for proper authentication,
 * data validation, error handling, and response formatting.
 * 
 * Test Coverage:
 * - GET /api/analytics/sales - Sales metrics endpoint
 * - GET /api/analytics/revenue - Revenue analytics endpoint 
 * - GET /api/analytics/customers - Customer metrics endpoint
 * - GET /api/analytics/products - Product performance endpoint
 * - Authentication and authorization
 * - Request validation and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as salesHandler } from '../../../src/app/api/analytics/sales/route';
import { GET as revenueHandler } from '../../../src/app/api/analytics/revenue/route';
import { GET as customersHandler } from '../../../src/app/api/analytics/customers/route';
import { GET as productsHandler } from '../../../src/app/api/analytics/products/route';

// Mock the analytics service
vi.mock('../../../src/services/analytics-service', () => ({
  AnalyticsService: vi.fn().mockImplementation(() => ({
    getSalesMetrics: vi.fn(),
    getRevenueByPeriod: vi.fn(),
    getCustomerMetrics: vi.fn(),
    getTopSellingProducts: vi.fn(),
  })),
}));

// Mock session storage
vi.mock('../../../src/lib/session-storage', () => ({
  getSessionFromCookies: vi.fn(),
}));

import { AnalyticsService } from '../../../src/services/analytics-service';
import { getSessionFromCookies } from '../../../src/lib/session-storage';

const mockAnalyticsService = AnalyticsService as any;
const mockGetSession = getSessionFromCookies as any;

describe('Analytics API Routes', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      storeId: 'store-123',
      role: 'STORE_ADMIN',
    },
  };

  const validDateRange = {
    startDate: '2025-01-01',
    endDate: '2025-01-31',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
  });

  describe('GET /api/analytics/sales', () => {
    it('should return sales metrics for authenticated user', async () => {
      // Arrange
      const mockSalesData = {
        totalSales: 10000,
        totalRevenue: 10000,
        orderCount: 50,
        averageOrderValue: 200,
      };

      mockAnalyticsService.prototype.getSalesMetrics.mockResolvedValue(mockSalesData);

      const url = new URL(`http://localhost:3000/api/analytics/sales?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}`);
      const request = new NextRequest(url);

      // Act
      const response = await salesHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        data: mockSalesData,
        message: 'Sales metrics retrieved successfully',
      });

      expect(mockAnalyticsService.prototype.getSalesMetrics).toHaveBeenCalledWith(
        'store-123',
        {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
        }
      );
    });

    it('should return 401 for unauthenticated requests', async () => {
      // Arrange
      mockGetSession.mockResolvedValue(null);

      const url = new URL(`http://localhost:3000/api/analytics/sales?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}`);
      const request = new NextRequest(url);

      // Act
      const response = await salesHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    });

    it('should return 400 for missing date parameters', async () => {
      // Arrange
      const url = new URL('http://localhost:3000/api/analytics/sales');
      const request = new NextRequest(url);

      // Act
      const response = await salesHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('startDate');
      expect(data.error.message).toContain('endDate');
    });

    it('should return 400 for invalid date format', async () => {
      // Arrange
      const url = new URL('http://localhost:3000/api/analytics/sales?startDate=invalid-date&endDate=2025-01-31');
      const request = new NextRequest(url);

      // Act
      const response = await salesHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Invalid date');
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      mockAnalyticsService.prototype.getSalesMetrics.mockRejectedValue(new Error('Database error'));

      const url = new URL(`http://localhost:3000/api/analytics/sales?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}`);
      const request = new NextRequest(url);

      // Act
      const response = await salesHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error.code).toBe('INTERNAL_ERROR');
      expect(data.error.message).toBe('Failed to retrieve sales metrics');
    });
  });

  describe('GET /api/analytics/orders', () => {
    it('should return order analytics with default grouping', async () => {
      // Arrange
      const mockOrderData = [
        {
          date: '2025-01-15',
          revenue: 500,
          orderCount: 5,
        },
        {
          date: '2025-01-16',
          revenue: 750,
          orderCount: 8,
        },
      ];

      mockAnalyticsService.prototype.getRevenueByPeriod.mockResolvedValue(mockOrderData);

      const url = new URL(`http://localhost:3000/api/analytics/orders?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}`);
      const request = new NextRequest(url);

      // Act
      const response = await ordersHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockOrderData);
      expect(mockAnalyticsService.prototype.getRevenueByPeriod).toHaveBeenCalledWith(
        'store-123',
        {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
        },
        'day'
      );
    });

    it('should support custom groupBy parameter', async () => {
      // Arrange
      const mockOrderData = [
        {
          date: '2025-01',
          revenue: 2500,
          orderCount: 25,
        },
      ];

      mockAnalyticsService.prototype.getRevenueByPeriod.mockResolvedValue(mockOrderData);

      const url = new URL(`http://localhost:3000/api/analytics/orders?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}&groupBy=month`);
      const request = new NextRequest(url);

      // Act
      const response = await ordersHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(mockAnalyticsService.prototype.getRevenueByPeriod).toHaveBeenCalledWith(
        'store-123',
        {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
        },
        'month'
      );
    });

    it('should reject invalid groupBy values', async () => {
      // Arrange
      const url = new URL(`http://localhost:3000/api/analytics/orders?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}&groupBy=invalid`);
      const request = new NextRequest(url);

      // Act
      const response = await ordersHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('groupBy');
    });
  });

  describe('GET /api/analytics/customers', () => {
    it('should return customer metrics', async () => {
      // Arrange
      const mockCustomerData = {
        totalCustomers: 150,
        newCustomers: 25,
        returningCustomers: 125,
        customerRetentionRate: 83.33,
      };

      mockAnalyticsService.prototype.getCustomerMetrics.mockResolvedValue(mockCustomerData);

      const url = new URL(`http://localhost:3000/api/analytics/customers?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}`);
      const request = new NextRequest(url);

      // Act
      const response = await customersHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockCustomerData);
      expect(mockAnalyticsService.prototype.getCustomerMetrics).toHaveBeenCalledWith(
        'store-123',
        {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
        }
      );
    });

    it('should handle zero customer data', async () => {
      // Arrange
      const mockCustomerData = {
        totalCustomers: 0,
        newCustomers: 0,
        returningCustomers: 0,
        customerRetentionRate: 0,
      };

      mockAnalyticsService.prototype.getCustomerMetrics.mockResolvedValue(mockCustomerData);

      const url = new URL(`http://localhost:3000/api/analytics/customers?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}`);
      const request = new NextRequest(url);

      // Act
      const response = await customersHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockCustomerData);
    });
  });

  describe('GET /api/analytics/products', () => {
    it('should return top selling products with default limit', async () => {
      // Arrange
      const mockProductData = [
        {
          id: 'prod-1',
          name: 'Gaming Laptop',
          totalQuantity: 25,
          totalRevenue: 12500,
          orderCount: 15,
        },
        {
          id: 'prod-2',
          name: 'Wireless Mouse',
          totalQuantity: 50,
          totalRevenue: 2500,
          orderCount: 30,
        },
      ];

      mockAnalyticsService.prototype.getTopSellingProducts.mockResolvedValue(mockProductData);

      const url = new URL(`http://localhost:3000/api/analytics/products?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}`);
      const request = new NextRequest(url);

      // Act
      const response = await productsHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockProductData);
      expect(mockAnalyticsService.prototype.getTopSellingProducts).toHaveBeenCalledWith(
        'store-123',
        {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
        },
        10
      );
    });

    it('should support custom limit parameter', async () => {
      // Arrange
      const mockProductData = [
        {
          id: 'prod-1',
          name: 'Gaming Laptop',
          totalQuantity: 25,
          totalRevenue: 12500,
          orderCount: 15,
        },
      ];

      mockAnalyticsService.prototype.getTopSellingProducts.mockResolvedValue(mockProductData);

      const url = new URL(`http://localhost:3000/api/analytics/products?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}&limit=5`);
      const request = new NextRequest(url);

      // Act
      const response = await productsHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(mockAnalyticsService.prototype.getTopSellingProducts).toHaveBeenCalledWith(
        'store-123',
        {
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-31'),
        },
        5
      );
    });

    it('should reject invalid limit values', async () => {
      // Arrange
      const url = new URL(`http://localhost:3000/api/analytics/products?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}&limit=invalid`);
      const request = new NextRequest(url);

      // Act
      const response = await productsHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('limit');
    });

    it('should enforce maximum limit', async () => {
      // Arrange
      const url = new URL(`http://localhost:3000/api/analytics/products?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}&limit=1000`);
      const request = new NextRequest(url);

      // Act
      const response = await productsHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('limit');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require valid session for all endpoints', async () => {
      // Arrange
      mockGetSession.mockResolvedValue(null);
      const endpoints = [
        salesHandler,
        ordersHandler,
        customersHandler,
        productsHandler,
      ];

      for (const handler of endpoints) {
        const url = new URL(`http://localhost:3000/api/analytics/test?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}`);
        const request = new NextRequest(url);

        // Act
        const response = await handler(request);

        // Assert
        expect(response.status).toBe(401);
      }
    });

    it('should require store access', async () => {
      // Arrange
      mockGetSession.mockResolvedValue({
        user: {
          id: 'user-123',
          storeId: null, // No store access
          role: 'CUSTOMER',
        },
      });

      const url = new URL(`http://localhost:3000/api/analytics/sales?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}`);
      const request = new NextRequest(url);

      // Act
      const response = await salesHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Rate Limiting and Performance', () => {
    it('should handle concurrent requests efficiently', async () => {
      // Arrange
      const mockSalesData = {
        totalSales: 10000,
        totalRevenue: 10000,
        orderCount: 50,
        averageOrderValue: 200,
      };

      mockAnalyticsService.prototype.getSalesMetrics.mockResolvedValue(mockSalesData);

      const requests = Array.from({ length: 5 }, () => {
        const url = new URL(`http://localhost:3000/api/analytics/sales?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}`);
        return salesHandler(new NextRequest(url));
      });

      // Act
      const responses = await Promise.all(requests);

      // Assert
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Service should be called for each request
      expect(mockAnalyticsService.prototype.getSalesMetrics).toHaveBeenCalledTimes(5);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed request URLs', async () => {
      // Arrange
      const url = new URL('http://localhost:3000/api/analytics/sales?startDate=2025-01-01&endDate=');
      const request = new NextRequest(url);

      // Act
      const response = await salesHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle database connection failures', async () => {
      // Arrange
      mockAnalyticsService.prototype.getSalesMetrics.mockRejectedValue(new Error('ECONNREFUSED'));

      const url = new URL(`http://localhost:3000/api/analytics/sales?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}`);
      const request = new NextRequest(url);

      // Act
      const response = await salesHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });

    it('should handle session validation errors', async () => {
      // Arrange
      mockGetSession.mockRejectedValue(new Error('Session validation failed'));

      const url = new URL(`http://localhost:3000/api/analytics/sales?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}`);
      const request = new NextRequest(url);

      // Act
      const response = await salesHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });
});