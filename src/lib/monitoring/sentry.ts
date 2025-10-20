import * as Sentry from '@sentry/nextjs';

/**
 * Sentry Monitoring Configuration
 * 
 * Provides centralized error tracking, performance monitoring, and breadcrumb logging
 * for the StormCom multi-tenant e-commerce platform.
 * 
 * Features:
 * - Error tracking with stack traces and context
 * - Performance monitoring with transaction tracing
 * - Multi-tenant context in breadcrumbs (storeId, userId, role)
 * - Environment-aware initialization (production only by default)
 * - Custom error boundaries for React components
 * 
 * Environment Variables Required:
 * - NEXT_PUBLIC_SENTRY_DSN: Sentry project DSN
 * - SENTRY_AUTH_TOKEN: Auth token for source map uploads (build-time only)
 * - NEXT_PUBLIC_SENTRY_ENVIRONMENT: Environment name (production, staging, development)
 * 
 * Usage:
 * ```ts
 * import { captureError, addBreadcrumb, addTenantContext } from '@/lib/monitoring/sentry';
 * 
 * // Add tenant context to all subsequent events
 * addTenantContext({ storeId: 'store_123', userId: 'user_456', role: 'STORE_ADMIN' });
 * 
 * // Add custom breadcrumb
 * addBreadcrumb({
 *   message: 'User updated product',
 *   category: 'product',
 *   data: { productId: 'prod_789', action: 'update' }
 * });
 * 
 * // Capture error with context
 * try {
 *   await createOrder(orderData);
 * } catch (error) {
 *   captureError(error, { orderId: 'order_123', amount: 99.99 });
 * }
 * ```
 */

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development';
const IS_PRODUCTION = SENTRY_ENVIRONMENT === 'production';

/**
 * Initialize Sentry client
 * 
 * Should be called once at application startup.
 * Automatically called by sentry.client.config.ts and sentry.server.config.ts.
 * 
 * Configuration:
 * - Sample rate: 100% errors, 10% transactions (adjustable per environment)
 * - Release tracking: Uses VERCEL_GIT_COMMIT_SHA for deploy identification
 * - Integrations: BrowserTracing for performance, Replay for session recording (errors only)
 */
export function initSentry(isServer: boolean = false) {
  if (!SENTRY_DSN) {
    console.warn('[Sentry] DSN not configured. Monitoring disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    
    // Release tracking (uses Vercel deployment SHA)
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    
    // Error sampling: 100% in production, 100% in dev
    tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
    
    // Performance monitoring sampling: 10% in production, 100% in dev
    // Reduces costs while maintaining visibility
    sampleRate: 1.0,
    
    // Enable debug mode in development
    debug: !IS_PRODUCTION,
    
    // Ignore common non-critical errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      'cancelled',
      'AbortError',
    ],
    
    // Configure integrations
    integrations: isServer
      ? [] // Server-side: minimal integrations
      : [
          // Browser-only: performance tracing
          Sentry.browserTracingIntegration({
            // Trace all navigation and API requests
            // tracePropagationTargets is now handled automatically
          }),
          
          // Session replay for error debugging (errors only, not all sessions)
          Sentry.replayIntegration({
            maskAllText: true, // GDPR compliance: mask user text
            blockAllMedia: true, // Don't record images/videos
            maskAllInputs: true, // Mask form inputs (PII protection)
          }),
        ],
    
    // Session replay sampling: Only capture sessions with errors
    replaysSessionSampleRate: 0.0, // Don't record normal sessions
    replaysOnErrorSampleRate: 1.0, // Record 100% of error sessions
    
    // Add custom context to all events
    beforeSend(event) {
      // Filter out specific errors in development
      if (!IS_PRODUCTION && event.exception) {
        const errorMessage = event.exception.values?.[0]?.value || '';
        if (errorMessage.includes('Hydration') || errorMessage.includes('minified React error')) {
          return null; // Don't send to Sentry
        }
      }
      
      return event;
    },
  });
}

/**
 * Add multi-tenant context to Sentry scope
 * 
 * Call this after user authentication to add store and user context
 * to all subsequent error reports and breadcrumbs.
 * 
 * @param context - Tenant context (storeId, userId, role, email, storeName)
 * 
 * @example
 * ```ts
 * const session = await getServerSession(authOptions);
 * if (session?.user) {
 *   addTenantContext({
 *     userId: session.user.id,
 *     email: session.user.email,
 *     role: session.user.role,
 *     storeId: session.user.storeId,
 *     storeName: session.user.storeName,
 *   });
 * }
 * ```
 */
