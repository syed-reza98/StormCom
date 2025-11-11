// src/app/(dashboard)/inventory/page.tsx
// Inventory Management Dashboard Page - US6
// Server Component with async searchParams

import { Suspense } from 'react';
import { Flex, Heading, Text, Container, Section } from '@radix-ui/themes';
import { CubeIcon, ExclamationTriangleIcon, PlusIcon, ReloadIcon } from '@radix-ui/react-icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// ============================================================================
// MOCK DATA & CACHING
// ============================================================================

// Mock inventory data (in production, this would come from database)
const mockInventoryData = [
  {
    id: '1',
    sku: 'PROD-001',
    name: 'Test Product 1',
    categoryName: 'Electronics',
    inventoryQty: 50,
    lowStockThreshold: 10,
    inventoryStatus: 'IN_STOCK',
  },
  {
    id: '2',
    sku: 'PROD-002',
    name: 'Test Product 2',
    categoryName: 'Clothing',
    inventoryQty: 3,
    lowStockThreshold: 5,
    inventoryStatus: 'LOW_STOCK',
  },
  {
    id: '3',
    sku: 'PROD-003',
    name: 'Test Product 3',
    categoryName: 'Books',
    inventoryQty: 0,
    lowStockThreshold: 5,
    inventoryStatus: 'OUT_OF_STOCK',
  },
];

// Pre-calculate low stock count (calculate once at module load)
const lowStockCountCache = mockInventoryData.filter(
  (item) => item.inventoryStatus === 'LOW_STOCK' || item.inventoryStatus === 'OUT_OF_STOCK'
).length;

// Pre-calculate total inventory stats
const inventoryStatsCache = {
  total: mockInventoryData.length,
  lowStockCount: lowStockCountCache,
  totalInStock: mockInventoryData.reduce((sum, item) => sum + item.inventoryQty, 0),
  totalValue: mockInventoryData.reduce((sum, item) => sum + (item.inventoryQty * 100), 0), // Mock value
};

/**
 * Inventory Status Badge Component
 */
function InventoryStatusBadge({ status }: { status: string }) {
  const variants = {
    IN_STOCK: 'default',
    LOW_STOCK: 'warning',
    OUT_OF_STOCK: 'destructive',
    DISCONTINUED: 'secondary',
  } as const;

  const labels = {
    IN_STOCK: 'In Stock',
    LOW_STOCK: 'Low Stock',
    OUT_OF_STOCK: 'Out of Stock',
    DISCONTINUED: 'Discontinued',
  } as const;

  return (
    <Badge 
      data-testid="inventory-status"
      variant={variants[status as keyof typeof variants] || 'default'}
    >
      {labels[status as keyof typeof labels] || status}
    </Badge>
  );
}

/**
 * Inventory Table Component
 */
