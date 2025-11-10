/**
 * Unit Tests for Order Details API Route
 * Tests GET /api/orders/[id] with authentication, authorization, and multi-tenant isolation
 * 
 * @vitest
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import * as orderService from '@/services/order-service';
import { OrderStatus, PaymentStatus, ShippingStatus } from '@prisma/client';

// Mock next-auth
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

// Mock order service
vi.mock('@/services/order-service', () => ({
  getOrderById: vi.fn(),
}));

// Import mocked functions
import { getServerSession } from 'next-auth';

describe('GET /api/orders/[id]', () => {
  const mockSession = {
    user: {
      id: 'user-1',
      email: 'admin@store.com',
      role: 'STORE_ADMIN',
      storeId: 'store-1',
    },
  };

  const mockOrder = {
    id: 'order-1',
    orderNumber: 'ORD-001',
    storeId: 'store-1',
    customerId: 'customer-1',
    userId: 'user-1',
    status: OrderStatus.PENDING,
    shippingAddressId: 'addr-1',
    billingAddressId: 'addr-2',
    subtotal: 120.0,
    taxAmount: 10.0,
    shippingAmount: 20.0,
    discountAmount: 0.0,
    totalAmount: 150.0,
    discountCode: null,
    paymentMethod: null,
    paymentGateway: null,
    paymentStatus: PaymentStatus.PENDING,
    shippingMethod: null,
    shippingStatus: ShippingStatus.PENDING,
    trackingNumber: null,
    trackingUrl: null,
    fulfilledAt: null,
    canceledAt: null,
    cancelReason: null,
    customerNote: null,
    adminNote: null,
    ipAddress: null,
    createdAt: new Date('2025-10-01'),
    updatedAt: new Date('2025-10-01'),
    deletedAt: null,
    // Required relations from getOrderById
    user: {
      id: 'user-1',
      email: 'admin@store.com',
      name: 'Admin User',
      phone: null,
    },
    customer: {
      id: 'customer-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: null,
    },
    items: [
      {
        id: 'item-1',
        orderId: 'order-1',
        productId: 'product-1',
        variantId: null,
        productName: 'Product 1',
        variantName: null,
        sku: 'SKU-001',
        image: null,
        price: 60.0,
        quantity: 2,
        subtotal: 120.0,
        taxAmount: 0.0,
        discountAmount: 0.0,
        totalAmount: 120.0,
        createdAt: new Date('2025-10-01'),
        updatedAt: new Date('2025-10-01'),
        product: {
          id: 'product-1',
          name: 'Product 1',
          slug: 'product-1',
        },
        variant: null,
      },
    ],
    payments: [],
    shippingAddress: {
      id: 'addr-1',
      firstName: 'John',
      lastName: 'Doe',
      company: null,
      address1: '123 Main St',
      address2: null,
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
      phone: null,
      isDefault: false,
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date('2025-10-01'),
      userId: null,
      customerId: 'customer-1',
    },
    billingAddress: {
      id: 'addr-2',
      firstName: 'John',
      lastName: 'Doe',
      company: null,
      address1: '123 Main St',
      address2: null,
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
      phone: null,
      isDefault: false,
      createdAt: new Date('2025-10-01'),
      updatedAt: new Date('2025-10-01'),
      userId: null,
      customerId: 'customer-1',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Unauthorized');
    });

    it('should return 401 if session exists but user is missing', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ user: null } as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });
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
          role: 'CUSTOMER',
        },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });
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

      const request = new NextRequest('http://localhost:3000/api/orders/order-1');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });
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

      vi.mocked(orderService.getOrderById).mockResolvedValue(mockOrder);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should allow Store Admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(orderService.getOrderById).mockResolvedValue(mockOrder);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should allow Staff', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          ...mockSession.user,
          role: 'STAFF',
        },
      } as any);

      vi.mocked(orderService.getOrderById).mockResolvedValue(mockOrder);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Order Retrieval', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
    });

    it('should return order details for valid order ID', async () => {
      vi.mocked(orderService.getOrderById).mockResolvedValue(mockOrder);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Order retrieved successfully');
      expect(data.data.id).toBe('order-1');
      expect(data.data.orderNumber).toBe('ORD-001');
      expect(data.data.status).toBe('PENDING');
      expect(data.data.customer.email).toBe('john@example.com');
      expect(orderService.getOrderById).toHaveBeenCalledWith('order-1', 'store-1');
    });

    it('should return 404 when order is not found', async () => {
      vi.mocked(orderService.getOrderById).mockRejectedValue(
        new Error('Order not found')
      );

      const request = new NextRequest('http://localhost:3000/api/orders/order-999');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Order not found');
    });

    it('should pass orderId from path parameters', async () => {
      vi.mocked(orderService.getOrderById).mockResolvedValue(mockOrder);

      const testOrderId = 'test-order-123';
      const request = new NextRequest(
        `http://localhost:3000/api/orders/${testOrderId}`
      );
      await GET(request, { params: Promise.resolve({ id: testOrderId }) });

      expect(orderService.getOrderById).toHaveBeenCalledWith(testOrderId, 'store-1');
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should pass storeId to getOrderById for Store Admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(orderService.getOrderById).mockResolvedValue(mockOrder);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1');
      await GET(request, { params: Promise.resolve({ id: 'order-1' }) });

      expect(orderService.getOrderById).toHaveBeenCalledWith('order-1', 'store-1');
    });

    it('should pass null storeId for Super Admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          ...mockSession.user,
          role: 'SUPER_ADMIN',
          storeId: null,
        },
      } as any);

      vi.mocked(orderService.getOrderById).mockResolvedValue(mockOrder);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1');
      await GET(request, { params: Promise.resolve({ id: 'order-1' }) });

      expect(orderService.getOrderById).toHaveBeenCalledWith('order-1', undefined);
    });

    it('should return 404 when order belongs to different store', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      // Service returns null when order doesn't exist or belongs to different store
      vi.mocked(orderService.getOrderById).mockResolvedValue(null as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });
      const data = await response.json();

      // Route should return 404 when order is not found (null)
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Order not found');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
    });

    it('should return 500 for service errors', async () => {
      vi.mocked(orderService.getOrderById).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost:3000/api/orders/order-1');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Database connection failed');
    });

    it('should return 500 with generic message for unknown errors', async () => {
      vi.mocked(orderService.getOrderById).mockRejectedValue('Unknown error');

      const request = new NextRequest('http://localhost:3000/api/orders/order-1');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Failed to fetch order');
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(orderService.getOrderById).mockResolvedValue(mockOrder);
    });

    it('should return order with complete details', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/order-1');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.orderNumber).toBe('ORD-001');
      expect(data.data.customer).toBeDefined();
      expect(data.data.items).toBeInstanceOf(Array);
      expect(data.data.totalAmount).toBe(150.0);
    });

    it('should include nested customer information', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/order-1');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });
      const data = await response.json();

      expect(data.data.customer.firstName).toBe('John');
      expect(data.data.customer.lastName).toBe('Doe');
      expect(data.data.customer.email).toBe('john@example.com');
    });

    it('should include order items with product details', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/order-1');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });
      const data = await response.json();

      expect(data.data.items).toHaveLength(1);
      expect(data.data.items[0].product.name).toBe('Product 1');
      expect(data.data.items[0].quantity).toBe(2);
      expect(data.data.items[0].price).toBe(60.0);
    });
  });
});
