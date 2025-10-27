// src/app/api/brands/route.ts
// Brands API Routes - List and Create operations

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { brandService, createBrandSchema } from '@/services/brand-service';
import { z } from 'zod';

// GET /api/brands - List brands with filtering and pagination
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
    
    // Parse query parameters
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') as 'ACTIVE' | 'INACTIVE' | undefined;
    const sortBy = searchParams.get('sortBy') as 'name' | 'createdAt' | 'updatedAt' | undefined;
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Additional query options
    const includeProductCount = searchParams.get('includeProductCount') === 'true';

    const result = await brandService.getBrands(session.user.storeId, {
      search,
      status,
      sortBy,
      sortOrder,
      page,
      limit,
      includeProductCount,
    });

    return NextResponse.json({
      data: result.brands,
      meta: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch brands' } },
      { status: 500 }
    );
  }
}

// POST /api/brands - Create new brand
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
    const validatedData = createBrandSchema.parse(body);

    const brand = await brandService.createBrand(
      session.user.storeId,
      validatedData
    );

    return NextResponse.json(
      {
        data: brand,
        message: 'Brand created successfully',
      },
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

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE_ERROR', message: error.message } },
        { status: 409 }
      );
    }

    console.error('Error creating brand:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create brand' } },
      { status: 500 }
    );
  }
}