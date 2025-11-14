'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface FilterOption {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'text' | 'date-range';
  options?: Array<{ value: string; label: string }>;
  value?: any;
}

interface ProductFiltersProps {
  filters: FilterOption[];
  onFiltersChange: (filters: FilterOption[]) => void;
  onReset: () => void;
  activeFiltersCount?: number;
  className?: string;
}

export function ProductFilters({
  filters,
  onFiltersChange,
  onReset,
  activeFiltersCount = 0,
  className,
}: ProductFiltersProps) {
  const [localFilters, setLocalFilters] = React.useState(filters);

  const handleFilterChange = (filterId: string, value: any) => {
    const updated = localFilters.map((filter) =>
      filter.id === filterId ? { ...filter, value } : filter
    );
    setLocalFilters(updated);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleReset = () => {
    const reset = localFilters.map((filter) => ({ ...filter, value: undefined }));
    setLocalFilters(reset);
    onReset();
  };

  const renderFilterInput = (filter: FilterOption) => {
    switch (filter.type) {
      case 'select':
        return (
          <Select
            value={filter.value || ''}
            onValueChange={(value) => handleFilterChange(filter.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${filter.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'text':
        return (
          <Input
            value={filter.value || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            placeholder={`Search ${filter.label.toLowerCase()}...`}
          />
        );

      case 'multiselect':
        // Simplified multiselect - would use a proper multiselect component in production
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(filter.value || []).includes(option.value)}
                  onChange={(e) => {
                    const current = filter.value || [];
                    const updated = e.target.checked
                      ? [...current, option.value]
                      : current.filter((v: string) => v !== option.value);
                    handleFilterChange(filter.id, updated);
                  }}
                  className="rounded"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className={className}>
          <Search className="mr-2 h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter Products</SheetTitle>
          <SheetDescription>
            Refine your product list with advanced filters
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {localFilters.map((filter) => (
            <div key={filter.id} className="space-y-2">
              <Label>{filter.label}</Label>
              {renderFilterInput(filter)}
            </div>
          ))}

          <Separator />

          <div className="flex gap-2">
            <Button onClick={handleApply} className="flex-1">
              Apply Filters
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={activeFiltersCount === 0}
            >
              <X className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
