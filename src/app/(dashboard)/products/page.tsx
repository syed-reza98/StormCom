// src/app/(dashboard)/products/page.tsx
// Products List Dashboard Page - Data table with search, filters, and bulk actions

import { Metadata } from 'next';
import Link from 'next/link';
import { Flex, Heading, Text, Container, Section } from '@radix-ui/themes';
import { PlusIcon, DownloadIcon, UploadIcon } from '@radix-ui/react-icons';
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

// MIGRATED: Removed export const dynamic = 'force-dynamic' (incompatible with Cache Components)
// Dynamic by default with Cache Components - will add "use cache" or Suspense boundary after analyzing build errors

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

export default async function ProductsPage({ searchParams }: { searchParams: Promise<ProductsPageProps['searchParams']> }) {
  const params = await searchParams;
  return (
    <Section size="2">
      <Container size="4">
        <Flex direction="column" gap="6">
          {/* Page Header */}
          <Flex direction="column" gap="2">
            <Flex justify="between" align="start">
              <Flex direction="column" gap="1">
                <Heading size="8" weight="bold">Products</Heading>
                <Text size="3" color="gray">
                  Manage your store products, inventory, and pricing
                </Text>
              </Flex>
              
              <Flex gap="3" align="center">
                {/* Import/Export Actions */}
                <Link
                  href="/dashboard/products/import"
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                >
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Import
                </Link>

                <Button variant="outline" size="sm">
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export
                </Button>

                {/* Add Product Button */}
                <Link href="/dashboard/products/new" className={cn(buttonVariants({}))}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Product
                </Link>
              </Flex>
            </Flex>
          </Flex>

          {/* Filters Section */}
          <Card className="p-6">
            <ProductsFilters searchParams={params} />
          </Card>

          {/* Bulk Actions */}
          <ProductsBulkActions />

          {/* Products Data Table */}
          <Card>
            <ProductsTable searchParams={params} />
          </Card>
        </Flex>
      </Container>
    </Section>
  );
}