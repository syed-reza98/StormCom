// src/app/api/brands/[id]/route.ts
// Individual Brand API Routes - Get, Update, Delete

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { brandService, createBrandSchema } from '@/services/brand-service';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/brands/[id] - Get single brand
export async function GET(_request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const brand = await brandService.getBrandById(
      id,
      session.user.storeId
    );

    if (!brand) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Brand not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: brand });
  } catch (error) {
    console.error('Error fetching brand:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch brand' } },
      { status: 500 }
    );
  }
}

// PATCH /api/brands/[id] - Update brand
export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input (partial schema for updates)
    const updateSchema = createBrandSchema.partial();
    const validatedData = updateSchema.parse(body);

    const brand = await brandService.updateBrand(
      id,
      session.user.storeId,
      validatedData
    );

    return NextResponse.json({
      data: brand,
      message: 'Brand updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid input', 
            changes: error.errors 
          } 
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message === 'Brand not found') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: error.message } },
          { status: 404 }
        );
      }

      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: { code: 'DUPLICATE_ERROR', message: error.message } },
          { status: 409 }
        );
      }
    }

    console.error('Error updating brand:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update brand' } },
      { status: 500 }
    );
  }
}

// DELETE /api/brands/[id] - Soft delete brand
export async function DELETE(_request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    await brandService.deleteBrand(id, session.user.storeId);

    return NextResponse.json(
      { message: 'Brand deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Brand not found') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: error.message } },
          { status: 404 }
        );
      }

      if (error.message.includes('Cannot delete')) {
        return NextResponse.json(
          { error: { code: 'BUSINESS_ERROR', message: error.message } },
          { status: 400 }
        );
      }
    }

    console.error('Error deleting brand:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete brand' } },
      { status: 500 }
    );
  }
}