/**
 * Audit Logs API Route
 * 
 * Provides endpoints for retrieving audit logs with filtering and pagination.
 * Supports filtering by store, user, entity type, action, and date range.
 * 
 * @module app/api/audit-logs/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuditLogService } from '@/services/audit-log-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

/**
 * Query parameters schema for GET /api/audit-logs
 */
const AuditLogsQuerySchema = z.object({
  storeId: z.string().optional(),
  userId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

/**
 * GET /api/audit-logs
 * 
 * Retrieve audit logs with optional filters and pagination.
 * Requires authentication. SUPER_ADMIN can access all logs,
 * STORE_ADMIN/STAFF can only access logs for their store.
 * 
 * Query Parameters:
 * - storeId (optional): Filter by store ID
 * - userId (optional): Filter by user ID
 * - entityType (optional): Filter by entity type (Product, Order, User, etc.)
 * - entityId (optional): Filter by specific entity ID
 * - action (optional): Filter by action (CREATE, UPDATE, DELETE)
 * - startDate (optional): Filter logs created after this date (ISO 8601)
 * - endDate (optional): Filter logs created before this date (ISO 8601)
 * - page (optional): Page number (default: 1)
 * - limit (optional): Results per page (default: 50, max: 100)
 * 
 * @returns 200 - Paginated audit logs
 * @returns 401 - Unauthorized (not authenticated)
 * @returns 403 - Forbidden (insufficient permissions)
 * @returns 400 - Bad Request (invalid parameters)
 * @returns 500 - Internal Server Error
 * 
 * @example
 * GET /api/audit-logs?storeId=store-123&entityType=Product&page=1&limit=20
 * 
 * Response:
 * ```json
 * {
 *   "data": {
 *     "logs": [
 *       {
 *         "id": "audit-1",
 *         "action": "UPDATE",
 *         "entityType": "Product",
 *         "entityId": "prod-123",
 *         "storeId": "store-123",
 *         "userId": "user-456",
 *         "changes": "{\"price\":{\"old\":99.99,\"new\":89.99}}",
 *         "ipAddress": "192.168.1.1",
 *         "userAgent": "Mozilla/5.0...",
 *         "createdAt": "2025-01-26T10:00:00.000Z",
 *         "user": {
 *           "id": "user-456",
 *           "name": "John Doe",
 *           "email": "john@example.com"
 *         },
 *         "store": {
 *           "id": "store-123",
 *           "name": "Demo Store"
 *         }
 *       }
 *     ],
 *     "total": 125,
 *     "page": 1,
 *     "limit": 20,
 *     "totalPages": 7
 *   }
 * }
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validationResult = AuditLogsQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validationResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const filters = validationResult.data;

    // Convert date strings to Date objects
    if (filters.startDate) {
      filters.startDate = new Date(filters.startDate) as any;
    }
    if (filters.endDate) {
      filters.endDate = new Date(filters.endDate) as any;
    }

    // Apply multi-tenant isolation
    // SUPER_ADMIN can access all logs (no storeId filter)
    // STORE_ADMIN/STAFF can only access logs for their store
    if (session.user.role !== 'SUPER_ADMIN') {
      if (!session.user.storeId) {
        return NextResponse.json(
          {
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions',
            },
          },
          { status: 403 }
        );
      }

      // Override storeId filter with session storeId for non-super-admins
      filters.storeId = session.user.storeId;
    } else if (filters.storeId) {
      // SUPER_ADMIN can filter by storeId if provided
      // (already set in filters)
    }

    // Retrieve audit logs
    const result = await AuditLogService.getAll(filters as any);

    return NextResponse.json(
      {
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving audit logs:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('page must be') || error.message.includes('limit must be')) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: error.message,
            },
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve audit logs',
        },
      },
      { status: 500 }
    );
  }
}
