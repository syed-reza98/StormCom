/**
 * POST /api/integrations/shopify/export
 * 
 * Export products to Shopify store.
 * 
 * Request Body:
 * - productIds: string[] (optional - if not provided, exports all products)
 * 
 * Response:
 * - 200: { data: { exported, failed, results } } - Export completed
 * - 400: { error: { code, message } } - Invalid input or Shopify not configured
 * - 401: { error: { code, message } } - Not authenticated
 * - 500: { error: { code, message } } - Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { IntegrationService } from '@/services/integration-service';
import { db } from '@/lib/db';

const exportSchema = z.object({
  productIds: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession();
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // 2. Validate input
    const body = await request.json();
    const validation = exportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: validation.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { productIds } = validation.data;

    // 3. Check if Shopify is configured
    const config = await IntegrationService.getConfig(
      session.user.storeId,
      'shopify'
    );

    if (!config) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_CONFIGURED',
            message: 'Shopify not configured for this store',
          },
        },
        { status: 400 }
      );
    }

    // 4. Fetch products to export
    const products = await db.product.findMany({
      where: {
        storeId: session.user.storeId,
        deletedAt: null,
        ...(productIds && { id: { in: productIds } }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        sku: true,
      },
    });

    if (products.length === 0) {
      return NextResponse.json({
        data: { exported: 0, failed: 0, results: [] },
        message: 'No products to export',
      });
    }

    // 5. Export to Shopify (one by one)
    const results = [];
    let exported = 0;
    let failed = 0;

    for (const product of products) {
      const result = await IntegrationService.exportProductToShopify(
        session.user.storeId,
        product
      );

      if (result.success) {
        exported++;
        results.push({
          productId: product.id,
          productName: product.name,
          success: true,
          externalId: result.externalId,
        });
      } else {
        failed++;
        results.push({
          productId: product.id,
          productName: product.name,
          success: false,
          error: result.error,
        });
      }
    }

    // 6. Update last sync timestamp
    await db.externalPlatformConfig.update({
      where: { id: config.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      data: {
        exported,
        failed,
        results,
      },
      message: `Exported ${exported} products (${failed} failed)`,
    });
  } catch (error) {
    console.error('POST /api/integrations/shopify/export error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to export products';

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: errorMessage,
        },
      },
      { status: 500 }
    );
  }
}
