/**
 * Integration tests for GET /api/orders/export
 * 
 * Tests CSV export with streaming (≤10k rows) and async job enqueue (>10k rows).
 * Validates FR-016 implementation (T028 + T029).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '@/app/api/orders/export/route';
import { db } from '@/lib/db';
import { enqueueOrderExport } from '@/services/export-service';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    order: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/services/export-service', () => ({
  enqueueOrderExport: vi.fn(),
}));

vi.mock('@/lib/api-middleware', async () => {
  const actual = await vi.importActual('@/lib/api-middleware');
  return {
    ...actual,
    createApiHandler: (middlewares: any, handler: any) => {
      return async (request: any, context: any) => {
        // Simulate authenticated middleware with default store admin
        context = context || {};
        context.session = {
          user: { 
            id: 'user-1', 
            email: 'admin@example.com',
            role: 'STORE_ADMIN',
            storeId: 'store-1',
          },
        };
        context.storeId = 'store-1';
        return handler(request, context);
      };
    },
  };
});

vi.mock('@/lib/request-context', () => ({
  getRequestId: () => 'test-request-id-123',
}));

describe('GET /api/orders/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authorization', () => {
    it('should return 403 for unauthorized roles', async () => {
      // Override mock for this test
      const { createApiHandler } = await import('@/lib/api-middleware');
      const originalHandler = createApiHandler;
      
      vi.mocked(createApiHandler).mockImplementation((middlewares, handler) => {
        return async (request, context) => {
          context = context || {};
          context.session = {
            user: { id: 'user-1', email: 'user@example.com', role: 'CUSTOMER' },
          };
          context.storeId = null;
          return handler(request, context);
        };
      });

      const request = new Request('http://localhost:3000/api/orders/export') as any;
      const response = await GET(request, {} as any);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error.message).toBe('Insufficient permissions');
      
      // Restore
      vi.mocked(createApiHandler).mockImplementation(originalHandler as any);
    });

    it('should allow SUPER_ADMIN to export all stores', async () => {
      const { createApiHandler } = await import('@/lib/api-middleware');
      const originalHandler = createApiHandler;
      
      vi.mocked(createApiHandler).mockImplementation((middlewares, handler) => {
        return async (request, context) => {
          context = context || {};
          context.session = {
            user: { id: 'admin-1', email: 'admin@example.com', role: 'SUPER_ADMIN' },
          };
          context.storeId = null; // SUPER_ADMIN may not have storeId
          return handler(request, context);
        };
      });

      vi.mocked(db.order.count).mockResolvedValue(5000);
      vi.mocked(db.order.findMany).mockResolvedValue([
        {
          orderNumber: 'ORD-001',
          status: 'DELIVERED',
          totalAmount: 99.99,
          createdAt: new Date('2025-01-26T10:00:00Z'),
          customer: { email: 'customer@example.com' },
          items: [{ id: 'item-1' }, { id: 'item-2' }],
          paymentStatus: 'PAID',
        },
      ] as any);

      const request = new Request('http://localhost:3000/api/orders/export') as any;
      const response = await GET(request, {} as any);

      expect(response.status).toBe(200);
      
      // Restore
      vi.mocked(createApiHandler).mockImplementation(originalHandler as any);
    });

    it('should return 403 for non-super-admin without storeId', async () => {
      const { createApiHandler } = await import('@/lib/api-middleware');
      const originalHandler = createApiHandler;
      
      vi.mocked(createApiHandler).mockImplementation((middlewares, handler) => {
        return async (request, context) => {
          context = context || {};
          context.session = {
            user: { id: 'staff-1', email: 'staff@example.com', role: 'STAFF' },
          };
          context.storeId = null;
          return handler(request, context);
        };
      });

      const request = new Request('http://localhost:3000/api/orders/export') as any;
      const response = await GET(request, {} as any);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error.message).toBe('No store assigned');
      
      // Restore
      vi.mocked(createApiHandler).mockImplementation(originalHandler as any);
    });
  });

  describe('Query Parameter Validation', () => {
    it('should reject invalid status enum values', async () => {
      const request = new Request('http://localhost:3000/api/orders/export?status=INVALID') as any;
      const response = await GET(request, {} as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should accept valid OrderStatus enum values', async () => {
      vi.mocked(db.order.count).mockResolvedValue(100);
      vi.mocked(db.order.findMany).mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/orders/export?status=DELIVERED') as any;
      const response = await GET(request, {} as any);

      expect(response.status).toBe(200);
    });

    it('should reject invalid datetime format', async () => {
      const request = new Request('http://localhost:3000/api/orders/export?dateFrom=invalid-date') as any;
      const response = await GET(request, {} as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should accept valid datetime strings', async () => {
      vi.mocked(db.order.count).mockResolvedValue(50);
      vi.mocked(db.order.findMany).mockResolvedValue([]);

      const request = new Request(
        'http://localhost:3000/api/orders/export?dateFrom=2025-01-01T00:00:00.000Z&dateTo=2025-01-31T23:59:59.999Z'
      ) as any;
      const response = await GET(request, {} as any);

      expect(response.status).toBe(200);
    });

    it('should accept search parameter', async () => {
      vi.mocked(db.order.count).mockResolvedValue(10);
      vi.mocked(db.order.findMany).mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/orders/export?search=ORD-123') as any;
      const response = await GET(request, {} as any);

      expect(response.status).toBe(200);
    });
  });

  describe('Streaming Export (≤10k rows)', () => {
    it('should stream CSV directly when row count ≤ 10000', async () => {
      vi.mocked(db.order.count).mockResolvedValue(5000);
      vi.mocked(db.order.findMany).mockResolvedValue([
        {
          orderNumber: 'ORD-001',
          status: 'DELIVERED',
          totalAmount: 99.99,
          createdAt: new Date('2025-01-26T10:00:00Z'),
          customer: { email: 'customer@example.com' },
          items: [{ id: 'item-1' }],
          paymentStatus: 'PAID',
        },
      ] as any);

      const request = new Request('http://localhost:3000/api/orders/export') as any;
      const response = await GET(request, {} as any);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
      expect(response.headers.get('Content-Disposition')).toContain('attachment; filename=');
      expect(response.headers.get('X-Request-Id')).toBe('test-request-id-123');
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    });

    it('should include CSV header row', async () => {
      vi.mocked(db.order.count).mockResolvedValue(1);
      vi.mocked(db.order.findMany).mockResolvedValue([
        {
          orderNumber: 'ORD-001',
          status: 'PENDING',
          totalAmount: 50.00,
          createdAt: new Date('2025-01-26T10:00:00Z'),
          customer: { email: 'test@example.com' },
          items: [],
          paymentStatus: 'PENDING',
        },
      ] as any);

      const request = new Request('http://localhost:3000/api/orders/export') as any;
      const response = await GET(request, {} as any);

      const text = await response.text();
      expect(text).toContain('Order Number,Customer Email,Status,Total Amount,Currency,Created At,Items Count,Payment Status');
    });

    it('should escape CSV fields with commas and quotes', async () => {
      vi.mocked(db.order.count).mockResolvedValue(1);
      vi.mocked(db.order.findMany).mockResolvedValue([
        {
          orderNumber: 'ORD-001',
          status: 'DELIVERED',
          totalAmount: 99.99,
          createdAt: new Date('2025-01-26T10:00:00Z'),
          customer: { email: 'customer,"special"@example.com' },
          items: [],
          paymentStatus: 'PAID',
        },
      ] as any);

      const request = new Request('http://localhost:3000/api/orders/export') as any;
      const response = await GET(request, {} as any);

      const text = await response.text();
      // Email should be wrapped in quotes and inner quotes escaped
      expect(text).toContain('"customer,""special""@example.com"');
    });

    it('should apply status filter', async () => {
      vi.mocked(db.order.count).mockResolvedValue(50);
      vi.mocked(db.order.findMany).mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/orders/export?status=CANCELLED') as any;
      await GET(request, {} as any);

      expect(db.order.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'CANCELLED',
          }),
        })
      );
    });

    it('should apply date range filter', async () => {
      vi.mocked(db.order.count).mockResolvedValue(100);
      vi.mocked(db.order.findMany).mockResolvedValue([]);

      const request = new Request(
        'http://localhost:3000/api/orders/export?dateFrom=2025-01-01T00:00:00.000Z&dateTo=2025-01-31T23:59:59.999Z'
      ) as any;
      await GET(request, {} as any);

      expect(db.order.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('should apply search filter', async () => {
      vi.mocked(db.order.count).mockResolvedValue(5);
      vi.mocked(db.order.findMany).mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/orders/export?search=john@example.com') as any;
      await GET(request, {} as any);

      expect(db.order.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ orderNumber: expect.any(Object) }),
              expect.objectContaining({ customerEmail: expect.any(Object) }),
            ]),
          }),
        })
      );
    });
  });

  describe('Async Export (>10k rows)', () => {
    it('should enqueue job when row count > 10000', async () => {
      vi.mocked(db.order.count).mockResolvedValue(15000);
      vi.mocked(enqueueOrderExport).mockResolvedValue({
        jobId: 'job-123',
        status: 'PENDING',
      } as any);

      const request = new Request('http://localhost:3000/api/orders/export') as any;
      const response = await GET(request, {} as any);

      expect(response.status).toBe(202); // Accepted
      const body = await response.json();
      
      expect(body.data.jobId).toBe('job-123');
      expect(body.data.status).toBe('PENDING');
      expect(body.data.estimatedRows).toBe(15000);
      expect(body.data.message).toContain('You will receive an email and in-app notification');
      
      expect(enqueueOrderExport).toHaveBeenCalledWith(
        'store-1',
        'user-1',
        expect.any(Object),
        15000
      );
    });

    it('should not stream when threshold exceeded', async () => {
      vi.mocked(db.order.count).mockResolvedValue(20000);
      vi.mocked(enqueueOrderExport).mockResolvedValue({
        jobId: 'job-456',
        status: 'PENDING',
      } as any);

      const request = new Request('http://localhost:3000/api/orders/export') as any;
      const response = await GET(request, {} as any);

      expect(response.status).toBe(202);
      expect(response.headers.get('Content-Type')).not.toBe('text/csv');
      
      // Should not call findMany for streaming
      expect(db.order.findMany).not.toHaveBeenCalled();
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should filter by storeId for non-super-admin users', async () => {
      vi.mocked(db.order.count).mockResolvedValue(100);
      vi.mocked(db.order.findMany).mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/orders/export') as any;
      await GET(request, {} as any);

      expect(db.order.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            storeId: 'store-1',
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      vi.mocked(db.order.count).mockRejectedValue(new Error('Database connection lost'));

      const request = new Request('http://localhost:3000/api/orders/export') as any;
      const response = await GET(request, {} as any);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });

    it('should handle enqueue job errors', async () => {
      vi.mocked(db.order.count).mockResolvedValue(15000);
      vi.mocked(enqueueOrderExport).mockRejectedValue(new Error('Job queue full'));

      const request = new Request('http://localhost:3000/api/orders/export') as any;
      const response = await GET(request, {} as any);

      expect(response.status).toBe(500);
    });
  });

  describe('Response Headers', () => {
    it('should include X-Request-Id header in streaming response', async () => {
      vi.mocked(db.order.count).mockResolvedValue(100);
      vi.mocked(db.order.findMany).mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/orders/export') as any;
      const response = await GET(request, {} as any);

      expect(response.headers.get('X-Request-Id')).toBe('test-request-id-123');
    });

    it('should set no-cache headers for CSV streams', async () => {
      vi.mocked(db.order.count).mockResolvedValue(50);
      vi.mocked(db.order.findMany).mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/orders/export') as any;
      const response = await GET(request, {} as any);

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    });

    it('should include date in filename', async () => {
      vi.mocked(db.order.count).mockResolvedValue(10);
      vi.mocked(db.order.findMany).mockResolvedValue([]);

      const request = new Request('http://localhost:3000/api/orders/export') as any;
      const response = await GET(request, {} as any);

      const disposition = response.headers.get('Content-Disposition');
      expect(disposition).toMatch(/filename="orders-\d{4}-\d{2}-\d{2}\.csv"/);
    });
  });
});
