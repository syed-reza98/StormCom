# Quickstart — Harden Checkout, Tenancy, Newsletter

Date: 2025-11-13  
Branch: 002-harden-checkout-tenancy

## Prerequisites
- Node.js ≥ 20.0.0, npm ≥ 10.0.0
- Run `npm install`
- Configure `.env` from `.env.example` (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)

## Database
- Dev (SQLite):
  - `npm run db:push` (or `npx prisma db push`)
  - Optional: `npm run db:seed`
- Prod (PostgreSQL):
  - `npm run db:migrate`

## Development
- Start dev server:
  - `npm run dev`
- Type check:
  - `npm run type-check`
- Lint:
  - `npx eslint .`

## Testing
- **Unit/Integration**:
  - `npx vitest run`
  - Coverage: `npx vitest run --coverage` (requires ≥80% services, 100% utilities)
- **Migration Testing**:
  - Windows: `.\scripts\migration-test.ps1`
  - Linux/Mac: `./scripts/migration-test.sh`
  - Validates schema integrity, rollback safety, foreign keys, and indexes
  - Cleanup: `.\scripts\migration-test.ps1 -Cleanup`
- **E2E (Playwright)**:
  - `npx playwright install` (first time)
  - `npx playwright test`
  - Includes axe-core accessibility assertions (WCAG 2.1 AA)

## What to Verify (This Feature)
- **Checkout**: authentication required, server-side price recalculation, payment validation, atomic transaction.
- **Multi-tenancy**: domain/subdomain → storeId, subdomain → custom domain redirect, no hardcoded storeId.
- **Newsletter**: single opt-in, consent record, rate limiting, deduplication (email+store).
- **API responses**: standardized error shape, X-Request-Id header in all responses.
- **Audit Logging**: critical events tracked (order.created, payment.validated, checkout.completed) with requestId correlation.
- **Caching**: tag invalidation on product/category/page changes (uses Next.js 16 revalidateTag with 'max' profile).
- **CSV export**: ≤10k streamed; >10k async job with email + in-app notification.
- **Accessibility**: WCAG 2.1 AA on forms and analytics (<figure>/<figcaption>, aria-live), E2E tests include axe assertions.

## Audit Logging Usage

The audit service (`src/services/audit-service.ts`) provides comprehensive tracking for critical events:

```typescript
import { auditOrderCreated, auditPaymentValidated, auditCheckoutCompleted } from '@/services/audit-service';

// Track order creation
await auditOrderCreated(order.id, {
  totalAmount: order.total,
  status: order.status,
  itemsCount: order.items.length,
});

// Track payment validation
await auditPaymentValidated(paymentIntent.id, {
  amount: paymentIntent.amount,
  currency: paymentIntent.currency,
  status: 'validated',
});

// Track checkout completion
await auditCheckoutCompleted(order.id, {
  totalAmount: order.total,
  paymentMethod: 'stripe',
  shippingMethod: 'standard',
});
```

All audit logs automatically capture:
- `storeId` and `userId` from request context (via AsyncLocalStorage)
- `requestId` for correlation (stored in changes JSON)
- IP address and User-Agent
- Timestamp (createdAt)

Query audit logs:
```typescript
import { getAuditLogsForEntity, getAuditLogsForStore } from '@/services/audit-service';

// Get all logs for an order
const orderLogs = await getAuditLogsForEntity('Order', orderId);

// Get recent store activity
const storeLogs = await getAuditLogsForStore(storeId, { limit: 50 });
```

## Cache Invalidation Pattern

Product and category mutations automatically invalidate cache tags:

```typescript
// Granular tag: specific resource
revalidateTag(`product:${productId}`, 'max');

// List tag: all resources in store
revalidateTag(`products:list:store:${storeId}`, 'max');
```

Tags are invalidated after:
- `createProduct/createCategory` (list tag only)
- `updateProduct/updateCategory` (both granular + list)
- `deleteProduct/deleteCategory` (both granular + list)
- `permanentlyDeleteProduct` (both granular + list)

## CI Performance Gating (T044)

**Automatic Gating**: PRs that modify critical paths are automatically tested for performance regressions. If thresholds are breached, **PR merge is blocked** until fixed or override approved.

### When Tests Run

**k6 Load Tests** (`.github/workflows/k6-load-tests.yml`) trigger on changes to:
- `src/app/api/checkout/**` or `src/app/api/orders/**`
- `src/services/checkout-service.ts`, `pricing-service.ts`, `export-service.ts`, `payment-service.ts`

**Lighthouse CI** (`.github/workflows/lighthouse.yml`) triggers on changes to:
- `src/app/(storefront)/**` or `src/app/(dashboard)/**`
- `src/components/**`, `public/**`, or `lighthouserc*.js`

### Performance Thresholds (BLOCKING)

**k6 Load Testing**:
| Metric | Threshold | Severity |
|--------|-----------|----------|
| API Response (p95) | < 500ms | BLOCKING |
| Checkout Complete (p95) | < 650ms | BLOCKING |
| Error Rate | < 1% | BLOCKING |
| Success Rate | > 99% | BLOCKING |

**Lighthouse CI Budgets**:
| Metric | Desktop | Mobile | Severity |
|--------|---------|--------|----------|
| LCP | < 2.0s | < 2.5s | BLOCKING |
| FID | < 100ms | < 100ms | BLOCKING |
| CLS | < 0.1 | < 0.1 | BLOCKING |
| TTI | < 3.0s | < 3.5s | BLOCKING |
| Performance Score | ≥ 90 | ≥ 90 | BLOCKING |

### Local Testing Before PR

**k6 Load Tests**:
```bash
# Install k6 (one-time)
# Windows: choco install k6
# macOS: brew install k6
# Linux: snap install k6

# Run checkout load test
k6 run tests/performance/checkout-load-test.js

# Run streaming export test
k6 run tests/performance/export-streaming-test.js

# Run async export test
k6 run tests/performance/export-async-test.js
```

**Lighthouse CI**:
```bash
# Start dev server
npm run dev

# Run Lighthouse (desktop + mobile)
npm run lighthouse

# Or run individually
npx lhci autorun --config=lighthouserc.js          # Desktop
npx lhci autorun --config=lighthouserc.mobile.js   # Mobile
```

### If CI Tests Fail

**Merge Blocked**:
- PR status check shows ❌ FAILED
- PR comment includes detailed threshold violations
- Cannot merge until tests pass or override approved

**Emergency Bypass** (critical hotfix/security patch):
1. Add `[skip-perf]` to PR title
2. Get approval from Tech Lead + Product Owner
3. Create remediation issue (must fix within 4 weeks)
4. Document in PR description

**Standard Override** (acceptable temporary regression):
1. Add `[perf-override]` to PR title
2. Get approval from Tech Lead
3. Include justification in PR description
4. Create follow-up issue with target metrics

### Detailed Documentation

See **[docs/testing-strategy.md § CI Performance Gating](../../docs/testing-strategy.md)** for:
- Complete threshold breakdown
- Bypass procedures
- Troubleshooting common failures
- Monitoring and daily automated runs
- Constitution references (§118-120 k6, §128-134 Lighthouse)
