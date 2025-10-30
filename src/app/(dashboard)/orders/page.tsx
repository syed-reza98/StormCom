// src/app/(dashboard)/orders/page.tsx
// Orders List Dashboard Page - Data table with search, filters, and status management

import { Metadata } from 'next';
import Link from 'next/link';
import { OrdersTable } from '@/components/orders/orders-table';
import { OrdersFilters } from '@/components/orders/orders-filters';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'Orders | Dashboard',
  description: 'Manage customer orders, fulfillment, and order status',
};

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface OrdersPageProps {
  searchParams: {
    page?: string;
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default async function OrdersPage({ 
  searchParams 
}: { 
  searchParams: Promise<OrdersPageProps['searchParams']> 
}) {
  const params = await searchParams;
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage customer orders, fulfillment, and order status
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Export to CSV Action */}
          <form action="/api/orders" method="GET" target="_blank">
            <input type="hidden" name="export" value="csv" />
            {params.status && <input type="hidden" name="status" value={params.status} />}
            {params.search && <input type="hidden" name="search" value={params.search} />}
            {params.dateFrom && <input type="hidden" name="dateFrom" value={params.dateFrom} />}
            {params.dateTo && <input type="hidden" name="dateTo" value={params.dateTo} />}
            <Button type="submit" variant="outline" size="sm">
              📥 Export CSV
            </Button>
          </form>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="p-6">
        <OrdersFilters searchParams={params} />
      </Card>

      {/* Orders Data Table */}
      <Card>
        <OrdersTable searchParams={params} />
      </Card>
    </div>
  );
}
