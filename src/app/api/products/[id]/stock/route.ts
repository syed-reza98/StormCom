// src/app/api/products/[id]/stock/route.ts
// Product Stock Level API - Get current inventory quantity

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/products/[id]/stock - Get current stock level
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const product = await db.product.findFirst({
      where: {
        id: id,
        storeId: session.user.storeId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        inventoryQty: true,
        lowStockThreshold: true,
        inventoryStatus: true,
        trackInventory: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        inventoryQty: product.inventoryQty,
        lowStockThreshold: product.lowStockThreshold,
        inventoryStatus: product.inventoryStatus,
        trackInventory: product.trackInventory,
        isLowStock: product.inventoryQty <= product.lowStockThreshold,
      },
    });
  } catch (error) {
    console.error('Error fetching product stock:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch product stock' } },
      { status: 500 }
    );
  }
}
