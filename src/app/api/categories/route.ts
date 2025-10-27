// src/app/api/categories/route.ts
// API routes for category management
// Supports hierarchical categories with parent-child relationships

import { NextRequest } from 'next/server';
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

const getCategoriesSchema = z.object({
  storeId: z.string().uuid('Store ID must be a valid UUID'),
  parentId: z.string().uuid('Parent ID must be a valid UUID').optional(),
  includeUnpublished: z.boolean().default(false),
  includeProductCounts: z.boolean().default(false),
  flat: z.boolean().default(false), // Return flat list instead of tree
});

// ============================================================================
// GET /api/categories - List Categories
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      storeId: url.searchParams.get('storeId'),
      parentId: url.searchParams.get('parentId'),
      includeUnpublished: url.searchParams.get('includeUnpublished') === 'true',
      includeProductCounts: url.searchParams.get('includeProductCounts') === 'true',
      flat: url.searchParams.get('flat') === 'true',
    };

    const validatedParams = getCategoriesSchema.parse(queryParams);

    // Get current user and validate authentication
    const user = await getCurrentUser();
    if (!user) {
      return createApiError('Unauthorized', 401);
    }

    // Use user's storeId if not provided in query
    const storeId = validatedParams.storeId || user.storeId;
    if (!storeId) {
      return createApiError('Store ID is required', 400);
    }

    // Validate store access
    const hasAccess = await validateStoreAccess(user.id, storeId, ['STORE_ADMIN', 'STAFF', 'CUSTOMER']);
    if (!hasAccess) {
      return createApiError('Access denied to this store', 403);
    }

    // Check if requesting tree structure
    const treeMode = url.searchParams.get('tree') === 'true';
    if (treeMode) {
      const tree = await categoryService.getCategoryTree(storeId);
      return createApiResponse({ categories: tree, meta: { structure: 'tree' } }, 'Category tree retrieved successfully');
    }

    // Check if requesting root categories only
    const rootOnly = url.searchParams.get('rootOnly') === 'true';
    if (rootOnly) {
      const rootCategories = await categoryService.getRootCategories(storeId);
      return createApiResponse({ categories: rootCategories, meta: { structure: 'root' } }, 'Root categories retrieved successfully');
    }

    // Parse pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(url.searchParams.get('perPage') || '10'), 100);
    
    // Parse filter parameters
    const filters = {
      search: url.searchParams.get('search') || undefined,
      parentId: url.searchParams.get('parentId') === 'null' ? null : url.searchParams.get('parentId') || undefined,
      isPublished: url.searchParams.get('isPublished') === 'true' ? true 
                  : url.searchParams.get('isPublished') === 'false' ? false 
                  : undefined,
      sortBy: url.searchParams.get('sortBy') || 'sortOrder',
      sortOrder: url.searchParams.get('sortOrder') || 'asc',
    };

    const result = await categoryService.getCategories(
      storeId,
      filters,
      page,
      perPage
    );

    return createApiResponse({
      categories: result.categories,
      meta: result.pagination,
    }, 'Categories retrieved successfully');

  } catch (error) {
    console.error('Get categories error:', error);

    if (error instanceof z.ZodError) {
      return createApiError('Validation failed', 400, error.errors);
    }

    return createApiError('Internal server error', 500);
  }
}

// ============================================================================
// POST /api/categories - Create Category
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Get current user and validate authentication
    const user = await getCurrentUser();
    if (!user) {
      return createApiError('Unauthorized', 401);
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createCategorySchema.parse(body);

    // Extract storeId from request (could be from body, query, or header)
    const url = new URL(request.url);
    const storeId = body.storeId || url.searchParams.get('storeId') || user.storeId;
    
    if (!storeId) {
      return createApiError('Store ID is required', 400);
    }

    // Validate store access
    const hasAccess = await validateStoreAccess(user.id, storeId, ['STORE_ADMIN', 'STAFF']);
    if (!hasAccess) {
      return createApiError('Access denied to this store', 403);
    }

    const category = await categoryService.createCategory(storeId, validatedData);

    // Create audit log
    await createAuditLog({
      userId: user.id,
      storeId,
      action: 'create',
      entityType: 'Category',
      entityId: category.id,
      changes: {
        created: {
          name: category.name,
          slug: category.slug,
          parentId: category.parentId,
        },
      },
    });

    return createApiResponse(category, 'Category created successfully', 201);

  } catch (error) {
    console.error('Create category error:', error);

    if (error instanceof z.ZodError) {
      return createApiError('Validation failed', 400, error.errors);
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      return createApiError('A category with this slug already exists in this store', 409);
    }

    return createApiError('Internal server error', 500);
  }
}