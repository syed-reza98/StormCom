// src/app/api/attributes/[id]/products/route.ts
// Attribute-Product Assignment API Routes

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { attributeService } from '@/services/attribute-service';
import { z } from 'zod';

interface RouteParams {
  params: { id: string };
}

const assignAttributeSchema = z.object({
  productId: z.string().uuid(),
  value: z.unknown(), // Can be any JSON value
});

const bulkAssignSchema = z.object({
  assignments: z.array(z.object({
    productId: z.string().uuid(),
    value: z.unknown(),
  })).min(1),
});

// POST /api/attributes/[id]/products - Assign attribute to product
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, value } = assignAttributeSchema.parse(body);

    const result = await attributeService.assignAttributeToProduct(
      productId,
      params.id,
      value as string,
      session.user.storeId
    );

    return NextResponse.json({
      data: result,
      message: 'Attribute assigned to product successfully',
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
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: error.message } },
          { status: 404 }
        );
      }

      if (error.message.includes('Invalid value') ||
          error.message.includes('required') ||
          error.message.includes('validation')) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: error.message } },
          { status: 400 }
        );
      }
    }

    console.error('Error assigning attribute to product:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to assign attribute to product' } },
      { status: 500 }
    );
  }
}

// POST /api/attributes/[id]/products/bulk - Bulk assign attribute to multiple products
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
    const { assignments } = bulkAssignSchema.parse(body);

    // Transform assignments to match service signature
    const transformedAssignments = assignments.map(a => ({
      attributeId: params.id,
      value: String(a.value),
    }));

    const result = await attributeService.bulkAssignAttributes(
      assignments[0].productId, // TODO: This seems wrong - need to fix API design
      transformedAssignments,
      session.user.storeId
    );

    return NextResponse.json({
      data: result,
      message: `Attribute assigned: ${result.created} created, ${result.updated} updated`,
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
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: error.message } },
          { status: 404 }
        );
      }
    }

    console.error('Error bulk assigning attributes:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to bulk assign attributes' } },
      { status: 500 }
    );
  }
}