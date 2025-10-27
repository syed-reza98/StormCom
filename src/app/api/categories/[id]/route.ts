// src/app/api/categories/[id]/route.ts
// Individual Category API Routes - Get, Update, Delete

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { categoryService } from '@/services/category-service';
import { createCategorySchema } from '@/services/category-service';
import { z } from 'zod';

interface RouteParams {
  params: { id: string };
}

// GET /api/categories/[id] - Get single category
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Check if requesting breadcrumb
    const breadcrumb = searchParams.get('breadcrumb') === 'true';
    if (breadcrumb) {
      const breadcrumbPath = await categoryService.getCategoryBreadcrumb(
        params.id,
        session.user.storeId
      );
      return NextResponse.json({ data: breadcrumbPath });
    }

    const category = await categoryService.getCategoryById(params.id, session.user.storeId);

    if (!category) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: category });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch category' } },
      { status: 500 }
    );
  }
}

// PATCH /api/categories/[id] - Update category
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
    
    // Validate input (partial schema for updates)
    const updateSchema = createCategorySchema.partial();
    const validatedData = updateSchema.parse(body);

    const category = await categoryService.updateCategory(
      params.id,
      session.user.storeId,
      validatedData
    );

    return NextResponse.json({
      data: category,
      message: 'Category updated successfully',
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
      // Handle business logic errors
      if (error.message === 'Category not found') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: error.message } },
          { status: 404 }
        );
      }

      if (error.message.includes('already exists') ||
          error.message.includes('circular') ||
          error.message.includes('cannot')) {
        return NextResponse.json(
          { error: { code: 'BUSINESS_ERROR', message: error.message } },
          { status: 400 }
        );
      }
    }

    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update category' } },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Soft delete category
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    await categoryService.deleteCategory(params.id, session.user.storeId);

    return NextResponse.json(
      { message: 'Category deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Category not found') {
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

    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete category' } },
      { status: 500 }
    );
  }
}