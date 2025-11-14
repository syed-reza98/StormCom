/**
 * GET /api/orders
 * 
 * Lists orders with filtering, pagination, and search capabilities.
 * Enforces multi-tenant isolation and role-based access control.
 * 
 * Migrated to use API middleware pipeline (T027)
 * - Request ID propagation via X-Request-Id header
 * - Authentication via authMiddleware
 * - Rate limiting via rateLimitMiddleware
 * - Standardized response format via apiResponse
 * 
 * @requires Authentication (Store Admin, Staff with orders:read permission)
 * @returns {OrderListResponse} Paginated list of orders
 */

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { createApiHandler, middlewareStacks } from '@/lib/api-middleware';
import { listOrders, exportOrdersToCSV } from '@/services/order-service';
import { 
  successResponse, 
  validationErrorResponse,
  forbiddenResponse,
  internalServerErrorResponse,
} from '@/lib/api-response';
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

export const GET = createApiHandler(
  middlewareStacks.authenticated, // Uses: requestId + auth + tenant + rateLimit + logging
  async (request: NextRequest, context) => {
    try {
      // Role-based access control (session already validated by authMiddleware)
      const userRole = context.session?.user?.role;
      if (!userRole || !['SUPER_ADMIN', 'STORE_ADMIN', 'STAFF'].includes(userRole)) {
        return forbiddenResponse('Insufficient permissions');
      }

      // storeId already extracted by tenantMiddleware
      const storeId = context.storeId;
      if (!storeId && userRole !== 'SUPER_ADMIN') {
        return forbiddenResponse('No store assigned');
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

      // Handle CSV export (streaming implementation in T028)
      if (params.export === 'csv') {
        const csv = await exportOrdersToCSV(queryParams);
        
        return new NextResponse(csv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().split('T')[0]}.csv"`,
            'X-Request-Id': context.request.headers.get('x-request-id') || '',
          },
        });
      }

      // Fetch orders
      const result = await listOrders(queryParams);

      // Return standardized response with X-Request-Id header (handled by middleware)
      return successResponse(result.orders, {
        message: 'Orders retrieved successfully',
        meta: result.pagination,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationErrorResponse('Validation error', {
          errors: error.errors,
        });
      }

      console.error('[GET /api/orders] Error:', error);
      return internalServerErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch orders'
      );
    }
  }
);

