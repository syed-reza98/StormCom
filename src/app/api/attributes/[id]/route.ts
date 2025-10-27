// src/app/api/attributes/[id]/route.ts
// Individual Attribute API Routes - Get, Update, Delete

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { attributeService, createAttributeSchema } from '@/services/attribute-service';
import { z } from 'zod';

interface RouteParams {
  params: { id: string };
}

// GET /api/attributes/[id] - Get single attribute
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const attribute = await attributeService.getAttributeById(
      params.id,
      session.user.storeId
    );

    if (!attribute) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Attribute not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: attribute });
  } catch (error) {
    console.error('Error fetching attribute:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch attribute' } },
      { status: 500 }
    );
  }
}

// PATCH /api/attributes/[id] - Update attribute
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
    const updateSchema = createAttributeSchema.partial();
    const validatedData = updateSchema.parse(body);

    const attribute = await attributeService.updateAttribute(
      params.id,
      session.user.storeId,
      validatedData
    );

    return NextResponse.json({
      data: attribute,
      message: 'Attribute updated successfully',
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
      if (error.message === 'Attribute not found') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: error.message } },
          { status: 404 }
        );
      }

      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: { code: 'DUPLICATE_ERROR', message: error.message } },
          { status: 409 }
        );
      }

      if (error.message.includes('Cannot change type') ||
          error.message.includes('has products')) {
        return NextResponse.json(
          { error: { code: 'BUSINESS_ERROR', message: error.message } },
          { status: 400 }
        );
      }
    }

    console.error('Error updating attribute:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update attribute' } },
      { status: 500 }
    );
  }
}

// DELETE /api/attributes/[id] - Soft delete attribute
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    await attributeService.deleteAttribute(params.id, session.user.storeId);

    return NextResponse.json(
      { message: 'Attribute deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Attribute not found') {
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

    console.error('Error deleting attribute:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete attribute' } },
      { status: 500 }
    );
  }
}