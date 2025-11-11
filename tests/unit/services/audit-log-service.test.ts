/**
 * Unit tests for AuditLogService
 * 
 * Tests cover:
 * - Audit log creation with all parameters
 * - Audit log retrieval with filters
 * - Entity-specific audit logs
 * - Pagination functionality
 * - Error handling and validation
 * 
 * @module tests/unit/services/audit-log-service.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditLogService } from '@/services/audit-log-service';
import { prisma } from '@/lib/db';

// Mock Prisma client
vi.mock('@/lib/db', () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('AuditLogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create audit log with all parameters', async () => {
      // Arrange
      const mockAuditLog = {
        id: 'audit-123',
        action: 'UPDATE',
        entityType: 'Product',
        entityId: 'prod-456',
        storeId: 'store-789',
        userId: 'user-101',
        changes: JSON.stringify({
          price: { old: 99.99, new: 89.99 },
          inventoryQty: { old: 10, new: 8 },
        }),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(),
      };

      vi.mocked(prisma.auditLog.create).mockResolvedValue(mockAuditLog as any);

      // Act
      const result = await AuditLogService.create('UPDATE', 'Product', 'prod-456', {
        storeId: 'store-789',
        userId: 'user-101',
        changes: {
          price: { old: 99.99, new: 89.99 },
          inventoryQty: { old: 10, new: 8 },
        },
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      });

      // Assert
      expect(result).toEqual(mockAuditLog);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'UPDATE',
          entityType: 'Product',
          entityId: 'prod-456',
          storeId: 'store-789',
          userId: 'user-101',
          changes: expect.any(String),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      });
    });

    it('should create audit log with minimal parameters', async () => {
      // Arrange
      const mockAuditLog = {
        id: 'audit-123',
        action: 'CREATE',
        entityType: 'Order',
        entityId: 'order-789',
        storeId: null,
        userId: null,
        changes: null,
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      };

      vi.mocked(prisma.auditLog.create).mockResolvedValue(mockAuditLog as any);

      // Act
      const result = await AuditLogService.create('CREATE', 'Order', 'order-789');

      // Assert
      expect(result).toEqual(mockAuditLog);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'CREATE',
          entityType: 'Order',
          entityId: 'order-789',
          storeId: null,
          userId: null,
          changes: null,
          ipAddress: null,
          userAgent: null,
        },
      });
    });

    it('should convert action to uppercase', async () => {
      // Arrange
      const mockAuditLog = {
        id: 'audit-123',
        action: 'DELETE',
        entityType: 'Product',
        entityId: 'prod-456',
        storeId: null,
        userId: null,
        changes: null,
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      };

      vi.mocked(prisma.auditLog.create).mockResolvedValue(mockAuditLog as any);

      // Act
      await AuditLogService.create('delete', 'Product', 'prod-456');

      // Assert
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'DELETE',
        }),
      });
    });

    it('should throw error for invalid action', async () => {
      // Act & Assert
      await expect(
        AuditLogService.create('INVALID', 'Product', 'prod-456')
      ).rejects.toThrow('Invalid action: INVALID');
    });

    it('should throw error for missing action', async () => {
      // Act & Assert
      await expect(
        AuditLogService.create('', 'Product', 'prod-456')
      ).rejects.toThrow('action, entityType, and entityId are required');
    });

    it('should throw error for missing entityType', async () => {
      // Act & Assert
      await expect(
        AuditLogService.create('CREATE', '', 'prod-456')
      ).rejects.toThrow('action, entityType, and entityId are required');
    });

    it('should throw error for missing entityId', async () => {
      // Act & Assert
      await expect(
        AuditLogService.create('CREATE', 'Product', '')
      ).rejects.toThrow('action, entityType, and entityId are required');
    });
  });

  describe('getAll', () => {
    it('should retrieve audit logs with all filters', async () => {
      // Arrange
      const mockLogs = [
        {
          id: 'audit-1',
          action: 'UPDATE',
          entityType: 'Product',
          entityId: 'prod-1',
          storeId: 'store-1',
          userId: 'user-1',
          changes: JSON.stringify({ price: { old: 99, new: 89 } }),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2025-01-15'),
          user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
          store: { id: 'store-1', name: 'Test Store' },
        },
      ];

      vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as any);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(1);

      // Act
      const result = await AuditLogService.getAll({
        storeId: 'store-1',
        userId: 'user-1',
        entityType: 'Product',
        entityId: 'prod-1',
        action: 'UPDATE',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        page: 1,
        limit: 20,
      });

      // Assert
      expect(result).toEqual({
        logs: mockLogs,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          storeId: 'store-1',
          userId: 'user-1',
          entityType: 'Product',
          entityId: 'prod-1',
          action: 'UPDATE',
          createdAt: {
            gte: new Date('2025-01-01'),
            lte: new Date('2025-01-31'),
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      expect(prisma.auditLog.count).toHaveBeenCalled();
    });

    it('should retrieve audit logs with default pagination', async () => {
      // Arrange
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0);

      // Act
      const result = await AuditLogService.getAll({});

      // Assert
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 50,
        })
      );
    });

    it('should calculate pagination correctly', async () => {
      // Arrange
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(125);

      // Act
      const result = await AuditLogService.getAll({ page: 3, limit: 20 });

      // Assert
      expect(result).toMatchObject({
        page: 3,
        limit: 20,
        total: 125,
        totalPages: 7,
      });
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40, // (3 - 1) * 20
          take: 20,
        })
      );
    });

    it('should throw error for invalid page number', async () => {
      // Act & Assert
      await expect(AuditLogService.getAll({ page: 0 })).rejects.toThrow(
        'page must be >= 1'
      );
    });

    it('should throw error for invalid limit', async () => {
      // Act & Assert
      await expect(AuditLogService.getAll({ limit: 0 })).rejects.toThrow(
        'limit must be between 1 and 100'
      );
      await expect(AuditLogService.getAll({ limit: 101 })).rejects.toThrow(
        'limit must be between 1 and 100'
      );
    });

    it('should convert action to uppercase in filter', async () => {
      // Arrange
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0);

      // Act
      await AuditLogService.getAll({ action: 'update' });

      // Assert
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: 'UPDATE',
          }),
        })
      );
    });

    it('should handle only startDate filter', async () => {
      // Arrange
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0);

      // Act
      await AuditLogService.getAll({ startDate: new Date('2025-01-01') });

      // Assert
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: new Date('2025-01-01'),
            },
          },
        })
      );
    });

    it('should handle only endDate filter', async () => {
      // Arrange
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0);

      // Act
      await AuditLogService.getAll({ endDate: new Date('2025-01-31') });

      // Assert
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              lte: new Date('2025-01-31'),
            },
          },
        })
      );
    });
  });

  describe('getByEntity', () => {
    it('should retrieve audit logs for specific entity', async () => {
      // Arrange
      const mockLogs = [
        {
          id: 'audit-1',
          action: 'CREATE',
          entityType: 'Product',
          entityId: 'prod-123',
          storeId: 'store-1',
          userId: 'user-1',
          changes: null,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2025-01-15'),
          user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
          store: { id: 'store-1', name: 'Test Store' },
        },
        {
          id: 'audit-2',
          action: 'UPDATE',
          entityType: 'Product',
          entityId: 'prod-123',
          storeId: 'store-1',
          userId: 'user-1',
          changes: JSON.stringify({ price: { old: 99, new: 89 } }),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2025-01-16'),
          user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
          store: { id: 'store-1', name: 'Test Store' },
        },
      ];

      vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as any);

      // Act
      const result = await AuditLogService.getByEntity('Product', 'prod-123');

      // Assert
      expect(result).toEqual(mockLogs);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          entityType: 'Product',
          entityId: 'prod-123',
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    it('should respect custom limit', async () => {
      // Arrange
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);

      // Act
      await AuditLogService.getByEntity('Product', 'prod-123', { limit: 50 });

      // Assert
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });

    it('should throw error for missing entityType', async () => {
      // Act & Assert
      await expect(AuditLogService.getByEntity('', 'prod-123')).rejects.toThrow(
        'entityType and entityId are required'
      );
    });

    it('should throw error for missing entityId', async () => {
      // Act & Assert
      await expect(AuditLogService.getByEntity('Product', '')).rejects.toThrow(
        'entityType and entityId are required'
      );
    });

    it('should throw error for invalid limit', async () => {
      // Act & Assert
      await expect(
        AuditLogService.getByEntity('Product', 'prod-123', { limit: 0 })
      ).rejects.toThrow('limit must be between 1 and 1000');
      await expect(
        AuditLogService.getByEntity('Product', 'prod-123', { limit: 1001 })
      ).rejects.toThrow('limit must be between 1 and 1000');
    });
  });

  describe('parseChanges', () => {
    it('should parse valid JSON changes', () => {
      // Arrange
      const changesString = JSON.stringify({
        price: { old: 99.99, new: 89.99 },
        inventoryQty: { old: 10, new: 8 },
      });

      // Act
      const result = AuditLogService.parseChanges(changesString);

      // Assert
      expect(result).toEqual({
        price: { old: 99.99, new: 89.99 },
        inventoryQty: { old: 10, new: 8 },
      });
    });

    it('should return null for null input', () => {
      // Act
      const result = AuditLogService.parseChanges(null);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      // Act
      const result = AuditLogService.parseChanges('invalid json {');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      // Act
      const result = AuditLogService.parseChanges('');

      // Assert
      expect(result).toBeNull();
    });
  });
});
