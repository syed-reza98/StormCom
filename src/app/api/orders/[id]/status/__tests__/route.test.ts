/**
 * Unit Tests for Order Status Update API Route
 * Tests PUT /api/orders/[id]/status with validation, state machine, and authorization
 * 
 * @vitest
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PUT } from '../route';
import * as orderService from '@/services/order-service';
import { OrderStatus } from '@prisma/client';

// Mock next-auth
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
} as any));

// Mock order service
vi.mock('@/services/order-service', () => ({
  updateOrderStatus: vi.fn(),
} as any));

// Import mocked functions
import { getServerSession } from 'next-auth/next';

describe('PUT /api/orders/[id]/status', () => {
  const mockSession = {
    user: {
      id: 'user-1',
      email: 'admin@store.com',
      role: 'STORE_ADMIN',
      storeId: 'store-1',
    },
  };

  const mockUpdatedOrder = {
    id: 'order-1',
    orderNumber: 'ORD-001',
    storeId: 'store-1',
    customerId: 'customer-1',
    userId: 'user-1',
    status: OrderStatus.PROCESSING,
    shippingAddressId: null,
    billingAddressId: null,
    subtotal: 100.0,
    taxAmount: 0.0,
    shippingAmount: 0.0,
    discountAmount: 0.0,
    totalAmount: 100.0,
    discountCode: null,
    paymentMethod: null,
    paymentGateway: null,
    paymentStatus: 'PENDING' as any,
    shippingMethod: null,
    shippingStatus: 'PENDING' as any,
    trackingNumber: null,
    trackingUrl: null,
    fulfilledAt: null,
    canceledAt: null,
    cancelReason: null,
    customerNote: null,
    adminNote: null,
    ipAddress: null,
    createdAt: new Date('2025-10-01'),
    updatedAt: new Date('2025-10-02'),
    deletedAt: null,
    user: {
      id: 'user-1',
      email: 'admin@store.com',
      name: 'Admin User',
      password: '$2a$12$hashedpassword',
      phone: null,
      role: 'STORE_ADMIN' as any,
      storeId: 'store-1',
      mfaEnabled: false,
      mfaMethod: null,
      totpSecret: null,
      emailVerified: true,
      emailVerifiedAt: new Date('2025-01-01'),
      verificationToken: null,
      verificationExpires: null,
      resetToken: null,
      resetExpires: null,
      lastLoginAt: new Date('2025-10-01'),
      lastLoginIP: '127.0.0.1',
      failedLoginAttempts: 0,
      lockedUntil: null,
      passwordChangedAt: new Date('2025-01-01'),
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-10-01'),
      deletedAt: null,
    },
    customer: {
      id: 'customer-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: null,
    },
    payments: [],
    items: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Unauthorized');
    });

    it('should return 401 if session exists but user is missing', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ user: null } as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('Authorization', () => {
    it('should return 403 for CUSTOMER role', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          ...mockSession.user,
          role: 'CUSTOMER',
        },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('Insufficient permissions');
    });

    it('should return 403 for STAFF role', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          ...mockSession.user,
          role: 'STAFF',
        },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
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

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('No store assigned');
    });

    it('should allow Super Admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          ...mockSession.user,
          role: 'SUPER_ADMIN',
          storeId: null,
        },
      } as any);

      vi.mocked(orderService.updateOrderStatus).mockResolvedValue(mockUpdatedOrder as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should allow Store Admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(orderService.updateOrderStatus).mockResolvedValue(mockUpdatedOrder as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
    });

    it('should return 400 for invalid status enum', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: 'INVALID_STATUS' } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing status field', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({} as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should accept valid trackingNumber', async () => {
      vi.mocked(orderService.updateOrderStatus).mockResolvedValue({
        ...mockUpdatedOrder,
        status: OrderStatus.SHIPPED,
        trackingNumber: 'TRACK123',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({
          status: OrderStatus.SHIPPED,
          trackingNumber: 'TRACK123',
        } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(orderService.updateOrderStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-1',
          newStatus: OrderStatus.SHIPPED,
          trackingNumber: 'TRACK123',
          storeId: 'store-1',
        } as any)
      );
    });

    it('should return 400 for trackingNumber exceeding 100 characters', async () => {
      const longTracking = 'A'.repeat(101);
      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({
          status: OrderStatus.SHIPPED,
          trackingNumber: longTracking,
        } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should accept valid trackingUrl', async () => {
      vi.mocked(orderService.updateOrderStatus).mockResolvedValue({
        ...mockUpdatedOrder,
        status: OrderStatus.SHIPPED,
        trackingUrl: 'https://tracking.example.com/TRACK123',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({
          status: OrderStatus.SHIPPED,
          trackingNumber: 'TRACK123',
          trackingUrl: 'https://tracking.example.com/TRACK123',
        } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 for invalid trackingUrl format', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({
          status: OrderStatus.SHIPPED,
          trackingNumber: 'TRACK123',
          trackingUrl: 'not-a-url',
        } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should accept valid adminNote', async () => {
      vi.mocked(orderService.updateOrderStatus).mockResolvedValue({
        ...mockUpdatedOrder,
        adminNote: 'Customer requested expedited shipping',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({
          status: OrderStatus.PROCESSING,
          adminNote: 'Customer requested expedited shipping',
        } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 for adminNote exceeding 1000 characters', async () => {
      const longNote = 'A'.repeat(1001);
      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({
          status: OrderStatus.PROCESSING,
          adminNote: longNote,
        } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Status Update', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
    });

    it('should update order status successfully', async () => {
      vi.mocked(orderService.updateOrderStatus).mockResolvedValue(mockUpdatedOrder as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Order status updated successfully');
      expect(data.data.status).toBe(OrderStatus.PROCESSING);
      expect(orderService.updateOrderStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-1',
          newStatus: OrderStatus.PROCESSING,
          storeId: 'store-1',
        } as any)
      );
    });

    it('should return 404 when order is not found', async () => {
      vi.mocked(orderService.updateOrderStatus).mockRejectedValue(
        new Error('Order not found')
      );

      const request = new NextRequest('http://localhost:3000/api/orders/order-999/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-999' } as any) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Order not found');
    });

    it('should return 422 for invalid state transition', async () => {
      vi.mocked(orderService.updateOrderStatus).mockRejectedValue(
        new Error('Invalid status transition')
      );

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.DELIVERED } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('Invalid status transition');
    });

    it('should return 400 when tracking number is missing for SHIPPED status', async () => {
      vi.mocked(orderService.updateOrderStatus).mockRejectedValue(
        new Error('Tracking number required for SHIPPED status')
      );

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.SHIPPED } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('Tracking number required');
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should pass storeId to updateOrderStatus for Store Admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(orderService.updateOrderStatus).mockResolvedValue(mockUpdatedOrder as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING } as any),
      });
      await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });

      expect(orderService.updateOrderStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-1',
          newStatus: OrderStatus.PROCESSING,
          storeId: 'store-1',
        } as any)
      );
    });

    it('should pass null storeId for Super Admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          ...mockSession.user,
          role: 'SUPER_ADMIN',
          storeId: null,
        },
      } as any);

      vi.mocked(orderService.updateOrderStatus).mockResolvedValue(mockUpdatedOrder as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING } as any),
      });
      await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });

      expect(orderService.updateOrderStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-1',
          newStatus: OrderStatus.PROCESSING,
          storeId: undefined,
        } as any)
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
    });

    it('should return 500 for service errors', async () => {
      vi.mocked(orderService.updateOrderStatus).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Database connection failed');
    });

    it('should return 500 with generic message for unknown errors', async () => {
      vi.mocked(orderService.updateOrderStatus).mockRejectedValue('Unknown error');

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Failed to update order status');
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(orderService.updateOrderStatus).mockResolvedValue(mockUpdatedOrder as any);
    });

    it('should return updated order with new status', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe(OrderStatus.PROCESSING);
      expect(data.data.orderNumber).toBe('ORD-001');
    });

    it('should include tracking information when provided', async () => {
      vi.mocked(orderService.updateOrderStatus).mockResolvedValue({
        ...mockUpdatedOrder,
        status: OrderStatus.SHIPPED,
        trackingNumber: 'TRACK123',
        trackingUrl: 'https://tracking.example.com/TRACK123',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({
          status: OrderStatus.SHIPPED,
          trackingNumber: 'TRACK123',
          trackingUrl: 'https://tracking.example.com/TRACK123',
        } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
      const data = await response.json();

      expect(data.data.trackingNumber).toBe('TRACK123');
      expect(data.data.trackingUrl).toBe('https://tracking.example.com/TRACK123');
    });

    it('should include adminNote when provided', async () => {
      vi.mocked(orderService.updateOrderStatus).mockResolvedValue({
        ...mockUpdatedOrder,
        adminNote: 'Expedited shipping requested',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({
          status: OrderStatus.PROCESSING,
          adminNote: 'Expedited shipping requested',
        } as any),
      });
      const response = await PUT(request, { params: Promise.resolve({ id: 'order-1' } as any) });
      const data = await response.json();

      expect(data.data.adminNote).toBe('Expedited shipping requested');
    });
  });
});
