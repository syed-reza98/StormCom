// src/app/api/products/[id]/stock/check/route.ts
// Check stock availability for a requested quantity

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { productService } from '@/services/product-service';

interface RouteParams { params: { id: string } }

export async function GET(request: NextRequest, context: RouteParams | { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const rawParams: any = (context as any)?.params;
    const resolved = rawParams && typeof rawParams.then === 'function' ? await rawParams : rawParams;
    const id: string | undefined = resolved?.id;
    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }
    const { searchParams } = new URL(request.url);
    const quantity = parseInt(searchParams.get('quantity') || '0', 10);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'quantity must be a positive integer' } },
        { status: 400 }
      );
    }

    const product = await productService.getProductById(id, session.user.storeId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }

    const available = await productService.isInStock(session.user.storeId, id, quantity);
    return NextResponse.json({
      success: true,
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
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to check stock' } },
      { status: 500 }
    );
  }
}
// Note: Consolidated to a single GET export to avoid duplicate export errors during build.
