// src/lib/audit.ts
// Audit log utilities: Create and query security audit logs
// Tracks all security-critical operations for compliance and monitoring

import { NextRequest } from 'next/server';
import { db } from './db';
import type { Prisma } from '@prisma/client';

/**
 * Audit action types (security-critical operations)
 */
export enum AuditAction {
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  
  // MFA
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  MFA_VERIFIED = 'MFA_VERIFIED',
  MFA_FAILED = 'MFA_FAILED',
  BACKUP_CODE_USED = 'BACKUP_CODE_USED',
  BACKUP_CODES_REGENERATED = 'BACKUP_CODES_REGENERATED',
  
  // User management
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_PERMISSIONS_CHANGED = 'USER_PERMISSIONS_CHANGED',
  
  // Store management
  STORE_CREATED = 'STORE_CREATED',
  STORE_UPDATED = 'STORE_UPDATED',
  STORE_DELETED = 'STORE_DELETED',
  STORE_SETTINGS_CHANGED = 'STORE_SETTINGS_CHANGED',
  
  // Product management
  PRODUCT_CREATED = 'PRODUCT_CREATED',
  PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  PRODUCT_DELETED = 'PRODUCT_DELETED',
  PRODUCT_PUBLISHED = 'PRODUCT_PUBLISHED',
  PRODUCT_UNPUBLISHED = 'PRODUCT_UNPUBLISHED',
  
  // Order management
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_REFUNDED = 'ORDER_REFUNDED',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  
  // Payment operations
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_ISSUED = 'REFUND_ISSUED',
  
  // Customer operations
  CUSTOMER_CREATED = 'CUSTOMER_CREATED',
  CUSTOMER_UPDATED = 'CUSTOMER_UPDATED',
  CUSTOMER_DELETED = 'CUSTOMER_DELETED',
  
  // Settings changes
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_DELETED = 'API_KEY_DELETED',
  WEBHOOK_CREATED = 'WEBHOOK_CREATED',
  WEBHOOK_DELETED = 'WEBHOOK_DELETED',
}

/**
 * Resource types for audit logs
 */
export enum AuditResource {
  USER = 'User',
  STORE = 'Store',
  PRODUCT = 'Product',
  ORDER = 'Order',
  CUSTOMER = 'Customer',
  PAYMENT = 'Payment',
  CATEGORY = 'Category',
  BRAND = 'Brand',
  COUPON = 'Coupon',
  SHIPPING_ZONE = 'ShippingZone',
  TAX_RATE = 'TaxRate',
  SETTINGS = 'Settings',
  API_KEY = 'ApiKey',
  WEBHOOK = 'Webhook',
}

/**
 * Extract IP address from Next.js request
 */
