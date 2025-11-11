// src/app/(dashboard)/orders/page.tsx
// Orders List Dashboard Page - Data table with search, filters, and status management

import { Metadata } from 'next';
import { Section, Container, Flex, Heading, Text, Card, Button } from '@radix-ui/themes';
import { FileTextIcon, DownloadIcon } from '@radix-ui/react-icons';
import { OrdersTable } from '@/components/orders/orders-table';
import { OrdersFilters } from '@/components/orders/orders-filters';

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
    <Section size="2">
      <Container size="4">
        <Flex direction="column" gap="6">
          {/* Page Header */}
          <Flex direction="column" gap="2">
            <Flex align="center" gap="3" justify="between">
              <Flex align="center" gap="3">
                <FileTextIcon width="32" height="32" color="teal" />
                <div>
                  <Heading size="8">Orders</Heading>
                  <Text size="3" color="gray">
                    Manage customer orders, fulfillment, and order status
                  </Text>
                </div>
              </Flex>
              
              <div className="flex items-center gap-3">
                {/* Export to CSV Action */}
                <form action="/api/orders" method="GET" target="_blank">
                  <input type="hidden" name="export" value="csv" />
                  {params.status && <input type="hidden" name="status" value={params.status} />}
                  {params.search && <input type="hidden" name="search" value={params.search} />}
                  {params.dateFrom && <input type="hidden" name="dateFrom" value={params.dateFrom} />}
                  {params.dateTo && <input type="hidden" name="dateTo" value={params.dateTo} />}
                  <Button type="submit" variant="outline" size="2">
                    <DownloadIcon width="16" height="16" />
                    Export CSV
                  </Button>
                </form>
              </div>
            </Flex>
          </Flex>

          {/* Filters Section */}
          <Card size="2">
            <OrdersFilters searchParams={params} />
          </Card>

          {/* Orders Data Table */}
          <Card>
            <OrdersTable searchParams={params} />
          </Card>
        </Flex>
      </Container>
    </Section>
  );
}
