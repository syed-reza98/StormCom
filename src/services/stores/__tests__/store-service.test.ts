import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as storeService from '../store-service';
import prisma from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    store: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    userStore: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
    },
    storeSubscription: {
      create: vi.fn(),
    },
    order: {
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    product: {
      count: vi.fn(),
    },
    customer: {
      count: vi.fn(),
    },
  },
}));

describe('Store Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createStore', () => {
    it('should create a store successfully', async () => {
      const mockRole = { id: 'role-1', slug: 'OWNER' };
      const mockStore = {
        id: 'store-1',
        name: 'Test Store',
        slug: 'test-store',
        email: 'test@example.com',
        status: 'TRIAL',
        users: [
          {
            userId: 'user-1',
            roleId: 'role-1',
            user: { id: 'user-1', name: 'Test User', email: 'user@example.com' },
          },
        ],
      };

      vi.mocked(prisma.store.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.role.findUnique).mockResolvedValue(mockRole as any);
      vi.mocked(prisma.store.create).mockResolvedValue(mockStore as any);

      const input = {
        name: 'Test Store',
        slug: 'test-store',
        email: 'test@example.com',
        timezone: 'UTC',
        currency: 'USD',
        language: 'en',
        primaryColor: '#000000',
        settings: {
          orderNotifications: true,
          customerNotifications: true,
          autoAcceptOrders: false,
          requireEmailVerification: false,
          maintenanceMode: false,
        },
      };

      const result = await storeService.createStore(input, 'user-1');

      expect(result).toEqual(mockStore);
      expect(prisma.store.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ slug: 'test-store' }],
          deletedAt: null,
        },
      });
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { slug: 'OWNER' },
      });
    });

    it('should throw error if slug already exists', async () => {
      vi.mocked(prisma.store.findFirst).mockResolvedValue({
        id: 'existing',
        slug: 'test-store',
      } as any);

      const input = {
        name: 'Test Store',
        slug: 'test-store',
        email: 'test@example.com',
        timezone: 'UTC',
        currency: 'USD',
        language: 'en',
        primaryColor: '#000000',
        settings: {
          orderNotifications: true,
          customerNotifications: true,
          autoAcceptOrders: false,
          requireEmailVerification: false,
          maintenanceMode: false,
        },
      };

      await expect(storeService.createStore(input, 'user-1')).rejects.toThrow(
        'A store with this slug already exists'
      );
    });
  });

  describe('getStore', () => {
    it('should return store with subscription and users', async () => {
      const mockStore = {
        id: 'store-1',
        name: 'Test Store',
        slug: 'test-store',
        subscription: { status: 'ACTIVE' },
        users: [],
      };

      vi.mocked(prisma.store.findUnique).mockResolvedValue(mockStore as any);

      const result = await storeService.getStore('store-1');

      expect(result).toEqual(mockStore);
      expect(prisma.store.findUnique).toHaveBeenCalledWith({
        where: { id: 'store-1', deletedAt: null },
        include: {
          subscription: true,
          users: {
            where: { isActive: true },
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      });
    });

    it('should return null if store not found', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null);

      const result = await storeService.getStore('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('updateStore', () => {
    it('should update store successfully', async () => {
      const mockStore = {
        id: 'store-1',
        name: 'Updated Store',
        slug: 'test-store',
        settings: { orderNotifications: true },
        subscription: null,
        users: [],
      };

      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: 'store-1',
        settings: { orderNotifications: true },
      } as any);
      vi.mocked(prisma.store.update).mockResolvedValue(mockStore as any);

      const input = {
        name: 'Updated Store',
      };

      const result = await storeService.updateStore('store-1', input);

      expect(result).toEqual(mockStore);
      expect(prisma.store.update).toHaveBeenCalledWith({
        where: { id: 'store-1' },
        data: input,
        include: {
          subscription: true,
          users: {
            where: { isActive: true },
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      });
    });

    it('should throw error if store not found', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null);

      await expect(storeService.updateStore('invalid-id', { name: 'Test' })).rejects.toThrow(
        'Store not found'
      );
    });

    it('should throw error if slug already exists on another store', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: 'store-1' } as any);
      vi.mocked(prisma.store.findFirst).mockResolvedValue({
        id: 'store-2',
        slug: 'existing-slug',
      } as any);

      await expect(
        storeService.updateStore('store-1', { slug: 'existing-slug' })
      ).rejects.toThrow('A store with this slug already exists');
    });
  });

  describe('deleteStore', () => {
    it('should soft delete store', async () => {
      const deletedStore = {
        id: 'store-1',
        name: 'Test Store',
        deletedAt: new Date(),
      };

      vi.mocked(prisma.store.findUnique).mockResolvedValue({
        id: 'store-1',
      } as any);
      vi.mocked(prisma.store.update).mockResolvedValue(deletedStore as any);

      const result = await storeService.deleteStore('store-1');

      expect(result).toEqual(deletedStore);
      expect(prisma.store.update).toHaveBeenCalledWith({
        where: { id: 'store-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw error if store not found', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null);

      await expect(storeService.deleteStore('invalid-id')).rejects.toThrow(
        'Store not found'
      );
    });
  });

  describe('listStores', () => {
    it('should list stores with pagination', async () => {
      const mockStores = [
        { id: 'store-1', name: 'Store 1' },
        { id: 'store-2', name: 'Store 2' },
      ];

      vi.mocked(prisma.store.findMany).mockResolvedValue(mockStores as any);
      vi.mocked(prisma.store.count).mockResolvedValue(2);

      const query = {
        page: 1,
        perPage: 10,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
      };

      const result = await storeService.listStores(query, {
        userId: 'user-1',
        isSuperAdmin: true,
      });

      expect(result.stores).toEqual(mockStores);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by search term', async () => {
      vi.mocked(prisma.store.findMany).mockResolvedValue([]);
      vi.mocked(prisma.store.count).mockResolvedValue(0);

      const query = {
        page: 1,
        perPage: 10,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
        search: 'test',
      };

      await storeService.listStores(query, {
        userId: 'user-1',
        isSuperAdmin: true,
      });

      expect(prisma.store.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'test' } },
              { slug: { contains: 'test' } },
            ]),
          }),
        })
      );
    });

    it('should filter by user stores when not super admin', async () => {
      vi.mocked(prisma.store.findMany).mockResolvedValue([]);
      vi.mocked(prisma.store.count).mockResolvedValue(0);

      const query = {
        page: 1,
        perPage: 10,
        sortBy: 'createdAt' as const,
        sortOrder: 'desc' as const,
      };

      await storeService.listStores(query, {
        userId: 'user-1',
        isSuperAdmin: false,
      });

      expect(prisma.store.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            users: {
              some: {
                userId: 'user-1',
                isActive: true,
              },
            },
          }),
        })
      );
    });
  });

  describe('getStoreStats', () => {
    it('should return store statistics', async () => {
      vi.mocked(prisma.order.count).mockResolvedValue(10);
      vi.mocked(prisma.order.aggregate).mockResolvedValue({
        _sum: { total: { toNumber: () => 1000 } },
      } as any);
      vi.mocked(prisma.product.count).mockResolvedValue(50);
      vi.mocked(prisma.customer.count).mockResolvedValue(25);

      const stats = await storeService.getStoreStats('store-1');

      expect(stats).toEqual({
        totalOrders: 10,
        totalRevenue: 1000,
        totalProducts: 50,
        totalCustomers: 25,
      });
    });
  });

  describe('checkStoreAccess', () => {
    it('should return true if user is super admin', async () => {
      const hasAccess = await storeService.checkStoreAccess('store-1', 'user-1', true);

      expect(hasAccess).toBe(true);
      expect(prisma.userStore.findFirst).not.toHaveBeenCalled();
    });

    it('should return true if user has access', async () => {
      vi.mocked(prisma.userStore.findFirst).mockResolvedValue({
        id: 'user-store-1',
      } as any);

      const hasAccess = await storeService.checkStoreAccess('store-1', 'user-1', false);

      expect(hasAccess).toBe(true);
    });

    it('should return false if user has no access', async () => {
      vi.mocked(prisma.userStore.findFirst).mockResolvedValue(null);

      const hasAccess = await storeService.checkStoreAccess('store-1', 'user-1', false);

      expect(hasAccess).toBe(false);
    });
  });
});
