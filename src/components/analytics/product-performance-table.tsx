// src/components/analytics/product-performance-table.tsx
// Product Performance Table for analytics dashboard
// Pattern: shadcn Table + Card with sorting and metrics

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
} from 'lucide-react';

interface ProductPerformance {
  id: string;
  name: string;
  sku: string;
  category?: string;
  sales: number;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  conversionRate: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

interface ProductPerformanceTableProps {
  data: ProductPerformance[];
  title?: string;
  description?: string;
  isLoading?: boolean;
}

type SortField = 'name' | 'sales' | 'revenue' | 'orders' | 'conversionRate';
type SortDirection = 'asc' | 'desc';

export function ProductPerformanceTable({
  data,
  title = 'Top Products',
  description = 'Best performing products by revenue',
  isLoading = false,
}: ProductPerformanceTableProps) {
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value / 100);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'name':
        return multiplier * a.name.localeCompare(b.name);
      case 'sales':
        return multiplier * (a.sales - b.sales);
      case 'revenue':
        return multiplier * (a.revenue - b.revenue);
      case 'orders':
        return multiplier * (a.orders - b.orders);
      case 'conversionRate':
        return multiplier * (a.conversionRate - b.conversionRate);
      default:
        return 0;
    }
  });

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sort icon component
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ArrowUpIcon className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDownIcon className="h-3 w-3 ml-1" />
    );
  };

  // Trend icon component
  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDownIcon className="h-4 w-4 text-red-500" />;
      case 'stable':
        return <MinusIcon className="h-4 w-4 text-muted-foreground" />;
    }
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
            <div className="text-muted-foreground">Loading performance data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('name')}
                    className="h-8 px-2 hover:bg-transparent"
                  >
                    Product
                    <SortIcon field="name" />
                  </Button>
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('sales')}
                    className="h-8 px-2 hover:bg-transparent"
                  >
                    Sales
                    <SortIcon field="sales" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('revenue')}
                    className="h-8 px-2 hover:bg-transparent"
                  >
                    Revenue
                    <SortIcon field="revenue" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('orders')}
                    className="h-8 px-2 hover:bg-transparent"
                  >
                    Orders
                    <SortIcon field="orders" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('conversionRate')}
                    className="h-8 px-2 hover:bg-transparent"
                  >
                    Conv. Rate
                    <SortIcon field="conversionRate" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No performance data available
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((product, index) => (
                  <TableRow key={product.id}>
                    {/* Rank */}
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>

                    {/* Product Name */}
                    <TableCell>
                      <div>
                        <Link
                          href={`/products/${product.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {product.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">{product.sku}</div>
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      {product.category ? (
                        <Badge variant="secondary">{product.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Sales */}
                    <TableCell className="text-right font-medium">
                      {product.sales}
                    </TableCell>

                    {/* Revenue */}
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.revenue)}
                    </TableCell>

                    {/* Orders */}
                    <TableCell className="text-center">
                      <Badge variant="outline">{product.orders}</Badge>
                    </TableCell>

                    {/* Conversion Rate */}
                    <TableCell className="text-center">
                      {formatPercentage(product.conversionRate)}
                    </TableCell>

                    {/* Trend */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendIcon trend={product.trend} />
                        <span className={`text-xs ${
                          product.trend === 'up' ? 'text-green-500' :
                          product.trend === 'down' ? 'text-red-500' :
                          'text-muted-foreground'
                        }`}>
                          {product.trendPercentage > 0 ? '+' : ''}
                          {formatPercentage(product.trendPercentage)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
