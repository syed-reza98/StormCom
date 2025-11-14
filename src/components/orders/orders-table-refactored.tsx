// src/components/orders/orders-table-refactored.tsx
// Refactored Orders Table with row selection, status badges, and actions
// Pattern: shadcn Table + DropdownMenu + AlertDialog

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MoreHorizontalIcon, 
  EyeIcon, 
  EditIcon, 
  TrashIcon,
  FileTextIcon,
  TruckIcon,
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

interface OrdersTableRefactoredProps {
  orders: Order[];
  onStatusUpdate?: (orderId: string, newStatus: OrderStatus) => void;
  onDelete?: (orderId: string) => void;
  onBulkDelete?: (orderIds: string[]) => void;
  isLoading?: boolean;
}

export function OrdersTableRefactored({
  orders,
  onDelete,
  onBulkDelete,
  isLoading = false,
}: OrdersTableRefactoredProps) {
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(new Set(orders.map(o => o.id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleSelectOne = (orderId: string, checked: boolean) => {
    const newSelection = new Set(selectedOrders);
    if (checked) {
      newSelection.add(orderId);
    } else {
      newSelection.delete(orderId);
    }
    setSelectedOrders(newSelection);
  };

  const isAllSelected = orders.length > 0 && selectedOrders.size === orders.length;

  // Delete handlers
  const handleDelete = () => {
    if (deleteOrderId && onDelete) {
      onDelete(deleteOrderId);
      setDeleteOrderId(null);
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(Array.from(selectedOrders));
      setSelectedOrders(new Set());
      setShowBulkDelete(false);
    }
  };

  // Status badge helper
  const getStatusBadge = (status: OrderStatus) => {
    const variants: Record<OrderStatus, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
      PENDING: { variant: 'secondary', label: 'Pending' },
      PAID: { variant: 'default', label: 'Paid' },
      PROCESSING: { variant: 'default', label: 'Processing' },
      SHIPPED: { variant: 'default', label: 'Shipped' },
      DELIVERED: { variant: 'default', label: 'Delivered' },
      CANCELED: { variant: 'destructive', label: 'Canceled' },
      REFUNDED: { variant: 'destructive', label: 'Refunded' },
      PAYMENT_FAILED: { variant: 'destructive', label: 'Payment Failed' },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  // Payment status badge helper
  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const variants: Record<PaymentStatus, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
      PENDING: { variant: 'secondary', label: 'Pending' },
      PAID: { variant: 'default', label: 'Paid' },
      FAILED: { variant: 'destructive', label: 'Failed' },
      REFUNDED: { variant: 'destructive', label: 'Refunded' },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedOrders.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedOrders.size} order{selectedOrders.size !== 1 ? 's' : ''} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowBulkDelete(true)}
            disabled={isLoading}
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Orders Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all orders"
                  disabled={isLoading}
                />
              </TableHead>
              <TableHead>Order Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  {/* Selection Checkbox */}
                  <TableCell>
                    <Checkbox
                      checked={selectedOrders.has(order.id)}
                      onCheckedChange={(checked) => handleSelectOne(order.id, checked as boolean)}
                      aria-label={`Select order ${order.orderNumber}`}
                      disabled={isLoading}
                    />
                  </TableCell>

                  {/* Order Number */}
                  <TableCell>
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </TableCell>

                  {/* Customer */}
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customer.name}</div>
                      <div className="text-sm text-muted-foreground">{order.customer.email}</div>
                    </div>
                  </TableCell>

                  {/* Order Status */}
                  <TableCell>
                    {getStatusBadge(order.status)}
                  </TableCell>

                  {/* Payment Status */}
                  <TableCell>
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </TableCell>

                  {/* Items Count */}
                  <TableCell>
                    {order.itemsCount} item{order.itemsCount !== 1 ? 's' : ''}
                  </TableCell>

                  {/* Total Amount */}
                  <TableCell className="text-right font-medium">
                    {formatCurrency(order.totalAmount)}
                  </TableCell>

                  {/* Created Date */}
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                  </TableCell>

                  {/* Actions Dropdown */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isLoading}
                          aria-label="Order actions"
                        >
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/orders/${order.id}`}>
                            <EyeIcon className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/orders/${order.id}/edit`}>
                            <EditIcon className="h-4 w-4 mr-2" />
                            Edit Order
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <FileTextIcon className="h-4 w-4 mr-2" />
                          Download Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <TruckIcon className="h-4 w-4 mr-2" />
                          Track Shipment
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteOrderId(order.id)}
                          className="text-destructive"
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete Order
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteOrderId} onOpenChange={() => setDeleteOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this order and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedOrders.size} orders?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected orders and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground">
              Delete Orders
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
