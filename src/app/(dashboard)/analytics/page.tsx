// src/app/(dashboard)/analytics/page.tsx
// Analytics Dashboard - Comprehensive analytics with live data, charts, and insights

import { Metadata } from 'next';
import { Suspense } from 'react';
// import { getSessionFromCookies } from '@/lib/session-storage';

// export const dynamic = 'force-dynamic';
// import { redirect } from 'next/navigation';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { AnalyticsDatePicker } from '@/components/analytics/analytics-date-picker';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getCurrentUser } from '@/lib/get-current-user';

// ============================================================================
// ROUTE CONFIG
// ============================================================================

// Mark as dynamic since this route uses cookies() for authentication
export const dynamic = 'force-dynamic';

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'Analytics Dashboard | StormCom',
  description: 'View comprehensive store analytics and performance metrics',
};

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AnalyticsPageProps {
  searchParams: {
    startDate?: string;
    endDate?: string;
    period?: 'day' | 'week' | 'month';
  };
}

// ============================================================================
// LOADING COMPONENTS
// ============================================================================

function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Date Picker Skeleton */}
      <Skeleton className="h-10 w-80" />

      {/* Metrics Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </div>
              <Skeleton className="h-8 w-20" />
              <div className="flex items-center space-x-2 mt-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default async function AnalyticsPage({ 
  searchParams 
}: { 
  searchParams: Promise<AnalyticsPageProps['searchParams']> 
}) {
  // Get current user and verify authentication
  const user = await getCurrentUser();
  // const storeId = user?.storeId || process.env.DEFAULT_STORE_ID;
  // if (!user?.storeId) {
  //   redirect('/login');
  // }

  const params = await searchParams;
  const { startDate, endDate, period = 'month' } = params;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Track your store performance and key metrics with real-time insights
        </p>
      </div>

      {/* Date Range Picker */}
      <AnalyticsDatePicker
        startDate={startDate}
        endDate={endDate}
        period={period}
      />

      {/* Analytics Dashboard with Loading State */}
      <Suspense fallback={<AnalyticsLoadingSkeleton />}>
        <AnalyticsDashboard
          storeId={user?.storeId || process.env.DEFAULT_STORE_ID}
        />
      </Suspense>
    </div>
  );
}
