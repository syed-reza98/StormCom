/**
 * ProductSort Component
 * 
 * Provides sorting options for product listings.
 * Client Component for interactive dropdown.
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductSortProps {
  currentSort: {
    sortBy: string;
    sortOrder: string;
  };
}

export function ProductSort({ currentSort }: ProductSortProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sortOptions = [
    { value: 'createdAt-desc', label: 'Newest First' },
    { value: 'createdAt-asc', label: 'Oldest First' },
    { value: 'name-asc', label: 'Name: A to Z' },
    { value: 'name-desc', label: 'Name: Z to A' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'popular-desc', label: 'Most Popular' },
  ];

  const currentValue = `${currentSort.sortBy}-${currentSort.sortOrder}`;

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    params.delete('page'); // Reset to page 1 when sorting changes
    
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2" data-testid="product-sort">
      <label htmlFor="sort-select" className="text-sm font-medium whitespace-nowrap">
        Sort by:
      </label>
      <Select value={currentValue} onValueChange={handleSortChange}>
        <SelectTrigger id="sort-select" className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
