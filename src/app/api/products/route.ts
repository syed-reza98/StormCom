// src/app/api/products/route.ts
// Products API Routes - List and Create

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { productService } from '@/services/product-service';
import { createProductSchema } from '@/services/product-service';
import { z } from 'zod';
import { SessionService } from '@/services/session-service';

// GET /api/products - List products with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    // Try NextAuth session first
    const session = await getServerSession(authOptions);

    // Determine storeId from NextAuth session or fallback to custom session service
    let storeId: string | undefined = session?.user?.storeId;

    if (!storeId) {
      // Support both 'session_token' (SessionService) and legacy 'sessionId' cookie
      const sessionToken = request.cookies.get('session_token')?.value || request.cookies.get('sessionId')?.value;
      if (sessionToken) {
        const userFromSession = await SessionService.getUserFromSession(sessionToken);
        if (userFromSession) {
          storeId = userFromSession.storeId || undefined;
        }
      }
    }

    if (!storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(searchParams.get('perPage') || '10'), 100);
    
    // Parse filter parameters
    const filters = {
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      brandId: searchParams.get('brandId') || undefined,
      isPublished: searchParams.get('isPublished') === 'true' ? true 
                  : searchParams.get('isPublished') === 'false' ? false 
                  : undefined,
      isFeatured: searchParams.get('isFeatured') === 'true' ? true 
                 : searchParams.get('isFeatured') === 'false' ? false 
                 : undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      inventoryStatus: searchParams.get('inventoryStatus') as any || undefined,
    };
    // Note: sortBy and sortOrder are removed - not supported in current ProductSearchFilters type

    const result = await productService.getProducts(
      storeId as string,
      filters,
      page,
      perPage
    );

    // Log for debugging: ensure images were normalized to arrays
    try {
      if (result.products && result.products.length > 0) {
        // eslint-disable-next-line no-console
        console.log('Products API - sample images type:', typeof (result.products[0] as any).images);
        // eslint-disable-next-line no-console
        console.log('Products API - sample images value:', (result.products[0] as any).images);
      }
    } catch (e) {
      // ignore
    }

    // Ensure response shapes are normalized at the API edge as a safeguard
    const normalizedProducts = result.products.map((p: any) => {
      const prod = { ...p };
      try {
        if (typeof prod.images === 'string') {
          const parsed = JSON.parse(prod.images);
          prod.images = Array.isArray(parsed) ? parsed : (prod.images ? [prod.images] : []);
        } else if (!Array.isArray(prod.images)) {
          prod.images = [];
        }
      } catch (e) {
        prod.images = prod.images ? [String(prod.images)] : [];
      }

      try {
        if (typeof prod.metaKeywords === 'string') {
          const parsed = JSON.parse(prod.metaKeywords);
          prod.metaKeywords = Array.isArray(parsed) ? parsed : (prod.metaKeywords ? [prod.metaKeywords] : []);
        } else if (!Array.isArray(prod.metaKeywords)) {
          prod.metaKeywords = [];
        }
      } catch (e) {
        prod.metaKeywords = prod.metaKeywords ? [String(prod.metaKeywords)] : [];
      }

      if ((!prod.thumbnailUrl || prod.thumbnailUrl === '') && Array.isArray(prod.images) && prod.images.length > 0) {
        prod.thumbnailUrl = prod.images[0];
      }

      return prod;
    });

    return NextResponse.json({
      data: normalizedProducts,
      meta: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch products' } },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = createProductSchema.parse(body);

    const product = await productService.createProduct(session.user.storeId, validatedData);

    return NextResponse.json(
      { data: product, message: 'Product created successfully' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
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

    if (error instanceof Error) {
      // Handle business logic errors
      if (error.message.includes('already exists') || 
          error.message.includes('not found')) {
        return NextResponse.json(
          { error: { code: 'BUSINESS_ERROR', message: error.message } },
          { status: 400 }
        );
      }
    }

    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create product' } },
      { status: 500 }
    );
  }
}