import * as React from 'react';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormSuccessProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
}

export function FormSuccess({
  message,
  className,
  ...props
}: FormSuccessProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-2 rounded-md border border-success/50 bg-success/10 p-3 text-sm text-success',
        className
      )}
      {...props}
    >
      <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
