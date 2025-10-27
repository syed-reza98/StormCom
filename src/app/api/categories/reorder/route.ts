// src/app/api/categories/reorder/route.ts
// Category Reorder API Route - Bulk reordering operations

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { categoryService } from '@/services/category-service';
import { z } from 'zod';

const reorderCategoriesSchema = z.object({
  categoryIds: z.array(z.string()).min(1),
  parentId: z.string().optional(),
});

// PATCH /api/categories/reorder - Reorder categories
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { categoryIds, parentId } = reorderCategoriesSchema.parse(body);

    const result = await categoryService.reorderCategories(
      session.user.storeId,
      parentId ?? null,  // Convert undefined to null
      categoryIds
    );

    return NextResponse.json({
      data: result,
      message: 'Categories reordered successfully',
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
      if (error.message.includes('not found') ||
          error.message.includes('Invalid category')) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: error.message } },
          { status: 404 }
        );
      }

      if (error.message.includes('same parent') ||
          error.message.includes('Invalid order')) {
        return NextResponse.json(
          { error: { code: 'BUSINESS_ERROR', message: error.message } },
          { status: 400 }
        );
      }
    }

    console.error('Error reordering categories:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to reorder categories' } },
      { status: 500 }
    );
  }
}