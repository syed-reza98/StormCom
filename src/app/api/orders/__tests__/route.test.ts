/**
 * Unit Tests for Orders API Routes
 * Tests GET /api/orders with authentication, authorization, pagination, filters, and CSV export
 * 
 * @vitest
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import * as orderService from '@/services/order-service';
import { OrderStatus } from '@prisma/client';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock order service
vi.mock('@/services/order-service', () => ({
  listOrders: vi.fn(),
  exportOrdersToCSV: vi.fn(),
}));

// Import mocked functions
import { getServerSession } from 'next-auth';

describe('GET /api/orders', () => {
  const mockSession = {
    user: {
      id: 'user-1',
      email: 'admin@store.com',
      role: 'STORE_ADMIN',
      storeId: 'store-1',
    },
  };

  const mockOrders = [
    {
      id: 'order-1',
      orderNumber: 'ORD-001',
      storeId: 'store-1',
      customerId: 'customer-1',
      userId: 'user-1',
      status: OrderStatus.PENDING,
      paymentStatus: 'PENDING' as any,
      paymentMethod: null,
      paymentGateway: null,
      shippingStatus: 'PENDING' as any,
      shippingMethod: null,
      shippingAddressId: null,
      billingAddressId: null,
      trackingNumber: null,
      trackingUrl: null,
      subtotal: 100.0,
      taxAmount: 0.0,
      shippingAmount: 0.0,
      discountAmount: 0.0,
      totalAmount: 100.0,
      discountCode: null,
      customerNote: null,
      adminNote: null,
      ipAddress: null,
      fulfilledAt: null,
      canceledAt: null,
      cancelReason: null,
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date('2025-10-01'),
      deletedAt: null,
      customer: {
        id: 'customer-1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
      },
      user: {
        id: 'user-1',
        email: 'admin@store.com',
        name: 'Admin User',
      },
      _count: {
        items: 2,
      },
    },
    {
      id: 'order-2',
      orderNumber: 'ORD-002',
      storeId: 'store-1',
      customerId: 'customer-2',
      userId: 'user-1',
      status: OrderStatus.PROCESSING,
      paymentStatus: 'PAID' as any,
      paymentMethod: 'CREDIT_CARD' as any,
      paymentGateway: 'STRIPE' as any,
      shippingStatus: 'PENDING' as any,
      shippingMethod: 'Standard',
      shippingAddressId: null,
      billingAddressId: null,
      trackingNumber: null,
      trackingUrl: null,
      subtotal: 200.0,
      taxAmount: 0.0,
      shippingAmount: 0.0,
      discountAmount: 0.0,
      totalAmount: 200.0,
      discountCode: null,
      customerNote: null,
      adminNote: null,
      ipAddress: null,
      fulfilledAt: null,
      canceledAt: null,
      cancelReason: null,
      createdAt: new Date('2025-10-02'),
      updatedAt: new Date('2025-10-02'),
      deletedAt: null,
      customer: {
        id: 'customer-2',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      },
      user: {
        id: 'user-1',
        email: 'admin@store.com',
        name: 'Admin User',
      },
      _count: {
        items: 1,
      },
    },
  ];

  const mockPagination = {
    page: 1,
    perPage: 10,
    total: 2,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/orders');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Unauthorized');
    });

    it('should return 401 if session exists but user is missing', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ user: null } as any);

      const request = new NextRequest('http://localhost:3000/api/orders');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('Authorization', () => {
    it('should return 403 if user role is not authorized', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          ...mockSession.user,
          role: 'CUSTOMER', // Not authorized
        },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/orders');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('Insufficient permissions');
    });

    it('should return 403 if non-Super Admin has no storeId', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          ...mockSession.user,
          storeId: null,
          role: 'STORE_ADMIN',
        },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/orders');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('No store assigned');
    });

    it('should allow Super Admin without storeId', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          ...mockSession.user,
          role: 'SUPER_ADMIN',
          storeId: null,
        },
      } as any);

      vi.mocked(orderService.listOrders).mockResolvedValue({
        orders: mockOrders,
        pagination: mockPagination,
      });

      const request = new NextRequest('http://localhost:3000/api/orders');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should allow Store Admin with orders', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(orderService.listOrders).mockResolvedValue({
        orders: mockOrders,
        pagination: mockPagination,
      });

      const request = new NextRequest('http://localhost:3000/api/orders');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should allow Staff with orders', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          ...mockSession.user,
          role: 'STAFF',
        },
      } as any);

      vi.mocked(orderService.listOrders).mockResolvedValue({
        orders: mockOrders,
        pagination: mockPagination,
      });

      const request = new NextRequest('http://localhost:3000/api/orders');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Query Parameters', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(orderService.listOrders).mockResolvedValue({
        orders: mockOrders,
        pagination: mockPagination,
      });
    });

    it('should use default pagination if not specified', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders');
      await GET(request);

      expect(orderService.listOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          perPage: 20,
        })
      );
    });

    it('should accept custom pagination parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/orders?page=2&perPage=50'
      );
      await GET(request);

      expect(orderService.listOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          perPage: 50,
        })
      );
    });

    it('should enforce max perPage limit of 100', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/orders?perPage=150'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Validation error');
    });

    it('should filter by order status', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/orders?status=${OrderStatus.PENDING}`
      );
      await GET(request);

      expect(orderService.listOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.PENDING,
        })
      );
    });

    it('should accept search query', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/orders?search=ORD-001'
      );
      await GET(request);

      expect(orderService.listOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'ORD-001',
        })
      );
    });

    it('should filter by date range', async () => {
      const dateFrom = '2025-10-01T00:00:00.000Z';
      const dateTo = '2025-10-31T23:59:59.999Z';
      const request = new NextRequest(
        `http://localhost:3000/api/orders?dateFrom=${dateFrom}&dateTo=${dateTo}`
      );
      await GET(request);

      expect(orderService.listOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          dateFrom: new Date(dateFrom),
          dateTo: new Date(dateTo),
        })
      );
    });

    it('should accept custom sorting', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/orders?sortBy=totalAmount&sortOrder=asc'
      );
      await GET(request);

      expect(orderService.listOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'totalAmount',
          sortOrder: 'asc',
        })
      );
    });

    it('should use default sorting if not specified', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders');
      await GET(request);

      expect(orderService.listOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'createdAt',
          sortOrder: 'desc',
        })
      );
    });

    it('should return 400 for invalid sortBy value', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/orders?sortBy=invalidField'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Validation error');
    });
  });

  describe('CSV Export', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
    });

    it('should return CSV when export=csv parameter is provided', async () => {
      const mockCSV = 'Order Number,Customer Name,Total\nORD-001,John Doe,100.00';
      vi.mocked(orderService.exportOrdersToCSV).mockResolvedValue(mockCSV);

      const request = new NextRequest(
        'http://localhost:3000/api/orders?export=csv'
      );
      const response = await GET(request);
      const csvData = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv');
      expect(response.headers.get('Content-Disposition')).toContain(
        'attachment; filename="orders-'
      );
      expect(csvData).toBe(mockCSV);
      expect(orderService.exportOrdersToCSV).toHaveBeenCalled();
    });

    it('should apply filters when exporting to CSV', async () => {
      const mockCSV = 'Order Number,Customer Name,Total\nORD-001,John Doe,100.00';
      vi.mocked(orderService.exportOrdersToCSV).mockResolvedValue(mockCSV);

      const request = new NextRequest(
        `http://localhost:3000/api/orders?export=csv&status=${OrderStatus.PENDING}&search=ORD`
      );
      await GET(request);

      expect(orderService.exportOrdersToCSV).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.PENDING,
          search: 'ORD',
        })
      );
    });

    it('should not call listOrders when exporting', async () => {
      const mockCSV = 'Order Number,Customer Name,Total\nORD-001,John Doe,100.00';
      vi.mocked(orderService.exportOrdersToCSV).mockResolvedValue(mockCSV);

      const request = new NextRequest(
        'http://localhost:3000/api/orders?export=csv'
      );
      await GET(request);

      expect(orderService.exportOrdersToCSV).toHaveBeenCalled();
      expect(orderService.listOrders).not.toHaveBeenCalled();
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(orderService.listOrders).mockResolvedValue({
        orders: mockOrders,
        pagination: mockPagination,
      });
    });

    it('should return orders with success response', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Orders retrieved successfully');
      expect(data.data).toHaveLength(2);
      expect(data.data[0].id).toBe('order-1');
      expect(data.data[0].orderNumber).toBe('ORD-001');
      expect(data.data[1].id).toBe('order-2');
      expect(data.meta).toEqual(mockPagination);
    });

    it('should handle empty orders list', async () => {
      vi.mocked(orderService.listOrders).mockResolvedValue({
        orders: [],
        pagination: {
          page: 1,
          perPage: 10,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const request = new NextRequest('http://localhost:3000/api/orders');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.meta.total).toBe(0);
      expect(data.meta.page).toBe(1);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
    });

    it('should return 400 for validation errors', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/orders?page=0' // Invalid: page must be positive
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Validation error');
      expect(data.error.details.errors).toBeDefined();
    });

    it('should return 500 for service errors', async () => {
      vi.mocked(orderService.listOrders).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost:3000/api/orders');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Database connection failed');
    });

    it('should return 500 with generic message for unknown errors', async () => {
      vi.mocked(orderService.listOrders).mockRejectedValue('Unknown error');

      const request = new NextRequest('http://localhost:3000/api/orders');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Failed to fetch orders');
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should pass storeId to listOrders for Store Admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(orderService.listOrders).mockResolvedValue({
        orders: mockOrders,
        pagination: mockPagination,
      });

      const request = new NextRequest('http://localhost:3000/api/orders');
      await GET(request);

      expect(orderService.listOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          storeId: 'store-1',
        })
      );
    });

    it('should not pass storeId for Super Admin (null storeId)', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          ...mockSession.user,
          role: 'SUPER_ADMIN',
          storeId: null,
        },
      } as any);

      vi.mocked(orderService.listOrders).mockResolvedValue({
        orders: mockOrders,
        pagination: mockPagination,
      });

      const request = new NextRequest('http://localhost:3000/api/orders');
      await GET(request);

      expect(orderService.listOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          storeId: null,
        })
      );
    });
  });
});
