/**
 * AuditLogService - Service for managing audit logs
 * 
 * Provides comprehensive audit trail functionality for tracking all
 * system actions including CREATE, UPDATE, DELETE operations on entities.
 * 
 * @module services/audit-log-service
 */

import { prisma } from '@/lib/db';
import type { AuditLog, Prisma } from '@prisma/client';

/**
 * Metadata for audit log creation
 */
export interface AuditLogMetadata {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Changes tracked in audit log
 */
export interface AuditLogChanges {
  [field: string]: {
    old: unknown;
    new: unknown;
  };
}

/**
 * Filters for retrieving audit logs
 */
export interface AuditLogFilters {
  storeId?: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * Paginated audit log results
 */
export interface PaginatedAuditLogs {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Service class for audit log operations
 */
export class AuditLogService {
  /**
   * Create a new audit log entry
   * 
   * @param action - Action performed (CREATE, UPDATE, DELETE)
   * @param entityType - Type of entity (Product, Order, User, etc.)
   * @param entityId - ID of the entity
   * @param options - Optional parameters
   * @param options.storeId - Store ID for multi-tenant isolation
   * @param options.userId - User ID who performed the action
   * @param options.changes - Object containing field changes
   * @param options.metadata - Request metadata (IP, user agent)
   * @returns Promise resolving to created audit log
   * 
   * @example
   * ```typescript
   * await AuditLogService.create('UPDATE', 'Product', productId, {
   *   storeId: 'store-123',
   *   userId: 'user-456',
   *   changes: {
   *     price: { old: 99.99, new: 89.99 },
   *     inventoryQty: { old: 10, new: 8 }
   *   },
   *   metadata: { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0...' }
   * });
   * ```
   */
  static async create(
    action: string,
    entityType: string,
    entityId: string,
    options: {
      storeId?: string;
      userId?: string;
      changes?: AuditLogChanges;
      metadata?: AuditLogMetadata;
    } = {}
  ): Promise<AuditLog> {
    const { storeId, userId, changes, metadata } = options;

    // Validate required parameters
    if (!action || !entityType || !entityId) {
      throw new Error('action, entityType, and entityId are required');
    }

    // Validate action is one of: CREATE, UPDATE, DELETE
    const validActions = ['CREATE', 'UPDATE', 'DELETE'];
    if (!validActions.includes(action.toUpperCase())) {
      throw new Error(`Invalid action: ${action}. Must be one of: ${validActions.join(', ')}`);
    }

    const changesJson = changes ? JSON.stringify(changes) : undefined;

    const auditLog = await prisma.auditLog.create({
      data: {
        action: action.toUpperCase(),
        entityType,
        entityId,
        storeId: storeId || null,
        userId: userId || null,
        ...(changesJson !== undefined && { changes: changesJson }),
        ipAddress: metadata?.ipAddress || null,
        userAgent: metadata?.userAgent || null,
      },
    });

    return auditLog;
  }

  /**
   * Retrieve audit logs with optional filters and pagination
   * 
   * @param filters - Filter criteria
   * @returns Promise resolving to paginated audit logs
   * 
   * @example
   * ```typescript
   * const result = await AuditLogService.getAll({
   *   storeId: 'store-123',
   *   entityType: 'Product',
   *   startDate: new Date('2025-01-01'),
   *   page: 1,
   *   limit: 20
   * });
   * ```
   */
  static async getAll(filters: AuditLogFilters = {}): Promise<PaginatedAuditLogs> {
    const {
      storeId,
      userId,
      entityType,
      entityId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    // Validate pagination parameters
    if (page < 1) {
      throw new Error('page must be >= 1');
    }
    if (limit < 1 || limit > 100) {
      throw new Error('limit must be between 1 and 100');
    }

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {};

    if (storeId) {
      where.storeId = storeId;
    }
    if (userId) {
      where.userId = userId;
    }
    if (entityType) {
      where.entityType = entityType;
    }
    if (entityId) {
      where.entityId = entityId;
    }
    if (action) {
      where.action = action.toUpperCase();
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    // Execute queries in parallel
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
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
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieve audit logs for a specific entity
   * 
   * @param entityType - Type of entity (Product, Order, User, etc.)
   * @param entityId - ID of the entity
   * @param options - Optional parameters
   * @param options.limit - Maximum number of logs to return (default: 100)
   * @returns Promise resolving to array of audit logs
   * 
   * @example
   * ```typescript
   * const logs = await AuditLogService.getByEntity('Product', 'prod-123', {
   *   limit: 50
   * });
   * ```
   */
  static async getByEntity(
    entityType: string,
    entityId: string,
    options: { limit?: number } = {}
  ): Promise<AuditLog[]> {
    const { limit = 100 } = options;

    // Validate parameters
    if (!entityType || !entityId) {
      throw new Error('entityType and entityId are required');
    }
    if (limit < 1 || limit > 1000) {
      throw new Error('limit must be between 1 and 1000');
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
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

    return logs;
  }

  /**
   * Parse changes JSON string into typed object
   * 
   * @param changesString - JSON string from database
   * @returns Parsed changes object or null
   */
  static parseChanges(changesString: string | null): AuditLogChanges | null {
    if (!changesString) {
      return null;
    }

    try {
      return JSON.parse(changesString) as AuditLogChanges;
    } catch {
      return null;
    }
  }
}
