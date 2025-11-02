// src/app/api/inventory/adjust/route.ts
// POST /api/inventory/adjust - Adjust product stock levels
// US6 - Inventory Management

import { NextRequest, NextResponse } from 'next/server';
import { adjustStock } from '@/services/inventory-service';
import { getUserFromSession } from '@/services/session-service';
import { z } from 'zod';

/**
 * Request body schema for stock adjustment
 */
const adjustStockSchema = z.object({
  productId: z.string().uuid({ message: 'Invalid product ID format' }),
  quantity: z
    .number()
    .int()
    .nonnegative({ message: 'Quantity must be non-negative' }),
  type: z.enum(['ADD', 'REMOVE', 'SET'], {
    errorMap: () => ({ message: 'Type must be ADD, REMOVE, or SET' }),
  }),
  reason: z.string().min(1, { message: 'Reason is required' }).max(255),
  note: z.string().max(500).optional(),
});

/**
 * POST /api/inventory/adjust
 * Adjust stock levels for a product
 *
 * Request Body:
 * {
 *   productId: string (UUID),
 *   quantity: number (non-negative integer),
 *   type: 'ADD' | 'REMOVE' | 'SET',
 *   reason: string (max 255 chars),
 *   note?: string (max 500 chars, optional)
 * }
 *
 * Response:
 * {
 *   data: InventoryItem
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication - get session token from cookie
    const sessionToken =
      request.cookies.get('session_token')?.value ||
      request.cookies.get('sessionId')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const user = await getUserFromSession(sessionToken);

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid session' } },
        { status: 401 }
      );
    }

    // Check role - only Store Admin and Staff with inventory permission
    if (
      user.role !== 'STORE_ADMIN' &&
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'STAFF'
    ) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to adjust inventory',
          },
        },
        { status: 403 }
      );
    }

    // Get store ID from user
    const storeId = user.storeId;
    if (!storeId && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Store ID is required' } },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    const validation = adjustStockSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: validation.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { productId, quantity, type, reason, note } = validation.data;

    // Adjust stock using service
    const updatedInventory = await adjustStock(storeId!, {
      productId,
      quantity,
      type,
      reason,
      note,
      userId: user.id,
    });

    return NextResponse.json(
      {
        data: updatedInventory,
        message: `Stock ${type.toLowerCase()}ed successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/inventory/adjust error:', error);

    // Handle specific error messages from service
    if (error instanceof Error) {
      if (error.message.includes('Product not found')) {
        return NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: error.message,
            },
          },
          { status: 404 }
        );
      }

      if (
        error.message.includes('Cannot remove') ||
        error.message.includes('Insufficient stock')
      ) {
        return NextResponse.json(
          {
            error: {
              code: 'INSUFFICIENT_STOCK',
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
          message: 'Failed to adjust stock',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
