import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session-storage';
import { analyticsService } from '@/services/analytics-service';
import { z } from 'zod';

const salesQuerySchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid start date format',
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid end date format',
  }),
});

export async function GET(request: NextRequest) {
  try {
    // Get session ID from cookie
    const sessionId = request.cookies.get('session-id')?.value;
    if (!sessionId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid session' } },
        { status: 401 }
      );
    }

    if (!session.storeId) {
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

    const validatedQuery = salesQuerySchema.parse(queryData);

    const dateRange = {
      startDate: new Date(validatedQuery.startDate),
      endDate: new Date(validatedQuery.endDate),
    };

    // Add time to end date to include full day
    dateRange.endDate.setHours(23, 59, 59, 999);

    const salesMetrics = await analyticsService.getSalesMetrics(
      session.storeId,
      dateRange
    );

    return NextResponse.json({
      data: salesMetrics,
      meta: {
        dateRange: {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
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

    console.error('Error fetching sales analytics:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch sales analytics' } },
      { status: 500 }
    );
  }
}