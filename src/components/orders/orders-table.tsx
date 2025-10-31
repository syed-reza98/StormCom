// src/components/orders/orders-table.tsx
// Orders Data Table with pagination, sorting, and status display

'use client';

import { useState, useEffect } from 'react';
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
// MAIN COMPONENT
// ============================================================================

export function OrdersTable({ searchParams }: OrdersTableProps) {
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
    const fetchOrders = async () => {
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

        const response = await fetch(`/api/orders?${params}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to fetch orders');
        }

        const data = await response.json();

        if (data.data) {
          setOrders(data.data);
          // Use functional update to avoid referencing `pagination` in the effect
          setPagination((prev) => data.meta || prev);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [searchParams]);

  // Format currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  // Get order status badge
  const getOrderStatusBadge = (status: OrderStatus) => {
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

    const { label, variant } = badges[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  // Get payment status badge
  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const badges: Record<PaymentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' }> = {
      PENDING: { label: 'Pending', variant: 'secondary' },
      PAID: { label: 'Paid', variant: 'success' },
      FAILED: { label: 'Failed', variant: 'destructive' },
      REFUNDED: { label: 'Refunded', variant: 'warning' },
    };

    const { label, variant } = badges[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

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
