// src/services/gdpr-service.ts
// GDPR Compliance Service for StormCom
// Handles data export, deletion requests, and consent management

import { prisma } from '@/lib/prisma';
import {
  GdprRequestType,
  GdprRequestStatus,
  ConsentType,
  type GdprRequest,
  type ConsentRecord,
  type User,
} from '@prisma/client';

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'csv';

/**
 * User data export structure
 */
export interface UserDataExport {
  user: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: string;
    createdAt: Date;
    lastLoginAt: Date | null;
  };
  orders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: Date;
  }>;
  addresses: Array<{
    id: string;
    type: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
  }>;
  consentRecords: Array<{
    consentType: string;
    granted: boolean;
    grantedAt: Date | null;
    revokedAt: Date | null;
  }>;
  exportedAt: Date;
}

/**
 * GDPR Service
 * 
 * Provides methods for GDPR compliance:
 * - exportUserData(): Generate comprehensive user data export
 * - createExportRequest(): Submit data export request (async processing)
 * - createDeletionRequest(): Submit account deletion request
 * - deleteUserData(): Permanently delete or anonymize user data
 * - recordConsent(): Record user consent for tracking/cookies
 * - getConsentRecords(): Retrieve user's consent preferences
 * - updateConsent(): Update consent preference
 * 
 * @see specs/001-multi-tenant-ecommerce/spec.md (US14 - GDPR Compliance)
 */
