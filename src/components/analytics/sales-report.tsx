// src/components/analytics/sales-report.tsx
// Sales Report Component - Detailed sales report with line chart and export functionality

'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DownloadIcon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/format';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface SalesReportProps {
  storeId: string;
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month';
}

interface SalesDataPoint {
  date: string;
  sales: number;
  orders: number;
  averageOrderValue: number;
}

interface SalesSummary {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  salesGrowth: number;
  ordersGrowth: number;
  aovGrowth: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SalesReport({
  storeId,
  startDate,
  endDate,
  period = 'month'
}: SalesReportProps) {
  const [data, setData] = useState<SalesDataPoint[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'sales' | 'orders' | 'aov'>('sales');
  const [isExporting, setIsExporting] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function fetchSalesData() {
      try {
        if (!isMounted) return;
        setIsLoading(true);
        setError(null);

        // Fetch both detailed data and summary
        const params = new URLSearchParams({ storeId, period });
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);

        const [revenueResponse, salesResponse] = await Promise.all([
          fetch(`/api/analytics/revenue?${params.toString()}`, { signal: controller.signal }),
          fetch(`/api/analytics/sales?${params.toString()}`, { signal: controller.signal })
        ]);

        if (!revenueResponse.ok || !salesResponse.ok) {
          throw new Error('Failed to fetch sales data');
        }

        const [revenueResult, salesResult] = await Promise.all([
          revenueResponse.json(),
          salesResponse.json()
        ]);

        if (!isMounted) return;

        // Transform revenue data to include AOV calculation
        const transformedData: SalesDataPoint[] = (revenueResult.data || []).map((item: any) => ({
          date: item.date,
          sales: item.revenue || 0,
          orders: item.orders || 0,
          averageOrderValue: item.orders > 0 ? (item.revenue || 0) / item.orders : 0
        }));

        if (!isMounted) return;
        setData(transformedData);
        setSummary(salesResult.data || {
          totalSales: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          salesGrowth: 0,
          ordersGrowth: 0,
          aovGrowth: 0
        });
      } catch (err: any) {
        if (err.name === 'AbortError' || !isMounted) return;
        console.error('Failed to fetch sales data:', err);
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchSalesData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [storeId, startDate, endDate, period]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const params = new URLSearchParams({ storeId, format: 'csv' });
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await fetch(`/api/analytics/sales?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  // Remove unused function - getMetricValue
  // const getMetricValue = (dataPoint: SalesDataPoint) => {
  //   switch (selectedMetric) {
  //     case 'sales':
  //       return dataPoint.sales;
  //     case 'orders':
  //       return dataPoint.orders;
  //     case 'aov':
  //       return dataPoint.averageOrderValue;
  //     default:
  //       return dataPoint.sales;
  //   }
  // };

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case 'sales':
        return 'Sales ($)';
      case 'orders':
        return 'Orders';
      case 'aov':
        return 'Avg Order Value ($)';
      default:
        return 'Sales ($)';
    }
  };

  const formatMetricValue = (value: number) => {
    switch (selectedMetric) {
      case 'sales':
      case 'aov':
        return formatCurrency(value);
      case 'orders':
        return formatNumber(value);
      default:
        return formatCurrency(value);
    }
  };

  const getGrowthValue = () => {
    if (!summary) return 0;
    switch (selectedMetric) {
      case 'sales':
        return summary.salesGrowth;
      case 'orders':
        return summary.ordersGrowth;
      case 'aov':
        return summary.aovGrowth;
      default:
        return summary.salesGrowth;
    }
  };

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
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales Report</CardTitle>
          <CardDescription>Detailed sales performance analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Failed to load sales report: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales Report</CardTitle>
          <CardDescription>Detailed sales performance analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No sales data available for the selected period</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const growth = getGrowthValue();
  const isPositiveGrowth = growth >= 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sales Report</CardTitle>
            <CardDescription>
              Detailed sales performance analysis (grouped by {period})
            </CardDescription>
          </div>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            size="sm"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Metric Selector */}
          <div className="flex items-center space-x-4">
            <label htmlFor="metric-select" className="text-sm font-medium">
              Display metric:
            </label>
            <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
              <SelectTrigger id="metric-select" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Sales Revenue</SelectItem>
                <SelectItem value="orders">Order Count</SelectItem>
                <SelectItem value="aov">Average Order Value</SelectItem>
              </SelectContent>
            </Select>
            
            {summary && (
              <Badge variant={isPositiveGrowth ? 'default' : 'secondary'} className="ml-4">
                {isPositiveGrowth ? (
                  <TrendingUpIcon className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDownIcon className="w-3 h-3 mr-1" />
                )}
                {formatPercentage(Math.abs(growth))} vs previous period
              </Badge>
            )}
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={400}>
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
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (selectedMetric === 'orders') {
                    return formatNumber(value);
                  }
                  return formatCurrency(value).replace(/\.00$/, '');
                }}
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
                formatter={(value) => [formatMetricValue(Number(value)), getMetricLabel()]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 5 }}
                name={getMetricLabel()}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Summary Statistics */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-xl font-bold">{formatCurrency(summary.totalSales)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPercentage(Math.abs(summary.salesGrowth))} 
                  {summary.salesGrowth >= 0 ? ' increase' : ' decrease'}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-xl font-bold">{formatNumber(summary.totalOrders)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPercentage(Math.abs(summary.ordersGrowth))} 
                  {summary.ordersGrowth >= 0 ? ' increase' : ' decrease'}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-xl font-bold">{formatCurrency(summary.averageOrderValue)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatPercentage(Math.abs(summary.aovGrowth))} 
                  {summary.aovGrowth >= 0 ? ' increase' : ' decrease'}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}