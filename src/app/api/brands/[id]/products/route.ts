// src/app/api/brands/[id]/products/route.ts
// Brand Products Assignment API Routes

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { brandService } from '@/services/brand-service';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const assignProductsSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1),
});

const unassignProductsSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1),
});

// POST /api/brands/[id]/products - Assign products to brand
export async function POST(request: NextRequest, context: RouteParams) {
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
    const { productIds } = assignProductsSchema.parse(body);

    const result = await brandService.assignProductsToBrand(
      id,
      productIds,
      session.user.storeId
    );

    return NextResponse.json({
      data: result,
      message: `${result.updated} products assigned to brand successfully`,
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

      if (error.message.includes('Product') && error.message.includes('not found')) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: error.message } },
          { status: 404 }
        );
      }
    }

    console.error('Error assigning products to brand:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to assign products to brand' } },
      { status: 500 }
    );
  }
}

// DELETE /api/brands/[id]/products - Remove products from brand
export async function DELETE(request: NextRequest, context: RouteParams) {
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
    const { productIds } = unassignProductsSchema.parse(body);

    const result = await brandService.removeProductsFromBrand(
      id,
      productIds,
      session.user.storeId
    );

    return NextResponse.json({
      data: result,
      message: `${result.updated} products removed from brand successfully`,
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
    }

    console.error('Error removing products from brand:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to remove products from brand' } },
      { status: 500 }
    );
  }
}