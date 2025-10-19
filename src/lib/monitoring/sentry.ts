import * as Sentry from '@sentry/nextjs';

/**
 * Sentry monitoring configuration
 * Provides error tracking, performance monitoring, and breadcrumbs
 */

// Check if Sentry is configured
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Initialize Sentry for client-side
 */
export function initSentryClient() {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    enabled: IS_PRODUCTION,
    tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: ['localhost', /^https:\/\/.*\.vercel\.app/],
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    beforeSend(event, hint) {
      // Filter out non-critical errors in development
      if (!IS_PRODUCTION && event.level === 'warning') {
        return null;
      }
      return event;
    },
  });
}

/**
 * Initialize Sentry for server-side
 */
export function initSentryServer() {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    enabled: IS_PRODUCTION,
    tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Prisma({ client: undefined }), // Will be configured later
    ],
    beforeSend(event, hint) {
      // Filter sensitive data
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });
}

/**
 * Add custom breadcrumb for multi-tenant context
 */
export function addTenantBreadcrumb(storeId: string, storeName?: string) {
  Sentry.addBreadcrumb({
    category: 'tenant',
    message: `Store context: ${storeName || storeId}`,
    level: 'info',
    data: { storeId, storeName },
  });
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(userId: string, email?: string, role?: string) {
  Sentry.setUser({
    id: userId,
    email,
    role,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Capture exception with additional context
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Add custom tags to events
 */
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

/**
 * Add custom context to events
 */
export function setContext(name: string, context: Record<string, any>) {
  Sentry.setContext(name, context);
}
