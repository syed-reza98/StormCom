// src/components/customers/customer-card-refactored.tsx
// Refactored Customer Card component for displaying customer information
// Pattern: shadcn Card + Avatar + Badge with stats

'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  ShoppingBagIcon,
  DollarSignIcon,
  EyeIcon,
  EditIcon,
} from 'lucide-react';

// Types
interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  } | null;
  ordersCount: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: string | null;
  createdAt: string;
  isActive: boolean;
  isVerified: boolean;
  tags?: string[];
}

interface CustomerCardRefactoredProps {
  customer: Customer;
  variant?: 'default' | 'compact';
  onViewDetails?: (customerId: string) => void;
  onEdit?: (customerId: string) => void;
}

export function CustomerCardRefactored({
  customer,
  variant = 'default',
  onViewDetails,
  onEdit,
}: CustomerCardRefactoredProps) {
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

  // Format address
  const formatAddress = () => {
    if (!customer.address) return null;
    const { street, city, state, zipCode } = customer.address;
    const parts = [street, city, state, zipCode].filter(Boolean);
    return parts.join(', ');
  };

  const address = formatAddress();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header with Avatar */}
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={customer.avatar || undefined} alt={customer.name} />
            <AvatarFallback className="text-lg">
              {getInitials(customer.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-1">
            <Link
              href={`/customers/${customer.id}`}
              className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1"
            >
              {customer.name}
            </Link>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                {customer.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {customer.isVerified && (
                <Badge variant="outline">
                  Verified
                </Badge>
              )}
              {customer.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="space-y-3">
        {/* Contact Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MailIcon className="h-4 w-4 text-muted-foreground" />
            <a
              href={`mailto:${customer.email}`}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {customer.email}
            </a>
          </div>
          
          {customer.phone && (
            <div className="flex items-center gap-2 text-sm">
              <PhoneIcon className="h-4 w-4 text-muted-foreground" />
              <a
                href={`tel:${customer.phone}`}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {customer.phone}
              </a>
            </div>
          )}
          
          {address && variant === 'default' && (
            <div className="flex items-start gap-2 text-sm">
              <MapPinIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="text-muted-foreground line-clamp-2">
                {address}
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShoppingBagIcon className="h-4 w-4" />
              <span>Orders</span>
            </div>
            <div className="text-2xl font-bold">
              {customer.ordersCount}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSignIcon className="h-4 w-4" />
              <span>Total Spent</span>
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(customer.totalSpent)}
            </div>
          </div>
        </div>

        {variant === 'default' && (
          <>
            <Separator />

            {/* Additional Stats */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Order</span>
                <span className="font-medium">
                  {formatCurrency(customer.averageOrderValue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Order</span>
                <span className="font-medium">
                  {customer.lastOrderDate
                    ? formatDistanceToNow(new Date(customer.lastOrderDate), { addSuffix: true })
                    : 'Never'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer Since</span>
                <span className="font-medium">
                  {formatDistanceToNow(new Date(customer.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Footer Actions */}
      <CardFooter className="pt-3">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onViewDetails?.(customer.id)}
            asChild
          >
            <Link href={`/customers/${customer.id}`}>
              <EyeIcon className="h-4 w-4 mr-2" />
              View Profile
            </Link>
          </Button>
          {onEdit && (
            <Button
              variant="outline"
              onClick={() => onEdit(customer.id)}
            >
              <EditIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
