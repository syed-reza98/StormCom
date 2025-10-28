// src/components/products/products-filters.tsx
// Products Filters Component - Search, category, brand, and other filters

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ProductsFiltersProps {
  searchParams: {
    page?: string;
    search?: string;
    categoryId?: string;
    brandId?: string;
    status?: string;
    minPrice?: string;
    maxPrice?: string;
    inventoryStatus?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

interface FilterOption {
  value: string;
  label: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProductsFilters({ searchParams }: ProductsFiltersProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();
  
  const [searchValue, setSearchValue] = useState(searchParams.search || '');
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [brands, setBrands] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      setLoading(true);
      try {
        const [categoriesRes, brandsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/brands'),
        ]);

        const [categoriesData, brandsData] = await Promise.all([
          categoriesRes.json(),
          brandsRes.json(),
        ]);

        if (categoriesData.data) {
          setCategories(categoriesData.data.map((cat: any) => ({
            value: cat.id,
            label: cat.name,
          })));
        }

        if (brandsData.data) {
          setBrands(brandsData.data.map((brand: any) => ({
            value: brand.id,
            label: brand.name,
          })));
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);

  // Update URL with new filters
  const updateFilters = (newFilters: Record<string, string | undefined>) => {
    const params = new URLSearchParams(currentSearchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change
    params.set('page', '1');

    router.push(`?${params.toString()}`);
  };

  // Handle search input
  const handleSearch = (value: string) => {
    setSearchValue(value);
    updateFilters({ search: value || undefined });
  };

  // Handle filter selection
  const handleFilterChange = (key: string, value: string | undefined) => {
    updateFilters({ [key]: value });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchValue('');
    router.push('/dashboard/products');
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    const filters = [
      'search', 'categoryId', 'brandId', 'status', 
      'minPrice', 'maxPrice', 'inventoryStatus'
    ];
    return filters.filter(key => searchParams[key as keyof typeof searchParams]).length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">🔍</span>
        <Input
          placeholder="Search products by name, SKU, or description..."
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Category
          </label>
          <select
            aria-label="Filter by category"
            value={searchParams.categoryId || ''}
            onChange={(e) => handleFilterChange('categoryId', e.target.value || undefined)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={loading}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Brand Filter */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Brand
          </label>
          <select
            aria-label="Filter by brand"
            value={searchParams.brandId || ''}
            onChange={(e) => handleFilterChange('brandId', e.target.value || undefined)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={loading}
          >
            <option value="">All Brands</option>
            {brands.map((brand) => (
              <option key={brand.value} value={brand.value}>
                {brand.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Status
          </label>
          <select
            aria-label="Filter by price range"
            value={searchParams.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {/* Inventory Status Filter */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Inventory
          </label>
          <select
            aria-label="Filter by stock status"
            value={searchParams.inventoryStatus || ''}
            onChange={(e) => handleFilterChange('inventoryStatus', e.target.value || undefined)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All Stock Levels</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Price Range Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Min Price
          </label>
          <Input
            type="number"
            placeholder="0.00"
            value={searchParams.minPrice || ''}
            onChange={(e) => handleFilterChange('minPrice', e.target.value || undefined)}
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Max Price
          </label>
          <Input
            type="number"
            placeholder="999.99"
            value={searchParams.maxPrice || ''}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value || undefined)}
            min="0"
            step="0.01"
          />
        </div>
      </div>

      {/* Active Filters & Clear */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied
            </span>
            <Badge variant="secondary">{activeFiltersCount}</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
          >
            ✕ Clear All
          </Button>
        </div>
      )}
    </div>
  );
}