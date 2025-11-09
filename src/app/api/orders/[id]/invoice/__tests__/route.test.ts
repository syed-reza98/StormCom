/**
 * Unit Tests for Invoice Generation API Route
 * Tests GET /api/orders/[id]/invoice with PDF generation and multi-tenant access
 * 
 * @vitest
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import * as orderService from '@/services/order-service';
import { PaymentStatus } from '@prisma/client';

// Mock next-auth
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

// Mock order service
vi.mock('@/services/order-service', () => ({
  getInvoiceData: vi.fn(),
}));

// Import mocked functions
import { getServerSession } from 'next-auth';

describe('GET /api/orders/[id]/invoice', () => {
  const mockSession = {
    user: {
      id: 'user-1',
      email: 'admin@store.com',
      role: 'STORE_ADMIN',
      storeId: 'store-1',
    },
  };

  const mockInvoiceData = {
    orderNumber: 'ORD-001',
    invoiceNumber: 'ORD-001',
    invoiceDate: new Date('2025-10-01'),
    dueDate: new Date('2025-10-01'),
    status: PaymentStatus.PAID as any,
    subtotal: 120.0,
    taxAmount: 10.0,
    shippingAmount: 20.0,
    discountAmount: 0.0,
    totalAmount: 150.0,
    paymentMethod: 'CREDIT_CARD',
    paymentStatus: PaymentStatus.PAID,
    paymentGateway: 'STRIPE',
    shippingMethod: 'Standard Shipping',
    trackingNumber: 'TRACK123',
    customerNote: null,
    adminNote: null,
    store: {
      name: 'Test Store',
      logo: 'https://example.com/logo.png',
      email: 'store@example.com',
      phone: '+1234567890',
      address: '123 Main St',
      city: 'City',
      state: 'State',
      postalCode: '12345',
      country: 'US',
    },
    seller: {
      name: 'Test Store',
      email: 'store@example.com',
      phone: '+1234567890',
      logo: 'https://example.com/logo.png',
      address: {
        street: '123 Main St',
        city: 'City',
        state: 'State',
        postalCode: '12345',
        country: 'US',
      },
    },
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1987654321',
    },
    buyer: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1987654321',
      address: {
        street: '456 Billing Ave',
        city: 'Billing City',
        state: 'BC',
        postalCode: '54321',
        country: 'US',
      },
    },
    shippingAddress: {
      name: 'John Doe',
      street: '789 Shipping Rd',
      city: 'Shipping City',
      state: 'SC',
      postalCode: '98765',
      country: 'US',
      phone: '+1987654321',
    },
    items: [
      {
        description: 'Product 1 - Size M',
        sku: 'SKU-001',
        quantity: 2,
        unitPrice: 60.0,
        subtotal: 120.0,
        tax: 10.0,
        discount: 0.0,
        total: 130.0,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Authentication required');
    });

    it('should return 401 if session exists but user is missing', async () => {
      vi.mocked(getServerSession).mockResolvedValue({ user: null } as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });
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

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('Only Store Admin and Super Admin');
    });

    it('should return 403 for STAFF role', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          ...mockSession.user,
          role: 'STAFF',
        },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.message).toContain('Only Store Admin and Super Admin');
    });

    it('should allow Super Admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          ...mockSession.user,
          role: 'SUPER_ADMIN',
          storeId: null,
        },
      } as any);

      vi.mocked(orderService.getInvoiceData).mockResolvedValue(mockInvoiceData as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
    });

    it('should allow Store Admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(orderService.getInvoiceData).mockResolvedValue(mockInvoiceData as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
    });
  });

  describe('Invoice Generation', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
    });

    it('should generate PDF invoice for valid order', async () => {
      vi.mocked(orderService.getInvoiceData).mockResolvedValue(mockInvoiceData as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });

      expect(response.status).toBe(200);
      expect(orderService.getInvoiceData).toHaveBeenCalledWith('order-1', 'store-1');
    });

    it('should return 404 when order is not found', async () => {
      vi.mocked(orderService.getInvoiceData).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/orders/order-999/invoice');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Order not found or access denied');
    });

    it('should pass orderId from path parameters', async () => {
      vi.mocked(orderService.getInvoiceData).mockResolvedValue(mockInvoiceData as any);

      const testOrderId = 'test-order-123';
      const request = new NextRequest(
        `http://localhost:3000/api/orders/${testOrderId}/invoice`
      );
      await GET(request, { params: Promise.resolve({ id: testOrderId }) });

      expect(orderService.getInvoiceData).toHaveBeenCalledWith(testOrderId, 'store-1');
    });
  });

  describe('PDF Response Headers', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(orderService.getInvoiceData).mockResolvedValue(mockInvoiceData as any);
    });

    it('should return Content-Type: application/pdf', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });

      expect(response.headers.get('Content-Type')).toBe('application/pdf');
    });

    it('should return Content-Disposition with filename', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });

      const contentDisposition = response.headers.get('Content-Disposition');
      expect(contentDisposition).toContain('attachment');
      expect(contentDisposition).toContain('invoice-ORD-001');
      expect(contentDisposition).toMatch(/\.pdf/);
    });

    it('should include filename with orderNumber and date', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });

      const contentDisposition = response.headers.get('Content-Disposition');
      const today = new Date().toISOString().split('T')[0];
      
      expect(contentDisposition).toContain(`invoice-ORD-001-${today}.pdf`);
    });

    it('should return Content-Length header', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });

      const contentLength = response.headers.get('Content-Length');
      expect(contentLength).toBeTruthy();
      expect(Number(contentLength)).toBeGreaterThan(0);
    });

    it('should return Cache-Control header for private caching', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('private');
      expect(cacheControl).toContain('must-revalidate');
    });
  });

  describe('PDF Content', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(orderService.getInvoiceData).mockResolvedValue(mockInvoiceData as any);
    });

    it('should return PDF buffer in response body', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      expect(buffer.length).toBeGreaterThan(0);
      // Check for PDF magic number (%PDF)
      expect(buffer.toString('utf-8', 0, 4)).toBe('%PDF');
    });

    it('should include order number in PDF content', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfContent = buffer.toString('utf-8');

      expect(pdfContent).toContain('ORD-001');
    });

    it('should include store name in PDF content', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfContent = buffer.toString('utf-8');

      expect(pdfContent).toContain('Test Store');
    });

    it('should include customer name in PDF content', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfContent = buffer.toString('utf-8');

      expect(pdfContent).toContain('John Doe');
    });

    it('should include total amount in PDF content', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfContent = buffer.toString('utf-8');

      expect(pdfContent).toContain('150.00');
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should pass storeId to getInvoiceData for Store Admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(orderService.getInvoiceData).mockResolvedValue(mockInvoiceData as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      await GET(request, { params: Promise.resolve({ id: 'order-1' }) });

      expect(orderService.getInvoiceData).toHaveBeenCalledWith('order-1', 'store-1');
    });

    it('should pass undefined storeId for Super Admin', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          ...mockSession.user,
          role: 'SUPER_ADMIN',
          storeId: null,
        },
      } as any);

      vi.mocked(orderService.getInvoiceData).mockResolvedValue(mockInvoiceData as any);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      await GET(request, { params: Promise.resolve({ id: 'order-1' }) });

      expect(orderService.getInvoiceData).toHaveBeenCalledWith('order-1', undefined);
    });

    it('should return 404 when Store Admin tries to access order from different store', async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
      vi.mocked(orderService.getInvoiceData).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.message).toBe('Order not found or access denied');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
    });

    it('should return 500 for service errors', async () => {
      vi.mocked(orderService.getInvoiceData).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Failed to generate invoice');
    });

    it('should return 500 with generic message for unknown errors', async () => {
      vi.mocked(orderService.getInvoiceData).mockRejectedValue('Unknown error');

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      const response = await GET(request, { params: Promise.resolve({ id: 'order-1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Failed to generate invoice');
    });

    it('should log error to console', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(orderService.getInvoiceData).mockRejectedValue(
        new Error('Test error')
      );

      const request = new NextRequest('http://localhost:3000/api/orders/order-1/invoice');
      await GET(request, { params: Promise.resolve({ id: 'order-1' }) });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invoice generation error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
