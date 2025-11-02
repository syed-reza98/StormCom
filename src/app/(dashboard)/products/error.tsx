// src/app/(dashboard)/products/error.tsx
// Error boundary for products page

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error tracking service
    console.error('Products page error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-8 w-8" />
        <h2 className="text-2xl font-semibold">Something went wrong!</h2>
      </div>
      <p className="text-muted-foreground text-center max-w-md">
        We encountered an error while loading your products. This could be a temporary issue.
      </p>
      {error.digest && (
        <p className="text-sm text-muted-foreground">
          Error ID: {error.digest}
        </p>
      )}
      <div className="flex gap-4">
        <Button onClick={reset}>
          Try again
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
