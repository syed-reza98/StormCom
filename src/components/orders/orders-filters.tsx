// src/components/orders/orders-filters.tsx
// Orders Filters Component - Search, status filter, date range filter

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface OrdersFiltersProps {
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

export function OrdersFilters({ searchParams }: OrdersFiltersProps) {
  const router = useRouter();
  
  // Form state
  const [search, setSearch] = useState(searchParams.search || '');
  const [status, setStatus] = useState(searchParams.status || '');
  const [dateFrom, setDateFrom] = useState(searchParams.dateFrom || '');
  const [dateTo, setDateTo] = useState(searchParams.dateTo || '');
  const [sortBy, setSortBy] = useState(searchParams.sortBy || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.sortOrder || 'desc');

  // Update URL when filters change
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (sortBy) params.set('sortBy', sortBy);
    if (sortOrder) params.set('sortOrder', sortOrder);
    
    // Reset to page 1 when filters change
    params.set('page', '1');
    
    router.push(`/orders?${params.toString()}`);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
    setSortBy('createdAt');
    setSortOrder('desc');
    router.push('/orders');
  };

  // Auto-apply filters on Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  // Check if any filters are active
  const hasActiveFilters = search || status || dateFrom || dateTo;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-4">
      {/* Search and Status Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="md:col-span-2">
          <label htmlFor="search" className="block text-sm font-medium mb-2">
            Search Orders
          </label>
          <Input
            id="search"
            type="text"
            placeholder="Order number or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-2">
            Status
          </label>
          <Select value={status || 'ALL'} onValueChange={(value) => setStatus(value === 'ALL' ? '' : value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="SHIPPED">Shipped</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="CANCELED">Canceled</SelectItem>
              <SelectItem value="REFUNDED">Refunded</SelectItem>
              <SelectItem value="PAYMENT_FAILED">Payment Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort By */}
        <div>
          <label htmlFor="sortBy" className="block text-sm font-medium mb-2">
            Sort By
          </label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date</SelectItem>
              <SelectItem value="totalAmount">Total Amount</SelectItem>
              <SelectItem value="orderNumber">Order Number</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date Range Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Date From */}
        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium mb-2">
            From Date
          </label>
          <Input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Date To */}
        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium mb-2">
            To Date
          </label>
          <Input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Sort Order */}
        <div>
          <label htmlFor="sortOrder" className="block text-sm font-medium mb-2">
            Order
          </label>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-end gap-2">
          <Button 
            onClick={applyFilters}
            className="flex-1"
          >
            Apply Filters
          </Button>
          {hasActiveFilters && (
            <Button 
              onClick={clearFilters}
              variant="outline"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Active filters:</span>
          {search && <span className="px-2 py-1 bg-muted rounded">Search: {search}</span>}
          {status && <span className="px-2 py-1 bg-muted rounded">Status: {status}</span>}
          {dateFrom && <span className="px-2 py-1 bg-muted rounded">From: {dateFrom}</span>}
          {dateTo && <span className="px-2 py-1 bg-muted rounded">To: {dateTo}</span>}
        </div>
      )}
    </div>
  );
}
