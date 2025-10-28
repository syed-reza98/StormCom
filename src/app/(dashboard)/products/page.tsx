// src/app/(dashboard)/products/page.tsx
// Products List Dashboard Page - Data table with search, filters, and bulk actions

import { Metadata } from 'next';
import Link from 'next/link';
import { ProductsTable } from '@/components/products/products-table';
import { ProductsFilters } from '@/components/products/products-filters';
import { ProductsBulkActions } from '@/components/products/products-bulk-actions';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'Products | Dashboard',
  description: 'Manage your store products, inventory, and pricing',
};

// Force dynamic rendering since this page contains client components
export const dynamic = 'force-dynamic';

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
          <Link
            href="/dashboard/products/import"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            📤 Import
          </Link>

          <Button variant="outline" size="sm">
            📥 Export
          </Button>

          {/* Add Product Button */}
          <Link href="/dashboard/products/new" className={cn(buttonVariants({}))}>
            ➕ Add Product
          </Link>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="p-6">
        <ProductsFilters searchParams={searchParams} />
      </Card>

      {/* Bulk Actions */}
      <ProductsBulkActions />

      {/* Products Data Table */}
      <Card>
        <ProductsTable searchParams={searchParams} />
      </Card>
    </div>
  );
}