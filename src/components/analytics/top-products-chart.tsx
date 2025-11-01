// src/components/analytics/top-products-chart.tsx
// Top Products Chart - Bar chart showing best-selling products

'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/lib/format';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface TopProductsChartProps {
  storeId: string;
  startDate?: string;
  endDate?: string;
}

interface ProductData {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TopProductsChart({
  storeId,
  startDate,
  endDate
}: TopProductsChartProps) {
  const [data, setData] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProductsData() {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({ storeId });
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);

        const response = await fetch(`/api/analytics/products?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch products data');
        }

        const result = await response.json();
        setData(result.data || []);
      } catch (err) {
        console.error('Failed to fetch products data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProductsData();
  }, [storeId, startDate, endDate]);

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
          <CardTitle>Top Selling Products</CardTitle>
          <CardDescription>Best performing products by quantity sold</CardDescription>
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
          <CardTitle>Top Selling Products</CardTitle>
          <CardDescription>Best performing products by quantity sold</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No product sales data available for the selected period</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data - limit to top 10 products
  const chartData = data.slice(0, 10).map((product, index) => ({
    ...product,
    rank: index + 1,
    name: product.productName.length > 20 
      ? product.productName.substring(0, 20) + '...' 
      : product.productName
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Selling Products</CardTitle>
        <CardDescription>
          Best performing products by quantity sold (Top 10)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatNumber(value)}
              />
              <Tooltip
                labelFormatter={(label) => {
                  const product = data.find(p => 
                    (p.productName.length > 20 ? p.productName.substring(0, 20) + '...' : p.productName) === label
                  );
                  return product?.productName || label;
                }}
                formatter={(value) => [
                  formatNumber(Number(value)),
                  'Quantity Sold'
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Bar 
                dataKey="totalQuantity" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Product Details Table */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Product Performance Details</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.slice(0, 10).map((product, index) => (
                <div key={product.productId} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="w-8 h-6 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{product.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(product.orderCount)} orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatNumber(product.totalQuantity)} sold</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(product.totalRevenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}