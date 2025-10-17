# Technical Research: StormCom Multi-tenant E-commerce Platform

**Feature**: StormCom Multi-tenant E-commerce  
**Date**: 2025-10-17  
**Phase**: 0 - Research & Technical Decisions

## Overview

This document resolves all "NEEDS CLARIFICATION" items from the Technical Context in `plan.md`. Each decision is based on research into best practices, ecosystem maturity, cost-effectiveness, and alignment with the project's tech stack (Next.js 15.5.5, TypeScript, Vercel deployment).

---

## 1. Transactional Email Service

### Decision
**Resend** (https://resend.com)

### Rationale
- **Native Next.js integration**: Official SDK with TypeScript support, works seamlessly with Next.js API routes and Server Actions
- **Developer experience**: Simple API, React Email integration for email templates (JSX/TSX instead of HTML)
- **Vercel-optimized**: Built by Vercel team members, optimized for serverless functions
- **Generous free tier**: 3,000 emails/month free, then $20/month for 50,000 emails (cost-effective for MVP)
- **Modern API**: RESTful API with proper error handling, webhooks for delivery status
- **Domain authentication**: Built-in SPF/DKIM setup, subdomain verification

### Alternatives Considered
| Service | Pros | Cons | Verdict |
|---------|------|------|---------|
| **SendGrid** | Mature, 100/day free tier, robust | Complex API, outdated SDK, expensive at scale | ❌ Rejected - Poor DX |
| **Mailgun** | Reliable, good deliverability | No React Email support, basic free tier | ❌ Rejected - No template tooling |
| **AWS SES** | Very cheap ($0.10/1000 emails) | Requires AWS setup, no templates, complex auth | ❌ Rejected - Operational overhead |
| **Postmark** | Excellent deliverability | No free tier, $15/month minimum | ❌ Rejected - Cost for MVP |

### Implementation Notes
```typescript
// Install: npm install resend react-email
// Usage in API route or Server Action
import { Resend } from 'resend';
import { OrderConfirmationEmail } from '@/emails/OrderConfirmation';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'orders@yourdomain.com',
  to: customer.email,
  subject: `Order #${order.number} Confirmed`,
  react: OrderConfirmationEmail({ order, customer }),
});
```

**Email Templates**: Use React Email (https://react.email) for type-safe, component-based email templates stored in `/emails/` directory.

---

## 2. File Storage Solution

### Decision
**Vercel Blob Storage** (https://vercel.com/docs/storage/vercel-blob)

### Rationale
- **Zero-config integration**: Native Vercel service, no third-party accounts needed
- **Edge-optimized**: Global CDN with automatic caching, reduces latency for image serving
- **Simple SDK**: Official `@vercel/blob` package with TypeScript support
- **Generous free tier**: 100GB bandwidth/month, 1GB storage free (Pro: 1TB bandwidth, 100GB storage)
- **Built-in transformations**: Image optimization via Vercel Image Optimization API
- **Secure**: Signed URLs for private files, automatic HTTPS

### Alternatives Considered
| Service | Pros | Cons | Verdict |
|---------|------|------|---------|
| **AWS S3** | Mature, very cheap ($0.023/GB) | Requires AWS account, complex IAM, no CDN included | ❌ Rejected - Operational complexity |
| **Cloudinary** | Advanced image transforms, DAM | Expensive ($89/month after free tier), overkill | ❌ Rejected - Cost + complexity |
| **UploadThing** | Next.js-focused, good DX | Smaller free tier (2GB), less mature | ⚠️ Fallback option |
| **Supabase Storage** | Generous free tier (100GB) | Requires Supabase account, not Vercel-native | ❌ Rejected - Adds external dependency |

### Implementation Notes
```typescript
// Install: npm install @vercel/blob
import { put, del } from '@vercel/blob';

// Upload product image
const blob = await put(`products/${productId}/${file.name}`, file, {
  access: 'public',
  contentType: file.type,
});
// Returns: { url: 'https://...', downloadUrl: '...', pathname: '...' }

