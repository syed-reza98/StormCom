// src/app/(dashboard)/orders/error.tsx
// Error boundary for orders page

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function OrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Orders page error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-8 w-8" />
        <h2 className="text-2xl font-semibold">Error Loading Orders</h2>
      </div>
      <p className="text-muted-foreground text-center max-w-md">
        We couldn&apos;t load your orders at this time. Please try again.
      </p>
      {error.digest && (
        <p className="text-sm text-muted-foreground">
          Error ID: {error.digest}
        </p>
      )}
      <div className="flex gap-4">
        <Button onClick={reset}>
          Retry
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
