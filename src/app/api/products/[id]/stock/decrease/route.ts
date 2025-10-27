// src/app/api/products/[id]/stock/decrease/route.ts
// Decrease Product Stock - For order placement

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { InventoryStatus } from '@prisma/client';

interface RouteParams {
  params: { id: string };
}

const decreaseStockSchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive'),
  reason: z.string().optional(),
  orderId: z.string().optional(),
});

// POST /api/products/[id]/stock/decrease - Decrease inventory quantity
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
    const validatedData = decreaseStockSchema.parse(body);

    // Use transaction to ensure atomic update
    const result = await db.$transaction(async (tx) => {
      // Get current product with lock
      const product = await tx.product.findFirst({
        where: {
          id: params.id,
          storeId: session.user!.storeId!,
          deletedAt: null,
        },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      if (!product.trackInventory) {
        throw new Error('Product inventory tracking is disabled');
      }

      if (product.inventoryQty < validatedData.quantity) {
        throw new Error(`Insufficient stock. Available: ${product.inventoryQty}, Requested: ${validatedData.quantity}`);
      }

      // Calculate new quantity and status
      const newQuantity = product.inventoryQty - validatedData.quantity;
      let newStatus = product.inventoryStatus;

      if (newQuantity === 0) {
        newStatus = InventoryStatus.OUT_OF_STOCK;
      } else if (newQuantity <= product.lowStockThreshold) {
        newStatus = InventoryStatus.LOW_STOCK;
      }

      // Update product inventory
      const updatedProduct = await tx.product.update({
        where: { id: params.id },
        data: {
          inventoryQty: newQuantity,
          inventoryStatus: newStatus,
        },
        select: {
          id: true,
          name: true,
          sku: true,
          inventoryQty: true,
          lowStockThreshold: true,
          inventoryStatus: true,
        },
      });

      // Create inventory log
      await tx.inventoryLog.create({
        data: {
          storeId: session.user!.storeId!,
          productId: params.id,
          changeType: 'SALE',
          quantityChange: -validatedData.quantity,
          quantityBefore: product.inventoryQty,
          quantityAfter: newQuantity,
          reason: validatedData.reason || 'Stock decreased via API',
          orderId: validatedData.orderId,
          userId: session.user!.id,
        },
      });

      return updatedProduct;
    });

    return NextResponse.json({
      data: result,
      message: 'Stock decreased successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message === 'Product not found') {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: error.message } },
          { status: 404 }
        );
      }

      if (error.message.includes('Insufficient stock') || error.message.includes('tracking is disabled')) {
        return NextResponse.json(
          { error: { code: 'BUSINESS_ERROR', message: error.message } },
          { status: 400 }
        );
      }
    }

    console.error('Error decreasing product stock:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to decrease product stock' } },
      { status: 500 }
    );
  }
}
