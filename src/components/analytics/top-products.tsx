// src/components/analytics/top-products.tsx
// Top Products Component - Bar chart and data table for best-selling products

'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DownloadIcon, PackageIcon, TrendingUpIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatNumber } from '@/lib/format';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface TopProductsProps {
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
  averagePrice: number;
  rank: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#6B7280'
];

// ============================================================================
// COMPONENT
// ============================================================================

export function TopProducts({
  storeId,
  startDate,
  endDate
}: TopProductsProps) {
  const [data, setData] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

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
        const products = result.data || [];
        
        // Add rank and calculate average price
        const rankedProducts: ProductData[] = products.map((product: any, index: number) => ({
          ...product,
          rank: index + 1,
          averagePrice: product.totalQuantity > 0 ? product.totalRevenue / product.totalQuantity : 0
        }));

        setData(rankedProducts);
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
  // HANDLERS
  // ============================================================================

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const params = new URLSearchParams({ storeId, format: 'csv' });
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const response = await fetch(`/api/analytics/products?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `top-products-${new Date().toISOString().split('T')[0]}.csv`;
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

  const getChartData = (limit = 10) => {
    return data.slice(0, limit).map((product, index) => ({
      ...product,
      name: product.productName.length > 15 
        ? product.productName.substring(0, 15) + '...' 
        : product.productName,
      fill: CHART_COLORS[index % CHART_COLORS.length]
    }));
  };

  const getPieData = (limit = 8) => {
    const topProducts = data.slice(0, limit);
    const others = data.slice(limit);
    
    const chartData = topProducts.map((product, index) => ({
      name: product.productName.length > 20 ? product.productName.substring(0, 20) + '...' : product.productName,
      value: product.totalRevenue,
      fill: CHART_COLORS[index % CHART_COLORS.length]
    }));

    if (others.length > 0) {
      const othersRevenue = others.reduce((sum, product) => sum + product.totalRevenue, 0);
      chartData.push({
        name: `Others (${others.length} products)`,
        value: othersRevenue,
        fill: '#6B7280'
      });
    }

    return chartData;
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
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Products Analysis</CardTitle>
          <CardDescription>Best performing products by sales and quantity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>Failed to load products data: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Products Analysis</CardTitle>
          <CardDescription>Best performing products by sales and quantity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <PackageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p>No product sales data available for the selected period</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Top Products Analysis</CardTitle>
            <CardDescription>
              Best performing products by sales and quantity ({data.length} products)
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
        <Tabs defaultValue="bar-chart" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bar-chart">Bar Chart</TabsTrigger>
            <TabsTrigger value="pie-chart">Revenue Share</TabsTrigger>
            <TabsTrigger value="data-table">Data Table</TabsTrigger>
          </TabsList>

          {/* Bar Chart Tab */}
          <TabsContent value="bar-chart" className="space-y-4">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={getChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatNumber(value)}
                />
                <Tooltip
                  labelFormatter={(label) => {
                    const product = data.find(p => 
                      (p.productName.length > 15 ? p.productName.substring(0, 15) + '...' : p.productName) === label
                    );
                    return product?.productName || label;
                  }}
                  formatter={(value, name) => {
                    if (name === 'totalQuantity') {
                      return [formatNumber(Number(value)), 'Quantity Sold'];
                    }
                    if (name === 'totalRevenue') {
                      return [formatCurrency(Number(value)), 'Total Revenue'];
                    }
                    return [formatNumber(Number(value)), name];
                  }}
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
                  name="Quantity Sold"
                />
              </BarChart>
            </ResponsiveContainer>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Top Product</p>
                <p className="font-medium text-sm">{data[0]?.productName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(data[0]?.totalQuantity)} sold
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-lg font-semibold">{data.length}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Total Quantity</p>
                <p className="text-lg font-semibold">
                  {formatNumber(data.reduce((sum, p) => sum + p.totalQuantity, 0))}
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(data.reduce((sum, p) => sum + p.totalRevenue, 0))}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Pie Chart Tab */}
          <TabsContent value="pie-chart" className="space-y-4">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={getPieData()}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  labelLine={false}
                >
                  {getPieData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legend */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {getPieData().map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Data Table Tab */}
          <TabsContent value="data-table">
            <div className="rounded-md border max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead className="text-right">Quantity Sold</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slice(0, 50).map((product) => (
                    <TableRow key={product.productId}>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="w-8 h-6 flex items-center justify-center">
                          {product.rank}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          {product.rank <= 3 && (
                            <TrendingUpIcon className="w-4 h-4 text-yellow-500" />
                          )}
                          <span>{product.productName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(product.totalQuantity)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(product.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(product.orderCount)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(product.averagePrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {data.length > 50 && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Showing top 50 products. Export CSV for complete data.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}