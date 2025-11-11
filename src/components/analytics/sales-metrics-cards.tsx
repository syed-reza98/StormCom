// src/components/analytics/sales-metrics-cards.tsx
// Sales Metrics Cards - Key performance indicators

import { TrendingUpIcon, TrendingDownIcon, DollarSignIcon, ShoppingCartIcon, UsersIcon, BarChart3Icon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/format';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface SalesMetricsCardsProps {
  storeId: string;
  startDate?: string;
  endDate?: string;
}

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  description?: string;
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function fetchSalesMetrics(storeId: string, startDate?: string, endDate?: string) {
  try {
    const params = new URLSearchParams({ storeId });
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/analytics/sales?${params.toString()}`, {
      cache: 'no-store' // Always fetch fresh data for analytics
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sales metrics');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to fetch sales metrics:', error);
    return {
      totalSales: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      salesGrowth: 0,
      ordersGrowth: 0,
      aovGrowth: 0
    };
  }
}

async function fetchCustomerMetrics(storeId: string, startDate?: string, endDate?: string) {
  try {
    const params = new URLSearchParams({ storeId });
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/analytics/customers?${params.toString()}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch customer metrics');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to fetch customer metrics:', error);
    return {
      totalCustomers: 0,
      newCustomers: 0,
      customerGrowth: 0
    };
  }
}

// ============================================================================
// COMPONENTS
// ============================================================================

function MetricCard({ title, value, change, icon, description }: MetricCardProps) {
  const isPositive = change >= 0;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-2 mt-2">
          <Badge variant={isPositive ? 'default' : 'secondary'} className="text-xs">
            {isPositive ? (
              <TrendingUpIcon className="w-3 h-3 mr-1" />
            ) : (
              <TrendingDownIcon className="w-3 h-3 mr-1" />
            )}
            {formatPercentage(Math.abs(change))}
          </Badge>
          <p className="text-xs text-muted-foreground">
            {description || 'vs previous period'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export async function SalesMetricsCards({
  storeId,
  startDate,
  endDate
}: SalesMetricsCardsProps) {
  // Fetch metrics in parallel
  const [salesMetrics, customerMetrics] = await Promise.all([
    fetchSalesMetrics(storeId, startDate, endDate),
    fetchCustomerMetrics(storeId, startDate, endDate)
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Revenue"
        value={formatCurrency(salesMetrics.totalSales)}
        change={salesMetrics.salesGrowth}
        icon={<DollarSignIcon className="h-4 w-4" />}
        description="vs previous period"
      />
      
      <MetricCard
        title="Total Orders"
        value={formatNumber(salesMetrics.totalOrders)}
        change={salesMetrics.ordersGrowth}
        icon={<ShoppingCartIcon className="h-4 w-4" />}
        description="vs previous period"
      />
      
      <MetricCard
        title="Average Order Value"
        value={formatCurrency(salesMetrics.averageOrderValue)}
        change={salesMetrics.aovGrowth}
        icon={<BarChart3Icon className="h-4 w-4" />}
        description="vs previous period"
      />
      
      <MetricCard
        title="Total Customers"
        value={formatNumber(customerMetrics.totalCustomers)}
        change={customerMetrics.customerGrowth}
        icon={<UsersIcon className="h-4 w-4" />}
        description="vs previous period"
      />
    </div>
  );
}