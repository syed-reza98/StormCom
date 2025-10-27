// src/app/api/categories/route.ts
// Categories API Routes - List and Create

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { categoryService } from '@/services/category-service';
import { createCategorySchema } from '@/services/category-service';
import { z } from 'zod';

// GET /api/categories - List categories with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Check if requesting tree structure
    const treeMode = searchParams.get('tree') === 'true';
    if (treeMode) {
      const tree = await categoryService.getCategoryTree(session.user.storeId);
      return NextResponse.json({ data: tree });
    }

    // Check if requesting root categories only
    const rootOnly = searchParams.get('rootOnly') === 'true';
    if (rootOnly) {
      const rootCategories = await categoryService.getRootCategories(session.user.storeId);
      return NextResponse.json({ data: rootCategories });
    }

    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(searchParams.get('perPage') || '10'), 100);
    
    // Parse filter parameters
    const filters = {
      search: searchParams.get('search') || undefined,
      parentId: searchParams.get('parentId') === 'null' ? null : searchParams.get('parentId') || undefined,
      isPublished: searchParams.get('isPublished') === 'true' ? true 
                  : searchParams.get('isPublished') === 'false' ? false 
                  : undefined,
      sortBy: searchParams.get('sortBy') || 'sortOrder',
      sortOrder: searchParams.get('sortOrder') || 'asc',
    };

    const result = await categoryService.getCategories(
      session.user.storeId,
      filters,
      page,
      perPage
    );

    return NextResponse.json({
      data: result.categories,
      meta: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch categories' } },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = createCategorySchema.parse(body);

    const category = await categoryService.createCategory(session.user.storeId, validatedData);

    return NextResponse.json(
      { data: category, message: 'Category created successfully' },
      { status: 201 }
    );
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
      if (error.message.includes('already exists') || 
          error.message.includes('not found')) {
        return NextResponse.json(
          { error: { code: 'BUSINESS_ERROR', message: error.message } },
          { status: 400 }
        );
      }
    }

    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create category' } },
      { status: 500 }
    );
  }
}