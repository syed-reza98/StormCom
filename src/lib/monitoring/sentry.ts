import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  integrations: [
    new Sentry.Integrations.Breadcrumbs({
      console: true,
      fetch: true,
      xhr: true,
    }),
    new Sentry.Integrations.Http({ tracing: true }),
  new Sentry.Integrations.Express(),
  ],
  tracesSampler: (samplingContext) => {
    // Sample all transactions for now; adjust for production
    return 1.0;
  },
});

export function addTenantBreadcrumb(storeId: string, userId?: string) {
  Sentry.addBreadcrumb({
    category: 'multi-tenant',
    message: `storeId: ${storeId}${userId ? ", userId: " + userId : ""}`,
    level: 'info',
  });
}

export default Sentry;
