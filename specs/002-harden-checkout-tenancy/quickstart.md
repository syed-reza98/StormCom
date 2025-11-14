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
