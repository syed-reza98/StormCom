// src/app/api/categories/route.ts
// API routes for category management
// Supports hierarchical categories with parent-child relationships

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { z } from 'zod';
import { categoryService } from '@/services/category-service';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be under 200 characters'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be under 100 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, alphanumeric with hyphens'),
  description: z.string().max(1000, 'Description must be under 1000 characters').optional(),
  image: z.string().url('Image must be a valid URL').optional(),
  parentId: z.string().uuid('Parent ID must be a valid UUID').optional(),
  metaTitle: z.string().max(60, 'Meta title must be under 60 characters').optional(),
  metaDescription: z.string().max(160, 'Meta description must be under 160 characters').optional(),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

// ============================================================================
// GET /api/categories - List Categories
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Check if requesting tree structure
    const treeMode = searchParams.get('tree') === 'true';
    if (treeMode) {
      const tree = await categoryService.getCategoryTree(user.storeId);
      return NextResponse.json({ 
        data: { categories: tree, meta: { structure: 'tree' } },
        message: 'Category tree retrieved successfully'
      });
    }

    // Check if requesting root categories only
    const rootOnly = searchParams.get('rootOnly') === 'true';
    if (rootOnly) {
      const rootCategories = await categoryService.getRootCategories(user.storeId);
      return NextResponse.json({ 
        data: { categories: rootCategories, meta: { structure: 'root' } },
        message: 'Root categories retrieved successfully'
      });
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
    };

    const result = await categoryService.getCategories(
      user.storeId,
      filters,
      page,
      perPage
    );

    return NextResponse.json({
      data: {
        categories: result.categories,
        meta: result.pagination,
      },
      message: 'Categories retrieved successfully'
    });

  } catch (error) {
    console.error('Get categories error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Validation failed', changes: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/categories - Create Category
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createCategorySchema.parse(body);

    const category = await categoryService.createCategory(user.storeId, validatedData);

    return NextResponse.json(
      {
        data: category,
        message: 'Category created successfully'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create category error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Validation failed', changes: error.errors } },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'A category with this slug already exists in this store' } },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}