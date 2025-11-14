'use client';

import * as React from 'react';
import { Check, Clock, Truck, XCircle, CheckCircle, Ban, RefreshCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'FAILED';

interface OrderStatusDropdownProps {
  currentStatus: OrderStatus;
  orderId: string;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  disabled?: boolean;
}

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    color: string;
  }
> = {
  PENDING: {
    label: 'Pending',
    icon: Clock,
    variant: 'outline',
    color: 'text-yellow-600',
  },
  CONFIRMED: {
    label: 'Confirmed',
    icon: Check,
    variant: 'secondary',
    color: 'text-blue-600',
  },
  PROCESSING: {
    label: 'Processing',
    icon: RefreshCw,
    variant: 'secondary',
    color: 'text-purple-600',
  },
  SHIPPED: {
    label: 'Shipped',
    icon: Truck,
    variant: 'default',
    color: 'text-indigo-600',
  },
  DELIVERED: {
    label: 'Delivered',
    icon: CheckCircle,
    variant: 'default',
    color: 'text-green-600',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: XCircle,
    variant: 'destructive',
    color: 'text-red-600',
  },
  REFUNDED: {
    label: 'Refunded',
    icon: RefreshCw,
    variant: 'destructive',
    color: 'text-orange-600',
  },
  FAILED: {
    label: 'Failed',
    icon: Ban,
    variant: 'destructive',
    color: 'text-red-700',
  },
};

const statusFlow: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
];

export function OrderStatusDropdown({
  currentStatus,
  orderId,
  onStatusChange,
  disabled = false,
}: OrderStatusDropdownProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const currentConfig = statusConfig[currentStatus];
  const CurrentIcon = currentConfig.icon;

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (newStatus === currentStatus || isLoading) return;

    setIsLoading(true);
    try {
      await onStatusChange(orderId, newStatus);
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableStatuses = (): OrderStatus[] => {
    const currentIndex = statusFlow.indexOf(currentStatus);

    // If cancelled, refunded, or failed, can only stay in terminal states
    if (['CANCELLED', 'REFUNDED', 'FAILED'].includes(currentStatus)) {
      return ['CANCELLED', 'REFUNDED'];
    }

    // Can always cancel or refund (if delivered)
    const available = [...statusFlow.slice(currentIndex)];
    available.push('CANCELLED');

    if (currentStatus === 'DELIVERED') {
      available.push('REFUNDED');
    }

    return Array.from(new Set(available));
  };

  const availableStatuses = getAvailableStatuses();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isLoading}
          className="gap-2"
        >
          <CurrentIcon className={`h-4 w-4 ${currentConfig.color}`} />
          <span>{currentConfig.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableStatuses.map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const isCurrent = status === currentStatus;

          return (
            <DropdownMenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={isCurrent}
              className="gap-2"
            >
              <Icon className={`h-4 w-4 ${config.color}`} />
              <span>{config.label}</span>
              {isCurrent && (
                <Check className="ml-auto h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Export status badge component for use in tables
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
