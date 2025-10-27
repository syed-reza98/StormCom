// src/app/api/attributes/route.ts
// Product Attributes API Routes - List and Create operations

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { attributeService, createAttributeSchema } from '@/services/attribute-service';
import { z } from 'zod';

// GET /api/attributes - List attributes with filtering and pagination
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
    const type = searchParams.get('type') as 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date' | undefined;
    const isRequired = searchParams.get('isRequired') === 'true' ? true : 
                      searchParams.get('isRequired') === 'false' ? false : undefined;
    const sortBy = searchParams.get('sortBy') as 'name' | 'type' | 'createdAt' | 'updatedAt' | undefined;
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Additional query options
    const includeProductCount = searchParams.get('includeProductCount') === 'true';

    const result = await attributeService.getAttributes(session.user.storeId, {
      search,
      type,
      isRequired,
      sortBy,
      sortOrder,
      page,
      limit,
      includeProductCount,
    });

    return NextResponse.json({
      data: result.attributes,
      meta: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching attributes:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch attributes' } },
      { status: 500 }
    );
  }
}

// POST /api/attributes - Create new attribute
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
    const validatedData = createAttributeSchema.parse(body);

    const attribute = await attributeService.createAttribute(
      session.user.storeId,
      validatedData
    );

    return NextResponse.json(
      {
        data: attribute,
        message: 'Attribute created successfully',
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

    console.error('Error creating attribute:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create attribute' } },
      { status: 500 }
    );
  }
}