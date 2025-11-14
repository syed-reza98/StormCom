import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createAuditLog,
  createAuditLogBatch,
  getAuditLogsForEntity,
  getAuditLogsForStore,
  auditCheckoutCompleted,
  auditPaymentValidated,
  auditOrderCreated,
  type CreateAuditLogOptions,
} from '@/services/audit-service';
import { db } from '@/lib/db';
import * as requestContext from '@/lib/request-context';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/request-context', () => ({
  getRequestContext: vi.fn(),
}));

describe('audit-service', () => {
  const mockContext = {
    requestId: 'test-request-123',
    storeId: 'store-123',
    userId: 'user-456',
    userRole: 'StoreAdmin',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requestContext.getRequestContext).mockReturnValue(mockContext);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createAuditLog', () => {
    it('should create audit log with context values', async () => {
      const mockAuditLog = {
        id: 'audit-123',
        action: 'order.created',
        entityType: 'Order',
        entityId: 'order-789',
        storeId: 'store-123',
        userId: 'user-456',
        changes: JSON.stringify({ totalAmount: 100 }),
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      };

      vi.mocked(db.auditLog.create).mockResolvedValue(mockAuditLog);

      const result = await createAuditLog({
        action: 'order.created',
        entityType: 'Order',
        entityId: 'order-789',
        changes: { totalAmount: 100 },
      });

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'order.created',
          entityType: 'Order',
          entityId: 'order-789',
          storeId: 'store-123',
          userId: 'user-456',
          changes: JSON.stringify({ totalAmount: 100 }),
          ipAddress: undefined,
          userAgent: undefined,
        },
      });

      expect(result).toEqual(mockAuditLog);
    });

    it('should override context values with explicit options', async () => {
      const mockAuditLog = {
        id: 'audit-123',
        action: 'export.requested',
        entityType: 'Export',
        entityId: 'export-999',
        storeId: 'store-override',
        userId: 'user-override',
        changes: null,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(),
      };

      vi.mocked(db.auditLog.create).mockResolvedValue(mockAuditLog);

      await createAuditLog({
        action: 'export.requested',
        entityType: 'Export',
        entityId: 'export-999',
        storeId: 'store-override',
        userId: 'user-override',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'export.requested',
          entityType: 'Export',
          entityId: 'export-999',
          storeId: 'store-override',
          userId: 'user-override',
          changes: null,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
      });
    });

    it('should handle missing context gracefully', async () => {
      vi.mocked(requestContext.getRequestContext).mockReturnValue(undefined);

      const mockAuditLog = {
        id: 'audit-123',
        action: 'cache.invalidated',
        entityType: 'Cache',
        entityId: 'products:list',
        storeId: null,
        userId: null,
        changes: null,
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      };

      vi.mocked(db.auditLog.create).mockResolvedValue(mockAuditLog);

      await createAuditLog({
        action: 'cache.invalidated',
        entityType: 'Cache',
        entityId: 'products:list',
      });

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'cache.invalidated',
          entityType: 'Cache',
          entityId: 'products:list',
          storeId: undefined,
          userId: undefined,
          changes: null,
          ipAddress: undefined,
          userAgent: undefined,
        },
      });
    });

    it('should serialize changes to JSON', async () => {
      const changes = {
        oldStatus: 'pending',
        newStatus: 'completed',
        amount: 150.50,
        metadata: { source: 'web' },
      };

      vi.mocked(db.auditLog.create).mockResolvedValue({} as any);

      await createAuditLog({
        action: 'order.updated',
        entityType: 'Order',
        entityId: 'order-123',
        changes,
      });

      expect(db.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          changes: JSON.stringify(changes),
        }),
      });
    });
  });

  describe('createAuditLogBatch', () => {
    it('should create multiple audit logs in a transaction', async () => {
      const entries: CreateAuditLogOptions[] = [
        {
          action: 'order.created',
          entityType: 'Order',
          entityId: 'order-123',
          changes: { totalAmount: 100 },
        },
        {
          action: 'payment.validated',
          entityType: 'Payment',
          entityId: 'payment-456',
          changes: { amount: 100, status: 'validated' },
        },
      ];

      const mockResults = [
        { id: 'audit-1', createdAt: new Date() },
        { id: 'audit-2', createdAt: new Date() },
      ];

      vi.mocked(db.$transaction).mockResolvedValue(mockResults as any);

      const result = await createAuditLogBatch(entries);

      expect(db.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            _def: expect.objectContaining({
              action: 'create',
            }),
          }),
        ])
      );

      expect(result).toEqual(mockResults);
    });

    it('should use context for batch entries', async () => {
      const entries: CreateAuditLogOptions[] = [
        {
          action: 'product.created',
          entityType: 'Product',
          entityId: 'product-1',
        },
        {
          action: 'product.updated',
          entityType: 'Product',
          entityId: 'product-1',
          storeId: 'store-override',
        },
      ];

      vi.mocked(db.$transaction).mockResolvedValue([] as any);

      await createAuditLogBatch(entries);

      expect(db.$transaction).toHaveBeenCalled();
      // Context should be used for first entry, override for second
    });
  });

  describe('getAuditLogsForEntity', () => {
    it('should retrieve audit logs for a specific entity', async () => {
      const mockLogs = [
        {
          id: 'audit-1',
          action: 'order.created',
          entityType: 'Order',
          entityId: 'order-123',
          user: { id: 'user-456', email: 'test@example.com', name: 'Test User' },
        },
        {
          id: 'audit-2',
          action: 'order.updated',
          entityType: 'Order',
          entityId: 'order-123',
          user: { id: 'user-456', email: 'test@example.com', name: 'Test User' },
        },
      ];

      vi.mocked(db.auditLog.findMany).mockResolvedValue(mockLogs as any);

      const result = await getAuditLogsForEntity('Order', 'order-123');

      expect(db.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          entityType: 'Order',
          entityId: 'order-123',
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      expect(result).toEqual(mockLogs);
    });

    it('should filter by storeId when provided', async () => {
      vi.mocked(db.auditLog.findMany).mockResolvedValue([] as any);

      await getAuditLogsForEntity('Order', 'order-123', { storeId: 'store-789' });

      expect(db.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          entityType: 'Order',
          entityId: 'order-123',
          storeId: 'store-789',
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });
    });

    it('should respect limit option', async () => {
      vi.mocked(db.auditLog.findMany).mockResolvedValue([] as any);

      await getAuditLogsForEntity('Product', 'product-456', { limit: 50 });

      expect(db.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });
  });

  describe('getAuditLogsForStore', () => {
    it('should retrieve audit logs for a specific store', async () => {
      const mockLogs = [
        {
          id: 'audit-1',
          action: 'checkout.completed',
          storeId: 'store-123',
          user: { id: 'user-456', email: 'test@example.com', name: 'Test User' },
        },
      ];

      vi.mocked(db.auditLog.findMany).mockResolvedValue(mockLogs as any);

      const result = await getAuditLogsForStore('store-123');

      expect(db.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          storeId: 'store-123',
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        skip: 0,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      expect(result).toEqual(mockLogs);
    });

    it('should filter by action when provided', async () => {
      vi.mocked(db.auditLog.findMany).mockResolvedValue([] as any);

      await getAuditLogsForStore('store-123', { action: 'checkout.completed' });

      expect(db.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          storeId: 'store-123',
          action: 'checkout.completed',
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        skip: 0,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });
    });

    it('should support pagination', async () => {
      vi.mocked(db.auditLog.findMany).mockResolvedValue([] as any);

      await getAuditLogsForStore('store-123', { limit: 25, skip: 50 });

      expect(db.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 25,
          skip: 50,
        })
      );
    });
  });

  describe('helper functions', () => {
    beforeEach(() => {
      vi.mocked(db.auditLog.create).mockResolvedValue({} as any);
    });

    describe('auditCheckoutCompleted', () => {
      it('should create checkout.completed audit log', async () => {
        const details = {
          totalAmount: 199.99,
          itemsCount: 3,
          paymentMethod: 'CREDIT_CARD',
          shippingMethod: 'STANDARD',
        };

        await auditCheckoutCompleted('order-123', details);

        expect(db.auditLog.create).toHaveBeenCalledWith({
          data: {
            action: 'checkout.completed',
            entityType: 'Order',
            entityId: 'order-123',
            storeId: 'store-123',
            userId: 'user-456',
            changes: JSON.stringify(details),
            ipAddress: undefined,
            userAgent: undefined,
          },
        });
      });
    });

    describe('auditPaymentValidated', () => {
      it('should create payment.validated audit log', async () => {
        const details = {
          amount: 199.99,
          currency: 'USD',
          intentId: 'pi_123',
          status: 'validated',
        };

        await auditPaymentValidated('payment-456', details);

        expect(db.auditLog.create).toHaveBeenCalledWith({
          data: {
            action: 'payment.validated',
            entityType: 'Payment',
            entityId: 'payment-456',
            storeId: 'store-123',
            userId: 'user-456',
            changes: JSON.stringify(details),
            ipAddress: undefined,
            userAgent: undefined,
          },
        });
      });
    });

    describe('auditOrderCreated', () => {
      it('should create order.created audit log', async () => {
        const details = {
          totalAmount: 299.99,
          status: 'PENDING',
          itemsCount: 5,
          orderNumber: 'ORD-2025-001',
          customField: 'custom value',
        };

        await auditOrderCreated('order-789', details);

        expect(db.auditLog.create).toHaveBeenCalledWith({
          data: {
            action: 'order.created',
            entityType: 'Order',
            entityId: 'order-789',
            storeId: 'store-123',
            userId: 'user-456',
            changes: JSON.stringify(details),
            ipAddress: undefined,
            userAgent: undefined,
          },
        });
      });
    });
  });
});
