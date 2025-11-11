// src/components/attributes/attributes-filters.tsx
// Filters component for attributes page

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface AttributesFiltersProps {
  searchParams: {
    search?: string;
    type?: string;
    status?: string;
    required?: string;
    sort?: string;
    order?: string;
    page?: string;
    per_page?: string;
  };
}

export function AttributesFilters({ searchParams }: AttributesFiltersProps) {
  const [search, setSearch] = useState(searchParams.search || '');
  // Use 'all' sentinel for Select items instead of an empty string (Radix requires non-empty Item values)
  const [type, setType] = useState(searchParams.type || 'all');
  const [status, setStatus] = useState(searchParams.status || 'all');
  const [required, setRequired] = useState(searchParams.required || 'all');

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    
    if (search.trim()) params.set('search', search.trim());
    // Only set filters when they are not the 'all' sentinel
    if (type && type !== 'all') params.set('type', type);
    if (status && status !== 'all') params.set('status', status);
    if (required && required !== 'all') params.set('required', required);
    if (searchParams.sort) params.set('sort', searchParams.sort);
    if (searchParams.order) params.set('order', searchParams.order);
    if (searchParams.per_page) params.set('per_page', searchParams.per_page);
    
    // Reset to page 1 when applying filters
    params.set('page', '1');
    
    window.location.href = `?${params.toString()}`;
  };

  const handleClearFilters = () => {
    setSearch('');
    setType('all');
    setStatus('all');
    setRequired('all');
    window.location.href = window.location.pathname;
  };

  const hasActiveFilters = () => {
    return !!(
      search.trim() ||
      (type && type !== 'all') ||
      (status && status !== 'all') ||
      (required && required !== 'all')
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (search.trim()) count++;
    if (type && type !== 'all') count++;
    if (status && status !== 'all') count++;
    if (required && required !== 'all') count++;
    return count;
  };

  const attributeTypes = [
    { value: 'text', label: 'Text', icon: '📝' },
    { value: 'number', label: 'Number', icon: '🔢' },
    { value: 'select', label: 'Select', icon: '📋' },
    { value: 'boolean', label: 'Boolean', icon: '✅' },
    { value: 'color', label: 'Color', icon: '🎨' },
    { value: 'size', label: 'Size', icon: '📏' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const requiredOptions = [
    { value: 'true', label: 'Required' },
    { value: 'false', label: 'Optional' },
  ];

  return (
    <div className="space-y-4">
      {/* Search and Quick Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <Label htmlFor="search" className="sr-only">Search</Label>
          <div className="relative">
            <Input
              id="search"
              type="text"
              placeholder="Search attributes by name, description, or values..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleApplyFilters();
                }
              }}
              className="pr-10"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-muted-foreground">🔍</span>
            </div>
          </div>
        </div>

        {/* Type Filter */}
        <div className="w-full lg:w-48">
          <Label htmlFor="type" className="sr-only">Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {attributeTypes.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="w-full lg:w-32">
          <Label htmlFor="status" className="sr-only">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Required Filter */}
        <div className="w-full lg:w-32">
          <Label htmlFor="required" className="sr-only">Required</Label>
          <Select value={required} onValueChange={setRequired}>
            <SelectTrigger>
              <SelectValue placeholder="Required" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {requiredOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Apply/Clear Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleApplyFilters}>
            Apply
          </Button>
          {hasActiveFilters() && (
            <Button variant="outline" onClick={handleClearFilters}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {search && (
            <Badge variant="secondary" className="gap-1">
              Search: {'"'}{search}{'"'}
              <button
                onClick={() => {
                  setSearch('');
                  const params = new URLSearchParams(window.location.search);
                  params.delete('search');
                  window.location.href = `?${params.toString()}`;
                }}
                className="ml-1 hover:text-red-500"
              >
                ×
              </button>
            </Badge>
          )}

          {type && (
            <Badge variant="secondary" className="gap-1">
              Type: {attributeTypes.find(t => t.value === type)?.label}
              <button
                onClick={() => {
                  setType('');
                  const params = new URLSearchParams(window.location.search);
                  params.delete('type');
                  window.location.href = `?${params.toString()}`;
                }}
                className="ml-1 hover:text-red-500"
              >
                ×
              </button>
            </Badge>
          )}

          {status && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusOptions.find(s => s.value === status)?.label}
              <button
                onClick={() => {
                  setStatus('');
                  const params = new URLSearchParams(window.location.search);
                  params.delete('status');
                  window.location.href = `?${params.toString()}`;
                }}
                className="ml-1 hover:text-red-500"
              >
                ×
              </button>
            </Badge>
          )}

          {required && (
            <Badge variant="secondary" className="gap-1">
              {requiredOptions.find(r => r.value === required)?.label}
              <button
                onClick={() => {
                  setRequired('');
                  const params = new URLSearchParams(window.location.search);
                  params.delete('required');
                  window.location.href = `?${params.toString()}`;
                }}
                className="ml-1 hover:text-red-500"
              >
                ×
              </button>
            </Badge>
          )}

          <div className="text-sm text-muted-foreground">
            ({getActiveFiltersCount()} filter{getActiveFiltersCount() > 1 ? 's' : ''})
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 text-sm">
        {attributeTypes.map(type => (
          <div
            key={type.value}
            className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => {
              setType(type.value);
              handleApplyFilters();
            }}
          >
            <span className="text-lg">{type.icon}</span>
            <div>
              <div className="font-medium">{type.label}</div>
              <div className="text-muted-foreground">
                {/* Mock counts - would be real data in production */}
                {Math.floor(Math.random() * 20) + 1}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Per Page Selection */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="per-page" className="text-sm">Show:</Label>
          <Select
            value={searchParams.per_page || '20'}
            onValueChange={(value) => {
              const params = new URLSearchParams(window.location.search);
              params.set('per_page', value);
              params.set('page', '1'); // Reset to first page
              window.location.href = `?${params.toString()}`;
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="sort" className="text-sm">Sort by:</Label>
          <Select
            value={`${searchParams.sort || 'name'}-${searchParams.order || 'asc'}`}
            onValueChange={(value) => {
              const [sort, order] = value.split('-');
              const params = new URLSearchParams(window.location.search);
              params.set('sort', sort);
              params.set('order', order);
              window.location.href = `?${params.toString()}`;
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
              <SelectItem value="type-asc">Type A-Z</SelectItem>
              <SelectItem value="type-desc">Type Z-A</SelectItem>
              <SelectItem value="products-desc">Most Used</SelectItem>
              <SelectItem value="products-asc">Least Used</SelectItem>
              <SelectItem value="updated-desc">Recently Updated</SelectItem>
              <SelectItem value="updated-asc">Oldest Updated</SelectItem>
              <SelectItem value="created-desc">Recently Created</SelectItem>
              <SelectItem value="created-asc">Oldest Created</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}