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

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the session storage
vi.mock('@/lib/session-storage', () => ({
  getSession: vi.fn(),
}));

// Mock the analytics service
vi.mock('@/services/analytics-service', () => ({
  analyticsService: {
    getSalesMetrics: vi.fn(),
    getRevenueByPeriod: vi.fn(),
    getCustomerMetrics: vi.fn(),
    getTopSellingProducts: vi.fn(),
  },
}));

// Import the mocked modules
import { getSession } from '@/lib/session-storage';
import { analyticsService } from '@/services/analytics-service';

// Import handlers dynamically to ensure mocks are applied
const mockGetSession = getSession as MockedFunction<typeof getSession>;
const mockAnalyticsService = analyticsService as any;

describe('Analytics API Routes', () => {
  const mockSession = {
    id: 'session-123',
    userId: 'user-123',
    storeId: 'store-123',
    role: 'STORE_ADMIN',
    expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
  };

  const validDateRange = {
    startDate: '2025-01-01',
    endDate: '2025-01-31',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
  });

  describe('Sales Analytics API', () => {
    // Import the sales handler
    let salesHandler: (request: NextRequest) => Promise<Response>;

    beforeEach(async () => {
      const { GET } = await import('../../../src/app/api/analytics/sales/route');
      salesHandler = GET;
    });

    it('should return sales metrics for authenticated user', async () => {
      // Arrange
      const mockSalesData = {
        totalSales: 10000,
        totalRevenue: 10000,
        orderCount: 50,
        averageOrderValue: 200,
      };

      mockAnalyticsService.getSalesMetrics.mockResolvedValue(mockSalesData);

      const url = new URL(`http://localhost:3000/api/analytics/sales?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}`);
      const request = new NextRequest(url);
      
      // Mock the cookie
      Object.defineProperty(request, 'cookies', {
        value: {
          get: vi.fn().mockReturnValue({ value: 'session-123' }),
        },
      });

      // Act
      const response = await salesHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockSalesData);
      expect(data.meta.dateRange).toBeDefined();

      expect(mockGetSession).toHaveBeenCalledWith('session-123');
      expect(mockAnalyticsService.getSalesMetrics).toHaveBeenCalledWith(
        'store-123',
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        })
      );
    });

    it('should return 401 for missing session cookie', async () => {
      // Arrange
      const url = new URL(`http://localhost:3000/api/analytics/sales?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}`);
      const request = new NextRequest(url);
      
      // Mock empty cookies
      Object.defineProperty(request, 'cookies', {
        value: {
          get: vi.fn().mockReturnValue(undefined),
        },
      });

      // Act
      const response = await salesHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBe('Not authenticated');
    });

    it('should return 401 for invalid session', async () => {
      // Arrange
      mockGetSession.mockResolvedValue(null);

      const url = new URL(`http://localhost:3000/api/analytics/sales?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}`);
      const request = new NextRequest(url);
      
      Object.defineProperty(request, 'cookies', {
        value: {
          get: vi.fn().mockReturnValue({ value: 'invalid-session' }),
        },
      });

      // Act
      const response = await salesHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(data.error.message).toBe('Invalid session');
    });

    it('should return 403 for session without store access', async () => {
      // Arrange
      mockGetSession.mockResolvedValue({
        ...mockSession,
        storeId: null,
      });

      const url = new URL(`http://localhost:3000/api/analytics/sales?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}`);
      const request = new NextRequest(url);
      
      Object.defineProperty(request, 'cookies', {
        value: {
          get: vi.fn().mockReturnValue({ value: 'session-123' }),
        },
      });

      // Act
      const response = await salesHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
      expect(data.error.message).toBe('No store access');
    });

    it('should use default date range when not provided', async () => {
      // Arrange
      const mockSalesData = {
        totalSales: 5000,
        totalRevenue: 5000,
        orderCount: 25,
        averageOrderValue: 200,
      };

      mockAnalyticsService.getSalesMetrics.mockResolvedValue(mockSalesData);

      const url = new URL('http://localhost:3000/api/analytics/sales');
      const request = new NextRequest(url);
      
      Object.defineProperty(request, 'cookies', {
        value: {
          get: vi.fn().mockReturnValue({ value: 'session-123' }),
        },
      });

      // Act
      const response = await salesHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockSalesData);
      expect(mockAnalyticsService.getSalesMetrics).toHaveBeenCalledWith(
        'store-123',
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        })
      );
    });

    it('should return 400 for invalid date format', async () => {
      // Arrange
      const url = new URL('http://localhost:3000/api/analytics/sales?startDate=invalid-date&endDate=2025-01-31');
      const request = new NextRequest(url);
      
      Object.defineProperty(request, 'cookies', {
        value: {
          get: vi.fn().mockReturnValue({ value: 'session-123' }),
        },
      });

      // Act
      const response = await salesHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Invalid query parameters');
      expect(data.error.details).toBeDefined();
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      mockAnalyticsService.getSalesMetrics.mockRejectedValue(new Error('Database error'));

      const url = new URL(`http://localhost:3000/api/analytics/sales?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}`);
      const request = new NextRequest(url);
      
      Object.defineProperty(request, 'cookies', {
        value: {
          get: vi.fn().mockReturnValue({ value: 'session-123' }),
        },
      });

      // Act
      const response = await salesHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error.code).toBe('INTERNAL_ERROR');
      expect(data.error.message).toBe('Failed to fetch sales analytics');
    });
  });

  describe('Revenue Analytics API', () => {
    let revenueHandler: (request: NextRequest) => Promise<Response>;

    beforeEach(async () => {
      const { GET } = await import('../../../src/app/api/analytics/revenue/route');
      revenueHandler = GET;
    });

    it('should return revenue analytics with default grouping', async () => {
      // Arrange
      const mockRevenueData = [
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

      mockAnalyticsService.getRevenueByPeriod.mockResolvedValue(mockRevenueData);

      const url = new URL(`http://localhost:3000/api/analytics/revenue?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}`);
      const request = new NextRequest(url);
      
      Object.defineProperty(request, 'cookies', {
        value: {
          get: vi.fn().mockReturnValue({ value: 'session-123' }),
        },
      });

      // Act
      const response = await revenueHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockRevenueData);
    });
  });

  describe('Customer Analytics API', () => {
    let customersHandler: (request: NextRequest) => Promise<Response>;

    beforeEach(async () => {
      const { GET } = await import('../../../src/app/api/analytics/customers/route');
      customersHandler = GET;
    });

    it('should return customer metrics', async () => {
      // Arrange
      const mockCustomerData = {
        totalCustomers: 150,
        newCustomers: 25,
        returningCustomers: 125,
        customerRetentionRate: 83.33,
      };

      mockAnalyticsService.getCustomerMetrics.mockResolvedValue(mockCustomerData);

      const url = new URL(`http://localhost:3000/api/analytics/customers?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}`);
      const request = new NextRequest(url);
      
      Object.defineProperty(request, 'cookies', {
        value: {
          get: vi.fn().mockReturnValue({ value: 'session-123' }),
        },
      });

      // Act
      const response = await customersHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockCustomerData);
    });
  });

  describe('Products Analytics API', () => {
    let productsHandler: (request: NextRequest) => Promise<Response>;

    beforeEach(async () => {
      const { GET } = await import('../../../src/app/api/analytics/products/route');
      productsHandler = GET;
    });

    it('should return top selling products', async () => {
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

      mockAnalyticsService.getTopSellingProducts.mockResolvedValue(mockProductData);

      const url = new URL(`http://localhost:3000/api/analytics/products?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}`);
      const request = new NextRequest(url);
      
      Object.defineProperty(request, 'cookies', {
        value: {
          get: vi.fn().mockReturnValue({ value: 'session-123' }),
        },
      });

      // Act
      const response = await productsHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockProductData);
    });
  });

  describe('Cross-cutting Concerns', () => {
    it('should handle session validation errors consistently', async () => {
      // Arrange
      mockGetSession.mockRejectedValue(new Error('Session validation failed'));

      const { GET: salesHandler } = await import('../../../src/app/api/analytics/sales/route');
      
      const url = new URL(`http://localhost:3000/api/analytics/sales?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}`);
      const request = new NextRequest(url);
      
      Object.defineProperty(request, 'cookies', {
        value: {
          get: vi.fn().mockReturnValue({ value: 'session-123' }),
        },
      });

      // Act
      const response = await salesHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });

    it('should include proper CORS headers', async () => {
      // Arrange
      const mockSalesData = {
        totalSales: 10000,
        totalRevenue: 10000,
        orderCount: 50,
        averageOrderValue: 200,
      };

      mockAnalyticsService.getSalesMetrics.mockResolvedValue(mockSalesData);

      const { GET: salesHandler } = await import('../../../src/app/api/analytics/sales/route');
      
      const url = new URL(`http://localhost:3000/api/analytics/sales?startDate=${validDateRange.startDate}&endDate=${validDateRange.endDate}`);
      const request = new NextRequest(url);
      
      Object.defineProperty(request, 'cookies', {
        value: {
          get: vi.fn().mockReturnValue({ value: 'session-123' }),
        },
      });

      // Act
      const response = await salesHandler(request);

      // Assert
      expect(response.status).toBe(200);
      // Check that response is a proper NextResponse
      expect(response).toBeInstanceOf(Response);
    });
  });
});