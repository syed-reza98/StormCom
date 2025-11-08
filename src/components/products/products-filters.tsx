// src/components/products/products-filters.tsx
// Products Filters Component - Search, category, brand, and other filters

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';

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

        const [rawCategoriesData, rawBrandsData] = await Promise.all([
          categoriesRes.json().catch(() => ({ error: true })),
          brandsRes.json().catch(() => ({ error: true })),
        ]);

        // Defensive parsing helpers -------------------------------------------------
        const extractArray = (input: any): any[] => {
          if (!input) return [];
          // Direct array
          if (Array.isArray(input)) return input;
          // Nested under data.categories (categories API design)
          if (Array.isArray(input.categories)) return input.categories;
          if (input.data) {
            if (Array.isArray(input.data)) return input.data;
            if (Array.isArray(input.data.categories)) return input.data.categories;
          }
          // Brands API returns data: Brand[] directly
          if (Array.isArray(input.data)) return input.data;
          return [];
        };

        const categoriesArray = extractArray(rawCategoriesData);
        const brandsArray = extractArray(rawBrandsData);

        if (categoriesArray.length) {
          setCategories(categoriesArray.map((cat: any) => ({
            value: String(cat.id),
            label: cat.name ?? 'Unnamed',
          })));
        } else {
          setCategories([]);
        }

        if (brandsArray.length) {
          setBrands(brandsArray.map((brand: any) => ({
            value: String(brand.id),
            label: brand.name ?? 'Unnamed',
          })));
        } else {
          setBrands([]);
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
    router.push('/products');
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
          <Select
            value={searchParams.categoryId || undefined}
            onValueChange={(val) => handleFilterChange('categoryId', val || undefined)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Brand Filter */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Brand
          </label>
          <Select
            value={searchParams.brandId || undefined}
            onValueChange={(val) => handleFilterChange('brandId', val || undefined)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((brand) => (
                <SelectItem key={brand.value} value={brand.value}>
                  {brand.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Status
          </label>
          <Select
            value={searchParams.status || undefined}
            onValueChange={(val) => handleFilterChange('status', val || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Inventory Status Filter */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Inventory
          </label>
          <Select
            value={searchParams.inventoryStatus || undefined}
            onValueChange={(val) => handleFilterChange('inventoryStatus', val || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Stock Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IN_STOCK">In Stock</SelectItem>
              <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
              <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
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