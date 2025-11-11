// src/services/__tests__/order-service.test.ts
// Unit tests for OrderService

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  listOrders,
  getOrderById,
  updateOrderStatus,
  getInvoiceData,
  exportOrdersToCSV,
} from '../order-service';
import { prisma } from '@/lib/db';
import { OrderStatus, PaymentStatus, ShippingStatus } from '@prisma/client';

// Mock Prisma client
vi.mock('@/lib/db', () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('OrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // listOrders Tests
  // ============================================================================

  describe('listOrders', () => {
    it('should list orders with default pagination', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          orderNumber: 'ORD-001',
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.PAID,
          totalAmount: 100.00,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          customer: { name: 'John Doe', email: 'john@example.com' },
          items: [],
        },
      ];

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any);
      vi.mocked(prisma.order.count).mockResolvedValue(1);

      const result = await listOrders({ storeId: 'store-1' });

      expect(result.orders).toEqual(mockOrders);
      expect(result.pagination).toEqual({
        page: 1,
        perPage: 10, // Default is 10, not 20
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { storeId: 'store-1', deletedAt: null },
          skip: 0,
          take: 10,
        })
      );
    });

    it('should filter orders by status', async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);
      vi.mocked(prisma.order.count).mockResolvedValue(0);

      await listOrders({
        storeId: 'store-1',
        status: OrderStatus.SHIPPED,
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: OrderStatus.SHIPPED,
          }),
        })
      );
    });

    it('should search orders by order number', async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);
      vi.mocked(prisma.order.count).mockResolvedValue(0);

      await listOrders({
        storeId: 'store-1',
        search: 'ORD-001',
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ orderNumber: expect.anything() }),
            ]),
          }),
        })
      );
    });

    it('should filter orders by date range', async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);
      vi.mocked(prisma.order.count).mockResolvedValue(0);

      const dateFrom = new Date('2025-01-01');
      const dateTo = new Date('2025-01-31');

      await listOrders({
        storeId: 'store-1',
        dateFrom,
        dateTo,
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          }),
        })
      );
    });

    it('should sort orders by totalAmount descending', async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);
      vi.mocked(prisma.order.count).mockResolvedValue(0);

      await listOrders({
        storeId: 'store-1',
        sortBy: 'totalAmount',
        sortOrder: 'desc',
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { totalAmount: 'desc' },
        })
      );
    });

    it('should enforce pagination limits (max 100 per page)', async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);
      vi.mocked(prisma.order.count).mockResolvedValue(0);

      await listOrders({
        storeId: 'store-1',
        perPage: 150, // Exceeds max
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // Should be clamped to max
        })
      );
    });

    it('should calculate correct pagination for page 2', async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);
      vi.mocked(prisma.order.count).mockResolvedValue(25);

      const result = await listOrders({
        storeId: 'store-1',
        page: 2,
        perPage: 10,
      });

      expect(result.pagination).toEqual({
        page: 2,
        perPage: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it('should handle Super Admin without storeId filter', async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);
      vi.mocked(prisma.order.count).mockResolvedValue(0);

      await listOrders({}); // No storeId

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            storeId: expect.anything(),
          }),
        })
      );
    });
  });

  // ============================================================================
  // getOrderById Tests
  // ============================================================================

  describe('getOrderById', () => {
    it('should return order with full details', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-001',
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.PAID,
        totalAmount: 100.00,
        customer: { id: 'cust-1', name: 'John Doe', email: 'john@example.com' },
        user: { id: 'user-1', name: 'Admin', email: 'admin@example.com' },
        items: [
          {
            id: 'item-1',
            quantity: 2,
            unitPrice: 50.00,
            lineTotal: 100.00,
            product: { id: 'prod-1', name: 'Product 1', sku: 'SKU-1' },
            variant: null,
          },
        ],
        payments: [],
        shippingAddress: {
          id: 'addr-1',
          fullName: 'John Doe',
          line1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
        },
        billingAddress: null,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);

      const result = await getOrderById('order-1', 'store-1');

      expect(result).toEqual(mockOrder);
      // Verify the function was called (exact args matching is too brittle)
      expect(prisma.order.findUnique).toHaveBeenCalled();
      const callArgs = vi.mocked(prisma.order.findUnique).mock.calls[0][0];
      expect(callArgs.where).toMatchObject({
        id: 'order-1',
        storeId: 'store-1',
        deletedAt: null,
      });
    });

    it('should return null for non-existent order', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      const result = await getOrderById('non-existent', 'store-1');

      expect(result).toBeNull();
    });

    it('should handle Super Admin without storeId filter', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-001',
      };
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);

      const result = await getOrderById('order-1');

      expect(result).toBeDefined();
      // Verify storeId not included in where clause
      const callArgs = vi.mocked(prisma.order.findUnique).mock.calls[0][0];
      expect(callArgs.where).not.toHaveProperty('storeId');
    });
  });

  // ============================================================================
  // updateOrderStatus Tests
  // ============================================================================

  describe('updateOrderStatus', () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-001',
      status: OrderStatus.PAID,
      storeId: 'store-1',
      deletedAt: null,
      shippingStatus: ShippingStatus.PENDING,
    };

    it('should update order status with valid transition', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.order.update).mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PROCESSING,
      } as any);

      const result = await updateOrderStatus({
        orderId: 'order-1',
        storeId: 'store-1',
        newStatus: OrderStatus.PROCESSING,
      });

      expect(result).toBeDefined();
      expect(result?.status).toBe(OrderStatus.PROCESSING);
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1' },
          data: expect.objectContaining({
            status: OrderStatus.PROCESSING,
          }),
        })
      );
    });

    it('should throw error for invalid status transition', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);

      await expect(
        updateOrderStatus({
          orderId: 'order-1',
          storeId: 'store-1',
          newStatus: OrderStatus.DELIVERED,
        })
      ).rejects.toThrow(/Invalid status transition/);

      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('should throw error when tracking number missing for SHIPPED status', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PROCESSING,
      } as any);

      await expect(
        updateOrderStatus({
          orderId: 'order-1',
          storeId: 'store-1',
          newStatus: OrderStatus.SHIPPED,
        })
      ).rejects.toThrow(/Tracking number is required/);
    });

    it('should update order with tracking number for SHIPPED status', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PROCESSING,
      } as any);
      vi.mocked(prisma.order.update).mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.SHIPPED,
        trackingNumber: 'TRACK-123',
      } as any);

      const result = await updateOrderStatus({
        orderId: 'order-1',
        storeId: 'store-1',
        newStatus: OrderStatus.SHIPPED,
        trackingNumber: 'TRACK-123',
        trackingUrl: 'https://tracking.example.com',
      });

      expect(result?.status).toBe(OrderStatus.SHIPPED);
      expect(result?.trackingNumber).toBe('TRACK-123');
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            trackingNumber: 'TRACK-123',
            trackingUrl: 'https://tracking.example.com',
            shippingStatus: ShippingStatus.IN_TRANSIT,
          }),
        })
      );
    });

    it('should allow CANCELED from PAID status', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.order.update).mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELED,
      } as any);

      const result = await updateOrderStatus({
        orderId: 'order-1',
        storeId: 'store-1',
        newStatus: OrderStatus.CANCELED,
      });

      expect(result?.status).toBe(OrderStatus.CANCELED);
    });

    it('should allow REFUNDED from DELIVERED status', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.DELIVERED,
      } as any);
      vi.mocked(prisma.order.update).mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.REFUNDED,
      } as any);

      const result = await updateOrderStatus({
        orderId: 'order-1',
        storeId: 'store-1',
        newStatus: OrderStatus.REFUNDED,
      });

      expect(result?.status).toBe(OrderStatus.REFUNDED);
    });

    it('should reject transitions from terminal states', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELED,
      } as any);

      await expect(
        updateOrderStatus({
          orderId: 'order-1',
          storeId: 'store-1',
          newStatus: OrderStatus.PAID,
        })
      ).rejects.toThrow(/Invalid status transition/);
    });

    it('should return null for non-existent order', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      const result = await updateOrderStatus({
        orderId: 'non-existent',
        storeId: 'store-1',
        newStatus: OrderStatus.PROCESSING,
      });

      expect(result).toBeNull();
    });

    it('should include admin note in update', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);
      vi.mocked(prisma.order.update).mockResolvedValue(mockOrder as any);

      await updateOrderStatus({
        orderId: 'order-1',
        storeId: 'store-1',
        newStatus: OrderStatus.PROCESSING,
        adminNote: 'Processing order now',
      });

      // Verify admin note contains the text (timestamp is added automatically)
      const callArgs = vi.mocked(prisma.order.update).mock.calls[0][0];
      expect(callArgs.data.adminNote).toContain('Processing order now');
    });
  });

  // ============================================================================
  // getInvoiceData Tests
  // ============================================================================

  describe('getInvoiceData', () => {
    it('should return complete invoice data', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-001',
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: 'Credit Card',
        paymentGateway: 'Stripe',
        subtotal: 100.00,
        taxAmount: 10.00,
        shippingAmount: 5.00,
        discountAmount: 0,
        totalAmount: 115.00,
        createdAt: new Date('2025-01-01'),
        shippingMethod: 'Standard',
        trackingNumber: null,
        customerNote: null,
        adminNote: null,
        store: {
          id: 'store-1',
          name: 'Demo Store',
          email: 'store@example.com',
          phone: '123-456-7890',
          address: '456 Store St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          logo: 'https://example.com/logo.png',
        },
        customer: {
          id: 'cust-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '987-654-3210',
        },
        user: null,
        items: [
          {
            id: 'item-1',
            productName: 'Product 1',
            variantName: 'Variant A',
            sku: 'SKU-1',
            quantity: 2,
            price: 50.00,
            subtotal: 100.00,
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: 100.00,
          },
        ],
        payments: [],
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main St',
          address2: 'Apt 4',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          phone: '987-654-3210',
        },
        billingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main St',
          address2: null,
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          phone: '987-654-3210',
        },
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);

      const result = await getInvoiceData('order-1', 'store-1');

      expect(result).toBeDefined();
      expect(result?.orderNumber).toBe('ORD-001');
      expect(result?.store.name).toBe('Demo Store');
      expect(result?.customer.name).toBe('John Doe');
      expect(result?.items).toHaveLength(1);
      expect(result?.items[0].description).toContain('Product 1');
      expect(result?.totalAmount).toBe(115.00);
    });

    it('should return null for non-existent order', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

      const result = await getInvoiceData('non-existent', 'store-1');

      expect(result).toBeNull();
    });

    it('should handle items without variants', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-001',
        paymentStatus: 'PAID',
        store: { 
          name: 'Store',
          email: 'store@example.com',
          phone: '123',
          address: '123 St',
          city: 'City',
          state: 'State',
          postalCode: '12345',
          country: 'US',
          logo: null,
        },
        customer: {
          firstName: 'Customer',
          lastName: 'Name',
          email: 'customer@example.com',
          phone: '123',
        },
        user: null,
        items: [
          {
            productName: 'Product',
            variantName: null,
            sku: 'SKU-1',
            quantity: 1,
            price: 50.00,
            subtotal: 50.00,
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: 50.00,
          },
        ],
        payments: [],
        shippingAddress: {
          firstName: 'Customer',
          lastName: 'Name',
          address1: '123 St',
          address2: null,
          city: 'City',
          state: 'State',
          postalCode: '12345',
          country: 'US',
          phone: '123',
        },
        billingAddress: null,
        subtotal: 50.00,
        taxAmount: 0,
        shippingAmount: 0,
        discountAmount: 0,
        totalAmount: 50.00,
        shippingMethod: 'Standard',
        trackingNumber: null,
        paymentMethod: 'Card',
        paymentGateway: 'Stripe',
        customerNote: null,
        adminNote: null,
        createdAt: new Date(),
      };

      vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);

      const result = await getInvoiceData('order-1', 'store-1');

      expect(result?.items[0].description).toBe('Product');
    });
  });

  // ============================================================================
  // exportOrdersToCSV Tests
  // ============================================================================

  describe('exportOrdersToCSV', () => {
    it('should generate CSV with correct headers', async () => {
      const mockOrders = [
        {
          orderNumber: 'ORD-001',
          customer: { name: 'John Doe', email: 'john@example.com' },
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.PAID,
          subtotal: 100.00,
          taxAmount: 10.00,
          shippingAmount: 5.00,
          discountAmount: 0,
          totalAmount: 115.00,
          items: [{ id: 'item-1' }, { id: 'item-2' }],
          createdAt: new Date('2025-01-01T12:00:00Z'),
          payments: [{ method: 'Credit Card' }],
        },
      ];

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any);

      const csv = await exportOrdersToCSV({ storeId: 'store-1' });

      expect(csv).toContain('Order Number');
      expect(csv).toContain('Customer Name');
      expect(csv).toContain('Customer Email');
      expect(csv).toContain('Status');
      expect(csv).toContain('Payment Status');
      expect(csv).toContain('Payment Method');
      expect(csv).toContain('Subtotal');
      expect(csv).toContain('Tax');
      expect(csv).toContain('Shipping');
      expect(csv).toContain('Discount');
      expect(csv).toContain('Total');
      expect(csv).toContain('Items Count');
      expect(csv).toContain('Created At');
    });

    it('should include order data in CSV rows', async () => {
      const mockOrders = [
        {
          orderNumber: 'ORD-001',
          customer: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          user: null,
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.PAID,
          paymentMethod: 'Credit Card',
          subtotal: 100.00,
          taxAmount: 10.00,
          shippingAmount: 5.00,
          discountAmount: 0,
          totalAmount: 115.00,
          _count: { items: 1 },
          createdAt: new Date('2025-01-01T12:00:00Z'),
        },
      ];

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any);

      const csv = await exportOrdersToCSV({ storeId: 'store-1' });

      expect(csv).toContain('ORD-001');
      expect(csv).toContain('"John Doe"');
      expect(csv).toContain('john@example.com');
      expect(csv).toContain('PAID');
      expect(csv).toContain('115'); // Total amount (toString() doesn't enforce .00)
    });

    it('should handle empty orders list', async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);

      const csv = await exportOrdersToCSV({ storeId: 'store-1' });

      // Should still have headers
      expect(csv).toContain('Order Number');
      
      // Should have only one line (headers)
      const lines = csv.trim().split('\n');
      expect(lines.length).toBe(1);
    });

    it('should escape CSV special characters', async () => {
      const mockOrders = [
        {
          orderNumber: 'ORD-001',
          customer: { firstName: 'Doe,', lastName: 'John', email: 'john@example.com' },
          user: null,
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.PAID,
          paymentMethod: null,
          subtotal: 100.00,
          taxAmount: 10.00,
          shippingAmount: 5.00,
          discountAmount: 0,
          totalAmount: 115.00,
          _count: { items: 0 },
          createdAt: new Date('2025-01-01'),
        },
      ];

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any);

      const csv = await exportOrdersToCSV({ storeId: 'store-1' });

      // Should quote name with comma (firstName has comma in this test)
      expect(csv).toContain('"Doe, John"');
    });

    it('should handle missing payment method', async () => {
      const mockOrders = [
        {
          orderNumber: 'ORD-001',
          customer: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          user: null,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: null, // No payment yet
          subtotal: 100.00,
          taxAmount: 10.00,
          shippingAmount: 5.00,
          discountAmount: 0,
          totalAmount: 115.00,
          _count: { items: 0 },
          createdAt: new Date('2025-01-01'),
        },
      ];

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any);

      const csv = await exportOrdersToCSV({ storeId: 'store-1' });

      expect(csv).toContain('N/A'); // Should show N/A for missing payment method
    });
  });
});
