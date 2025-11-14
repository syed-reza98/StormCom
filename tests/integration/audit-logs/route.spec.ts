/**
 * Integration tests for GET /api/audit-logs
 * 
 * Tests audit log retrieval with filtering, pagination, and authorization.
 * Validates multi-tenant isolation and permission enforcement.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '@/app/api/audit-logs/route';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('next-auth/next');
vi.mock('@/lib/db', () => ({
  db: {
    auditLog: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('GET /api/audit-logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/audit-logs');
      const response = await GET(request as any);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 when session has no user', async () => {
      vi.mocked(getServerSession).mockResolvedValue({} as any);

      const request = new Request('http://localhost:3000/api/audit-logs');
      const response = await GET(request as any);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should allow SUPER_ADMIN to access all logs', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-1', role: 'SUPER_ADMIN', email: 'admin@example.com' },
      } as any);

      vi.mocked(db.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(db.auditLog.count).mockResolvedValue(0);

      const request = new Request('http://localhost:3000/api/audit-logs');
      const response = await GET(request as any);

      expect(response.status).toBe(200);
      expect(db.auditLog.findMany).toHaveBeenCalled();
    });

    it('should restrict STORE_ADMIN to their store logs only', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { 
          id: 'admin-2', 
          role: 'STORE_ADMIN', 
          storeId: 'store-123',
          email: 'storeAdmin@example.com',
        },
      } as any);

      vi.mocked(db.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(db.auditLog.count).mockResolvedValue(0);

      const request = new Request('http://localhost:3000/api/audit-logs?storeId=store-456');
      const response = await GET(request as any);

      expect(response.status).toBe(200);
      
      // Verify storeId was overridden to session storeId
      expect(db.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            storeId: 'store-123', // Session storeId, not query param
          }),
        })
      );
    });

    it('should return 403 for non-super-admin without storeId', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'staff-1', role: 'STAFF', email: 'staff@example.com' },
      } as any);

      const request = new Request('http://localhost:3000/api/audit-logs');
      const response = await GET(request as any);

      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Query Parameter Validation', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-1', role: 'SUPER_ADMIN', email: 'admin@example.com' },
      } as any);
    });

    it('should reject invalid action enum values', async () => {
      const request = new Request('http://localhost:3000/api/audit-logs?action=INVALID');
      const response = await GET(request as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid date format', async () => {
      const request = new Request('http://localhost:3000/api/audit-logs?startDate=invalid-date');
      const response = await GET(request as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should accept valid datetime strings', async () => {
      vi.mocked(db.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(db.auditLog.count).mockResolvedValue(0);

      const request = new Request(
        'http://localhost:3000/api/audit-logs?startDate=2025-01-01T00:00:00.000Z'
      );
      const response = await GET(request as any);

      expect(response.status).toBe(200);
    });

    it('should validate page and limit as numbers', async () => {
      vi.mocked(db.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(db.auditLog.count).mockResolvedValue(0);

      const request = new Request('http://localhost:3000/api/audit-logs?page=2&limit=20');
      const response = await GET(request as any);

      expect(response.status).toBe(200);
    });
  });

  describe('Filtering and Pagination', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-1', role: 'SUPER_ADMIN', email: 'admin@example.com' },
      } as any);
    });

    it('should apply entityType filter', async () => {
      vi.mocked(db.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(db.auditLog.count).mockResolvedValue(0);

      const request = new Request('http://localhost:3000/api/audit-logs?entityType=Product');
      const response = await GET(request as any);

      expect(response.status).toBe(200);
      expect(db.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entityType: 'Product',
          }),
        })
      );
    });

    it('should apply action filter', async () => {
      vi.mocked(db.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(db.auditLog.count).mockResolvedValue(0);

      const request = new Request('http://localhost:3000/api/audit-logs?action=UPDATE');
      const response = await GET(request as any);

      expect(response.status).toBe(200);
      expect(db.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: 'UPDATE',
          }),
        })
      );
    });

    it('should apply date range filter', async () => {
      vi.mocked(db.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(db.auditLog.count).mockResolvedValue(0);

      const request = new Request(
        'http://localhost:3000/api/audit-logs?startDate=2025-01-01T00:00:00.000Z&endDate=2025-01-31T23:59:59.999Z'
      );
      const response = await GET(request as any);

      expect(response.status).toBe(200);
      expect(db.auditLog.findMany).toHaveBeenCalledWith(
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
  });

  describe('Response Format', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-1', role: 'SUPER_ADMIN', email: 'admin@example.com' },
      } as any);
    });

    it('should return paginated results with metadata', async () => {
      const mockLogs = [
        {
          id: 'audit-1',
          action: 'UPDATE',
          entityType: 'Product',
          entityId: 'prod-1',
          storeId: 'store-1',
          userId: 'user-1',
          changes: '{"price":{"old":99.99,"new":89.99}}',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2025-01-26T10:00:00Z'),
          user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
          store: { id: 'store-1', name: 'Demo Store' },
        },
      ];

      vi.mocked(db.auditLog.findMany).mockResolvedValue(mockLogs as any);
      vi.mocked(db.auditLog.count).mockResolvedValue(125);

      const request = new Request('http://localhost:3000/api/audit-logs?page=1&limit=20');
      const response = await GET(request as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      
      expect(body.data).toHaveProperty('logs');
      expect(body.data).toHaveProperty('total', 125);
      expect(body.data).toHaveProperty('page', 1);
      expect(body.data).toHaveProperty('limit', 20);
      expect(body.data).toHaveProperty('totalPages', 7);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'admin-1', role: 'SUPER_ADMIN', email: 'admin@example.com' },
      } as any);
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(db.auditLog.findMany).mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost:3000/api/audit-logs');
      const response = await GET(request as any);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
