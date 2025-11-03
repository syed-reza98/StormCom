/**
 * Skeleton Component
 * 
 * Loading placeholder component for content that is being fetched.
 * Used for better perceived performance during async operations.
 * 
 * Based on shadcn-ui best practices with proper aria-live region
 */

import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to show a more subtle animation
   */
  subtle?: boolean;
}

export function Skeleton({ className, subtle = false, ...props }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading content"
      className={cn(
        'rounded-md bg-muted',
        subtle ? 'animate-pulse opacity-50' : 'animate-pulse',
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
