import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { analyticsService } from '@/services/analytics-service';
import { z } from 'zod';

const productsQuerySchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid start date format',
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid end date format',
  }),
  limit: z.string().refine((val) => !isNaN(parseInt(val)), {
    message: 'Invalid limit value',
  }).optional().default('10'),
});

export async function GET(request: NextRequest) {
  try {
    // Authenticate user with NextAuth
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    if (!session.user.storeId) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'No store access' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const limitParam = searchParams.get('limit');

    // Default to last 30 days if not provided
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const queryData = {
      startDate: startDateParam || defaultStartDate.toISOString().split('T')[0],
      endDate: endDateParam || defaultEndDate.toISOString().split('T')[0],
      limit: limitParam || '10',
    };

    const validatedQuery = productsQuerySchema.parse(queryData);

    const dateRange = {
      startDate: new Date(validatedQuery.startDate),
      endDate: new Date(validatedQuery.endDate),
    };

    // Add time to end date to include full day
    dateRange.endDate.setHours(23, 59, 59, 999);

    const limit = Math.min(parseInt(validatedQuery.limit), 50); // Cap at 50 products max

    const topProducts = await analyticsService.getTopSellingProducts(
      session.user.storeId,
      dateRange,
      limit
    );

    // Calculate totals for summary
    const totalQuantitySold = topProducts.reduce((sum, product) => sum + product.totalQuantity, 0);
    const totalRevenue = topProducts.reduce((sum, product) => sum + product.totalRevenue, 0);
    const totalOrders = topProducts.reduce((sum, product) => sum + product.orderCount, 0);

    return NextResponse.json({
      data: topProducts,
      meta: {
        dateRange: {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        },
        limit,
        summary: {
          totalProducts: topProducts.length,
          totalQuantitySold,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalOrders,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Error fetching top products analytics:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch top products analytics' } },
      { status: 500 }
    );
  }
}