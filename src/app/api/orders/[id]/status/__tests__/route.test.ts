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
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock order service
vi.mock('@/services/order-service', () => ({
  updateOrderStatus: vi.fn(),
}));

// Import mocked functions
import { getServerSession } from 'next-auth';

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
    status: OrderStatus.PROCESSING,
    trackingNumber: null,
    trackingUrl: null,
    adminNote: null,
    updatedAt: new Date('2025-10-02'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING }),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Unauthorized');
    });

    it('should return 401 if session exists but user is missing', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ user: null } as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING }),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
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
        body: JSON.stringify({ status: OrderStatus.PROCESSING }),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
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
        body: JSON.stringify({ status: OrderStatus.PROCESSING }),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
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
        body: JSON.stringify({ status: OrderStatus.PROCESSING }),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
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

      vi.mocked(orderService.updateOrderStatus).mockResolvedValue(mockUpdatedOrder);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING }),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should allow Store Admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(orderService.updateOrderStatus).mockResolvedValue(mockUpdatedOrder);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING }),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
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
        body: JSON.stringify({ status: 'INVALID_STATUS' }),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing status field', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({}),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
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
      });

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({
          status: OrderStatus.SHIPPED,
          trackingNumber: 'TRACK123',
        }),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(orderService.updateOrderStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-1',
          newStatus: OrderStatus.SHIPPED,
          trackingNumber: 'TRACK123',
          storeId: 'store-1',
        })
      );
    });

    it('should return 400 for trackingNumber exceeding 100 characters', async () => {
      const longTracking = 'A'.repeat(101);
      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({
          status: OrderStatus.SHIPPED,
          trackingNumber: longTracking,
        }),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
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
      });

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({
          status: OrderStatus.SHIPPED,
          trackingNumber: 'TRACK123',
          trackingUrl: 'https://tracking.example.com/TRACK123',
        }),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
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
        }),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should accept valid adminNote', async () => {
      vi.mocked(orderService.updateOrderStatus).mockResolvedValue({
        ...mockUpdatedOrder,
        adminNote: 'Customer requested expedited shipping',
      });

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({
          status: OrderStatus.PROCESSING,
          adminNote: 'Customer requested expedited shipping',
        }),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
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
        }),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
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
      vi.mocked(orderService.updateOrderStatus).mockResolvedValue(mockUpdatedOrder);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING }),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
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
        })
      );
    });

    it('should return 404 when order is not found', async () => {
      vi.mocked(orderService.updateOrderStatus).mockRejectedValue(
        new Error('Order not found')
      );

      const request = new NextRequest('http://localhost:3000/api/orders/order-999/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING }),
      });
      const response = await PUT(request, { params: { id: 'order-999' } });
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
        body: JSON.stringify({ status: OrderStatus.DELIVERED }),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
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
        body: JSON.stringify({ status: OrderStatus.SHIPPED }),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('Tracking number required');
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should pass storeId to updateOrderStatus for Store Admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(orderService.updateOrderStatus).mockResolvedValue(mockUpdatedOrder);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING }),
      });
      await PUT(request, { params: { id: 'order-1' } });

      expect(orderService.updateOrderStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-1',
          newStatus: OrderStatus.PROCESSING,
          storeId: 'store-1',
        })
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

      vi.mocked(orderService.updateOrderStatus).mockResolvedValue(mockUpdatedOrder);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING }),
      });
      await PUT(request, { params: { id: 'order-1' } });

      expect(orderService.updateOrderStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-1',
          newStatus: OrderStatus.PROCESSING,
          storeId: null,
        })
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
        body: JSON.stringify({ status: OrderStatus.PROCESSING }),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Database connection failed');
    });

    it('should return 500 with generic message for unknown errors', async () => {
      vi.mocked(orderService.updateOrderStatus).mockRejectedValue('Unknown error');

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING }),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Failed to update order status');
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(orderService.updateOrderStatus).mockResolvedValue(mockUpdatedOrder);
    });

    it('should return updated order with new status', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.PROCESSING }),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
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
      });

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({
          status: OrderStatus.SHIPPED,
          trackingNumber: 'TRACK123',
          trackingUrl: 'https://tracking.example.com/TRACK123',
        }),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
      const data = await response.json();

      expect(data.data.trackingNumber).toBe('TRACK123');
      expect(data.data.trackingUrl).toBe('https://tracking.example.com/TRACK123');
    });

    it('should include adminNote when provided', async () => {
      vi.mocked(orderService.updateOrderStatus).mockResolvedValue({
        ...mockUpdatedOrder,
        adminNote: 'Expedited shipping requested',
      });

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/status', {
        method: 'PUT',
        body: JSON.stringify({
          status: OrderStatus.PROCESSING,
          adminNote: 'Expedited shipping requested',
        }),
      });
      const response = await PUT(request, { params: { id: 'order-1' } });
      const data = await response.json();

      expect(data.data.adminNote).toBe('Expedited shipping requested');
    });
  });
});