export function addTenantContext(context: {
  storeId?: string;
  storeName?: string;
  userId?: string;
  email?: string;
  role?: string;
}) {
  Sentry.setContext('tenant', {
    storeId: context.storeId,
    storeName: context.storeName,
    role: context.role,
  });
  
  Sentry.setUser({
    id: context.userId,
    email: context.email,
    username: context.email,
  });
  
  // Add breadcrumb for context change
  Sentry.addBreadcrumb({
    category: 'auth',
    message: 'Tenant context updated',
    level: 'info',
    data: {
      storeId: context.storeId,
      role: context.role,
    },
  });
}

/**
 * Clear tenant context from Sentry scope
 * 
 * Call this on logout to prevent cross-user data leakage.
 * 
 * @example
 * ```ts
 * await signOut({ redirect: false });
 * clearTenantContext();
 * ```
 */
export function clearTenantContext() {
  Sentry.setContext('tenant', null);
  Sentry.setUser(null);
  
  Sentry.addBreadcrumb({
    category: 'auth',
    message: 'Tenant context cleared (logout)',
    level: 'info',
  });
}

/**
 * Add custom breadcrumb for debugging
 * 
 * Breadcrumbs provide a trail of events leading up to an error.
 * Use this to track important user actions, API calls, or state changes.
 * 
 * @param breadcrumb - Breadcrumb data (message, category, level, data)
 * 
 * @example
 * ```ts
 * addBreadcrumb({
 *   message: 'Product updated',
 *   category: 'product',
 *   level: 'info',
 *   data: { productId: 'prod_123', changes: ['price', 'stock'] }
 * });
 * ```
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';
  data?: Record<string, unknown>;
}) {
  Sentry.addBreadcrumb({
    message: breadcrumb.message,
    category: breadcrumb.category || 'custom',
    level: breadcrumb.level || 'info',
    data: breadcrumb.data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture error with custom context
 * 
 * Use this to manually report errors with additional context data.
 * 
 * @param error - Error object or message string
 * @param context - Additional context data (tags, extra, level)
 * 
 * @example
 * ```ts
 * try {
 *   await processPayment(paymentData);
 * } catch (error) {
 *   captureError(error, {
 *     tags: { paymentGateway: 'stripe', currency: 'USD' },
 *     extra: { amount: 99.99, orderId: 'order_123' },
 *     level: 'error',
 *   });
 *   throw error;
 * }
 * ```
 */
export function captureError(
  error: Error | string,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  }
) {
  Sentry.withScope((scope) => {
    // Add tags for filtering in Sentry UI
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    
    // Add extra context data
    if (context?.extra) {
      scope.setContext('extra', context.extra);
    }
    
    // Set severity level
    if (context?.level) {
      scope.setLevel(context.level);
    }
    
    // Capture error or message
    if (typeof error === 'string') {
      Sentry.captureMessage(error, context?.level || 'error');
    } else {
      Sentry.captureException(error);
    }
  });
}

/**
 * Start a performance transaction
 * 
 * Use this to measure the performance of specific operations.
 * Transactions appear in Sentry's Performance dashboard.
 * 
 * @param name - Transaction name (e.g., 'checkout.process', 'product.import')
 * @param op - Operation type (e.g., 'http.server', 'db.query', 'task')
 * 
 * @returns Span object with end() method
 * 
 * @example
 * ```ts
 * const transaction = startTransaction('order.create', 'http.server');
 * try {
 *   await createOrder(orderData);
 * } catch (error) {
 *   throw error;
 * } finally {
 *   transaction.end();
 * }
 * ```
 */
export function startTransaction(name: string, op: string = 'task') {
  return Sentry.startSpan({ name, op }, (span) => span);
}

/**
 * Wrap async function with Sentry transaction
 * 
 * Convenience wrapper for automatic transaction tracking.
 * 
 * @param name - Transaction name
 * @param fn - Async function to wrap
 * 
 * @returns Promise with function result
 * 
 * @example
 * ```ts
 * const result = await withTransaction('product.bulkImport', async () => {
 *   return await importProducts(csvData);
 * });
 * ```
 */
export async function withTransaction<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return await Sentry.startSpan({ name, op: 'task' }, async () => {
    try {
      return await fn();
    } catch (error) {
      captureError(error as Error, { tags: { transaction: name } });
      throw error;
    }
  });
}

// Export Sentry namespace for direct access if needed
export { Sentry };
