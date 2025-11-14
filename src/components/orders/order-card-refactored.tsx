// src/components/orders/order-card-refactored.tsx
// Refactored Order Card component for displaying order summary
// Pattern: shadcn Card + Badge + Button with status indicators

'use client';

import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  PackageIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FileTextIcon,
  EyeIcon,
} from 'lucide-react';

// Types
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

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
  };
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

interface OrderCardRefactoredProps {
  order: Order;
  variant?: 'default' | 'compact';
  onViewDetails?: (orderId: string) => void;
}

export function OrderCardRefactored({
  order,
  variant = 'default',
  onViewDetails,
}: OrderCardRefactoredProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  // Get status icon and color
  const getStatusConfig = (status: OrderStatus) => {
    const configs: Record<OrderStatus, { icon: typeof PackageIcon; color: string; label: string }> = {
      PENDING: { icon: ClockIcon, color: 'text-yellow-500', label: 'Pending' },
      PAID: { icon: CheckCircleIcon, color: 'text-green-500', label: 'Paid' },
      PROCESSING: { icon: PackageIcon, color: 'text-blue-500', label: 'Processing' },
      SHIPPED: { icon: TruckIcon, color: 'text-blue-500', label: 'Shipped' },
      DELIVERED: { icon: CheckCircleIcon, color: 'text-green-500', label: 'Delivered' },
      CANCELED: { icon: XCircleIcon, color: 'text-red-500', label: 'Canceled' },
      REFUNDED: { icon: XCircleIcon, color: 'text-orange-500', label: 'Refunded' },
      PAYMENT_FAILED: { icon: XCircleIcon, color: 'text-red-500', label: 'Payment Failed' },
    };
    return configs[status];
  };

  // Get status badge
  const getStatusBadge = (status: OrderStatus) => {
    const variants: Record<OrderStatus, 'default' | 'secondary' | 'destructive'> = {
      PENDING: 'secondary',
      PAID: 'default',
      PROCESSING: 'default',
      SHIPPED: 'default',
      DELIVERED: 'default',
      CANCELED: 'destructive',
      REFUNDED: 'destructive',
      PAYMENT_FAILED: 'destructive',
    };

    return (
      <Badge variant={variants[status]}>
        {getStatusConfig(status).label}
      </Badge>
    );
  };

  // Get payment status badge
  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const variants: Record<PaymentStatus, 'default' | 'secondary' | 'destructive'> = {
      PENDING: 'secondary',
      PAID: 'default',
      FAILED: 'destructive',
      REFUNDED: 'destructive',
    };

    return (
      <Badge variant={variants[status]}>
        {status}
      </Badge>
    );
  };

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Link
              href={`/orders/${order.id}`}
              className="font-semibold text-lg hover:text-primary transition-colors"
            >
              {order.orderNumber}
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2 mt-2">
          {getStatusBadge(order.status)}
          {getPaymentStatusBadge(order.paymentStatus)}
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="space-y-3">
        {/* Customer Info */}
        <div className="space-y-1">
          <div className="text-sm font-medium">{order.customer.name}</div>
          <div className="text-sm text-muted-foreground">{order.customer.email}</div>
        </div>

        <Separator />

        {/* Order Items */}
        {variant === 'default' ? (
          <div className="space-y-2">
            <div className="text-sm font-medium">Order Items ({order.items.length})</div>
            <div className="space-y-1">
              {order.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.quantity}x {item.productName}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              {order.items.length > 3 && (
                <div className="text-sm text-muted-foreground">
                  + {order.items.length - 3} more items
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
          </div>
        )}

        {variant === 'default' && (
          <>
            <Separator />

            {/* Price Breakdown */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{formatCurrency(order.shipping)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </>
        )}

        {variant === 'compact' && (
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-lg font-bold">
              {formatCurrency(order.total)}
            </span>
          </div>
        )}
      </CardContent>

      {/* Footer Actions */}
      <CardFooter className="pt-3">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onViewDetails?.(order.id)}
            asChild
          >
            <Link href={`/orders/${order.id}`}>
              <EyeIcon className="h-4 w-4 mr-2" />
              View Details
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/orders/${order.id}/invoice`}>
              <FileTextIcon className="h-4 w-4 mr-2" />
              Invoice
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