// Delete image
await del(blob.url);
```

**Image Optimization**: Use Next.js `<Image>` component with Vercel Image Optimization for automatic WebP conversion, responsive sizing, and lazy loading.

**Storage Organization**:
```
/stores/{storeId}/products/{productId}/{filename}
/stores/{storeId}/orders/{orderId}/invoices/{filename}.pdf
/stores/{storeId}/themes/{themeId}/{asset}
```

---

## 3. Background Job Queue System

### Decision
**Inngest** (https://www.inngest.com)

### Rationale
- **Serverless-native**: Designed for serverless environments (Vercel, Cloudflare Workers), no infrastructure to manage
- **Type-safe**: Full TypeScript support with typed events and functions
- **Built-in features**: Automatic retries, exponential backoff, cron scheduling, rate limiting, debouncing
- **Developer experience**: Simple API, local development mode, visual debugger
- **Generous free tier**: 10,000 function runs/month, 1M events/month (enough for MVP)
- **Durability**: Persists job state, handles long-running tasks (up to 24 hours)
- **No polling**: Event-driven architecture, webhook-based triggers

### Alternatives Considered
| Service | Pros | Cons | Verdict |
|---------|------|------|---------|
| **Vercel Cron** | Native, free, simple | No queue, no retries, max 10s execution | ❌ Rejected - Too limited |
| **BullMQ** | Feature-rich, popular | Requires Redis, not serverless-friendly | ❌ Rejected - Infrastructure overhead |
| **Quirrel** | Serverless-focused | Deprecated/inactive project | ❌ Rejected - No longer maintained |
| **Trigger.dev** | Modern, good DX | Newer service, smaller community | ⚠️ Fallback option |

### Implementation Notes
```typescript
// Install: npm install inngest
import { Inngest } from 'inngest';

const inngest = new Inngest({ id: 'stormcom' });

// Define background function
export const autoCancelUnpaidOrders = inngest.createFunction(
  { id: 'auto-cancel-unpaid-orders' },
  { cron: '*/5 * * * *' }, // Every 5 minutes
  async ({ step }) => {
    const unpaidOrders = await step.run('fetch-unpaid-orders', async () => {
      return await prisma.order.findMany({
        where: {
          status: 'pending',
          createdAt: { lt: new Date(Date.now() - 60 * 60 * 1000) }, // 1 hour old
        },
      });
    });

    await step.run('cancel-orders', async () => {
      // Cancel orders and restore inventory
    });
  }
);
```

**Use Cases**:
- Auto-cancel unpaid orders (cron: every 5 minutes)
- Abandoned cart recovery (cron: daily)
- Email notification queue (event-driven)
- Webhook retry logic (event-driven with retries)
- Low stock alerts (event-driven)
- Plan expiration checks (cron: daily)
- External platform sync (event-driven)

---

## 4. Product Search Engine

### Decision
**Database Full-Text Search (Phase 1) → Algolia (Phase 2 optional upgrade)**

### Rationale
**Phase 1: PostgreSQL Full-Text Search**
- **Zero additional cost**: Included with PostgreSQL, no third-party service
- **Sufficient for MVP**: Handles 10K products per store with acceptable performance (<1s search)
- **Simple implementation**: Prisma supports full-text search via `@@fulltext` index
- **No external dependencies**: Reduces complexity and failure points

**Phase 2: Algolia (Optional Upgrade)**
- **Best-in-class search**: Typo tolerance, instant results, advanced ranking
- **Scalability**: Sub-50ms search on millions of records
- **Free tier**: 10,000 searches/month, 10,000 records (good for testing)
- **Pricing**: $0.50/1000 searches after free tier (cost-effective at scale)

### Alternatives Considered
| Service | Pros | Cons | Verdict |
|---------|------|------|---------|
| **Elasticsearch** | Powerful, open-source | Requires hosting, expensive, complex | ❌ Rejected - Operational overhead |
| **Typesense** | Fast, open-source, cheaper | Requires hosting or $0.03/hr cloud | ⚠️ Alternative to Algolia |
| **Meilisearch** | Excellent DX, open-source | Requires hosting, smaller community | ⚠️ Alternative to Algolia |
| **PostgreSQL FTS** | Free, simple, good enough | Limited features vs dedicated search | ✅ Phase 1 choice |

### Implementation Notes

**Phase 1: PostgreSQL Full-Text Search**
```prisma
// prisma/schema.prisma
model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  // ... other fields
  
  @@fulltext([name, description])
  @@index([storeId, name])
}
```

```typescript
// Search products with Prisma
const products = await prisma.product.findMany({
  where: {
    storeId,
    OR: [
      { name: { search: searchQuery } },
      { description: { search: searchQuery } },
    ],
  },
  take: 24,
  skip: (page - 1) * 24,
});
```

**Phase 2: Algolia Integration (Optional)**
```typescript
// Install: npm install algoliasearch
import algoliasearch from 'algoliasearch';

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID!,
  process.env.ALGOLIA_ADMIN_KEY!
);

const index = client.initIndex('products');

