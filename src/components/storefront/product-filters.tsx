/**
 * ProductFilters Component
 * 
 * Provides filtering options for product browsing (category, price, stock status).
 * Client Component for interactive form elements.
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { StorefrontCategory } from '@/services/storefront-service';

interface ProductFiltersProps {
  categories: StorefrontCategory[];
  currentFilters: {
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  };
}

export function ProductFilters({ categories, currentFilters }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice?.toString() || '');
  const [selectedCategory, setSelectedCategory] = useState(currentFilters.categoryId || '');
  const [inStockOnly, setInStockOnly] = useState(currentFilters.inStock || false);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Remove page param when filters change
    params.delete('page');
    
    // Update filters
    if (selectedCategory) {
      params.set('category', selectedCategory);
    } else {
      params.delete('category');
    }
    
    if (minPrice) {
      params.set('minPrice', minPrice);
    } else {
      params.delete('minPrice');
    }
    
    if (maxPrice) {
      params.set('maxPrice', maxPrice);
    } else {
      params.delete('maxPrice');
    }
    
    if (inStockOnly) {
      params.set('inStock', 'true');
    } else {
      params.delete('inStock');
    }
    
    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedCategory('');
    setInStockOnly(false);
    
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    params.delete('minPrice');
    params.delete('maxPrice');
    params.delete('inStock');
    params.delete('page');
    
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="space-y-6" data-testid="product-filters">
      {/* Categories */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">Category</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="category-all"
              name="category"
              value=""
              checked={!selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-4 w-4"
            />
            <label htmlFor="category-all" className="text-sm cursor-pointer">
              All Categories
            </label>
          </div>
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <input
                type="radio"
                id={`category-${category.id}`}
                name="category"
                value={category.id}
                checked={selectedCategory === category.id}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-4 w-4"
              />
              <label
                htmlFor={`category-${category.id}`}
                className="text-sm cursor-pointer flex-1"
              >
                {category.name}
                {category.productCount > 0 && (
                  <span className="text-muted-foreground ml-1">
                    ({category.productCount})
                  </span>
                )}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">Price Range</Label>
        <div className="space-y-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            min="0"
            step="0.01"
          />
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>
      </div>

      {/* Stock Status */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">Availability</Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="in-stock"
            checked={inStockOnly}
            onCheckedChange={(checked) => setInStockOnly(checked as boolean)}
          />
          <label htmlFor="in-stock" className="text-sm cursor-pointer">
            In Stock Only
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-4 border-t">
        <Button onClick={applyFilters} className="w-full" data-testid="apply-filters">
          Apply Filters
        </Button>
        <Button
          onClick={clearFilters}
          variant="outline"
          className="w-full"
          data-testid="clear-filters"
        >
          Clear All
        </Button>
      </div>
    </div>
  );
}