export function getIPAddress(request: NextRequest): string | null {
  // Check X-Forwarded-For header (proxy/load balancer)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  // Check X-Real-IP header (nginx)
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to null (Vercel doesn't expose direct IP in request object)
  return null;
}

/**
 * Extract user agent from Next.js request
 */
export function getUserAgent(request: NextRequest): string | null {
  return request.headers.get('user-agent');
}

/**
 * Create audit log entry
 * Records security-critical operations for compliance
 */
export async function createAuditLog(params: {
  userId?: string; // User who performed action (null for anonymous)
  storeId?: string; // Store context (null for cross-store operations)
  action: AuditAction; // What action was performed
  resource: AuditResource; // What type of resource was affected
  resourceId?: string; // ID of affected resource
  before?: Record<string, any>; // State before change (JSON)
  after?: Record<string, any>; // State after change (JSON)
  ipAddress?: string | null; // IP address of request
  userAgent?: string | null; // User agent of request
  metadata?: Record<string, any>; // Additional context
}): Promise<void> {
  try {
    // Combine before/after into changes object matching schema
    const changes: Record<string, any> = {};
    if (params.before || params.after) {
      Object.keys({ ...params.before, ...params.after }).forEach((field) => {
        changes[field] = {
          old: params.before?.[field],
          new: params.after?.[field],
        };
      });
    }

    const changesJson = Object.keys(changes).length > 0 ? JSON.stringify(changes) : undefined;

    await db.auditLog.create({
      data: {
        userId: params.userId,
        storeId: params.storeId,
        action: params.action,
        entityType: params.resource,
        entityId: params.resourceId || '',
        ...(changesJson !== undefined && { changes: changesJson }),
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error('Audit log creation error:', error);
    // Don't throw error - audit logging failure shouldn't break operations
  }
}

/**
 * Create audit log from Next.js request
 * Automatically extracts IP and user agent
 */
export async function auditFromRequest(
  request: NextRequest,
  params: {
    userId?: string;
    storeId?: string;
    action: AuditAction;
    resource: AuditResource;
    resourceId?: string;
    before?: Record<string, any>;
    after?: Record<string, any>;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  await createAuditLog({
    ...params,
    ipAddress: getIPAddress(request),
    userAgent: getUserAgent(request),
  });
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(params: {
  userId?: string;
  storeId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<{
  logs: Array<{
    id: string;
    userId: string | null;
    storeId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    changes: Prisma.JsonValue;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
  }>;
  total: number;
}> {
  try {
    // Build where clause
    const where: any = {};

    if (params.userId) where.userId = params.userId;
    if (params.storeId) where.storeId = params.storeId;
    if (params.action) where.action = params.action;
    if (params.resource) where.entityType = params.resource;
    if (params.resourceId) where.entityId = params.resourceId;

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    // Execute query
    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: params.limit || 50,
        skip: params.offset || 0,
      }),
      db.auditLog.count({ where }),
    ]);

    return { logs, total };
  } catch (error) {
    console.error('Audit log query error:', error);
    return { logs: [], total: 0 };
  }
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{
  logs: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    ipAddress: string | null;
    createdAt: Date;
  }>;
  total: number;
}> {
  const result = await queryAuditLogs({ userId, limit, offset });

  return {
    logs: result.logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
    })),
    total: result.total,
  };
}

/**
 * Get audit logs for a specific store
 */
export async function getStoreAuditLogs(
  storeId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{
  logs: Array<{
    id: string;
    userId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    ipAddress: string | null;
    createdAt: Date;
  }>;
  total: number;
}> {
  const result = await queryAuditLogs({ storeId, limit, offset });

  return {
    logs: result.logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
    })),
    total: result.total,
  };
}

/**
 * Get audit logs for a specific resource
 */
export async function getResourceAuditLogs(
  resource: AuditResource,
  resourceId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{
  logs: Array<{
    id: string;
    userId: string | null;
    action: string;
    changes: string | null;
    ipAddress: string | null;
    createdAt: Date;
  }>;
  total: number;
}> {
  const result = await queryAuditLogs({ resource, resourceId, limit, offset });

  return {
    logs: result.logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      action: log.action,
      changes: log.changes as string | null,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
    })),
    total: result.total,
  };
}

/**
 * Get failed login attempts for security monitoring
 */
export async function getFailedLoginAttempts(
  timeWindowMinutes: number = 15
): Promise<
  Array<{
    ipAddress: string | null;
    userAgent: string | null;
    count: number;
    lastAttempt: Date;
  }>
> {
  try {
    const startDate = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

    const logs = await db.auditLog.findMany({
      where: {
        action: AuditAction.LOGIN_FAILED,
        createdAt: { gte: startDate },
      },
      select: {
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by IP address
    const grouped = new Map<
      string,
      { count: number; lastAttempt: Date; userAgent: string | null }
    >();

    for (const log of logs) {
      const key = log.ipAddress || 'unknown';
      const existing = grouped.get(key);

      if (existing) {
        existing.count += 1;
        if (log.createdAt > existing.lastAttempt) {
          existing.lastAttempt = log.createdAt;
          existing.userAgent = log.userAgent;
        }
      } else {
        grouped.set(key, {
          count: 1,
          lastAttempt: log.createdAt,
          userAgent: log.userAgent,
        });
      }
    }

    return Array.from(grouped.entries())
      .map(([ipAddress, data]) => ({
        ipAddress,
        userAgent: data.userAgent,
        count: data.count,
        lastAttempt: data.lastAttempt,
      }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Failed login attempts query error:', error);
    return [];
  }
}

/**
 * Clean up old audit logs
 * Deletes logs older than retention period (default: 90 days)
 */
export async function cleanupOldAuditLogs(
  retentionDays: number = 90
): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const result = await db.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  } catch (error) {
    console.error('Audit log cleanup error:', error);
    return 0;
  }
}
