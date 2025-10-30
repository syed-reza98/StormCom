/**
 * GET /api/orders/[id]
 * 
 * Retrieves detailed information for a specific order.
 * Includes customer info, order items, payments, addresses, and full order history.
 * 
 * @requires Authentication (Store Admin, Staff with orders:read permission)
 * @returns {OrderDetailsResponse} Complete order details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrderById } from '@/services/order-service';
import { apiResponse } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiResponse.unauthorized();
    }

    // Role-based access control
    if (!['SUPER_ADMIN', 'STORE_ADMIN', 'STAFF'].includes(session.user.role)) {
      return apiResponse.forbidden('Insufficient permissions');
    }

    // Multi-tenant isolation
    const storeId = session.user.storeId;
    if (!storeId && session.user.role !== 'SUPER_ADMIN') {
      return apiResponse.forbidden('No store assigned');
    }

    const orderId = params.id;

    // Fetch order details
    const order = await getOrderById(orderId, storeId!);

    // Check if order exists
    if (!order) {
      return apiResponse.notFound('Order not found');
    }

    return apiResponse.success(order, {
      message: 'Order retrieved successfully',
    });
  } catch (error) {
    console.error(`[GET /api/orders/${params.id}] Error:`, error);
    
    if (error instanceof Error && error.message === 'Order not found') {
      return apiResponse.notFound('Order not found');
    }

    return apiResponse.internalServerError(
      error instanceof Error ? error.message : 'Failed to fetch order'
    );
  }
}
