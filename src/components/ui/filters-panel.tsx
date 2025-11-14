// src/components/ui/filters-panel.tsx
// Reusable Filters Panel component using Sheet
// Pattern: shadcn Sheet with form controls

'use client';

import { ReactNode } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FilterIcon, XIcon } from 'lucide-react';

interface FiltersPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  onApply?: () => void;
  onReset?: () => void;
  applyLabel?: string;
  resetLabel?: string;
  isLoading?: boolean;
}

export function FiltersPanel({
  open,
  onOpenChange,
  title = 'Filters',
  description = 'Refine your search with these filters',
  children,
  onApply,
  onReset,
  applyLabel = 'Apply Filters',
  resetLabel = 'Reset',
  isLoading = false,
}: FiltersPanelProps) {
  const handleApply = () => {
    if (onApply) {
      onApply();
    }
    onOpenChange(false);
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FilterIcon className="h-5 w-5" />
              <SheetTitle>{title}</SheetTitle>
            </div>
          </div>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] py-4">
          <div className="space-y-6 pr-4">
            {children}
          </div>
        </ScrollArea>

        <SheetFooter className="flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
            className="flex-1"
          >
            <XIcon className="h-4 w-4 mr-2" />
            {resetLabel}
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Applying...' : applyLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
