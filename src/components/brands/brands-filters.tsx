// src/components/brands/brands-filters.tsx
// Brands Filters Component - Advanced filtering for brands

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BrandsFiltersProps {
  searchParams: {
    search?: string;
    status?: 'active' | 'inactive' | 'all';
    sort?: 'name' | 'products' | 'created' | 'updated';
    order?: 'asc' | 'desc';
    page?: string;
    per_page?: string;
  };
}

export function BrandsFilters({ searchParams }: BrandsFiltersProps) {
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    
    if (value === '' || value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    
    // Reset to first page when changing filters
    params.delete('page');
    
    window.location.href = `?${params.toString()}`;
  };

  const clearFilters = () => {
    window.location.href = window.location.pathname;
  };

  const hasActiveFilters = Object.values(searchParams).some(value => 
    value && value !== 'all' && value !== '1' && value !== '10'
  );

  return (
    <div className="bg-muted/25 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            🗑️ Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <Label htmlFor="search" className="text-sm">Search</Label>
          <Input
            id="search"
            placeholder="Brand name, description..."
            defaultValue={searchParams.search || ''}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                updateFilter('search', e.currentTarget.value);
              }
            }}
            className="mt-1"
          />
        </div>

        {/* Status Filter */}
        <div>
          <Label htmlFor="status" className="text-sm">Status</Label>
          <select
            id="status"
            value={searchParams.status || 'all'}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {/* Sort Options */}
        <div>
          <Label htmlFor="sort" className="text-sm">Sort By</Label>
          <select
            id="sort"
            value={searchParams.sort || 'name'}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="name">Name</option>
            <option value="products">Product Count</option>
            <option value="created">Date Created</option>
            <option value="updated">Last Updated</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <Label htmlFor="order" className="text-sm">Order</Label>
          <select
            id="order"
            value={searchParams.order || 'asc'}
            onChange={(e) => updateFilter('order', e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2 mt-4">
        <span className="text-sm text-muted-foreground">Quick filters:</span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateFilter('status', 'active')}
          className={searchParams.status === 'active' ? 'bg-primary text-primary-foreground' : ''}
        >
          ✅ Active Brands
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            updateFilter('sort', 'products');
            updateFilter('order', 'desc');
          }}
          className={
            searchParams.sort === 'products' && searchParams.order === 'desc'
              ? 'bg-primary text-primary-foreground'
              : ''
          }
        >
          📈 Most Products
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            updateFilter('sort', 'created');
            updateFilter('order', 'desc');
          }}
          className={
            searchParams.sort === 'created' && searchParams.order === 'desc'
              ? 'bg-primary text-primary-foreground'
              : ''
          }
        >
          🆕 Recently Added
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            updateFilter('sort', 'updated');
            updateFilter('order', 'desc');
          }}
          className={
            searchParams.sort === 'updated' && searchParams.order === 'desc'
              ? 'bg-primary text-primary-foreground'
              : ''
          }
        >
          🔄 Recently Updated
        </Button>
      </div>

      {/* Results Summary */}
      <div className="mt-3 text-sm text-muted-foreground">
        {hasActiveFilters && (
          <span>
            🔍 Filtering results
            {searchParams.search && ` • Search: "${searchParams.search}"`}
            {searchParams.status && searchParams.status !== 'all' && ` • Status: ${searchParams.status}`}
            {searchParams.sort && searchParams.sort !== 'name' && ` • Sorted by: ${searchParams.sort}`}
          </span>
        )}
      </div>
    </div>
  );
}