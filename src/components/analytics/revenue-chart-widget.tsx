// src/components/analytics/revenue-chart-widget.tsx
// Revenue Chart Widget for analytics dashboard
// Pattern: Recharts + shadcn Card

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUpIcon, TrendingDownIcon, DollarSignIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
  previousRevenue?: number;
}

interface RevenueChartWidgetProps {
  data: RevenueData[];
  title?: string;
  description?: string;
  chartType?: 'line' | 'area';
  showComparison?: boolean;
  isLoading?: boolean;
}

export function RevenueChartWidget({
  data,
  title = 'Revenue Overview',
  description = 'Total revenue and orders over time',
  chartType = 'area',
  showComparison = false,
  isLoading = false,
}: RevenueChartWidgetProps) {
  // Calculate total revenue and growth
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const previousTotal = showComparison
    ? data.reduce((sum, item) => sum + (item.previousRevenue || 0), 0)
    : 0;
  
  const growth = showComparison && previousTotal > 0
    ? ((totalRevenue - previousTotal) / previousTotal) * 100
    : 0;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value / 100);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium mb-2">{formatDate(label)}</p>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Revenue: <span className="font-medium text-foreground">{formatCurrency(payload[0].value)}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Orders: <span className="font-medium text-foreground">{payload[0].payload.orders}</span>
            </p>
            {showComparison && payload[0].payload.previousRevenue && (
              <p className="text-sm text-muted-foreground">
                Previous: <span className="font-medium text-foreground">{formatCurrency(payload[0].payload.previousRevenue)}</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">Loading chart data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <DollarSignIcon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="flex items-center gap-4 mt-4">
          <div>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <div className="text-xs text-muted-foreground">Total Revenue</div>
          </div>
          
          {showComparison && growth !== 0 && (
            <Badge variant={growth > 0 ? 'default' : 'destructive'} className="flex items-center gap-1">
              {growth > 0 ? (
                <TrendingUpIcon className="h-3 w-3" />
              ) : (
                <TrendingDownIcon className="h-3 w-3" />
              )}
              {Math.abs(growth).toFixed(1)}%
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'area' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                {showComparison && (
                  <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                  </linearGradient>
                )}
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value)}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              {showComparison && <Legend />}
              
              {showComparison && (
                <Area
                  type="monotone"
                  dataKey="previousRevenue"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  fill="url(#colorPrevious)"
                  name="Previous Period"
                />
              )}
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorRevenue)"
                name="Current Period"
              />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value)}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              {showComparison && <Legend />}
              
              {showComparison && (
                <Line
                  type="monotone"
                  dataKey="previousRevenue"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  dot={false}
                  name="Previous Period"
                />
              )}
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
                name="Current Period"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
