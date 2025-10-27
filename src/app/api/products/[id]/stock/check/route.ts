// src/app/api/products/[id]/stock/check/route.ts
// Check Product Stock Availability

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

interface RouteParams {
  params: { id: string };
}

// GET /api/products/[id]/stock/check - Check stock availability
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Parse quantity from query params (optional)
    const { searchParams } = new URL(request.url);
    const requestedQty = searchParams.get('quantity');
    const quantityToCheck = requestedQty ? parseInt(requestedQty, 10) : 1;

    if (isNaN(quantityToCheck) || quantityToCheck < 1) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid quantity parameter' } },
        { status: 400 }
      );
    }

    const product = await db.product.findFirst({
      where: {
        id: params.id,
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
        isPublished: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }

    // If inventory tracking is disabled, assume always available
    if (!product.trackInventory) {
      return NextResponse.json({
        data: {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          isAvailable: product.isPublished,
          requestedQuantity: quantityToCheck,
          availableQuantity: null, // Not tracked
          trackInventory: false,
          reason: product.isPublished ? 'Product available (inventory not tracked)' : 'Product not published',
        },
      });
    }

    // Check if requested quantity is available
    const isAvailable = product.inventoryQty >= quantityToCheck && product.isPublished;
    const maxAvailable = product.isPublished ? product.inventoryQty : 0;

    let reason = '';
    if (!product.isPublished) {
      reason = 'Product not published';
    } else if (product.inventoryQty === 0) {
      reason = 'Out of stock';
    } else if (product.inventoryQty < quantityToCheck) {
      reason = `Insufficient stock (available: ${product.inventoryQty})`;
    } else {
      reason = 'Available';
    }

    return NextResponse.json({
      data: {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        isAvailable,
        requestedQuantity: quantityToCheck,
        availableQuantity: maxAvailable,
        trackInventory: true,
        isLowStock: product.inventoryQty <= product.lowStockThreshold && product.inventoryQty > 0,
        inventoryStatus: product.inventoryStatus,
        reason,
      },
    });
  } catch (error) {
    console.error('Error checking product stock availability:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to check product stock availability' } },
      { status: 500 }
    );
  }
}
