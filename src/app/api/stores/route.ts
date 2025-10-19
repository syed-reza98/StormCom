/**
 * Stores API Routes
 * 
 * Handles store listing and creation endpoints.
 * 
 * GET /api/stores - List all stores (Super Admin only)
 * POST /api/stores - Create new store (Super Admin only)
 * 
 * @module app/api/stores/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { createStore, listStores } from '@/services/stores/store-service';
import { createStoreSchema } from '@/lib/validation/store';
import { z } from 'zod';

/**
 * GET /api/stores
 * List all stores with pagination
 * Requires: Super Admin role
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check Super Admin permission
    const canListStores = await hasPermission(session.user.id, 'stores.*');
    if (!canListStores) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Only Super Admins can list all stores' } },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(searchParams.get('perPage') || '20'), 100);
    const search = searchParams.get('search') || undefined;
    const sortBy = searchParams.get('sortBy') || undefined;
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const { stores, total } = await listStores({
      page,
      perPage,
      search,
      sortBy,
      sortOrder,
    });

    return NextResponse.json({
      data: stores,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error('Error listing stores:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to list stores' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/stores
 * Create a new store
 * Requires: Super Admin role
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check Super Admin permission
    const canCreateStore = await hasPermission(session.user.id, 'stores.create');
    if (!canCreateStore) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Only Super Admins can create stores' } },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = createStoreSchema.parse(body);

    // Create store
    const store = await createStore(validatedData);

    return NextResponse.json(
      {
        data: store,
        message: 'Store created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: error.message } },
        { status: 400 }
      );
    }

    console.error('Error creating store:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create store' } },
      { status: 500 }
    );
  }
}
