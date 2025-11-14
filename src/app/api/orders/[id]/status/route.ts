/**
 * PUT /api/orders/[id]/status
 * 
 * Updates order status with state machine validation.
 * Optionally accepts tracking information and admin notes.
 * Sends notification email to customer (when US9 is implemented).
 * 
 * @requires Authentication (Store Admin, Staff with orders:write permission)
 * @returns {OrderResponse} Updated order details
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { updateOrderStatus } from '@/services/order-service';
import { apiResponse } from '@/lib/api-response';
import { OrderStatus } from '@prisma/client';
import {
  requireIdempotencyKey,
  getCachedIdempotentResult,
  cacheIdempotentResult,
} from '@/lib/idempotency';

// Validation schema
const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  trackingNumber: z.string().max(100).optional(),
  trackingUrl: z.string().url().max(500).optional(),
  adminNote: z.string().max(1000).optional(),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Extract params
    const { id: orderId } = await context.params;

    // Idempotency check (CRITICAL: Prevents duplicate status updates)
    let idempotencyKey: string;
    try {
      idempotencyKey = requireIdempotencyKey(request);
    } catch (error) {
      return apiResponse.badRequest(
        error instanceof Error ? error.message : 'Invalid idempotency key'
      );
    }

    // Check cache for duplicate request
    const cachedResult = await getCachedIdempotentResult<unknown>(idempotencyKey);
    if (cachedResult) {
      return apiResponse.success(cachedResult, {
        message: 'Order status already updated (idempotent response)',
      });
    }

    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiResponse.unauthorized();
    }

    // Role-based access control (require write permissions)
    if (!session.user.role || !['SUPER_ADMIN', 'STORE_ADMIN'].includes(session.user.role)) {
      // Staff can only read, not update orders (unless specific permission granted)
      return apiResponse.forbidden('Insufficient permissions to update orders');
    }

    // Multi-tenant isolation
    const storeId = session.user.storeId;
    if (!storeId && session.user.role !== 'SUPER_ADMIN') {
      return apiResponse.forbidden('No store assigned');
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateStatusSchema.parse(body);

    // Update order status
    const updatedOrder = await updateOrderStatus({
      orderId,
      storeId: storeId ?? undefined,
      newStatus: validatedData.status,
      trackingNumber: validatedData.trackingNumber,
      trackingUrl: validatedData.trackingUrl,
      adminNote: validatedData.adminNote,
    });

    // Cache idempotent result (24 hour TTL)
    await cacheIdempotentResult(idempotencyKey, updatedOrder);

    // TODO: Send notification email (US9 - Email Notifications)
    // await sendOrderStatusEmail(updatedOrder);

    // TODO: Log to audit trail (US11 - Audit Logs)
    // await createAuditLog({
    //   storeId,
    //   userId: session.user.id,
    //   action: 'UPDATE',
    //   entityType: 'Order',
    //   entityId: orderId,
    //   changes: { status: { old: order.status, new: validatedData.status } },
    // });

    return apiResponse.success(updatedOrder, {
      message: 'Order status updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse.validationError('Validation error', {
        errors: error.errors,
      });
    }

    console.error('[PUT /api/orders/[id]/status] Error:', error);

    if (error instanceof Error) {
      if (error.message === 'Order not found') {
        return apiResponse.notFound('Order not found');
      }
      if (error.message.includes('Invalid status transition')) {
        return apiResponse.unprocessableEntity(error.message);
      }
      if (error.message.includes('Tracking number') && error.message.includes('required')) {
        return apiResponse.badRequest(error.message);
      }
    }

    return apiResponse.internalServerError(
      error instanceof Error ? error.message : 'Failed to update order status'
    );
  }
}
