/**
 * Store by ID API Routes
 * 
 * Handles individual store operations.
 * 
 * GET /api/stores/[storeId] - Get store details
 * PATCH /api/stores/[storeId] - Update store
 * DELETE /api/stores/[storeId] - Delete store (soft delete)
 * 
 * @module app/api/stores/[storeId]/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { getStoreById, updateStore, deleteStore } from '@/services/stores/store-service';
import { updateStoreSchema } from '@/lib/validation/store';
import { z } from 'zod';

interface RouteParams {
  params: { storeId: string };
}

/**
 * GET /api/stores/[storeId]
 * Get store details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const store = await getStoreById(params.storeId);
    if (!store) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Store not found' } },
        { status: 404 }
      );
    }

    // Check permissions: Super Admin or user belongs to this store
    const isSuperAdmin = await hasPermission(session.user.id, 'stores.*');
    const belongsToStore = session.user.storeId === params.storeId;

    if (!isSuperAdmin && !belongsToStore) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: store });
  } catch (error) {
    console.error('Error fetching store:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch store' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/stores/[storeId]
 * Update store details
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check permissions: Super Admin or store admin
    const isSuperAdmin = await hasPermission(session.user.id, 'stores.*');
    const canUpdateStore = await hasPermission(session.user.id, 'stores.update');
    const belongsToStore = session.user.storeId === params.storeId;

    if (!isSuperAdmin && !(canUpdateStore && belongsToStore)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = updateStoreSchema.parse(body);

    // Update store
    const store = await updateStore(params.storeId, validatedData);

    return NextResponse.json({
      data: store,
      message: 'Store updated successfully',
    });
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

    console.error('Error updating store:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update store' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/stores/[storeId]
 * Delete store (soft delete)
 * Super Admin only
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check Super Admin permission
    const isSuperAdmin = await hasPermission(session.user.id, 'stores.delete');
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Only Super Admins can delete stores' } },
        { status: 403 }
      );
    }

    await deleteStore(params.storeId);

    return NextResponse.json(
      { message: 'Store deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: error.message } },
        { status: 400 }
      );
    }

    console.error('Error deleting store:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete store' } },
      { status: 500 }
    );
  }
}
