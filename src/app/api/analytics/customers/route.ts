import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { analyticsService } from '@/services/analytics-service';
import { z } from 'zod';

const customerQuerySchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid start date format',
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid end date format',
  }),
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

    // Default to last 30 days if not provided
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const queryData = {
      startDate: startDateParam || defaultStartDate.toISOString().split('T')[0],
      endDate: endDateParam || defaultEndDate.toISOString().split('T')[0],
    };

    const validatedQuery = customerQuerySchema.parse(queryData);

    const dateRange = {
      startDate: new Date(validatedQuery.startDate),
      endDate: new Date(validatedQuery.endDate),
    };

    // Add time to end date to include full day
    dateRange.endDate.setHours(23, 59, 59, 999);

    const customerMetrics = await analyticsService.getCustomerMetrics(
      session.user.storeId,
      dateRange
    );

    // Calculate additional insights
    const customerGrowthRate = customerMetrics.totalCustomers > 0 
      ? (customerMetrics.newCustomers / customerMetrics.totalCustomers) * 100 
      : 0;

    const returningCustomerRate = customerMetrics.totalCustomers > 0
      ? (customerMetrics.returningCustomers / customerMetrics.totalCustomers) * 100
      : 0;

    return NextResponse.json({
      data: {
        ...customerMetrics,
        insights: {
          customerGrowthRate: Math.round(customerGrowthRate * 100) / 100,
          returningCustomerRate: Math.round(returningCustomerRate * 100) / 100,
          newCustomerPercentage: Math.round((customerMetrics.newCustomers / (customerMetrics.newCustomers + customerMetrics.returningCustomers || 1)) * 10000) / 100,
        },
      },
      meta: {
        dateRange: {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        },
        description: {
          totalCustomers: 'Total customers registered in the store',
          newCustomers: 'Customers acquired during the selected period',
          returningCustomers: 'Customers who made orders in this period and had previous orders',
          customerRetentionRate: 'Percentage of customers from previous period who returned',
          customerGrowthRate: 'Percentage of new customers relative to total customer base',
          returningCustomerRate: 'Percentage of returning customers relative to total customer base',
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

    console.error('Error fetching customer analytics:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch customer analytics' } },
      { status: 500 }
    );
  }
}