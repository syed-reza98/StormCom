// src/components/ui/checkbox.tsx
// Checkbox Component - Simple checkbox without external dependencies

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2',
          className
        )}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };