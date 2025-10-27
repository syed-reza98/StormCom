// src/app/(dashboard)/products/page.tsx
// Products List Dashboard Page - Data table with search, filters, and bulk actions

import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ProductsTable } from '@/components/products/products-table';
import { ProductsFilters } from '@/components/products/products-filters';
import { ProductsBulkActions } from '@/components/products/products-bulk-actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'Products | Dashboard',
  description: 'Manage your store products, inventory, and pricing',
};

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ProductsPageProps {
  searchParams: {
    page?: string;
    search?: string;
    categoryId?: string;
    brandId?: string;
    status?: string;
    minPrice?: string;
    maxPrice?: string;
    inventoryStatus?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your store products, inventory, and pricing
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Import/Export Actions */}
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/products/import">
              📤 Import
            </Link>
          </Button>
          
          <Button variant="outline" size="sm">
            📥 Export
          </Button>
          
          {/* Add Product Button */}
          <Button asChild>
            <Link href="/dashboard/products/new">
              ➕ Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="p-6">
        <Suspense fallback={<div>Loading filters...</div>}>
          <ProductsFilters searchParams={searchParams} />
        </Suspense>
      </Card>

      {/* Bulk Actions */}
      <Suspense fallback={<div>Loading bulk actions...</div>}>
        <ProductsBulkActions />
      </Suspense>

      {/* Products Data Table */}
      <Card>
        <Suspense fallback={<ProductsTableSkeleton />}>
          <ProductsTable searchParams={searchParams} />
        </Suspense>
      </Card>
    </div>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function ProductsTableSkeleton() {
  return (
    <div className="p-6">
      <div className="space-y-4">
        {/* Table Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 bg-muted rounded animate-pulse" />
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        </div>
        
        {/* Table Rows Skeleton */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-4 border-b">
            <div className="h-12 w-12 bg-muted rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-muted rounded animate-pulse" />
              <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}