'use client';

import * as React from 'react';
import { captureError } from '@/lib/monitoring/sentry';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Error Boundary Props
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

/**
 * Error Fallback Props
 */
export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

/**
 * Error Boundary State
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Default Error Fallback Component
 * 
 * Displays a user-friendly error message with retry option.
 * Used when no custom fallback is provided.
 */
function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div
      className="flex min-h-[400px] flex-col items-center justify-center p-6"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-destructive/10 p-3">
          <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Something went wrong
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            We encountered an unexpected error. Our team has been notified and is working on a fix.
          </p>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 w-full max-w-2xl">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
              Error Details (Development Only)
            </summary>
            <pre className="mt-2 overflow-auto rounded-md bg-muted p-4 text-left text-xs text-muted-foreground">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}
        
        <Button
          onClick={resetError}
          variant="default"
          className="mt-4"
          aria-label="Try again"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

/**
 * React Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the component tree and displays
 * a fallback UI instead of crashing the entire application.
 * 
 * Features:
 * - Automatic error reporting to Sentry with stack traces
 * - User-friendly error message with retry functionality
 * - Development mode: Shows detailed error information
 * - Production mode: Generic error message (no stack trace exposure)
 * - Custom fallback UI support
 * - Error recovery via resetKeys (re-mount on key change)
 * 
 * Usage:
 * ```tsx
 * // Wrap components that might throw errors
 * <ErrorBoundary>
 *   <ProductList />
 * </ErrorBoundary>
 * 
 * // With custom fallback
 * <ErrorBoundary fallback={CustomErrorFallback}>
 *   <CheckoutForm />
 * </ErrorBoundary>
 * 
 * // With error handler
 * <ErrorBoundary onError={(error, errorInfo) => {
 *   console.error('Checkout error:', error);
 *   analytics.track('checkout_error', { error: error.message });
 * }}>
 *   <CheckoutFlow />
 * </ErrorBoundary>
 * 
 * // Auto-reset on dependency change
 * <ErrorBoundary resetKeys={[productId]}>
 *   <ProductDetails id={productId} />
 * </ErrorBoundary>
 * ```
 * 
 * @param props.children - Child components to protect with error boundary
 * @param props.fallback - Custom error fallback component
 * @param props.onError - Custom error handler (called before Sentry)
 * @param props.resetKeys - Array of values that trigger error reset when changed
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to Sentry
    captureError(error, {
      extra: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
      level: 'error',
    });
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error state if resetKeys change
    if (this.state.hasError && this.props.resetKeys) {
      const prevKeys = prevProps.resetKeys || [];
      const currentKeys = this.props.resetKeys;
      
      // Check if any reset key has changed
      const hasChangedKey = currentKeys.some(
        (key, index) => key !== prevKeys[index]
      );
      
      if (hasChangedKey) {
        this.resetError();
      }
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-Order Component: withErrorBoundary
 * 
 * Wraps a component with an error boundary for convenient usage.
 * 
 * @param Component - Component to wrap with error boundary
 * @param errorBoundaryProps - Error boundary configuration
 * 
 * @returns Wrapped component with error boundary
 * 
 * @example
 * ```tsx
 * const SafeProductList = withErrorBoundary(ProductList, {
 *   fallback: ProductListErrorFallback,
 *   onError: (error) => console.error('ProductList error:', error),
 * });
 * 
 * export default SafeProductList;
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name || 'Component'
  })`;

  return WrappedComponent;
}
