/**
 * Unit tests for audit middleware
 * 
 * Tests cover:
 * - Request metadata extraction
 * - HTTP method to action mapping
 * - Audit trail logging
 * - Middleware wrapper functionality
 * - Error handling
 * 
 * @module tests/unit/lib/audit-middleware.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  extractRequestMetadata,
  mapMethodToAction,
  logAuditTrail,
  withAuditLog,
  shouldAudit,
} from '@/lib/audit-middleware';
import { AuditLogService } from '@/services/audit-log-service';

// Mock AuditLogService
vi.mock('@/services/audit-log-service', () => ({
  AuditLogService: {
    create: vi.fn(),
  },
}));

describe('audit-middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractRequestMetadata', () => {
    it('should extract IP from x-forwarded-for header', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
          'user-agent': 'Mozilla/5.0',
        },
      });

      // Act
      const metadata = extractRequestMetadata(request);

      // Assert
      expect(metadata).toEqual({
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });
    });

    it('should extract IP from x-real-ip header if x-forwarded-for not present', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-real-ip': '192.168.1.1',
          'user-agent': 'Mozilla/5.0',
        },
      });

      // Act
      const metadata = extractRequestMetadata(request);

      // Assert
      expect(metadata).toEqual({
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });
    });

    it('should use "unknown" for missing IP headers', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      });

      // Act
      const metadata = extractRequestMetadata(request);

      // Assert
      expect(metadata).toEqual({
        ipAddress: 'unknown',
        userAgent: 'Mozilla/5.0',
      });
    });

    it('should use "unknown" for missing user agent', () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });

      // Act
      const metadata = extractRequestMetadata(request);

      // Assert
      expect(metadata).toEqual({
        ipAddress: '192.168.1.1',
        userAgent: 'unknown',
      });
    });
  });

  describe('mapMethodToAction', () => {
    it('should map POST to CREATE', () => {
      expect(mapMethodToAction('POST')).toBe('CREATE');
    });

    it('should map PUT to UPDATE', () => {
      expect(mapMethodToAction('PUT')).toBe('UPDATE');
    });

    it('should map PATCH to UPDATE', () => {
      expect(mapMethodToAction('PATCH')).toBe('UPDATE');
    });

    it('should map DELETE to DELETE', () => {
      expect(mapMethodToAction('DELETE')).toBe('DELETE');
    });

    it('should handle lowercase methods', () => {
      expect(mapMethodToAction('post')).toBe('CREATE');
      expect(mapMethodToAction('put')).toBe('UPDATE');
      expect(mapMethodToAction('patch')).toBe('UPDATE');
      expect(mapMethodToAction('delete')).toBe('DELETE');
    });

    it('should return original method for unmapped methods', () => {
      expect(mapMethodToAction('GET')).toBe('GET');
      expect(mapMethodToAction('HEAD')).toBe('HEAD');
    });
  });

  describe('logAuditTrail', () => {
    it('should log audit trail with all parameters', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0',
        },
      });

      vi.mocked(AuditLogService.create).mockResolvedValue({} as any);

      // Act
      await logAuditTrail(request, {
        entityType: 'Product',
        entityId: 'prod-123',
        storeId: 'store-456',
        userId: 'user-789',
        changes: {
          price: { old: 99.99, new: 89.99 },
        },
      });

      // Assert
      expect(AuditLogService.create).toHaveBeenCalledWith(
        'CREATE',
        'Product',
        'prod-123',
        {
          storeId: 'store-456',
          userId: 'user-789',
          changes: {
            price: { old: 99.99, new: 89.99 },
          },
          metadata: {
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
          },
        }
      );
    });

    it('should use custom action if provided', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0',
        },
      });

      vi.mocked(AuditLogService.create).mockResolvedValue({} as any);

      // Act
      await logAuditTrail(request, {
        action: 'CUSTOM_ACTION',
        entityType: 'Product',
        entityId: 'prod-123',
      });

      // Assert
      expect(AuditLogService.create).toHaveBeenCalledWith(
        'CUSTOM_ACTION',
        'Product',
        'prod-123',
        expect.any(Object)
      );
    });

    it('should handle audit log creation failure gracefully', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(AuditLogService.create).mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        logAuditTrail(request, {
          entityType: 'Product',
          entityId: 'prod-123',
        })
      ).resolves.toBeUndefined();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to create audit log:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('withAuditLog', () => {
    it('should wrap handler and log successful mutations', async () => {
      // Arrange
      const mockHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ data: { id: 'prod-123' } }, { status: 201 })
      );

      const mockGetContext = vi.fn().mockResolvedValue({
        entityType: 'Product',
        entityId: 'prod-123',
        storeId: 'store-456',
        userId: 'user-789',
      });

      vi.mocked(AuditLogService.create).mockResolvedValue({} as any);

      const wrappedHandler = withAuditLog(mockHandler, mockGetContext);

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0',
        },
      });

      // Act
      const response = await wrappedHandler(request);

      // Assert
      expect(mockHandler).toHaveBeenCalledWith(request, undefined);
      expect(mockGetContext).toHaveBeenCalled();
      expect(AuditLogService.create).toHaveBeenCalledWith(
        'CREATE',
        'Product',
        'prod-123',
        expect.objectContaining({
          storeId: 'store-456',
          userId: 'user-789',
        })
      );
      expect(response.status).toBe(201);
    });

    it('should not log GET requests', async () => {
      // Arrange
      const mockHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ data: [] })
      );

      const mockGetContext = vi.fn();
      const wrappedHandler = withAuditLog(mockHandler, mockGetContext);

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'GET',
      });

      // Act
      await wrappedHandler(request);

      // Assert
      expect(mockHandler).toHaveBeenCalled();
      expect(mockGetContext).not.toHaveBeenCalled();
      expect(AuditLogService.create).not.toHaveBeenCalled();
    });

    it('should not log failed requests', async () => {
      // Arrange
      const mockHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ error: 'Not found' }, { status: 404 })
      );

      const mockGetContext = vi.fn();
      const wrappedHandler = withAuditLog(mockHandler, mockGetContext);

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'DELETE',
      });

      // Act
      await wrappedHandler(request);

      // Assert
      expect(mockHandler).toHaveBeenCalled();
      expect(mockGetContext).not.toHaveBeenCalled();
      expect(AuditLogService.create).not.toHaveBeenCalled();
    });

    it('should handle audit context extraction failure gracefully', async () => {
      // Arrange
      const mockHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ data: { id: 'prod-123' } })
      );

      const mockGetContext = vi.fn().mockRejectedValue(new Error('Context error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const wrappedHandler = withAuditLog(mockHandler, mockGetContext);

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
      });

      // Act
      const response = await wrappedHandler(request);

      // Assert
      expect(mockHandler).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to log audit trail:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should pass context parameter to handler', async () => {
      // Arrange
      const mockHandler = vi.fn().mockResolvedValue(
        NextResponse.json({ data: {} })
      );

      const mockGetContext = vi.fn().mockResolvedValue({
        entityType: 'Product',
        entityId: 'prod-123',
      });

      vi.mocked(AuditLogService.create).mockResolvedValue({} as any);

      const wrappedHandler = withAuditLog(mockHandler, mockGetContext);

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
      });

      const context = { params: { id: 'prod-123' } };

      // Act
      await wrappedHandler(request, context);

      // Assert
      expect(mockHandler).toHaveBeenCalledWith(request, context);
    });
  });

  describe('shouldAudit', () => {
    it('should return true for POST', () => {
      expect(shouldAudit('POST')).toBe(true);
    });

    it('should return true for PUT', () => {
      expect(shouldAudit('PUT')).toBe(true);
    });

    it('should return true for PATCH', () => {
      expect(shouldAudit('PATCH')).toBe(true);
    });

    it('should return true for DELETE', () => {
      expect(shouldAudit('DELETE')).toBe(true);
    });

    it('should return false for GET', () => {
      expect(shouldAudit('GET')).toBe(false);
    });

    it('should return false for HEAD', () => {
      expect(shouldAudit('HEAD')).toBe(false);
    });

    it('should handle lowercase methods', () => {
      expect(shouldAudit('post')).toBe(true);
      expect(shouldAudit('get')).toBe(false);
    });
  });
});
