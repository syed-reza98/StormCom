/**
 * Purchase History Page
 * 
 * Customer-facing page for viewing past orders and purchases.
 * Allows customers to track orders, view invoices, and reorder items.
 */

import { Metadata } from 'next';
import { Section, Container, Flex, Heading, Text, Card, Badge, Button } from '@radix-ui/themes';
import { 
  FileTextIcon, 
  CalendarIcon, 
  DownloadIcon,
  ReloadIcon,
  ClockIcon
} from '@radix-ui/react-icons';

export const metadata: Metadata = {
  title: 'Order History | StormCom',
  description: 'View your past orders and purchases',
};

// Mock data for demonstration
const mockOrders = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    date: '2024-01-15',
    total: 129.99,
    status: 'DELIVERED',
    itemCount: 3,
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    date: '2024-01-10',
    total: 49.99,
    status: 'SHIPPED',
    itemCount: 1,
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-003',
    date: '2024-01-05',
    total: 89.99,
    status: 'PROCESSING',
    itemCount: 2,
  },
];

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { color: 'green' | 'blue' | 'amber' | 'gray'; label: string }> = {
    DELIVERED: { color: 'green', label: 'Delivered' },
    SHIPPED: { color: 'blue', label: 'Shipped' },
    PROCESSING: { color: 'amber', label: 'Processing' },
    PENDING: { color: 'gray', label: 'Pending' },
  };

  const config = statusConfig[status] || statusConfig.PENDING;
  return <Badge color={config.color} size="2">{config.label}</Badge>;
}

export default function PurchaseHistoryPage() {
  return (
    <Section size="2">
      <Container size="4">
        <Flex direction="column" gap="6">
          {/* Page Header */}
          <Flex align="center" gap="3">
            <FileTextIcon width="32" height="32" color="teal" />
            <div>
              <Heading size="8">Order History</Heading>
              <Text size="3" color="gray">
                View and manage your past purchases
              </Text>
            </div>
          </Flex>

          {/* Orders List */}
          <Flex direction="column" gap="4">
            {mockOrders.map((order) => (
              <Card key={order.id} size="3">
                <Flex direction="column" gap="4">
                  {/* Order Header */}
                  <Flex align="center" justify="between">
                    <Flex direction="column" gap="1">
                      <Flex align="center" gap="2">
                        <Text size="4" weight="bold">{order.orderNumber}</Text>
                        {getStatusBadge(order.status)}
                      </Flex>
                      <Flex align="center" gap="2">
                        <CalendarIcon width="14" height="14" style={{ color: 'var(--gray-11)' }} />
                        <Text size="2" color="gray">
                          {new Date(order.date).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </Flex>
                    </Flex>
                    
                    <Flex direction="column" align="end" gap="1">
                      <Text size="4" weight="bold">${order.total.toFixed(2)}</Text>
                      <Text size="2" color="gray">{order.itemCount} item{order.itemCount > 1 ? 's' : ''}</Text>
                    </Flex>
                  </Flex>

                  {/* Order Actions */}
                  <Flex gap="2" wrap="wrap">
                    <Button size="2" variant="soft">
                      <FileTextIcon width="14" height="14" />
                      View Details
                    </Button>
                    <Button size="2" variant="outline">
                      <DownloadIcon width="14" height="14" />
                      Invoice
                    </Button>
                    {order.status === 'DELIVERED' && (
                      <Button size="2" variant="outline">
                        <ReloadIcon width="14" height="14" />
                        Reorder
                      </Button>
                    )}
                    {order.status === 'SHIPPED' && (
                      <Button size="2" variant="outline">
                        <ClockIcon width="14" height="14" />
                        Track Order
                      </Button>
                    )}
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Flex>

          {/* Empty State (hidden when orders exist) */}
          <Card size="3" style={{ display: 'none' /* Show when no orders */ }}>
            <Flex direction="column" align="center" gap="4" style={{ padding: '48px' }}>
              <FileTextIcon width="64" height="64" color="gray" />
              <Heading size="6" align="center">No Orders Yet</Heading>
              <Text size="3" color="gray" align="center" style={{ maxWidth: '400px' }}>
                When you place orders, they&apos;ll appear here
              </Text>
              <Button size="3">
                Start Shopping
              </Button>
            </Flex>
          </Card>

          {/* Load More Button */}
          {mockOrders.length > 0 && (
            <Flex justify="center">
              <Button size="3" variant="outline">
                Load More Orders
              </Button>
            </Flex>
          )}
        </Flex>
      </Container>
    </Section>
  );
}
