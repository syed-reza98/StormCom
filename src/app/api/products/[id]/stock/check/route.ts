// src/app/api/products/[id]/stock/check/route.ts
// Check stock availability for a requested quantity

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { productService } from '@/services/product-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const quantity = parseInt(searchParams.get('quantity') || '0', 10);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'quantity must be a positive integer' } },
        { status: 400 }
      );
    }

    const product = await productService.getProductById(id, session.user.storeId);
    if (!product) {
      return NextResponse.json(
        { error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }

    const available = await productService.isInStock(session.user.storeId, id, quantity);
    return NextResponse.json({
      data: {
        available,
        requestedQuantity: quantity,
        availableQuantity: product.inventoryQty,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error checking stock:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to check stock' } },
      { status: 500 }
    );
  }
}
// Note: Consolidated to a single GET export to avoid duplicate export errors during build.
