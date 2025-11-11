// src/app/api/products/[id]/stock/decrease/route.ts
// Decrease product stock quantity

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { productService } from '@/services/product-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const qty = typeof body?.quantity === 'number' ? body.quantity : NaN;
    if (!Number.isFinite(qty) || qty <= 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'quantity must be a positive number' } },
        { status: 400 }
      );
    }

    const updated = await productService.decreaseStock(session.user.storeId, id, qty);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Product not found') {
        return NextResponse.json(
          { success: false, error: { code: 'PRODUCT_NOT_FOUND', message: error.message } },
          { status: 404 }
        );
      }
      if (error.message.includes('Insufficient stock')) {
        return NextResponse.json(
          { success: false, error: { code: 'INSUFFICIENT_STOCK', message: error.message } },
          { status: 400 }
        );
      }
    }
    // eslint-disable-next-line no-console
    console.error('Error decreasing stock:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to decrease stock' } },
      { status: 500 }
    );
  }
}
// Note: An alternative implementation using explicit transactions existed here.
// Consolidated to a single POST export to avoid duplicate export errors during build.
