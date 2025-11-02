// tests/unit/services/gdpr-service.test.ts
// Unit tests for GDPR Service
// Target: 80%+ coverage for business logic

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GDPRService } from '@/services/gdpr-service';
import { prisma } from '@/lib/prisma';
import { GdprRequestType, GdprRequestStatus, ConsentType } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    gdprRequest: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    consentRecord: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    address: {
      deleteMany: vi.fn(),
    },
    review: {
      deleteMany: vi.fn(),
    },
    wishlistItem: {
      deleteMany: vi.fn(),
    },
    cart: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('GDPRService', () => {
  let gdprService: GDPRService;

  beforeEach(() => {
    gdprService = new GDPRService();
    vi.clearAllMocks();
  });

  describe('exportUserData', () => {
    it('should export all user data successfully', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        phone: '+1234567890',
        role: 'USER',
        createdAt: new Date('2024-01-01'),
        lastLoginAt: new Date('2024-01-15'),
        orders: [
          {
            id: 'order-1',
            orderNumber: 'ORD-001',
            total: 99.99,
            status: 'DELIVERED',
            createdAt: new Date('2024-01-10'),
          },
        ],
        addresses: [
          {
            id: 'addr-1',
            type: 'BILLING',
            addressLine1: '123 Main St',
            addressLine2: 'Apt 4',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
          },
        ],
        reviews: [
          {
            id: 'review-1',
            rating: 5,
            comment: 'Great product!',
            createdAt: new Date('2024-01-12'),
          },
        ],
        consentRecords: [
          {
            consentType: 'ANALYTICS',
            granted: true,
            grantedAt: new Date('2024-01-01'),
            revokedAt: null,
          },
        ],
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      // Act
      const result = await gdprService.exportUserData('user-123');

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('orders');
      expect(result).toHaveProperty('addresses');
      expect(result).toHaveProperty('reviews');
      expect(result).toHaveProperty('consentRecords');
      expect(result).toHaveProperty('exportedAt');

      expect(result.user.id).toBe('user-123');
      expect(result.user.email).toBe('test@example.com');
      expect(result.orders).toHaveLength(1);
      expect(result.addresses).toHaveLength(1);
      expect(result.reviews).toHaveLength(1);
      expect(result.consentRecords).toHaveLength(1);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: {
          orders: {
            where: undefined,
            select: {
              id: true,
              orderNumber: true,
              totalAmount: true,
              status: true,
              createdAt: true,
            },
          },
          addresses: {
            select: {
              id: true,
              address1: true,
              address2: true,
              city: true,
              state: true,
              postalCode: true,
              country: true,
            },
          },
          reviews: {
            where: undefined,
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
            },
          },
          consentRecords: {
            where: undefined,
            select: {
              consentType: true,
              granted: true,
              grantedAt: true,
              revokedAt: true,
            },
          },
        },
      });
    });

    it('should filter by storeId when provided', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        phone: null,
        role: 'USER',
        createdAt: new Date(),
        lastLoginAt: null,
        orders: [],
        addresses: [],
        reviews: [],
        consentRecords: [],
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      // Act
      await gdprService.exportUserData('user-123', 'store-456');

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: expect.objectContaining({
          orders: {
            where: { storeId: 'store-456' },
            select: expect.any(Object),
          },
          reviews: {
            where: { storeId: 'store-456' },
            select: expect.any(Object),
          },
          consentRecords: {
            where: { storeId: 'store-456' },
            select: expect.any(Object),
          },
        }),
      });
    });

    it('should throw error if user not found', async () => {
      // Arrange
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(gdprService.exportUserData('nonexistent')).rejects.toThrow(
        'User not found: nonexistent'
      );
    });
  });

  describe('createExportRequest', () => {
    it('should create export request successfully', async () => {
      // Arrange
      vi.mocked(prisma.gdprRequest.findFirst).mockResolvedValue(null);
      const mockRequest = {
        id: 'req-123',
        userId: 'user-123',
        storeId: 'store-456',
        type: GdprRequestType.EXPORT,
        status: GdprRequestStatus.PENDING,
        exportUrl: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        processedAt: null,
        errorMessage: null,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.gdprRequest.create).mockResolvedValue(mockRequest);

      // Act
      const result = await gdprService.createExportRequest('user-123', 'store-456', {
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      // Assert
      expect(result).toEqual(mockRequest);
      expect(prisma.gdprRequest.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          type: GdprRequestType.EXPORT,
          status: GdprRequestStatus.PENDING,
        },
      });
      expect(prisma.gdprRequest.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          storeId: 'store-456',
          type: GdprRequestType.EXPORT,
          status: GdprRequestStatus.PENDING,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          expiresAt: expect.any(Date),
        },
      });
    });

    it('should throw error if pending request exists', async () => {
      // Arrange
      vi.mocked(prisma.gdprRequest.findFirst).mockResolvedValue({
        id: 'existing-req',
        type: GdprRequestType.EXPORT,
        status: GdprRequestStatus.PENDING,
      } as any);

      // Act & Assert
      await expect(gdprService.createExportRequest('user-123')).rejects.toThrow(
        'A data export request is already pending for this user'
      );
    });
  });

  describe('createDeletionRequest', () => {
    it('should create deletion request successfully', async () => {
      // Arrange
      vi.mocked(prisma.gdprRequest.findFirst).mockResolvedValue(null);
      const mockRequest = {
        id: 'req-456',
        userId: 'user-123',
        storeId: null,
        type: GdprRequestType.DELETE,
        status: GdprRequestStatus.PENDING,
        exportUrl: null,
        expiresAt: null,
        processedAt: null,
        errorMessage: null,
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome/120',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(prisma.gdprRequest.create).mockResolvedValue(mockRequest);

      // Act
      const result = await gdprService.createDeletionRequest('user-123', undefined, {
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome/120',
      });

      // Assert
      expect(result.type).toBe(GdprRequestType.DELETE);
      expect(result.status).toBe(GdprRequestStatus.PENDING);
    });

    it('should throw error if deletion request already pending', async () => {
      // Arrange
      vi.mocked(prisma.gdprRequest.findFirst).mockResolvedValue({
        id: 'existing-req',
        type: GdprRequestType.DELETE,
        status: GdprRequestStatus.PENDING,
      } as any);

      // Act & Assert
      await expect(gdprService.createDeletionRequest('user-123')).rejects.toThrow(
        'An account deletion request is already pending for this user'
      );
    });
  });

  describe('deleteUserData', () => {
    it('should anonymize user data and delete related records', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        deletedAt: null,
      };

      const anonymizedUser = {
        id: 'user-123',
        email: 'deleted_user_user-123@deleted.local',
        name: 'Deleted User',
        phone: null,
        deletedAt: new Date(),
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        return callback({
          address: { deleteMany: vi.fn() },
          review: { deleteMany: vi.fn() },
          consentRecord: { deleteMany: vi.fn() },
          wishlistItem: { deleteMany: vi.fn() },
          cart: { deleteMany: vi.fn() },
          user: {
            update: vi.fn().mockResolvedValue(anonymizedUser),
          },
          gdprRequest: {
            updateMany: vi.fn(),
          },
        } as any);
      });

      // Act
      const result = await gdprService.deleteUserData('user-123');

      // Assert
      expect(result.email).toContain('deleted_user_');
      expect(result.name).toBe('Deleted User');
      expect(result.deletedAt).toBeTruthy();
    });

    it('should throw error if user not found', async () => {
      // Arrange
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(gdprService.deleteUserData('nonexistent')).rejects.toThrow(
        'User not found: nonexistent'
      );
    });

    it('should throw error if user already deleted', async () => {
      // Arrange
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        deletedAt: new Date(),
      } as any);

      // Act & Assert
      await expect(gdprService.deleteUserData('user-123')).rejects.toThrow(
        'User already deleted: user-123'
      );
    });
  });

  describe('recordConsent', () => {
    it('should create new consent record', async () => {
      // Arrange
      const mockConsent = {
        id: 'consent-123',
        userId: 'user-123',
        storeId: 'store-456',
        consentType: ConsentType.ANALYTICS,
        granted: true,
        grantedAt: new Date(),
        revokedAt: null,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.consentRecord.upsert).mockResolvedValue(mockConsent);

      // Act
      const result = await gdprService.recordConsent(
        'user-123',
        ConsentType.ANALYTICS,
        true,
        'store-456',
        { ipAddress: '127.0.0.1', userAgent: 'Mozilla/5.0' }
      );

      // Assert
      expect(result.granted).toBe(true);
      expect(result.consentType).toBe(ConsentType.ANALYTICS);
      expect(prisma.consentRecord.upsert).toHaveBeenCalledWith({
        where: {
          userId_consentType: {
            userId: 'user-123',
            consentType: ConsentType.ANALYTICS,
          },
        },
        update: {
          granted: true,
          grantedAt: expect.any(Date),
          revokedAt: undefined,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
        },
        create: {
          userId: 'user-123',
          storeId: 'store-456',
          consentType: ConsentType.ANALYTICS,
          granted: true,
          grantedAt: expect.any(Date),
          revokedAt: null,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
        },
      });
    });

    it('should revoke consent when granted is false', async () => {
      // Arrange
      const mockConsent = {
        id: 'consent-123',
        userId: 'user-123',
        consentType: ConsentType.MARKETING,
        granted: false,
        grantedAt: null,
        revokedAt: new Date(),
      };

      vi.mocked(prisma.consentRecord.upsert).mockResolvedValue(mockConsent as any);

      // Act
      const result = await gdprService.recordConsent(
        'user-123',
        ConsentType.MARKETING,
        false
      );

      // Assert
      expect(result.granted).toBe(false);
      expect(result.revokedAt).toBeTruthy();
    });
  });

  describe('getConsentRecords', () => {
    it('should retrieve all consent records for user', async () => {
      // Arrange
      const mockConsents = [
        {
          id: '1',
          userId: 'user-123',
          consentType: ConsentType.ESSENTIAL,
          granted: true,
        },
        {
          id: '2',
          userId: 'user-123',
          consentType: ConsentType.ANALYTICS,
          granted: false,
        },
      ];

      vi.mocked(prisma.consentRecord.findMany).mockResolvedValue(mockConsents as any);

      // Act
      const result = await gdprService.getConsentRecords('user-123');

      // Assert
      expect(result).toHaveLength(2);
      expect(prisma.consentRecord.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by storeId when provided', async () => {
      // Arrange
      vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([]);

      // Act
      await gdprService.getConsentRecords('user-123', 'store-456');

      // Assert
      expect(prisma.consentRecord.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          storeId: 'store-456',
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('updateConsent', () => {
    it('should update existing consent', async () => {
      // Arrange
      const mockConsent = {
        id: 'consent-123',
        userId: 'user-123',
        consentType: ConsentType.PREFERENCES,
        granted: true,
      };

      vi.mocked(prisma.consentRecord.upsert).mockResolvedValue(mockConsent as any);

      // Act
      const result = await gdprService.updateConsent(
        'user-123',
        ConsentType.PREFERENCES,
        true,
        { ipAddress: '10.0.0.1' }
      );

      // Assert
      expect(result.granted).toBe(true);
    });
  });

  describe('getRequest', () => {
    it('should retrieve GDPR request by ID', async () => {
      // Arrange
      const mockRequest = {
        id: 'req-123',
        userId: 'user-123',
        type: GdprRequestType.EXPORT,
        status: GdprRequestStatus.COMPLETED,
      };

      vi.mocked(prisma.gdprRequest.findUnique).mockResolvedValue(mockRequest as any);

      // Act
      const result = await gdprService.getRequest('req-123');

      // Assert
      expect(result?.id).toBe('req-123');
      expect(prisma.gdprRequest.findUnique).toHaveBeenCalledWith({
        where: { id: 'req-123' },
      });
    });

    it('should return null if request not found', async () => {
      // Arrange
      vi.mocked(prisma.gdprRequest.findUnique).mockResolvedValue(null);

      // Act
      const result = await gdprService.getRequest('nonexistent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getUserRequests', () => {
    it('should retrieve all requests for user', async () => {
      // Arrange
      const mockRequests = [
        { id: '1', userId: 'user-123', type: GdprRequestType.EXPORT },
        { id: '2', userId: 'user-123', type: GdprRequestType.DELETE },
      ];

      vi.mocked(prisma.gdprRequest.findMany).mockResolvedValue(mockRequests as any);

      // Act
      const result = await gdprService.getUserRequests('user-123');

      // Assert
      expect(result).toHaveLength(2);
    });

    it('should filter by request type when provided', async () => {
      // Arrange
      vi.mocked(prisma.gdprRequest.findMany).mockResolvedValue([]);

      // Act
      await gdprService.getUserRequests('user-123', GdprRequestType.EXPORT);

      // Assert
      expect(prisma.gdprRequest.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          type: GdprRequestType.EXPORT,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('updateRequestStatus', () => {
    it('should update request status to COMPLETED', async () => {
      // Arrange
      const mockRequest = {
        id: 'req-123',
        status: GdprRequestStatus.COMPLETED,
        processedAt: new Date(),
        exportUrl: 'https://example.com/export.zip',
      };

      vi.mocked(prisma.gdprRequest.update).mockResolvedValue(mockRequest as any);

      // Act
      const result = await gdprService.updateRequestStatus(
        'req-123',
        GdprRequestStatus.COMPLETED,
        { exportUrl: 'https://example.com/export.zip' }
      );

      // Assert
      expect(result.status).toBe(GdprRequestStatus.COMPLETED);
      expect(result.processedAt).toBeTruthy();
      expect(result.exportUrl).toBe('https://example.com/export.zip');
    });

    it('should update request status to FAILED with error message', async () => {
      // Arrange
      const mockRequest = {
        id: 'req-123',
        status: GdprRequestStatus.FAILED,
        processedAt: new Date(),
        errorMessage: 'Export generation failed',
      };

      vi.mocked(prisma.gdprRequest.update).mockResolvedValue(mockRequest as any);

      // Act
      const result = await gdprService.updateRequestStatus(
        'req-123',
        GdprRequestStatus.FAILED,
        { errorMessage: 'Export generation failed' }
      );

      // Assert
      expect(result.status).toBe(GdprRequestStatus.FAILED);
      expect(result.errorMessage).toBe('Export generation failed');
    });
  });
});