export class GDPRService {
  /**
   * Export all personal data for a user (synchronous)
   * 
   * Returns JSON object containing all user data:
   * - Profile information
   * - Order history
   * - Addresses
   * - Reviews
   * - Consent records
   * 
   * **GDPR Requirement**: Data export must be provided within 30 days
   * 
   * @param userId - User ID to export data for
   * @param storeId - Optional store ID for multi-tenant filtering
   * @returns User data export object
   * @throws Error if user not found
   */
  async exportUserData(userId: string, storeId?: string): Promise<UserDataExport> {
    // Fetch user with related data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        orders: {
          where: storeId ? { storeId } : undefined,
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
          where: storeId ? { storeId } : undefined,
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
        consentRecords: {
          where: storeId ? { storeId } : undefined,
          select: {
            consentType: true,
            granted: true,
            grantedAt: true,
            revokedAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Build export object
    const exportData: UserDataExport = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      orders: user.orders.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
      })),
      addresses: user.addresses.map((address: any) => ({
        id: address.id,
        type: 'shipping', // Default type since Prisma schema doesn't have this field
        addressLine1: address.address1,
        addressLine2: address.address2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
      })),
      reviews: user.reviews,
      consentRecords: user.consentRecords.map((record: {
        consentType: string;
        granted: boolean;
        grantedAt: Date | null;
        revokedAt: Date | null;
      }) => ({
        consentType: record.consentType,
        granted: record.granted,
        grantedAt: record.grantedAt,
        revokedAt: record.revokedAt,
      })),
      exportedAt: new Date(),
    };

    return exportData;
  }

  /**
   * Create an export request (async processing)
   * 
   * Creates a GdprRequest record with PENDING status.
   * Background job will process the request and generate download link.
   * 
   * **GDPR Requirement**: Data export must be provided within 30 days
   * 
   * @param userId - User requesting data export
   * @param storeId - Optional store ID
   * @param metadata - Request metadata (IP, user agent)
   * @returns Created GDPR request
   */
  async createExportRequest(
    userId: string,
    storeId?: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<GdprRequest> {
    // Check if pending request already exists
    const existingRequest = await prisma.gdprRequest.findFirst({
      where: {
        userId,
        type: GdprRequestType.EXPORT,
        status: GdprRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new Error('A data export request is already pending for this user');
    }

    // Create export request
    const request = await prisma.gdprRequest.create({
      data: {
        userId,
        storeId,
        type: GdprRequestType.EXPORT,
        status: GdprRequestStatus.PENDING,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
      },
    });

    return request;
  }

  /**
   * Create a deletion request
   * 
   * **GDPR Requirement**: Right to erasure ("right to be forgotten")
   * 
   * Creates a GdprRequest record for account deletion.
   * Deletion request will:
   * - Soft delete user account
   * - Anonymize personal data (email → deleted_user_xxx@example.com)
   * - Preserve order history (for legal/accounting requirements)
   * - Remove addresses, reviews, consent records
   * 
   * @param userId - User requesting account deletion
   * @param storeId - Optional store ID
   * @param metadata - Request metadata
   * @returns Created GDPR request
   */
  async createDeletionRequest(
    userId: string,
    storeId?: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<GdprRequest> {
    // Check if pending deletion request exists
    const existingRequest = await prisma.gdprRequest.findFirst({
      where: {
        userId,
        type: GdprRequestType.DELETE,
        status: {
          in: [GdprRequestStatus.PENDING, GdprRequestStatus.PROCESSING],
        },
      },
    });

    if (existingRequest) {
      throw new Error('An account deletion request is already pending for this user');
    }

    // Create deletion request
    const request = await prisma.gdprRequest.create({
      data: {
        userId,
        storeId,
        type: GdprRequestType.DELETE,
        status: GdprRequestStatus.PENDING,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      },
    });

    return request;
  }

  /**
   * Execute user data deletion (anonymization)
   * 
   * **GDPR Requirement**: Right to erasure
   * 
   * Anonymizes user data while preserving order history:
   * - Email → `deleted_user_<userId>@deleted.local`
   * - Name → `Deleted User`
   * - Phone → null
   * - Password → random hash
   * - Soft delete user record (deletedAt set)
   * - Delete addresses, reviews, consents
   * - Preserve orders (anonymized)
   * 
   * @param userId - User ID to delete
   * @returns Anonymized user record
   * @throws Error if user not found or already deleted
   */
  async deleteUserData(userId: string): Promise<User> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    if (user.deletedAt) {
      throw new Error(`User already deleted: ${userId}`);
    }

    // Perform deletion in transaction
    const deletedUser = await prisma.$transaction(async (tx: any) => {
      // 1. Delete related data (hard delete)
      await tx.address.deleteMany({ where: { userId } });
      await tx.review.deleteMany({ where: { userId } });
      await tx.consentRecord.deleteMany({ where: { userId } });
      await tx.wishlistItem.deleteMany({ where: { userId } });
      await tx.cart.deleteMany({ where: { userId } });

      // 2. Anonymize user record (soft delete)
      const anonymizedUser = await tx.user.update({
        where: { id: userId },
        data: {
          email: `deleted_user_${userId}@deleted.local`,
          name: 'Deleted User',
          phone: null,
          password: `deleted_${Date.now()}`, // Random hash
          emailVerified: false,
          emailVerifiedAt: null,
          verificationToken: null,
          verificationExpires: null,
          resetToken: null,
          resetExpires: null,
          lastLoginAt: null,
          lastLoginIP: null,
          deletedAt: new Date(),
        },
      });

      // 3. Mark deletion request as completed
      await tx.gdprRequest.updateMany({
        where: {
          userId,
          type: GdprRequestType.DELETE,
          status: {
            in: [GdprRequestStatus.PENDING, GdprRequestStatus.PROCESSING],
          },
        },
        data: {
          status: GdprRequestStatus.COMPLETED,
          processedAt: new Date(),
        },
      });

      return anonymizedUser;
    });

    return deletedUser;
  }

  /**
   * Record user consent
   * 
   * **GDPR Requirement**: Consent management for cookies/tracking
   * 
   * Records or updates consent for a specific consent type.
   * 
   * @param userId - User ID
   * @param consentType - Type of consent (ESSENTIAL, ANALYTICS, MARKETING, PREFERENCES)
   * @param granted - Whether consent is granted
   * @param storeId - Optional store ID
   * @param metadata - Request metadata
   * @returns Consent record
   */
  async recordConsent(
    userId: string,
    consentType: ConsentType,
    granted: boolean,
    storeId?: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<ConsentRecord> {
    // Upsert consent record
    const consent = await prisma.consentRecord.upsert({
      where: {
        userId_consentType: {
          userId,
          consentType,
        },
      },
      update: {
        granted,
        grantedAt: granted ? new Date() : undefined,
        revokedAt: !granted ? new Date() : undefined,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      },
      create: {
        userId,
        storeId,
        consentType,
        granted,
        grantedAt: granted ? new Date() : null,
        revokedAt: !granted ? new Date() : null,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      },
    });

    return consent;
  }

  /**
   * Get all consent records for a user
   * 
   * @param userId - User ID
   * @param storeId - Optional store ID for filtering
   * @returns Array of consent records
   */
  async getConsentRecords(userId: string, storeId?: string): Promise<ConsentRecord[]> {
    const consents = await prisma.consentRecord.findMany({
      where: {
        userId,
        ...(storeId && { storeId }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return consents;
  }

  /**
   * Update consent preference
   * 
   * @param userId - User ID
   * @param consentType - Consent type to update
   * @param granted - New granted status
   * @param metadata - Request metadata
   * @returns Updated consent record
   */
  async updateConsent(
    userId: string,
    consentType: ConsentType,
    granted: boolean,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<ConsentRecord> {
    return this.recordConsent(userId, consentType, granted, undefined, metadata);
  }

  /**
   * Get GDPR request by ID
   * 
   * @param requestId - Request ID
   * @returns GDPR request or null
   */
  async getRequest(requestId: string): Promise<GdprRequest | null> {
    return prisma.gdprRequest.findUnique({
      where: { id: requestId },
    });
  }

  /**
   * Get all GDPR requests for a user
   * 
   * @param userId - User ID
   * @param type - Optional request type filter
   * @returns Array of GDPR requests
   */
  async getUserRequests(userId: string, type?: GdprRequestType): Promise<GdprRequest[]> {
    return prisma.gdprRequest.findMany({
      where: {
        userId,
        ...(type && { type }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update GDPR request status
   * 
   * @param requestId - Request ID
   * @param status - New status
   * @param metadata - Optional metadata (exportUrl, error message)
   * @returns Updated request
   */
  async updateRequestStatus(
    requestId: string,
    status: GdprRequestStatus,
    metadata?: {
      exportUrl?: string;
      errorMessage?: string;
    }
  ): Promise<GdprRequest> {
    return prisma.gdprRequest.update({
      where: { id: requestId },
      data: {
        status,
        processedAt: (status === GdprRequestStatus.COMPLETED || status === GdprRequestStatus.FAILED)
          ? new Date()
          : undefined,
        exportUrl: metadata?.exportUrl,
        errorMessage: metadata?.errorMessage,
      },
    });
  }
}

// Singleton instance
export const gdprService = new GDPRService();