// Sync product to Algolia on create/update
await index.saveObject({
  objectID: product.id,
  storeId: product.storeId,
  name: product.name,
  description: product.description,
  price: product.price,
  // ... other searchable fields
});
```

**Search Performance Target**: <1s search response time for Phase 1 (database), <300ms for Phase 2 (Algolia).

---

## 5. Monitoring & Observability (APM/Logging)

### Decision
**Vercel Analytics + Sentry** (hybrid approach)

### Rationale
**Vercel Analytics** (for performance monitoring)
- **Native integration**: Zero-config for Next.js on Vercel
- **Web Vitals tracking**: LCP, FID, CLS, TTFB automatically collected
- **Real User Monitoring (RUM)**: Actual user performance data, not synthetic
- **Free tier**: Included with all Vercel plans
- **Audience Insights**: Track by geography, device, browser

**Sentry** (for error tracking & logging)
- **Best-in-class error tracking**: Source maps, stack traces, breadcrumbs
- **Distributed tracing**: Track requests across services (API → database → external APIs)
- **Performance monitoring**: Transaction profiling, slow queries detection
- **Generous free tier**: 5,000 errors/month, 10,000 transactions/month (sufficient for MVP)
- **Pricing**: $26/month for 50K errors after free tier (cost-effective)
- **Integrations**: Slack, GitHub, PagerDuty for alerting

### Alternatives Considered
| Service | Pros | Cons | Verdict |
|---------|------|------|---------|
| **DataDog** | Enterprise-grade, comprehensive | Expensive ($15/host + $0.10/GB logs) | ❌ Rejected - Overkill + cost |
| **New Relic** | Full APM suite | Complex setup, expensive at scale | ❌ Rejected - Cost + complexity |
| **Logtail (Better Stack)** | Modern, affordable | Smaller ecosystem, newer service | ⚠️ Alternative for logs |
| **Axiom** | Serverless-native, fast | Smaller community, less mature | ⚠️ Alternative for logs |
| **LogRocket** | Session replay, amazing DX | Expensive ($99/month after trial) | ❌ Rejected - Cost |

### Implementation Notes

**Vercel Analytics**
```typescript
// Install: npm install @vercel/analytics
// In app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Sentry Setup**
```typescript
// Install: npm install @sentry/nextjs
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0, // 100% in dev, reduce in prod (0.1 = 10%)
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of errors
});
```

**Logging Strategy**:
- **Errors**: Sentry for all exceptions with context (user, store, request)
- **Performance**: Vercel Analytics for Web Vitals, Sentry for API transaction profiling
- **Business Metrics**: Custom events in Sentry (e.g., order placed, payment failed)
- **Audit Logs**: Database storage (immutable append-only table) for compliance

**Alerting**:
- Sentry → Slack for critical errors (payment failures, auth errors, sync failures)
- Uptime monitoring: Vercel built-in + UptimeRobot (external check)
- Threshold alerts: >100 errors/hour, >5s p95 API response time, >10% order failures

---

## Summary of Technical Decisions

| Component | Phase 1 Decision | Phase 2 Enhancement | Rationale |
|-----------|------------------|---------------------|-----------|
| **Email** | Resend | - | Native Next.js, React Email, generous free tier |
| **File Storage** | Vercel Blob | - | Zero-config, edge-optimized, included with Vercel |
| **Background Jobs** | Inngest | - | Serverless-native, type-safe, built-in retries |
| **Search** | PostgreSQL FTS | Algolia (optional) | Start simple, upgrade if needed for scale/features |
| **Monitoring** | Vercel Analytics + Sentry | - | Best hybrid: performance (Vercel) + errors (Sentry) |

**Total Monthly Cost (MVP Phase 1)**:
- Resend: $0 (under 3,000 emails/month)
- Vercel Blob: $0 (under 100GB bandwidth/month)
- Inngest: $0 (under 10,000 function runs/month)
- PostgreSQL FTS: $0 (included with database)
- Vercel Analytics: $0 (included with Vercel Pro plan)
- Sentry: $0 (under 5,000 errors/month)

**Estimated Cost at Scale (1,000 stores, 100K orders/month)**:
- Resend: ~$100/month (250K emails/month)
- Vercel Blob: ~$20/month (500GB bandwidth)
- Inngest: ~$50/month (100K function runs)
- Algolia (if upgraded): ~$150/month (300K searches)
- Sentry: ~$50/month (100K errors/month)
- **Total**: ~$370/month external services (plus Vercel hosting)

---

## Next Steps

All technical dependencies resolved. Proceed to **Phase 1: Design & Contracts**:
1. Generate `data-model.md` (database schema from entities in spec)
2. Generate API contracts in `/contracts/` (OpenAPI spec from functional requirements)
3. Generate `quickstart.md` (setup and development guide)
4. Update Copilot agent context with new technology decisions
