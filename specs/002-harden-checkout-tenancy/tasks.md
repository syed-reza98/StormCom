# Phase 2 Tasks — Harden Checkout, Tenancy, Newsletter

Date: 2025-11-13  
Branch: 002-harden-checkout-tenancy

This plan breaks the specification into implementable tasks with owners, concrete file targets, validation criteria, and tests. Each task references FR/SC items from the spec. Follow project standards in .github/instructions/* and constitution limits (files <300 lines, functions <50 lines, no any, WCAG AA, multi-tenant isolation).


## 0) Cross-cutting foundations

- T0.1 Add standardized API response helpers (FR-008, FR-021)
  - Files: `src/lib/api-response.ts` (new), wire-in in key routes
  - Implement success({ data, meta?, message? }), error({ code, message, details? })
  - Inject `X-Request-Id` header; expose helper to generate/propagate requestId
  - Tests: `tests/unit/api-response.test.ts`

- T0.2 Request context and correlation ID propagation (FR-021)
  - Files: `src/lib/request-context.ts` (new) using AsyncLocalStorage to store requestId, storeId
  - Adapter in proxy to seed requestId; server routes to pick it up
  - Tests: `tests/unit/request-context.test.ts`

- T0.3 Error class hierarchy and mapper (FR-008)
  - Files: `src/lib/errors.ts` (new) with typed AppError(code, httpStatus, details)
  - Mapper to JSON shape used by api-response
  - Tests: `tests/unit/errors.test.ts`


## 1) Secure Checkout hardening (P1)

- T1.1 Enforce authentication and tenant scope in checkout endpoints (FR-001, FR-009)
  - Files: `src/app/api/checkout/complete/route.ts`, `src/app/api/checkout/validate/route.ts`
  - Use `getServerSession(authOptions)`, reject 401 when not authenticated
  - Read storeId from session.user.storeId; remove body storeId usage
  - Add `dynamic = 'force-dynamic'` where route reads headers/cookies
  - Tests: `tests/integration/checkout-auth.test.ts`

- T1.2 Ignore client monetary fields; recalc all totals server-side (FR-002)
  - Files: `src/app/api/checkout/complete/route.ts`, `src/services/checkout-service.ts`
  - Remove acceptance of price/subtotal/taxes in request (keep only items[productId, variantId, quantity], addresses, shippingMethod)
  - Ensure `validateCart` and total calculation drive amounts exclusively
  - Tests: update `src/services/__tests__/checkout-service.test.ts` and add `tests/integration/checkout-recalc.test.ts` (send tampered prices → server ignores)

- T1.3 Validate payment intent/token before order creation (FR-003)
  - Files: `src/services/payment-service.ts` (add `preValidatePaymentIntent(paymentIntentId|token, expectedAmount, currency)`),
           `src/app/api/checkout/complete/route.ts`
  - Flow: compute totals → call preValidate → on success, create order in tx and create payment record with AUTHORIZED/PAID as appropriate
  - Tests: `tests/unit/payment-prevalidate.test.ts` (mock Stripe), `tests/integration/checkout-payment-guard.test.ts`

- T1.4 Wrap order+items+inventory+payment record in one atomic transaction (FR-004)
  - Files: `src/services/checkout-service.ts` (ensure `$transaction` covers inventory decrement and payment record write)
  - Add compensating safeguards: if any write fails, no partial data persists
  - Tests: `tests/integration/checkout-atomicity.test.ts` (fail inventory → no order created)

- T1.5 Plan enforcement at checkout (optional guard)
  - Files: `src/lib/plan-enforcement.ts` (already exists) — verify check and call before order create; return 402 equivalent error if over limit
  - Tests: `tests/unit/plan-enforcement.checkout.test.ts`


## 2) Multi-tenancy and canonical domains (P2)

- T2.1 Store resolution from host + canonical redirect (FR-005, FR-020)
  - Schema: add `StoreDomain` model
    - `id`, `storeId`, `domain` (unique), `isPrimary` (canonical), timestamps
  - Files: `prisma/schema.prisma` (model + `@@unique([domain])`), migration; seed example
  - Files: `src/lib/store-resolver.ts` (new): parse host, resolve `storeId` by domain OR `slug.subdomain`
  - Proxy: add canonical redirect: if request for subdomain and primary custom domain exists → 308 redirect
  - Tests: `tests/unit/store-resolver.test.ts`, `tests/integration/canonical-redirect.test.ts`

- T2.2 Remove hardcoded store IDs and enforce tenant scoping (FR-006, FR-009)
  - Sweep: search for `storeId: "..."` literals and replace with session context or resolver
  - Ensure Prisma middleware `registerMultiTenantMiddleware` is seeded via request context in API routes
  - Files: various services/routes; add minimal `setStoreIdContext()` calls in each API route’s handler entry
  - Tests: `tests/integration/tenant-isolation.test.ts` (cross-tenant access must fail)

- T2.3 Per-store dynamic metadata (FR-020)
  - Files: add `generateMetadata` in key storefront routes to pull store title/description/social image
  - Tests: `tests/integration/metadata-storefront.test.ts`


## 3) Newsletter subscription (P2)

- T3.1 Server Action for subscribe (single opt-in + consent + audit) (FR-007, FR-019)
  - Files: `src/app/(storefront)/newsletter/actions.ts` (new, 'use server') with Zod validation
  - Write to `Newsletter` with `@@unique([storeId,email])`; respect DNT header (process essential only)
  - Create `ConsentRecord` row and `AuditLog` for subscription
  - Rate limit: call simple limiter (100 rpm/IP) per store/email
  - Tests: `tests/integration/newsletter-action.test.ts` (valid/invalid/duplicate/DNT)

- T3.2 Minimal API endpoint for integrations (optional)
  - Files: `src/app/api/subscriptions/route.ts` — wrapper to call server action for external clients
  - Tests: `tests/integration/newsletter-api.test.ts`


## 4) API pipeline and consistency (P3)

- T4.1 Apply api-response and errors to selected routes (FR-008, FR-014, FR-015, FR-021)
  - Routes: orders, checkout, inventory, products (representative set)
  - Ensure `X-Request-Id` set on all responses; proxy seeds it if missing
  - Tests: `tests/integration/api-consistency.test.ts`

- T4.2 Proxy security headers/rate limit already present — extend to add requestId seeding
  - Files: `proxy.ts` (generate UUID v4 if header missing, store in ALS)
  - Tests: `tests/integration/request-id.test.ts`


## 5) Caching and invalidation (P3)

- T5.1 Cache tag util + invalidation (FR-011)
  - Files: `src/lib/cache-tags.ts` (new): helpers for tag name construction
  - On create/update/delete in product/category/page services → call `revalidateTag(tag, 'max')`
  - Tests: `tests/unit/cache-tags.test.ts`

- T5.2 Document phased Cache Components plan (FR-012)
  - Files: `docs/cache-components-plan.md` (new) — enablement guardrails and rollout


## 6) CSV export (P3)

- T6.1 Streaming for ≤10k, async for >10k (FR-016)
  - Files: `src/services/bulk-export-service.ts`, `src/app/api/orders/route.ts`
  - Implement row counting; if >10k, enqueue background job (existing job infra or stub) and notify via email + in-app `Notification`
  - Tests: `tests/integration/orders-export.test.ts` (mock dataset sizes)


## 7) Dashboard and accessibility polish (P3)

- T7.1 Redirect unauthenticated dashboard access (FR-017)
  - Already handled via proxy; add e2e coverage
  - Tests: `tests/e2e/auth-redirect.spec.ts`

- T7.2 Charts/analytics accessible markup (FR-018)
  - Files: targeted pages/components under `src/app/(dashboard)`
  - Wrap charts in `<figure>`/`<figcaption>` with textual summary; ensure focus rings
  - Tests: axe-core scan `tests/integration/a11y-analytics.test.ts`


## 8) Testing and coverage (P3)

- T8.1 Unit tests to ≥80% for services, 100% for utilities (FR-013)
  - Add/expand tests covering fraud scenarios, tenancy isolation, newsletter flows, standardized errors

- T8.2 E2E Playwright flows (checkout, tenancy, newsletter, export) (FR-013)
  - Files: `tests/e2e/checkout.spec.ts`, `tests/e2e/tenancy.spec.ts`, `tests/e2e/newsletter.spec.ts`, `tests/e2e/export.spec.ts`


## Deliverables checklist (tie to Success Criteria)

- [ ] SC-001 Security review passes: no high-severity findings in checkout/tenancy
- [ ] SC-002 Tenant isolation verified; no hardcoded store IDs
- [ ] SC-003 Checkout E2E validates server-side pricing; failure paths abort cleanly
- [ ] SC-004 Newsletter E2E: consent + audit + idempotency + rate limit + DNT
- [ ] SC-005 Middleware instrumentation confirms tenant scoping
- [ ] SC-006 Migrations apply cleanly; data integrity verified
- [ ] SC-007 API responses standardized + X-Request-Id everywhere
- [ ] SC-008 Cache invalidation proves timely updates
- [ ] SC-009 Coverage thresholds hit; tests in place
- [ ] SC-010 Perf & a11y budgets within thresholds
- [ ] SC-011 CSV export: streamed ≤10k, async >10k with email + in-app
- [ ] SC-012 Dashboard unauthenticated redirect verified
- [ ] SC-013 Per-store metadata present and validated
- [ ] SC-014 Analytics markup accessible


## Execution order (safe incremental rollout)

1) T0 foundations (responses, request context, errors)
2) T1 secure checkout (auth, recalc, payment pre-validate, atomic tx)
3) T2 store resolver + canonical redirect + tenant scoping sweep
4) T3 newsletter server action + endpoint
5) T4 API consistency + requestId propagation in proxy
6) T5 caching utilities + invalidations + docs
7) T6 CSV export streaming/async
8) T7 a11y polish
9) T8 testing/coverage expansion


## Notes and risks

- Payment pre-validation requires Stripe secret key; in dev/tests use mocks guarded by env fallbacks. Create `.env.local` placeholders if missing.
- Adding StoreDomain model introduces a migration; coordinate seed data and dev db push. Ensure backwards-compatible fallbacks (use `Store.slug` for subdomain if no domain records).
- Ensure Next.js 16 async params/searchParams and cookies/headers await semantics are preserved in any touched routes.
- Respect constitution size limits by extracting helper functions to utilities; avoid monolith handlers.
