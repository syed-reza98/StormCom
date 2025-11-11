// tests/integration/gdpr-endpoints.test.ts
// Integration tests for GDPR API endpoints
// Tests: /api/gdpr/export, /api/gdpr/delete, /api/gdpr/consent

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { POST as exportHandler } from '@/app/api/gdpr/export/route';
import { POST as deleteHandler } from '@/app/api/gdpr/delete/route';
import { GET as getConsentHandler, POST as postConsentHandler } from '@/app/api/gdpr/consent/route';
import { GdprRequestType, ConsentType, UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth/next';

// Mock NextAuth.js
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

describe('GDPR API Endpoints', () => {
  let testUserId: string;
  let testStoreId: string;

  beforeAll(async () => {
    // Clean up any existing test data first
    await prisma.store.deleteMany({ where: { slug: 'gdpr-test-store' } });
    await prisma.user.deleteMany({ where: { email: 'gdpr-test@example.com' } });

    // Create test user and store
    const store = await prisma.store.create({
      data: {
        name: 'GDPR Test Store',
        slug: 'gdpr-test-store',
        email: 'gdpr-store@example.com',
      },
    });
    testStoreId = store.id;

    const user = await prisma.user.create({
      data: {
        email: 'gdpr-test@example.com',
        name: 'GDPR Test User',
        password: 'hashed_password',
        role: UserRole.CUSTOMER,
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up test data (check if IDs exist before deleting)
    if (testUserId) {
      await prisma.consentRecord.deleteMany({ where: { userId: testUserId } });
      await prisma.gdprRequest.deleteMany({ where: { userId: testUserId } });
      await prisma.user.delete({ where: { id: testUserId } });
    }
    if (testStoreId) {
      await prisma.store.delete({ where: { id: testStoreId } });
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/gdpr/export', () => {
    it('should create export request successfully', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue({
        userId: testUserId,
        email: 'gdpr-test@example.com',
        role: 'USER',
        storeId: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      const request = new Request('http://localhost:3000/api/gdpr/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
          'user-agent': 'Test Agent',
        },
        body: JSON.stringify({ storeId: testStoreId }),
      });

      // Act
      const response = await exportHandler(request as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data.userId).toBe(testUserId);
      expect(data.data.type).toBe('EXPORT');
      expect(data.data.status).toBe('PENDING');
      expect(data.data.storeId).toBe(testStoreId);
      expect(data.message).toContain('email');
    });

    it('should reject duplicate export request', async () => {
      // Arrange - request already exists from previous test
      vi.mocked(getServerSession).mockResolvedValue({
        userId: testUserId,
        email: 'gdpr-test@example.com',
        role: 'USER',
        storeId: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      const request = new Request('http://localhost:3000/api/gdpr/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storeId: testStoreId }),
      });

      // Act
      const response = await exportHandler(request as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DUPLICATE_REQUEST');
      expect(data.error.message).toContain('already pending');
    });

    it('should reject unauthenticated request', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/gdpr/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      // Act
      const response = await exportHandler(request as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.message).toBe('Unauthorized');
    });

    it('should validate request body', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue({
        userId: testUserId,
        email: 'gdpr-test@example.com',
        role: 'USER',
        storeId: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      const request = new Request('http://localhost:3000/api/gdpr/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storeId: 123 }), // Invalid: number instead of string
      });

      // Act
      const response = await exportHandler(request as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/gdpr/delete', () => {
    beforeAll(async () => {
      // Clear existing deletion requests before the test suite
      await prisma.gdprRequest.deleteMany({
        where: {
          userId: testUserId,
          type: GdprRequestType.DELETE,
        },
      });
    });

    it('should create deletion request successfully', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue({
        userId: testUserId,
        email: 'gdpr-test@example.com',
        role: 'USER',
        storeId: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      const request = new Request('http://localhost:3000/api/gdpr/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Test Browser',
        },
        body: JSON.stringify({
          confirmation: 'DELETE_MY_ACCOUNT',
          storeId: testStoreId,
        }),
      });

      // Act
      const response = await deleteHandler(request as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data.userId).toBe(testUserId);
      expect(data.data.type).toBe('DELETE');
      expect(data.data.status).toBe('PENDING');
      expect(data.message).toContain('permanently deleted');
    });

    it('should require confirmation', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue({
        userId: testUserId,
        email: 'gdpr-test@example.com',
        role: 'USER',
        storeId: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      const request = new Request('http://localhost:3000/api/gdpr/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmation: 'WRONG_CONFIRMATION',
        }),
      });

      // Act
      const response = await deleteHandler(request as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject duplicate deletion request', async () => {
      // Arrange - request already exists from first test
      vi.mocked(getServerSession).mockResolvedValue({
        userId: testUserId,
        email: 'gdpr-test@example.com',
        role: 'USER',
        storeId: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      const request = new Request('http://localhost:3000/api/gdpr/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmation: 'DELETE_MY_ACCOUNT',
        }),
      });

      // Act
      const response = await deleteHandler(request as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('DUPLICATE_REQUEST');
    });
  });

  describe('GET /api/gdpr/consent', () => {
    beforeAll(async () => {
      // Create test consent records
      await prisma.consentRecord.createMany({
        data: [
          {
            userId: testUserId,
            storeId: testStoreId,
            consentType: ConsentType.ESSENTIAL,
            granted: true,
            grantedAt: new Date(),
          },
          {
            userId: testUserId,
            storeId: testStoreId,
            consentType: ConsentType.ANALYTICS,
            granted: false,
            revokedAt: new Date(),
          },
        ],
      });
    });

    it('should retrieve consent records', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue({
        userId: testUserId,
        email: 'gdpr-test@example.com',
        role: 'USER',
        storeId: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      const request = new Request(
        `http://localhost:3000/api/gdpr/consent?storeId=${testStoreId}`,
        { method: 'GET' }
      );

      // Act
      const response = await getConsentHandler(request as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThanOrEqual(2);
      expect(data.data.some((c: any) => c.consentType === 'ESSENTIAL')).toBe(true);
      expect(data.data.some((c: any) => c.consentType === 'ANALYTICS')).toBe(true);
    });

    it('should require authentication', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/gdpr/consent', {
        method: 'GET',
      });

      // Act
      const response = await getConsentHandler(request as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/gdpr/consent', () => {
    it('should update consent preference', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue({
        userId: testUserId,
        email: 'gdpr-test@example.com',
        role: 'USER',
        storeId: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      const request = new Request('http://localhost:3000/api/gdpr/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '10.0.0.1',
          'user-agent': 'Test Client',
        },
        body: JSON.stringify({
          consentType: 'MARKETING',
          granted: true,
          storeId: testStoreId,
        }),
      });

      // Act
      const response = await postConsentHandler(request as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.consentType).toBe('MARKETING');
      expect(data.data.granted).toBe(true);
      expect(data.data.grantedAt).toBeTruthy();
      expect(data.message).toContain('updated successfully');
    });

    it('should revoke consent', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue({
        userId: testUserId,
        email: 'gdpr-test@example.com',
        role: 'USER',
        storeId: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      const request = new Request('http://localhost:3000/api/gdpr/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consentType: 'MARKETING',
          granted: false,
        }),
      });

      // Act
      const response = await postConsentHandler(request as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.granted).toBe(false);
      expect(data.data.revokedAt).toBeTruthy();
    });

    it('should validate consent type', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue({
        userId: testUserId,
        email: 'gdpr-test@example.com',
        role: 'USER',
        storeId: null,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      const request = new Request('http://localhost:3000/api/gdpr/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consentType: 'INVALID_TYPE',
          granted: true,
        }),
      });

      // Act
      const response = await postConsentHandler(request as any);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });
});

