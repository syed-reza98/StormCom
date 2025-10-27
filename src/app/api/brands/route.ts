// src/app/api/brands/route.ts
// API routes for brand management
// Supports brand CRUD operations with store isolation

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { brandService } from '@/services/brand-service';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createBrandSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be under 200 characters'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be under 100 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, alphanumeric with hyphens'),
  description: z.string().max(1000, 'Description must be under 1000 characters').optional(),
  logo: z.string().url('Logo must be a valid URL').optional(),
  website: z.string().url('Website must be a valid URL').optional(),
  metaTitle: z.string().max(60, 'Meta title must be under 60 characters').optional(),
  metaDescription: z.string().max(160, 'Meta description must be under 160 characters').optional(),
  isPublished: z.boolean().default(true),
});

// ============================================================================
// GET /api/brands - List Brands
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    
    // Extract storeId from query params (required)
    const storeId = url.searchParams.get('storeId');
    if (!storeId) {
      return Response.json(
        { error: { code: 'MISSING_STORE_ID', message: 'Store ID is required' } },
        { status: 400 }
      );
    }

    // Parse query parameters
    const search = url.searchParams.get('search') || undefined;
    const sortBy = url.searchParams.get('sortBy') as 'name' | 'createdAt' | 'updatedAt' || 'name';
    const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' || 'asc';
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(url.searchParams.get('perPage') || '10'), 100);

    const result = await brandService.getBrands(storeId, {
      search,
      sortBy,
      sortOrder,
    }, page, perPage);

    return Response.json({
      data: result.brands,
      meta: {
        page: result.pagination.page,
        perPage: result.pagination.perPage,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch brands' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/brands - Create Brand
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract storeId from body (required)
    const storeId = body.storeId;
    if (!storeId) {
      return Response.json(
        { error: { code: 'MISSING_STORE_ID', message: 'Store ID is required' } },
        { status: 400 }
      );
    }

    // Validate input
    const validatedData = createBrandSchema.parse(body);

    const brand = await brandService.createBrand(storeId, validatedData);

    return Response.json(
      {
        data: brand,
        message: 'Brand created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
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

    if (error instanceof Error && error.message.includes('already exists')) {
      return Response.json(
        { error: { code: 'DUPLICATE_ERROR', message: error.message } },
        { status: 409 }
      );
    }

    console.error('Error creating brand:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create brand' } },
      { status: 500 }
    );
  }
}