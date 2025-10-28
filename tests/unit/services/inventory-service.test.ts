// tests/unit/services/inventory-service.test.ts
// Unit tests for InventoryService (US6)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryStatus } from '@prisma/client';
import * as inventoryService from '@/services/inventory-service';

// Mock Prisma client
vi.mock('@/lib/db', () => ({
  db: {
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    inventoryLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      product: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      inventoryLog: {
        create: vi.fn(),
      },
    })),
  },
}));

describe('InventoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('determineInventoryStatus', () => {
    it('should return IN_STOCK when quantity is above threshold', () => {
      const status = inventoryService.determineInventoryStatus(20, 10);
      expect(status).toBe(InventoryStatus.IN_STOCK);
    });

    it('should return LOW_STOCK when quantity is at or below threshold but greater than zero', () => {
      expect(inventoryService.determineInventoryStatus(10, 10)).toBe(InventoryStatus.LOW_STOCK);
      expect(inventoryService.determineInventoryStatus(5, 10)).toBe(InventoryStatus.LOW_STOCK);
      expect(inventoryService.determineInventoryStatus(1, 10)).toBe(InventoryStatus.LOW_STOCK);
    });

    it('should return OUT_OF_STOCK when quantity is zero', () => {
      const status = inventoryService.determineInventoryStatus(0, 10);
      expect(status).toBe(InventoryStatus.OUT_OF_STOCK);
    });

    it('should handle edge cases', () => {
      expect(inventoryService.determineInventoryStatus(0, 0)).toBe(InventoryStatus.OUT_OF_STOCK);
      expect(inventoryService.determineInventoryStatus(1, 0)).toBe(InventoryStatus.IN_STOCK);
      expect(inventoryService.determineInventoryStatus(100, 5)).toBe(InventoryStatus.IN_STOCK);
    });
  });

  describe('getInventoryLevels', () => {
    it('should return paginated inventory items', async () => {
      const { db } = await import('@/lib/db');
      
      const mockProducts = [
        {
          id: '1',
          name: 'Product 1',
          sku: 'SKU-001',
          inventoryQty: 50,
          lowStockThreshold: 10,
          inventoryStatus: InventoryStatus.IN_STOCK,
          category: { name: 'Electronics' },
          brand: { name: 'Brand A' },
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.product.findMany).mockResolvedValue(mockProducts as any);
      vi.mocked(db.product.count).mockResolvedValue(1);

      const result = await inventoryService.getInventoryLevels('store-1', {
        page: 1,
        perPage: 20,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].name).toBe('Product 1');
      expect(result.items[0].categoryName).toBe('Electronics');
    });

    it('should filter by search term', async () => {
      const { db } = await import('@/lib/db');
      
      vi.mocked(db.product.findMany).mockResolvedValue([]);
      vi.mocked(db.product.count).mockResolvedValue(0);

      await inventoryService.getInventoryLevels('store-1', {
        search: 'laptop',
        page: 1,
        perPage: 20,
      });

      const callArgs = vi.mocked(db.product.findMany).mock.calls[0]?.[0];
      expect(callArgs).toBeDefined();
      expect(callArgs?.where).toBeDefined();
      expect(callArgs?.where?.AND).toContainEqual({
        OR: [
          { name: { contains: 'laptop' } },
          { sku: { contains: 'laptop' } },
        ],
      });
    });

    it('should filter by category', async () => {
      const { db } = await import('@/lib/db');
      
      vi.mocked(db.product.findMany).mockResolvedValue([]);
      vi.mocked(db.product.count).mockResolvedValue(0);

      await inventoryService.getInventoryLevels('store-1', {
        categoryId: 'cat-1',
        page: 1,
        perPage: 20,
      });

      const callArgs = vi.mocked(db.product.findMany).mock.calls[0]?.[0];
      expect(callArgs).toBeDefined();
      expect(callArgs?.where).toBeDefined();
      expect(callArgs?.where?.AND).toContainEqual({ categoryId: 'cat-1' });
    });

    it('should filter by low stock only', async () => {
      const { db } = await import('@/lib/db');
      
      vi.mocked(db.product.findMany).mockResolvedValue([]);
      vi.mocked(db.product.count).mockResolvedValue(0);

      await inventoryService.getInventoryLevels('store-1', {
        lowStockOnly: true,
        page: 1,
        perPage: 20,
      });

      const callArgs = vi.mocked(db.product.findMany).mock.calls[0]?.[0];
      expect(callArgs).toBeDefined();
      expect(callArgs?.where).toBeDefined();
      expect(callArgs?.where?.AND).toContainEqual({
        inventoryStatus: {
          in: [InventoryStatus.LOW_STOCK, InventoryStatus.OUT_OF_STOCK],
        },
      });
    });
  });

  describe('getLowStockItems', () => {
    it('should return only products with LOW_STOCK or OUT_OF_STOCK status', async () => {
      const { db } = await import('@/lib/db');
      
      const mockProducts = [
        {
          id: '1',
          name: 'Low Stock Product',
          sku: 'SKU-001',
          inventoryQty: 3,
          lowStockThreshold: 10,
          inventoryStatus: InventoryStatus.LOW_STOCK,
          category: { name: 'Electronics' },
          brand: null,
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Out of Stock Product',
          sku: 'SKU-002',
          inventoryQty: 0,
          lowStockThreshold: 5,
          inventoryStatus: InventoryStatus.OUT_OF_STOCK,
          category: { name: 'Clothing' },
          brand: null,
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.product.findMany).mockResolvedValue(mockProducts as any);

      const result = await inventoryService.getLowStockItems('store-1');

      expect(result).toHaveLength(2);
      expect(result[0].inventoryStatus).toBe(InventoryStatus.LOW_STOCK);
      expect(result[1].inventoryStatus).toBe(InventoryStatus.OUT_OF_STOCK);
    });
  });

  describe('getInventoryHistory', () => {
    it('should return inventory log entries for a product', async () => {
      const { db } = await import('@/lib/db');
      
      const mockLogs = [
        {
          id: 'log-1',
          productId: 'prod-1',
          previousQty: 10,
          newQty: 15,
          changeQty: 5,
          reason: 'Restocking',
          note: 'Added 5 units',
          userId: 'user-1',
          createdAt: new Date(),
          product: {
            name: 'Test Product',
            sku: 'TEST-001',
          },
          user: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      ];

      vi.mocked(db.inventoryLog.findMany).mockResolvedValue(mockLogs as any);

      const result = await inventoryService.getInventoryHistory('store-1', 'prod-1', 50);

      expect(result).toHaveLength(1);
      expect(result[0].productName).toBe('Test Product');
      expect(result[0].userName).toBe('John Doe');
      expect(result[0].changeQty).toBe(5);
    });

    it('should handle logs without user information', async () => {
      const { db } = await import('@/lib/db');
      
      const mockLogs = [
        {
          id: 'log-1',
          productId: 'prod-1',
          previousQty: 10,
          newQty: 5,
          changeQty: -5,
          reason: 'Order fulfillment',
          note: null,
          userId: null,
          createdAt: new Date(),
          product: {
            name: 'Test Product',
            sku: 'TEST-001',
          },
          user: null,
        },
      ];

      vi.mocked(db.inventoryLog.findMany).mockResolvedValue(mockLogs as any);

      const result = await inventoryService.getInventoryHistory('store-1', 'prod-1');

      expect(result[0].userName).toBeUndefined();
    });
  });

  describe('adjustStock - validation', () => {
    it('should throw error for negative quantity with SET type', async () => {
      await expect(
        inventoryService.adjustStock('store-1', {
          productId: 'prod-1',
          quantity: -5,
          type: 'SET',
          reason: 'Test',
        })
      ).rejects.toThrow('Quantity must be non-negative');
    });

    it('should throw error for negative quantity with ADD type', async () => {
      await expect(
        inventoryService.adjustStock('store-1', {
          productId: 'prod-1',
          quantity: -10,
          type: 'ADD',
          reason: 'Test',
        })
      ).rejects.toThrow('Quantity must be non-negative');
    });

    it('should throw error for product not found', async () => {
      const { db } = await import('@/lib/db');
      
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          product: {
            findUnique: vi.fn().mockResolvedValue(null),
          },
        };
        return callback(tx);
      });

      await expect(
        inventoryService.adjustStock('store-1', {
          productId: 'non-existent',
          quantity: 10,
          type: 'ADD',
          reason: 'Test',
        })
      ).rejects.toThrow('Product not found');
    });

    it('should throw error when REMOVE would result in negative stock', async () => {
      const { db } = await import('@/lib/db');
      
      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        sku: 'TEST-001',
        inventoryQty: 5,
        lowStockThreshold: 10,
        inventoryStatus: InventoryStatus.LOW_STOCK,
        storeId: 'store-1',
        trackInventory: true,
      };

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          product: {
            findUnique: vi.fn().mockResolvedValue(mockProduct),
          },
        };
        return callback(tx);
      });

      await expect(
        inventoryService.adjustStock('store-1', {
          productId: 'prod-1',
          quantity: 10,
          type: 'REMOVE',
          reason: 'Test removal',
        })
      ).rejects.toThrow('Insufficient stock');
    });
  });

  describe('adjustStock - operations', () => {
    it('should add stock correctly', async () => {
      const { db } = await import('@/lib/db');
      
      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        sku: 'TEST-001',
        inventoryQty: 10,
        lowStockThreshold: 5,
        inventoryStatus: InventoryStatus.IN_STOCK,
        storeId: 'store-1',
        trackInventory: true,
        category: { name: 'Electronics' },
        brand: null,
        updatedAt: new Date(),
      };

      const updatedProduct = { ...mockProduct, inventoryQty: 15 };

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          product: {
            findUnique: vi.fn().mockResolvedValue(mockProduct),
            update: vi.fn().mockResolvedValue(updatedProduct),
          },
          inventoryLog: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      const result = await inventoryService.adjustStock('store-1', {
        productId: 'prod-1',
        quantity: 5,
        type: 'ADD',
        reason: 'Restocking',
        userId: 'user-1',
      });

      expect(result.inventoryQty).toBe(15);
    });

    it('should remove stock correctly', async () => {
      const { db } = await import('@/lib/db');
      
      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        sku: 'TEST-001',
        inventoryQty: 10,
        lowStockThreshold: 5,
        inventoryStatus: InventoryStatus.IN_STOCK,
        storeId: 'store-1',
        trackInventory: true,
        category: { name: 'Electronics' },
        brand: null,
        updatedAt: new Date(),
      };

      const updatedProduct = { ...mockProduct, inventoryQty: 7 };

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          product: {
            findUnique: vi.fn().mockResolvedValue(mockProduct),
            update: vi.fn().mockResolvedValue(updatedProduct),
          },
          inventoryLog: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      const result = await inventoryService.adjustStock('store-1', {
        productId: 'prod-1',
        quantity: 3,
        type: 'REMOVE',
        reason: 'Damaged items',
        userId: 'user-1',
      });

      expect(result.inventoryQty).toBe(7);
    });

    it('should set stock correctly', async () => {
      const { db } = await import('@/lib/db');
      
      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        sku: 'TEST-001',
        inventoryQty: 10,
        lowStockThreshold: 5,
        inventoryStatus: InventoryStatus.IN_STOCK,
        storeId: 'store-1',
        trackInventory: true,
        category: { name: 'Electronics' },
        brand: null,
        updatedAt: new Date(),
      };

      const updatedProduct = { ...mockProduct, inventoryQty: 20 };

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          product: {
            findUnique: vi.fn().mockResolvedValue(mockProduct),
            update: vi.fn().mockResolvedValue(updatedProduct),
          },
          inventoryLog: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      const result = await inventoryService.adjustStock('store-1', {
        productId: 'prod-1',
        quantity: 20,
        type: 'SET',
        reason: 'Inventory count',
        userId: 'user-1',
      });

      expect(result.inventoryQty).toBe(20);
    });

    it('should update inventory status when stock falls below threshold', async () => {
      const { db } = await import('@/lib/db');
      
      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        sku: 'TEST-001',
        inventoryQty: 10,
        lowStockThreshold: 10,
        inventoryStatus: InventoryStatus.IN_STOCK,
        storeId: 'store-1',
        trackInventory: true,
        category: { name: 'Electronics' },
        brand: null,
        updatedAt: new Date(),
      };

      const updatedProduct = {
        ...mockProduct,
        inventoryQty: 5,
        inventoryStatus: InventoryStatus.LOW_STOCK,
      };

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          product: {
            findUnique: vi.fn().mockResolvedValue(mockProduct),
            update: vi.fn().mockResolvedValue(updatedProduct),
          },
          inventoryLog: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      const result = await inventoryService.adjustStock('store-1', {
        productId: 'prod-1',
        quantity: 5,
        type: 'REMOVE',
        reason: 'Sale',
        userId: 'user-1',
      });

      expect(result.inventoryStatus).toBe(InventoryStatus.LOW_STOCK);
    });
  });
});