function InventoryTable({ items }: { items: any[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <CubeIcon width="48" height="48" color="gray" className="mb-4" />
        <p className="text-muted-foreground">No inventory items found.</p>
        <Link href="/products/create">
          <Button className="mt-4">Add Your First Product</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-auto">
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50">
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              SKU
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Product Name
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Category
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
              Current Stock
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
              Low Stock Threshold
            </th>
            <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">
              Status
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
            >
              <td className="p-4 align-middle">
                <code className="rounded bg-muted px-2 py-1 text-sm">{item.sku}</code>
              </td>
              <td className="p-4 align-middle font-medium">
                <Link
                  href={`/products/${item.id}`}
                  className="hover:underline"
                >
                  {item.name}
                </Link>
              </td>
              <td className="p-4 align-middle text-muted-foreground">
                {item.categoryName || '—'}
              </td>
              <td className="p-4 align-middle text-right font-mono">
                {item.inventoryQty}
              </td>
              <td className="p-4 align-middle text-right font-mono text-muted-foreground">
                {item.lowStockThreshold}
              </td>
              <td className="p-4 align-middle text-center">
                <InventoryStatusBadge status={item.inventoryStatus} />
              </td>
              <td className="p-4 align-middle text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    title="Adjust Stock"
                  >
                    <ReloadIcon className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Low Stock Alert Card Component
 */
function LowStockAlert({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <Card 
      data-testid="low-stock-alert"
      className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ExclamationTriangleIcon width="20" height="20" color="orange" />
          <CardTitle className="text-orange-900 dark:text-orange-100">
            Low Stock Alert
          </CardTitle>
        </div>
        <CardDescription className="text-orange-700 dark:text-orange-300">
          {count} {count === 1 ? 'product is' : 'products are'} running low on stock or out of stock.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

/**
 * Inventory Page - Main Component (Server Component)
 */
export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    perPage?: string;
    search?: string;
    categoryId?: string;
    lowStockOnly?: string;
  }>;
}) {
  const params = await searchParams;

  const page = parseInt(params.page || '1', 10);
  const search = params.search || '';
  // Treat 'all' as no category filter (empty string internally)
  const categoryId = params.categoryId === 'all' ? '' : params.categoryId || '';
  const lowStockOnly = params.lowStockOnly === 'true';

  // Apply filters to cached mock data
  let filteredData = [...mockInventoryData];

  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase();
    filteredData = filteredData.filter(
      (item) =>
        item.name.toLowerCase().includes(searchLower) ||
        item.sku.toLowerCase().includes(searchLower)
    );
  }

  // Filter by category
  if (categoryId) {
    filteredData = filteredData.filter(
      (item) => item.categoryName?.toLowerCase() === categoryId.toLowerCase()
    );
  }

  // Filter by low stock
  if (lowStockOnly) {
    filteredData = filteredData.filter(
      (item) => item.inventoryStatus === 'LOW_STOCK' || item.inventoryStatus === 'OUT_OF_STOCK'
    );
  }

  // Pagination
  const total = filteredData.length;
  const totalPages = Math.ceil(total / 20);
  const paginatedData = filteredData.slice((page - 1) * 20, page * 20);

  const mockData = {
    data: paginatedData,
    meta: {
      page,
      perPage: 20,
      total,
      totalPages,
    },
  };

  // Use pre-calculated low stock count from cache
  const lowStockCount = inventoryStatsCache.lowStockCount;

  return (
    <Section size="2">
      <Container size="4">
        <Flex direction="column" gap="6">
          {/* Page Header */}
          <Flex align="center" justify="between">
            <Flex direction="column" gap="2">
              <Flex align="center" gap="3">
                <CubeIcon width="32" height="32" color="teal" />
                <Heading size="8">Inventory</Heading>
              </Flex>
              <Text size="3" color="gray">
                Track stock levels and manage inventory for all products
              </Text>
            </Flex>
            <Button asChild>
              <Link href="/products/create">
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </Flex>

          {/* Low Stock Alert */}
          <LowStockAlert count={lowStockCount} />

          {/* Filters */}
          <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter inventory by search, category, or stock status.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label htmlFor="search" className="text-sm font-medium mb-2 block">
                Search
              </label>
              <Input
                id="search"
                name="search"
                placeholder="Search by product name or SKU..."
                defaultValue={search}
              />
            </div>
            <div className="w-full md:w-48">
              <label htmlFor="categoryId" className="text-sm font-medium mb-2 block">
                Category
              </label>
              <Select name="categoryId" defaultValue={categoryId || 'all'}>
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="books">Books</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <label htmlFor="lowStockOnly" className="text-sm font-medium mb-2 block">
                Stock Status
              </label>
              <Select 
                name="lowStockOnly" 
                defaultValue={lowStockOnly ? 'true' : 'false'}
              >
                <SelectTrigger id="lowStockOnly" data-testid="low-stock-filter">
                  <SelectValue placeholder="All Items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">All Items</SelectItem>
                  <SelectItem value="true">Low Stock Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Apply Filters</Button>
          </form>
        </CardContent>
      </Card>

          {/* Inventory Table */}
          <Card>
        <CardHeader>
          <CardTitle>
            Inventory Items ({mockData.meta.total})
          </CardTitle>
          <CardDescription>
            Showing {mockData.data.length} of {mockData.meta.total} products.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading inventory...</div>}>
            <InventoryTable items={mockData.data} />
          </Suspense>
        </CardContent>
      </Card>

          {/* Pagination */}
          {mockData.meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {mockData.meta.page} of {mockData.meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" disabled={page === 1}>
                  Previous
                </Button>
                <Button variant="outline" disabled={page === mockData.meta.totalPages}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </Flex>
      </Container>
    </Section>
  );
}
