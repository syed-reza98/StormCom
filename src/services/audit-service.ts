/**
 * Audit Service
 * 
 * Provides audit logging for critical actions across the application.
 * Tracks order creation, payment validation, newsletter subscriptions,
 * cache invalidation, and other significant events with full context.
 * 
 * All audit logs include:
 * - Action type and entity details
 * - Actor information (user ID, email, IP)
 * - Request correlation ID (X-Request-Id)
 * - Tenant context (storeId)
 * - Change details (JSON)
 * 
 * @module audit-service
 */

import { db } from '@/lib/db';
import { getRequestContext } from '@/lib/request-context';

/**
 * Audit action types following the convention: entity.action
 */
export type AuditAction =
  | 'order.created'
  | 'order.updated'
  | 'order.cancelled'
  | 'order.refunded'
  | 'payment.validated'
  | 'payment.captured'
  | 'payment.failed'
  | 'checkout.completed'
  | 'checkout.failed'
  | 'newsletter.subscribed'
  | 'newsletter.unsubscribed'
  | 'export.requested'
  | 'export.completed'
  | 'cache.invalidated'
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'category.created'
  | 'category.updated'
  | 'category.deleted';

/**
 * Options for creating an audit log entry
 */
export interface CreateAuditLogOptions {
  /** Action type (e.g., 'order.created', 'payment.validated') */
  action: AuditAction;
  /** Entity type (e.g., 'Order', 'Payment', 'Product') */
  entityType: string;
  /** Entity ID */
  entityId: string;
  /** Store ID (defaults to request context if not provided) */
  storeId?: string;
  /** User ID (defaults to request context if not provided) */
  userId?: string;
  /** Change details (field-level changes, metadata, etc.) */
  changes?: Record<string, unknown>;
  /** IP address (for anonymous actions) */
  ipAddress?: string;
  /** User agent */
  userAgent?: string;
}

/**
 * Create an audit log entry
 * 
 * Automatically includes request context (correlation ID, store ID, user ID)
 * if available. For checkout/payment actions, ensure this is called within
 * the transaction scope to maintain consistency.
 * 
 * @param options - Audit log creation options
 * @returns Created audit log entry
 * 
 * @example
 * ```ts
 * await createAuditLog({
 *   action: 'order.created',
 *   entityType: 'Order',
 *   entityId: order.id,
 *   changes: {
 *     totalAmount: order.totalAmount,
 *     status: order.status,
 *     items: order.items.length,
 *   },
 * });
 * ```
 */
export async function createAuditLog(options: CreateAuditLogOptions) {
  const context = getRequestContext();
  
  // Resolve storeId and userId from context or options
  const storeId = options.storeId ?? context?.storeId;
  const userId = options.userId ?? context?.userId;
  
  // Build changes JSON
  const changes = options.changes ? JSON.stringify(options.changes) : null;
  
  return db.auditLog.create({
    data: {
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId,
      storeId,
      userId,
      changes,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    },
  });
}

/**
 * Create multiple audit log entries in a single batch
 * 
 * Useful for complex operations that affect multiple entities
 * (e.g., checkout creates order + payment + inventory decrements).
 * 
 * @param entries - Array of audit log options
 * @returns Array of created audit log entries
 * 
 * @example
 * ```ts
 * await createAuditLogBatch([
 *   {
 *     action: 'order.created',
 *     entityType: 'Order',
 *     entityId: order.id,
 *     changes: { totalAmount: order.totalAmount },
 *   },
 *   {
 *     action: 'payment.validated',
 *     entityType: 'Payment',
 *     entityId: payment.id,
 *     changes: { status: 'validated', amount: payment.amount },
 *   },
 * ]);
 * ```
 */
export async function createAuditLogBatch(entries: CreateAuditLogOptions[]) {
  const context = getRequestContext();
  
  return db.$transaction(
    entries.map(options => {
      const storeId = options.storeId ?? context?.storeId;
      const userId = options.userId ?? context?.userId;
      const changes = options.changes ? JSON.stringify(options.changes) : null;
      
      return db.auditLog.create({
        data: {
          action: options.action,
          entityType: options.entityType,
          entityId: options.entityId,
          storeId,
          userId,
          changes,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
        },
      });
    })
  );
}

