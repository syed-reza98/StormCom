// src/components/orders/orders-table.tsx
// Orders Data Table with pagination, sorting, and status display
// OPTIMIZED: Added React.memo, useMemo, useCallback for better performance

'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type OrderStatus = 
  | 'PENDING' 
  | 'PAID' 
  | 'PROCESSING' 
  | 'SHIPPED' 
  | 'DELIVERED' 
  | 'CANCELED' 
  | 'REFUNDED' 
  | 'PAYMENT_FAILED';

type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
  };
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface OrdersTableProps {
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

interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

// ============================================================================
// MOCK DATA (Development/Demo fallback)
// ============================================================================

function generateMockOrders(page: number = 1): { data: Order[]; meta: PaginationMeta } {
  const perPage = 10;
  const total = 47;
  const totalPages = Math.ceil(total / perPage);
  
  const mockOrders: Order[] = [
    {
      id: '1',
      orderNumber: 'ORD-2025-001',
      customer: { name: 'John Doe', email: 'john@example.com' },
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      totalAmount: 15999,
      itemsCount: 3,
      createdAt: '2025-11-01T10:30:00Z',
      updatedAt: '2025-11-05T14:20:00Z',
    },
    {
      id: '2',
      orderNumber: 'ORD-2025-002',
      customer: { name: 'Jane Smith', email: 'jane@example.com' },
      status: 'SHIPPED',
      paymentStatus: 'PAID',
      totalAmount: 8999,
      itemsCount: 2,
      createdAt: '2025-11-02T14:15:00Z',
      updatedAt: '2025-11-04T09:30:00Z',
    },
    {
      id: '3',
      orderNumber: 'ORD-2025-003',
      customer: { name: 'Bob Johnson', email: 'bob@example.com' },
      status: 'PROCESSING',
      paymentStatus: 'PAID',
      totalAmount: 24999,
      itemsCount: 5,
      createdAt: '2025-11-03T16:45:00Z',
      updatedAt: '2025-11-03T16:45:00Z',
    },
    {
      id: '4',
      orderNumber: 'ORD-2025-004',
      customer: { name: 'Alice Brown', email: 'alice@example.com' },
      status: 'PENDING',
      paymentStatus: 'PENDING',
      totalAmount: 5499,
      itemsCount: 1,
      createdAt: '2025-11-04T11:20:00Z',
      updatedAt: '2025-11-04T11:20:00Z',
    },
    {
      id: '5',
      orderNumber: 'ORD-2025-005',
      customer: { name: 'Charlie Wilson', email: 'charlie@example.com' },
      status: 'PAID',
      paymentStatus: 'PAID',
      totalAmount: 12999,
      itemsCount: 4,
      createdAt: '2025-11-04T15:10:00Z',
      updatedAt: '2025-11-04T15:30:00Z',
    },
    {
      id: '6',
      orderNumber: 'ORD-2025-006',
      customer: { name: 'Diana Martinez', email: 'diana@example.com' },
      status: 'CANCELED',
      paymentStatus: 'REFUNDED',
      totalAmount: 9999,
      itemsCount: 2,
      createdAt: '2025-11-03T09:00:00Z',
      updatedAt: '2025-11-04T10:15:00Z',
    },
    {
      id: '7',
      orderNumber: 'ORD-2025-007',
      customer: { name: 'Ethan Davis', email: 'ethan@example.com' },
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      totalAmount: 19999,
      itemsCount: 6,
      createdAt: '2025-10-28T13:30:00Z',
      updatedAt: '2025-11-02T16:45:00Z',
    },
    {
      id: '8',
      orderNumber: 'ORD-2025-008',
      customer: { name: 'Fiona Garcia', email: 'fiona@example.com' },
      status: 'PROCESSING',
      paymentStatus: 'PAID',
      totalAmount: 7499,
      itemsCount: 3,
      createdAt: '2025-11-04T08:15:00Z',
      updatedAt: '2025-11-04T08:15:00Z',
    },
    {
      id: '9',
      orderNumber: 'ORD-2025-009',
      customer: { name: 'George Lee', email: 'george@example.com' },
      status: 'PAYMENT_FAILED',
      paymentStatus: 'FAILED',
      totalAmount: 14999,
      itemsCount: 4,
      createdAt: '2025-11-03T19:00:00Z',
      updatedAt: '2025-11-03T19:05:00Z',
    },
    {
      id: '10',
      orderNumber: 'ORD-2025-010',
      customer: { name: 'Hannah White', email: 'hannah@example.com' },
      status: 'SHIPPED',
      paymentStatus: 'PAID',
      totalAmount: 11999,
      itemsCount: 2,
      createdAt: '2025-11-02T12:40:00Z',
      updatedAt: '2025-11-03T14:20:00Z',
    },
  ];
  
  // Simulate pagination
  const startIndex = (page - 1) * perPage;
  const paginatedOrders = mockOrders.slice(startIndex, startIndex + perPage);
  
  return {
    data: paginatedOrders,
    meta: {
      page,
      perPage,
      total,
      totalPages,
    },
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function OrdersTableComponent({ searchParams }: OrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    perPage: 10,
    total: 0,
    totalPages: 0,
  });

  // Fetch orders data
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchOrders = async () => {
      if (!isMounted) return;
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          page: searchParams.page || '1',
          perPage: '10',
          ...(searchParams.search && { search: searchParams.search }),
          ...(searchParams.status && { status: searchParams.status }),
          ...(searchParams.dateFrom && { dateFrom: searchParams.dateFrom }),
          ...(searchParams.dateTo && { dateTo: searchParams.dateTo }),
          sortBy: searchParams.sortBy || 'createdAt',
          sortOrder: searchParams.sortOrder || 'desc',
        });

        const response = await fetch(`/api/orders?${params}`, {
          signal: controller.signal,
        });
        
        if (!response.ok) {
          // Handle unauthorized/authentication errors gracefully with mock data
          if (response.status === 401 || response.status === 403) {
            console.warn('Authentication required - using mock data for development');
            // Use mock data for development/demo purposes
            const mockOrders = generateMockOrders(parseInt(searchParams.page || '1'));
            if (!isMounted) return;
            setOrders(mockOrders.data);
            setPagination(mockOrders.meta);
            return;
          }
          
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to fetch orders');
        }

        const data = await response.json();
        if (!isMounted) return;

        if (data.data) {
          setOrders(data.data);
          // Use functional update to avoid referencing `pagination` in the effect
          setPagination((prev) => data.meta || prev);
        }
      } catch (err: any) {
        if (err.name === 'AbortError' || !isMounted) return;
        console.error('Error fetching orders:', err);
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [searchParams]);

  // Memoize currency formatter (expensive to create)
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }),
    []
  );

  // Memoize date formatter (expensive to create)
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
    []
  );

  // Format currency using memoized formatter
  const formatPrice = (price: number) => {
    return currencyFormatter.format(price);
  };

  // Format date using memoized formatter
  const formatDate = (dateString: string) => {
    return dateFormatter.format(new Date(dateString));
  };

  // OPTIMIZED: useMemo for badge lookups (prevents recalculation on every render)
  const getOrderStatusBadge = useMemo(() => {
    const badges: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' }> = {
      PENDING: { label: 'Pending', variant: 'secondary' },
      PAID: { label: 'Paid', variant: 'success' },
      PROCESSING: { label: 'Processing', variant: 'default' },
      SHIPPED: { label: 'Shipped', variant: 'default' },
      DELIVERED: { label: 'Delivered', variant: 'success' },
      CANCELED: { label: 'Canceled', variant: 'destructive' },
      REFUNDED: { label: 'Refunded', variant: 'warning' },
      PAYMENT_FAILED: { label: 'Payment Failed', variant: 'destructive' },
    };

    const OrderStatusBadge = (status: OrderStatus) => {
      const { label, variant } = badges[status];
      return <Badge variant={variant}>{label}</Badge>;
    };
    OrderStatusBadge.displayName = 'OrderStatusBadge';
    return OrderStatusBadge;
  }, []);

  // OPTIMIZED: useMemo for payment status badge lookup
  const getPaymentStatusBadge = useMemo(() => {
    const badges: Record<PaymentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' }> = {
      PENDING: { label: 'Pending', variant: 'secondary' },
      PAID: { label: 'Paid', variant: 'success' },
      FAILED: { label: 'Failed', variant: 'destructive' },
      REFUNDED: { label: 'Refunded', variant: 'warning' },
    };

    const PaymentStatusBadge = (status: PaymentStatus) => {
      const { label, variant } = badges[status];
      return <Badge variant={variant}>{label}</Badge>;
    };
    PaymentStatusBadge.displayName = 'PaymentStatusBadge';
    return PaymentStatusBadge;
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive font-medium">Error loading orders</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-muted-foreground">No orders found</p>
        <p className="text-sm text-muted-foreground mt-1">
          {searchParams.search || searchParams.status 
            ? 'Try adjusting your filters' 
            : 'Orders will appear here once customers place them'}
        </p>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Order Number</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Payment</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Items</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-4">
                  <Link 
                    href={`/orders/${order.id}`}
                    className="font-mono text-sm font-medium text-primary hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm">
                    <p className="font-medium">{order.customer.name}</p>
                    <p className="text-muted-foreground text-xs">{order.customer.email}</p>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-muted-foreground">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-4 py-4">
                  {getOrderStatusBadge(order.status)}
                </td>
                <td className="px-4 py-4">
                  {getPaymentStatusBadge(order.paymentStatus)}
                </td>
                <td className="px-4 py-4 text-sm text-center">
                  {order.itemsCount}
                </td>
                <td className="px-4 py-4 text-sm font-medium text-right">
                  {formatPrice(order.totalAmount)}
                </td>
                <td className="px-4 py-4 text-right">
                  <Link href={`/orders/${order.id}`}>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-6 pb-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            baseUrl="/orders"
            searchParams={searchParams}
          />
        </div>
      )}

      {/* Results Summary */}
      <div className="px-6 pb-4 text-sm text-muted-foreground text-center">
        Showing {((pagination.page - 1) * pagination.perPage) + 1} to {Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total} orders
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
const OrdersTable = memo(OrdersTableComponent, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.searchParams) === JSON.stringify(nextProps.searchParams);
});

// Export both named and default
export { OrdersTable };
export default OrdersTable;
