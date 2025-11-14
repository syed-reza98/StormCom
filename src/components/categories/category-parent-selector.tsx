'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Search } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
}

interface CategoryParentSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  categories: Category[];
  currentCategoryId?: string;
}

export function CategoryParentSelector({
  value,
  onChange,
  categories,
  currentCategoryId,
}: CategoryParentSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter out current category and its descendants
  const getDescendantIds = (catId: string): string[] => {
    const children = categories.filter((c) => c.parentId === catId);
    return [catId, ...children.flatMap((child) => getDescendantIds(child.id))];
  };

  const validCategories = currentCategoryId
    ? categories.filter(
        (c) => !getDescendantIds(currentCategoryId).includes(c.id)
      )
    : categories;

  const filteredCategories = validCategories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Label>Parent Category</Label>
      <div className="flex gap-2">
        <Select value={value || 'root'} onValueChange={(v) => onChange(v === 'root' ? null : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select parent category" />
          </SelectTrigger>
          <SelectContent>
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <SelectItem value="root">Root (No Parent)</SelectItem>
            {filteredCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {'  '.repeat(category.level)}{category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {value && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => onChange(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