/**
 * Query audit logs for a specific entity
 * 
 * @param entityType - Entity type to filter by
 * @param entityId - Entity ID to filter by
 * @param options - Query options (limit, storeId filter)
 * @returns Array of audit log entries
 * 
 * @example
 * ```ts
 * const orderAudits = await getAuditLogsForEntity('Order', order.id);
 * ```
 */
export async function getAuditLogsForEntity(
  entityType: string,
  entityId: string,
  options?: {
    limit?: number;
    storeId?: string;
  }
) {
  return db.auditLog.findMany({
    where: {
      entityType,
      entityId,
      ...(options?.storeId && { storeId: options.storeId }),
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit ?? 100,
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
}

/**
 * Query audit logs for a specific store
 * 
 * @param storeId - Store ID to filter by
 * @param options - Query options (action filter, limit, pagination)
 * @returns Array of audit log entries
 * 
 * @example
 * ```ts
 * const checkoutAudits = await getAuditLogsForStore(storeId, {
 *   action: 'checkout.completed',
 *   limit: 50,
 * });
 * ```
 */
export async function getAuditLogsForStore(
  storeId: string,
  options?: {
    action?: AuditAction;
    limit?: number;
    skip?: number;
  }
) {
  return db.auditLog.findMany({
    where: {
      storeId,
      ...(options?.action && { action: options.action }),
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit ?? 100,
    skip: options?.skip ?? 0,
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
}

/**
 * Audit checkout completion
 * 
 * Helper function to log checkout events with standard structure.
 * Call this after successful order creation within the transaction.
 * 
 * @param orderId - Created order ID
 * @param details - Checkout details (total, items count, payment method)
 * 
 * @example
 * ```ts
 * await auditCheckoutCompleted(order.id, {
 *   totalAmount: order.totalAmount,
 *   itemsCount: order.items.length,
 *   paymentMethod: 'CREDIT_CARD',
 * });
 * ```
 */
export async function auditCheckoutCompleted(
  orderId: string,
  details: {
    totalAmount: number;
    itemsCount: number;
    paymentMethod: string;
    [key: string]: unknown;
  }
) {
  return createAuditLog({
    action: 'checkout.completed',
    entityType: 'Order',
    entityId: orderId,
    changes: details,
  });
}

/**
 * Audit payment validation
 * 
 * Helper function to log payment validation events.
 * Call this before payment capture during checkout flow.
 * 
 * @param paymentId - Payment record ID
 * @param details - Validation details (amount, currency, status)
 * 
 * @example
 * ```ts
 * await auditPaymentValidated(payment.id, {
 *   amount: payment.amount,
 *   currency: 'USD',
 *   intentId: paymentIntent.id,
 *   status: 'validated',
 * });
 * ```
 */
export async function auditPaymentValidated(
  paymentId: string,
  details: {
    amount: number;
    currency: string;
    intentId: string;
    [key: string]: unknown;
  }
) {
  return createAuditLog({
    action: 'payment.validated',
    entityType: 'Payment',
    entityId: paymentId,
    changes: details,
  });
}

/**
 * Audit order creation
 * 
 * Helper function to log order creation events.
 * Call this within the transaction after order creation.
 * 
 * @param orderId - Created order ID
 * @param details - Order details (total, items, status)
 * 
 * @example
 * ```ts
 * await auditOrderCreated(order.id, {
 *   totalAmount: order.totalAmount,
 *   status: order.status,
 *   itemsCount: order.items.length,
 *   orderNumber: order.orderNumber,
 * });
 * ```
 */
export async function auditOrderCreated(
  orderId: string,
  details: {
    totalAmount: number;
    status: string;
    itemsCount: number;
    orderNumber: string;
    [key: string]: unknown;
  }
) {
  return createAuditLog({
    action: 'order.created',
    entityType: 'Order',
    entityId: orderId,
    changes: details,
  });
}
