// src/app/api/categories/[id]/move/route.ts
// Category Move API Route - Handle hierarchical operations

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { categoryService } from '@/services/category-service';
import { z } from 'zod';

interface RouteParams {
  params: { id: string };
}

const moveCategorySchema = z.object({
  newParentId: z.string().optional(),
  position: z.number().min(0).optional(),
});

// PATCH /api/categories/[id]/move - Move category in hierarchy
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { newParentId, position } = moveCategorySchema.parse(body);

    const result = await categoryService.moveCategory(
      params.id,
      session.user.storeId,
      newParentId,
      position
    );

    return NextResponse.json({
      data: result,
      message: 'Category moved successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid input', 
            details: error.errors 
          } 
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message === 'Category not found') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: error.message } },
          { status: 404 }
        );
      }

      if (error.message.includes('circular') ||
          error.message.includes('cannot move') ||
          error.message.includes('invalid position')) {
        return NextResponse.json(
          { error: { code: 'BUSINESS_ERROR', message: error.message } },
          { status: 400 }
        );
      }
    }

    console.error('Error moving category:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to move category' } },
      { status: 500 }
    );
  }
}