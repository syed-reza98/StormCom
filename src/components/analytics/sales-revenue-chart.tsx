// src/components/analytics/sales-revenue-chart.tsx
// Sales and Revenue Chart - Line chart showing trends over time

'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/format';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface SalesRevenueChartProps {
  storeId: string;
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month';
}

interface ChartDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SalesRevenueChart({
  storeId,
  startDate,
  endDate,
  period = 'month'
}: SalesRevenueChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRevenueData() {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({ storeId, period });
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);

        const response = await fetch(`/api/analytics/revenue?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch revenue data');
        }

        const result = await response.json();
        setData(result.data || []);
      } catch (err) {
        console.error('Failed to fetch revenue data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchRevenueData();
  }, [storeId, startDate, endDate, period]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales & Revenue Trends</CardTitle>
          <CardDescription>Revenue and order trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Failed to load chart data: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales & Revenue Trends</CardTitle>
          <CardDescription>Revenue and order trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No data available for the selected period</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales & Revenue Trends</CardTitle>
        <CardDescription>
          Revenue and order trends over time (grouped by {period})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                switch (period) {
                  case 'day':
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  case 'week':
                    return `Week ${Math.ceil(date.getDate() / 7)}`;
                  case 'month':
                    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                  default:
                    return value;
                }
              }}
            />
            <YAxis 
              yAxisId="revenue"
              orientation="left"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(value).replace(/\.00$/, '')}
            />
            <YAxis 
              yAxisId="orders"
              orientation="right"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
              }}
              formatter={(value, name) => [
                name === 'revenue' ? formatCurrency(Number(value)) : Number(value),
                name === 'revenue' ? 'Revenue' : 'Orders'
              ]}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Line
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
              name="Revenue"
            />
            <Line
              yAxisId="orders"
              type="monotone"
              dataKey="orders"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 4 }}
              name="Orders"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}