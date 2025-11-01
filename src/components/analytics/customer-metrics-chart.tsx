// src/components/analytics/customer-metrics-chart.tsx
// Customer Metrics Chart - Area chart showing customer acquisition and retention

'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/format';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface CustomerMetricsChartProps {
  storeId: string;
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month';
}

interface CustomerDataPoint {
  date: string;
  newCustomers: number;
  returningCustomers: number;
  totalCustomers: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CustomerMetricsChart({
  storeId,
  startDate,
  endDate,
  period = 'month'
}: CustomerMetricsChartProps) {
  const [data, setData] = useState<CustomerDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCustomerData() {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({ storeId, period });
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);

        const response = await fetch(`/api/analytics/customers?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch customer data');
        }

        const result = await response.json();
        
        // Transform the data to include calculated metrics
        const customers = result.data || [];
        const transformedData: CustomerDataPoint[] = customers.map((item: any) => ({
          date: item.date,
          newCustomers: item.newCustomers || 0,
          returningCustomers: item.returningCustomers || 0,
          totalCustomers: (item.newCustomers || 0) + (item.returningCustomers || 0)
        }));

        setData(transformedData);
      } catch (err) {
        console.error('Failed to fetch customer data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCustomerData();
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
          <CardTitle>Customer Acquisition & Retention</CardTitle>
          <CardDescription>New vs returning customers over time</CardDescription>
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
          <CardTitle>Customer Acquisition & Retention</CardTitle>
          <CardDescription>New vs returning customers over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No customer data available for the selected period</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Acquisition & Retention</CardTitle>
        <CardDescription>
          New vs returning customers over time (grouped by {period})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatNumber(value)}
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
                formatNumber(Number(value)),
                name === 'newCustomers' ? 'New Customers' : 
                name === 'returningCustomers' ? 'Returning Customers' : 
                'Total Customers'
              ]}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="newCustomers"
              stackId="1"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              name="New Customers"
              fillOpacity={0.8}
            />
            <Area
              type="monotone"
              dataKey="returningCustomers"
              stackId="1"
              stroke="hsl(var(--chart-2))"
              fill="hsl(var(--chart-2))"
              name="Returning Customers"
              fillOpacity={0.8}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Summary Statistics */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">Total New Customers</p>
            <p className="text-lg font-semibold">
              {formatNumber(data.reduce((sum, item) => sum + item.newCustomers, 0))}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">Total Returning Customers</p>
            <p className="text-lg font-semibold">
              {formatNumber(data.reduce((sum, item) => sum + item.returningCustomers, 0))}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">Customer Retention Rate</p>
            <p className="text-lg font-semibold">
              {(() => {
                const totalNew = data.reduce((sum, item) => sum + item.newCustomers, 0);
                const totalReturning = data.reduce((sum, item) => sum + item.returningCustomers, 0);
                const total = totalNew + totalReturning;
                if (total === 0) return '0%';
                return `${((totalReturning / total) * 100).toFixed(1)}%`;
              })()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}