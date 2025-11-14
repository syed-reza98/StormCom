// src/components/customers/customers-table-refactored.tsx
// Refactored Customers Table with search, filters, and actions
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MoreHorizontalIcon, 
  EyeIcon, 
  EditIcon, 
  TrashIcon,
  MailIcon,
  ShoppingBagIcon,
} from 'lucide-react';

// Types
interface Customer {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  phone?: string | null;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate?: string | null;
  createdAt: string;
  isActive: boolean;
  isVerified: boolean;
}

interface CustomersTableRefactoredProps {
  customers: Customer[];
  onDelete?: (customerId: string) => void;
  onBulkDelete?: (customerIds: string[]) => void;
  isLoading?: boolean;
}

export function CustomersTableRefactored({
  customers,
  onDelete,
  onBulkDelete,
  isLoading = false,
}: CustomersTableRefactoredProps) {
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(new Set(customers.map(c => c.id)));
    } else {
      setSelectedCustomers(new Set());
    }
  };

  const handleSelectOne = (customerId: string, checked: boolean) => {
    const newSelection = new Set(selectedCustomers);
    if (checked) {
      newSelection.add(customerId);
    } else {
      newSelection.delete(customerId);
    }
    setSelectedCustomers(newSelection);
  };

  const isAllSelected = customers.length > 0 && selectedCustomers.size === customers.length;

  // Delete handlers
  const handleDelete = () => {
    if (deleteCustomerId && onDelete) {
      onDelete(deleteCustomerId);
      setDeleteCustomerId(null);
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(Array.from(selectedCustomers));
      setSelectedCustomers(new Set());
      setShowBulkDelete(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedCustomers.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedCustomers.size} customer{selectedCustomers.size !== 1 ? 's' : ''} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <MailIcon className="h-4 w-4 mr-1" />
            Send Email
          </Button>
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

      {/* Customers Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all customers"
                  disabled={isLoading}
                />
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-center">Orders</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead>Last Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  {/* Selection Checkbox */}
                  <TableCell>
                    <Checkbox
                      checked={selectedCustomers.has(customer.id)}
                      onCheckedChange={(checked) => handleSelectOne(customer.id, checked as boolean)}
                      aria-label={`Select customer ${customer.name}`}
                      disabled={isLoading}
                    />
                  </TableCell>

                  {/* Customer with Avatar */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={customer.avatar || undefined} alt={customer.name} />
                        <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Link
                          href={`/customers/${customer.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {customer.name}
                        </Link>
                        {customer.isVerified && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Contact Info */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">{customer.email}</div>
                      {customer.phone && (
                        <div className="text-sm text-muted-foreground">{customer.phone}</div>
                      )}
                    </div>
                  </TableCell>

                  {/* Orders Count */}
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {customer.ordersCount}
                    </Badge>
                  </TableCell>

                  {/* Total Spent */}
                  <TableCell className="text-right font-medium">
                    {formatCurrency(customer.totalSpent)}
                  </TableCell>

                  {/* Last Order Date */}
                  <TableCell>
                    {customer.lastOrderDate ? (
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(customer.lastOrderDate), { addSuffix: true })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Never</span>
                    )}
                  </TableCell>

                  {/* Active Status */}
                  <TableCell>
                    <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>

                  {/* Actions Dropdown */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isLoading}
                          aria-label="Customer actions"
                        >
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/customers/${customer.id}`}>
                            <EyeIcon className="h-4 w-4 mr-2" />
                            View Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/customers/${customer.id}/edit`}>
                            <EditIcon className="h-4 w-4 mr-2" />
                            Edit Customer
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/customers/${customer.id}/orders`}>
                            <ShoppingBagIcon className="h-4 w-4 mr-2" />
                            View Orders
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MailIcon className="h-4 w-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteCustomerId(customer.id)}
                          className="text-destructive"
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          Delete Customer
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
      <AlertDialog open={!!deleteCustomerId} onOpenChange={() => setDeleteCustomerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this customer and all associated data including orders and reviews.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete Customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCustomers.size} customers?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected customers and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground">
              Delete Customers
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
