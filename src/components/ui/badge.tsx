// src/components/ui/badge.tsx
// Badge Component - Flexible status indicators using Radix Color scales

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90',
        success: 'border-transparent bg-[var(--grass-9)] text-white hover:bg-[var(--grass-10)]',
        warning: 'border-transparent bg-[var(--amber-9)] text-[var(--amber-12)] hover:bg-[var(--amber-10)]',
        info: 'border-transparent bg-[var(--teal-9)] text-white hover:bg-[var(--teal-10)]',
        outline: 'text-foreground border-border hover:bg-accent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };