/**
 * GET /api/orders
 * 
 * Lists orders with filtering, pagination, and search capabilities.
 * Enforces multi-tenant isolation and role-based access control.
 * 
 * @requires Authentication (Store Admin, Staff with orders:read permission)
 * @returns {OrderListResponse} Paginated list of orders
 */

import { NextRequest, NextResponse } from 'next/server';
// This route calls authentication helpers which in turn access request
// headers/cookies. Ensure the route is always dynamic so Next.js does not
// attempt to prerender it and cause `headers()`/`request.cookies` to fail
// during the build step.
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { listOrders, exportOrdersToCSV } from '@/services/order-service';
import { apiResponse } from '@/lib/api-response';
import { OrderStatus } from '@prisma/client';

// Validation schema
const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(OrderStatus).optional(),
  search: z.string().max(200).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'totalAmount', 'orderNumber']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  export: z.enum(['csv']).optional(), // Export format
});

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiResponse.unauthorized();
    }

    // Role-based access control
    if (!session.user.role || !['SUPER_ADMIN', 'STORE_ADMIN', 'STAFF'].includes(session.user.role)) {
      return apiResponse.forbidden('Insufficient permissions');
    }

    // Multi-tenant isolation
    const storeId = session.user.storeId;
    if (!storeId && session.user.role !== 'SUPER_ADMIN') {
      return apiResponse.forbidden('No store assigned');
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse(Object.fromEntries(searchParams));

    // Convert date strings to Date objects
    const queryParams = {
      storeId: storeId ?? undefined,
      page: params.page,
      perPage: params.perPage,
      status: params.status,
      search: params.search,
      dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
      dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    };

    // Handle CSV export
    if (params.export === 'csv') {
      const csv = await exportOrdersToCSV(queryParams);
      
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Fetch orders
    const result = await listOrders(queryParams);

    return apiResponse.success(result.orders, {
      message: 'Orders retrieved successfully',
      meta: result.pagination,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiResponse.validationError('Validation error', {
        errors: error.errors,
      });
    }

    console.error('[GET /api/orders] Error:', error);
    return apiResponse.internalServerError(
      error instanceof Error ? error.message : 'Failed to fetch orders'
    );
  }
}
