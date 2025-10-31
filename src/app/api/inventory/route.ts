// src/app/api/inventory/route.ts
// GET /api/inventory - Retrieve inventory levels with filters
// US6 - Inventory Management

import { NextRequest, NextResponse } from 'next/server';
// This route reads cookies and headers at runtime and must opt out of
// prerendering. Force dynamic rendering so Next.js does not attempt to
// prerender this API route which would cause `request.cookies` to fail
// during the build.
export const dynamic = 'force-dynamic';
import { getInventoryLevels } from '@/services/inventory-service';
import { getUserFromSession } from '@/services/session-service';

/**
 * GET /api/inventory
 * Retrieve inventory levels for the authenticated user's store
 *
 * Query Parameters:
 * - search: Filter by product name or SKU
 * - categoryId: Filter by category
 * - brandId: Filter by brand
 * - lowStockOnly: true to show only low/out of stock items
 * - page: Page number (default: 1)
 * - perPage: Items per page (default: 20, max: 100)
 *
 * Response:
 * {
 *   data: InventoryItem[],
 *   meta: {
 *     page: number,
 *     perPage: number,
 *     total: number,
 *     totalPages: number
 *   }
 * }
 */
export async function GET(request: NextRequest) {
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
            message: 'You do not have permission to view inventory',
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const brandId = searchParams.get('brandId') || undefined;
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = Math.min(
      parseInt(searchParams.get('perPage') || '20', 10),
      100
    );

    // Validate pagination
    if (page < 1) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Page must be >= 1' } },
        { status: 400 }
      );
    }

    if (perPage < 1 || perPage > 100) {
      return NextResponse.json(
        {
          error: {
            code: 'BAD_REQUEST',
            message: 'perPage must be between 1 and 100',
          },
        },
        { status: 400 }
      );
    }

    // Fetch inventory levels
    const { items, total } = await getInventoryLevels(storeId!, {
      search,
      categoryId,
      brandId,
      lowStockOnly,
      page,
      perPage,
    });

    // Calculate total pages
    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({
      data: items,
      meta: {
        page,
        perPage,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('GET /api/inventory error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch inventory levels',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
