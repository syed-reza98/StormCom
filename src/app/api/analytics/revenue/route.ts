import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { analyticsService } from '@/services/analytics-service';
import { z } from 'zod';

const revenueQuerySchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid start date format',
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid end date format',
  }),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
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
    const groupByParam = searchParams.get('groupBy');

    // Default to last 30 days if not provided
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const queryData = {
      startDate: startDateParam || defaultStartDate.toISOString().split('T')[0],
      endDate: endDateParam || defaultEndDate.toISOString().split('T')[0],
      groupBy: groupByParam || 'day',
    };

    const validatedQuery = revenueQuerySchema.parse(queryData);

    const dateRange = {
      startDate: new Date(validatedQuery.startDate),
      endDate: new Date(validatedQuery.endDate),
    };

    // Add time to end date to include full day
    dateRange.endDate.setHours(23, 59, 59, 999);

    const revenueData = await analyticsService.getRevenueByPeriod(
      session.user.storeId,
      dateRange,
      validatedQuery.groupBy
    );

    // Calculate totals for summary
    const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = revenueData.reduce((sum, item) => sum + item.orderCount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return NextResponse.json({
      data: revenueData,
      meta: {
        dateRange: {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        },
        groupBy: validatedQuery.groupBy,
        summary: {
          totalRevenue,
          totalOrders,
          averageOrderValue: Math.round(averageOrderValue * 100) / 100,
          dataPoints: revenueData.length,
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

    console.error('Error fetching revenue analytics:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch revenue analytics' } },
      { status: 500 }
    );
  }
}