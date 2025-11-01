/**
 * Integration tests for Audit Logs API
 * 
 * Tests cover:
 * - Retrieving audit logs with filters
 * - Pagination functionality
 * - Multi-tenant access control
 * - Authentication and authorization
 * - Error handling
 * 
 * @module tests/integration/api/audit-logs.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/audit-logs/route';
import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/session-storage';
import { AuditLogService } from '@/services/audit-log-service';

// Mock dependencies
vi.mock('@/lib/session-storage', () => ({
  getSessionFromRequest: vi.fn(),
}));

vi.mock('@/services/audit-log-service', () => ({
  AuditLogService: {
    getAll: vi.fn(),
  },
}));

describe('GET /api/audit-logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 if not authenticated', async () => {
      // Arrange
      vi.mocked(getSessionFromRequest).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/audit-logs');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toEqual({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    });
  });

  describe('Authorization', () => {
    it('should allow SUPER_ADMIN to access all logs', async () => {
      // Arrange
      vi.mocked(getSessionFromRequest).mockResolvedValue({
        userId: 'user-super',
        storeId: null,
        role: 'SUPER_ADMIN',
      } as any);

      const mockLogs = {
        logs: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
      };

      vi.mocked(AuditLogService.getAll).mockResolvedValue(mockLogs);

      const request = new NextRequest('http://localhost:3000/api/audit-logs');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockLogs);
      expect(AuditLogService.getAll).toHaveBeenCalledWith(
        expect.not.objectContaining({ storeId: expect.anything() })
      );
    });

    it('should restrict STORE_ADMIN to their store logs only', async () => {
      // Arrange
      vi.mocked(getSessionFromRequest).mockResolvedValue({
        userId: 'user-admin',
        storeId: 'store-123',
        role: 'STORE_ADMIN',
      } as any);

      const mockLogs = {
        logs: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
      };

      vi.mocked(AuditLogService.getAll).mockResolvedValue(mockLogs);

      const request = new NextRequest('http://localhost:3000/api/audit-logs');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockLogs);
      expect(AuditLogService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ storeId: 'store-123' })
      );
    });

    it('should return 403 if STAFF user has no storeId', async () => {
      // Arrange
      vi.mocked(getSessionFromRequest).mockResolvedValue({
        userId: 'user-staff',
        storeId: null,
        role: 'STAFF',
      } as any);

      const request = new NextRequest('http://localhost:3000/api/audit-logs');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toEqual({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    });

    it('should override storeId filter for non-SUPER_ADMIN users', async () => {
      // Arrange
      vi.mocked(getSessionFromRequest).mockResolvedValue({
        userId: 'user-admin',
        storeId: 'store-123',
        role: 'STORE_ADMIN',
      } as any);

      vi.mocked(AuditLogService.getAll).mockResolvedValue({
        logs: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/audit-logs?storeId=store-999'
      );

      // Act
      await GET(request);

      // Assert
      expect(AuditLogService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ storeId: 'store-123' }) // Session storeId, not requested storeId
      );
    });

    it('should allow SUPER_ADMIN to filter by storeId', async () => {
      // Arrange
      vi.mocked(getSessionFromRequest).mockResolvedValue({
        userId: 'user-super',
        storeId: null,
        role: 'SUPER_ADMIN',
      } as any);

      vi.mocked(AuditLogService.getAll).mockResolvedValue({
        logs: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/audit-logs?storeId=store-123'
      );

      // Act
      await GET(request);

      // Assert
      expect(AuditLogService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ storeId: 'store-123' })
      );
    });
  });

  describe('Query Parameters', () => {
    beforeEach(() => {
      vi.mocked(getSessionFromRequest).mockResolvedValue({
        userId: 'user-super',
        storeId: null,
        role: 'SUPER_ADMIN',
      } as any);

      vi.mocked(AuditLogService.getAll).mockResolvedValue({
        logs: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
      });
    });

    it('should pass all valid filters to service', async () => {
      // Arrange
      const request = new NextRequest(
        'http://localhost:3000/api/audit-logs?' +
          'storeId=store-123&' +
          'userId=user-456&' +
          'entityType=Product&' +
          'entityId=prod-789&' +
          'action=UPDATE&' +
          'startDate=2025-01-01T00:00:00.000Z&' +
          'endDate=2025-01-31T23:59:59.999Z&' +
          'page=2&' +
          'limit=20'
      );

      // Act
      await GET(request);

      // Assert
      expect(AuditLogService.getAll).toHaveBeenCalledWith({
        storeId: 'store-123',
        userId: 'user-456',
        entityType: 'Product',
        entityId: 'prod-789',
        action: 'UPDATE',
        startDate: new Date('2025-01-01T00:00:00.000Z'),
        endDate: new Date('2025-01-31T23:59:59.999Z'),
        page: 2,
        limit: 20,
      });
    });

    it('should use default pagination if not provided', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/audit-logs');

      // Act
      await GET(request);

      // Assert
      expect(AuditLogService.getAll).toHaveBeenCalledWith(
        expect.not.objectContaining({
          page: expect.anything(),
          limit: expect.anything(),
        })
      );
    });

    it('should return 400 for invalid action', async () => {
      // Arrange
      const request = new NextRequest(
        'http://localhost:3000/api/audit-logs?action=INVALID'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Invalid query parameters');
    });

    it('should return 400 for invalid page number', async () => {
      // Arrange
      const request = new NextRequest(
        'http://localhost:3000/api/audit-logs?page=abc'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid date format', async () => {
      // Arrange
      const request = new NextRequest(
        'http://localhost:3000/api/audit-logs?startDate=invalid-date'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should convert date strings to Date objects', async () => {
      // Arrange
      const request = new NextRequest(
        'http://localhost:3000/api/audit-logs?startDate=2025-01-01T00:00:00.000Z'
      );

      // Act
      await GET(request);

      // Assert
      expect(AuditLogService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(Date),
        })
      );
    });
  });

  describe('Success Response', () => {
    beforeEach(() => {
      vi.mocked(getSessionFromRequest).mockResolvedValue({
        userId: 'user-admin',
        storeId: 'store-123',
        role: 'STORE_ADMIN',
      } as any);
    });

    it('should return paginated audit logs', async () => {
      // Arrange
      const mockLogs = {
        logs: [
          {
            id: 'audit-1',
            action: 'UPDATE',
            entityType: 'Product',
            entityId: 'prod-123',
            storeId: 'store-123',
            userId: 'user-456',
            changes: JSON.stringify({ price: { old: 99, new: 89 } }),
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
            createdAt: new Date('2025-01-26T10:00:00.000Z'),
            user: { id: 'user-456', name: 'John Doe', email: 'john@example.com' },
            store: { id: 'store-123', name: 'Demo Store' },
          },
        ],
        total: 125,
        page: 1,
        limit: 20,
        totalPages: 7,
      };

      vi.mocked(AuditLogService.getAll).mockResolvedValue(mockLogs);

      const request = new NextRequest(
        'http://localhost:3000/api/audit-logs?page=1&limit=20'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.total).toBe(125);
      expect(data.data.page).toBe(1);
      expect(data.data.limit).toBe(20);
      expect(data.data.totalPages).toBe(7);
      expect(data.data.logs).toHaveLength(1);
      expect(data.data.logs[0].id).toBe('audit-1');
      expect(data.data.logs[0].action).toBe('UPDATE');
      expect(data.data.logs[0].entityType).toBe('Product');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.mocked(getSessionFromRequest).mockResolvedValue({
        userId: 'user-admin',
        storeId: 'store-123',
        role: 'STORE_ADMIN',
      } as any);
    });

    it('should return 400 for invalid page validation from service', async () => {
      // Arrange
      vi.mocked(AuditLogService.getAll).mockRejectedValue(
        new Error('page must be >= 1')
      );

      const request = new NextRequest('http://localhost:3000/api/audit-logs');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'page must be >= 1',
      });
    });

    it('should return 400 for invalid limit validation from service', async () => {
      // Arrange
      vi.mocked(AuditLogService.getAll).mockRejectedValue(
        new Error('limit must be between 1 and 100')
      );

      const request = new NextRequest('http://localhost:3000/api/audit-logs');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'limit must be between 1 and 100',
      });
    });

    it('should return 500 for unexpected errors', async () => {
      // Arrange
      vi.mocked(AuditLogService.getAll).mockRejectedValue(
        new Error('Database connection failed')
      );

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const request = new NextRequest('http://localhost:3000/api/audit-logs');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toEqual({
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve audit logs',
      });
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
