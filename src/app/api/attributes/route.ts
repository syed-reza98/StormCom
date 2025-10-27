// src/app/api/attributes/route.ts
// Product Attributes API Routes - List and Create operations

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { attributeService } from '@/services/attribute-service';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createAttributeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be under 100 characters'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be under 100 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, alphanumeric with hyphens'),
  type: z.enum(['text', 'number', 'boolean', 'select', 'multiselect', 'date'], 
    { errorMap: () => ({ message: 'Type must be one of: text, number, boolean, select, multiselect, date' }) }),
  description: z.string().max(500, 'Description must be under 500 characters').optional(),
  isRequired: z.boolean().default(false),
  defaultValue: z.string().max(255, 'Default value must be under 255 characters').optional(),
  options: z.array(z.string().min(1).max(100)).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
  displayOrder: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
});

// ============================================================================
// GET /api/attributes - List Attributes
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
    // TODO: type and isRequired filters not yet implemented in service
    // const type = url.searchParams.get('type') as 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date' | undefined;
    // const isRequired = url.searchParams.get('isRequired') === 'true' ? true : 
    //                   url.searchParams.get('isRequired') === 'false' ? false : undefined;
    const sortBy = url.searchParams.get('sortBy') as 'name' | 'createdAt' | 'updatedAt' || 'name';
    const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' || 'asc';
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(url.searchParams.get('perPage') || '10'), 100);

    const result = await attributeService.getAttributes({
      search,
      sortBy,
      sortOrder,
    }, page, perPage);

    return Response.json({
      data: result.attributes || result,
      meta: result.pagination || {},
    });
  } catch (error) {
    console.error('Error fetching attributes:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch attributes' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/attributes - Create Attribute
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
    const validatedData = createAttributeSchema.parse(body);

    // Validate options for select/multiselect types
    if (['select', 'multiselect'].includes(validatedData.type)) {
      if (!validatedData.options || validatedData.options.length === 0) {
        return Response.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Options are required for select and multiselect types' } },
          { status: 400 }
        );
      }
    }

    const attribute = await attributeService.createAttribute({
      name: validatedData.name,
      values: validatedData.options || [] // TODO: Schema mismatch - API uses 'options', service uses 'values'
    });

    return Response.json(
      {
        data: attribute,
        message: 'Attribute created successfully',
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

    console.error('Error creating attribute:', error);
    return Response.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create attribute' } },
      { status: 500 }
    );
  }
}