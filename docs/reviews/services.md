---
title: Services Review
sourcePath: src/services
category: services
riskLevel: medium
---

# Services Review

Files:
- analytics-service.ts
- attribute-service.ts
- audit-log-service.ts
- auth-service.ts
- brand-service.ts
- bulk-export-service.ts
- bulk-import-service.ts
- category-service.ts
- checkout-service.ts
- email-service.ts
- gdpr-service.ts
- integration-service.ts
- inventory-service.ts
- mfa-service.ts
- notification-service.ts
- order-service.ts
- payment-service.ts
- product-service.ts
- role-service.ts
- session-service.ts
- store-service.ts
- storefront-service.ts
- subscription-service.ts
- theme-service.ts
- __tests__/* (unit tests for several services)

Review Highlights (category-wide):
- Multi-tenancy: Ensure queries filter by storeId and respect soft delete (`deletedAt: null`). Tests indicate explicit storeId usage in product/category/order services.
- Validation: Prefer Zod schemas for inputs to services that accept external data (import/bulk operations, checkout, payments).
- Performance: Use `select` to limit payloads; paginate lists; avoid N+1 with batched queries; add indexes when query patterns evolve.
- Security: For auth/mfa/email, ensure secrets and tokens are handled via environment vars and encryption utilities (`lib/encryption`). Avoid logging sensitive data.
- Observability: Log key actions to `audit-log-service` for admin mutations. Add structured logs via `lib/logger`.
- Transactions: Wrap multi-step operations (checkout, inventory adjustments, order status changes) in transactions to maintain consistency.
- Error handling: Normalize service errors via `lib/api-response` or a common error class; provide safe messages up the stack.

Per-file notes (abbreviated):
- theme-service.ts: exposes getStoreTheme(storeId) and update paths; uses storeId filters. Confirm cache invalidation when theme updates.
- analytics-service.ts: verify heavy aggregations use proper indexes from schema; consider background jobs for long-running reports.
- checkout-service.ts: validate cart, stock, pricing; ensure idempotency for payment/complete (use webhook-idempotency).
- order-service.ts/payment-service.ts: ensure status transitions are validated; capture failure reasons; reconcile refunds consistently.
- bulk-import/export: apply streaming and CSV parsing limits; validate rows with Zod; track history for auditing.

Testing:
- Unit tests present for product, order, payment, checkout, category, brand services. Strive for ≥80% coverage across all services.
