/**
 * GET /api/orders/export
 * 
 * CSV Export endpoint with automatic streaming/async selection (FR-016)
 * - ≤10k rows: Streams CSV directly (200 OK)
 * - >10k rows: Enqueues async job, returns job ID (202 Accepted)
 * 
 * Memory cap: 200MB heap
 * Timeout cap: 120s
 * 
 * Implements T028: CSV streaming for ≤10k rows
 * Related: T029 for async export job service
 * 
 * @requires Authentication (Store Admin, Staff with orders:read permission)
 * @returns CSV stream (200) or job acceptance (202)
 */

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { z } from 'zod';
import { createApiHandler, middlewareStacks } from '@/lib/api-middleware';
import { 
  successResponse,
  validationErrorResponse,
  forbiddenResponse,
  internalServerErrorResponse,
} from '@/lib/api-response';
import { OrderStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { getRequestId } from '@/lib/request-context';

// Validation schema for export filters
const exportQuerySchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().max(200).optional(),
});

// Export thresholds (FR-016 clarifications)
const STREAMING_THRESHOLD = 10000; // ≤10k rows: stream directly

/**
 * Count orders matching filters
 */
async function countOrders(
  storeId: string | undefined,
  filters: {
    status?: OrderStatus;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
  }
): Promise<number> {
  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (storeId) {
    where.storeId = storeId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      (where.createdAt as Record<string, unknown>).gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      (where.createdAt as Record<string, unknown>).lte = filters.dateTo;
    }
  }

  if (filters.search) {
    where.OR = [
      { orderNumber: { contains: filters.search, mode: 'insensitive' } },
      { customerEmail: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return db.order.count({ where });
}

/**
 * Stream CSV rows for orders (≤10k)
 * 
 * Uses ReadableStream API to stream CSV without buffering entire dataset
 * Memory efficient: processes in batches, yields to event loop
 */
async function* streamOrdersCSV(
  storeId: string | undefined,
  filters: {
    status?: OrderStatus;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
  }
): AsyncGenerator<string> {
  // CSV header row
  yield 'Order Number,Customer Email,Status,Total Amount,Currency,Created At,Items Count,Payment Status\n';

  const BATCH_SIZE = 1000; // Process 1k rows at a time
  let skip = 0;
  let hasMore = true;

  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (storeId) {
    where.storeId = storeId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      (where.createdAt as Record<string, unknown>).gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      (where.createdAt as Record<string, unknown>).lte = filters.dateTo;
    }
  }

  if (filters.search) {
    where.OR = [
      { orderNumber: { contains: filters.search, mode: 'insensitive' } },
      {
        customer: {
          email: { contains: filters.search, mode: 'insensitive' },
        },
      },
    ];
  }

  while (hasMore) {
    const orders = await db.order.findMany({
      where,
      select: {
        orderNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        customer: {
          select: { email: true },
        },
        items: {
          select: { id: true },
        },
        paymentStatus: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: BATCH_SIZE,
    });

    if (orders.length === 0) {
      hasMore = false;
      break;
    }

    // Convert batch to CSV rows
    for (const order of orders) {
      const customerEmail = order.customer?.email || '';
      const itemsCount = order.items?.length || 0;

      const row = [
        escapeCsvField(order.orderNumber),
        escapeCsvField(customerEmail),
        escapeCsvField(order.status),
        order.totalAmount.toFixed(2),
        'USD', // Default currency
        order.createdAt.toISOString(),
        itemsCount.toString(),
        escapeCsvField(order.paymentStatus),
      ].join(',');

      yield row + '\n';
    }

    skip += BATCH_SIZE;

    // Check if we have more rows
    if (orders.length < BATCH_SIZE) {
      hasMore = false;
    }
  }
}

/**
 * Escape CSV field (handle quotes, commas, newlines)
 */
function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Convert async generator to ReadableStream
 */
function createStreamFromGenerator(
  generator: AsyncGenerator<string>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await generator.next();

        if (done) {
          controller.close();
          return;
        }

        controller.enqueue(encoder.encode(value));
      } catch (error) {
        console.error('[CSV Stream] Error:', error);
        controller.error(error);
      }
    },
  });
}

export const GET = createApiHandler(
  middlewareStacks.authenticated,
  async (request: NextRequest, context) => {
    try {
      // Role-based access control
      const userRole = context.session?.user?.role;
      if (!userRole || !['SUPER_ADMIN', 'STORE_ADMIN', 'STAFF'].includes(userRole)) {
        return forbiddenResponse('Insufficient permissions');
      }

      const storeId = context.storeId;
      if (!storeId && userRole !== 'SUPER_ADMIN') {
        return forbiddenResponse('No store assigned');
      }

      // Parse and validate query parameters
      const { searchParams } = new URL(request.url);
      const params = exportQuerySchema.parse(Object.fromEntries(searchParams));

      const filters = {
        status: params.status,
        dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
        dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
        search: params.search,
      };

      // Count total rows to determine streaming vs async
      const totalRows = await countOrders(storeId, filters);

      // If >10k rows, enqueue async job (T029)
      if (totalRows > STREAMING_THRESHOLD) {
        const { enqueueOrderExport } = await import('@/services/export-service');
        
        const { jobId, status } = await enqueueOrderExport(
          storeId || '', // SuperAdmin can export all stores
          context.session!.user.id,
          filters,
          totalRows
        );

        return successResponse(
          {
            jobId,
            status,
            estimatedRows: totalRows,
            message: 'Export job enqueued. You will receive an email and in-app notification when complete.',
          },
          { status: 202 }
        );
      }

      // Stream CSV directly (≤10k rows)
      const generator = streamOrdersCSV(storeId, filters);
      const stream = createStreamFromGenerator(generator);

      const requestId = getRequestId();
      const filename = `orders-${new Date().toISOString().split('T')[0]}.csv`;

      return new NextResponse(stream, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'X-Request-Id': requestId,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return validationErrorResponse('Validation error', {
          errors: error.errors,
        });
      }

      console.error('[GET /api/orders/export] Error:', error);
      return internalServerErrorResponse(
        error instanceof Error ? error.message : 'Failed to export orders'
      );
    }
  }
);
