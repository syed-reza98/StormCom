# Tasks: Harden Checkout, Tenancy, and Newsletter

Generated from `specs/002-harden-checkout-tenancy/spec.md` and `plan.md`.

Total tasks: 42 (grouped by phase and user story)

## Phase 1: Setup
- [ ] T001 Initialize feature workspace and artifacts (create `specs/002-harden-checkout-tenancy/artifacts/`)
- [ ] T002 [P] Create scaffolding for logs and request correlation header in `src/lib/request-context.ts`
- [ ] T003 Add CI coverage gating placeholders in `.github/workflows/` for this branch (copy `ci` template) and document in `specs/002-harden-checkout-tenancy/quickstart.md`

## Phase 2: Foundational (blocking prerequisites)
- [ ] T004 [P] Create domain->store resolver at `src/lib/store/resolve-store.ts`
- [ ] T005 [P] Add server-side pricing service at `src/services/pricing-service.ts` (recalculate line items, discounts, shipping, taxes)
- [ ] T006 [P] Add transaction wrapper helper `src/services/transaction.ts` to centralize `prisma.$transaction` usage
- [ ] T007 [P] Create minimal error class scaffolding `src/lib/errors.ts` (BaseError + placeholders)
- [ ] T008 [P] Create API response mapper skeleton `src/lib/error-response.ts` and `src/lib/api-response.ts`
- [ ] T009 [P] Create cache tag registry `src/lib/cache/tags.ts` (initial tags: products, categories, pages)

## Phase 3: User Story Implementation (Priority Order)

### User Story 1 (US1) — Shopper completes a secure checkout (Priority: P1)
- [ ] T010 [US1] Refactor checkout route to require session auth and `storeId` at `src/app/api/checkout/complete/route.ts`
- [ ] T011 [US1] Replace client-trusted monetary acceptance: wire `src/app/api/checkout/complete/route.ts` to call `src/services/pricing-service.ts` to recalc totals
- [ ] T012 [US1] Integrate payment intent pre-validation adapter at `src/services/payments/intent-validator.ts`
- [ ] T013 [US1] Refactor checkout flow to use `src/services/transaction.ts` and include order, items, inventory decrement, discount mark, payment record (edit `src/services/checkout-service.ts`)
- [ ] T014 [US1] Add integration tests `tests/integration/checkout/checkout-atomic.spec.ts` (rollback on payment validation failure)
- [ ] T015 [US1] Add E2E tamper test `tests/e2e/checkout/tamper.spec.ts` to attempt client price override and assert server recalculation

### User Story 2 (US2) — Tenant isolation & canonical domains (Priority: P2)
- [ ] T016 [US2] Implement mapping model `prisma` migration change: `StoreDomain` model and seed script adjustments (`prisma/schema.prisma` + `prisma/migrations/`)
- [ ] T017 [US2] Implement store resolution middleware integration in `proxy.ts` to set request context `storeId` (use `src/lib/store/resolve-store.ts`)
- [ ] T018 [US2] Remove `DEFAULT_STORE_ID` fallbacks in codebase (search & replace) and add failing unit tests for any removed fallbacks (`tests/unit/tenancy/*.spec.ts`)
- [ ] T019 [US2] Add redirect canonicalization: when subdomain exists and custom domain present, redirect in `proxy.ts`
- [ ] T020 [US2] Add integration tests `tests/integration/tenancy/store-resolution.spec.ts` (mapped domain -> storeId; unmapped -> 404)

### User Story 3 (US3) — Newsletter subscription (Priority: P2)
- [ ] T021 [US3] Implement Server Action at `app/(storefront)/newsletter/actions.ts` with Zod schema to validate email and record consent
- [ ] T022 [US3] Implement `ConsentRecord` create logic in `src/services/newsletter-service.ts` and audit logs in `src/services/audit-service.ts`
- [ ] T023 [US3] Enforce rate limiting for newsletter submissions via `src/lib/rate-limit.ts` integration and add unit tests `tests/unit/newsletter/*.spec.ts`
- [ ] T024 [US3] Implement deduplication by `(storeId,email)` in DB and server logic; add integration test `tests/integration/newsletter/dedupe.spec.ts`
- [ ] T025 [US3] Add consent banner component skeleton `src/components/ConsentBanner.tsx` and wire to Server Action

### User Story 4 (US4) — Consistent APIs & CSV exports (Priority: P3)
- [ ] T026 [US4] Implement API middleware pipeline skeleton `src/lib/api-middleware/index.ts` (auth, rateLimit, validation, logging, requestId)
- [ ] T027 [US4] Migrate representative route `src/app/api/orders/route.ts` to use standardized API response format (`src/lib/api-response.ts`) and include `X-Request-Id` header
- [ ] T028 [US4] Implement efficient CSV streaming for ≤10k rows in `src/app/api/orders/export/route.ts` and tests `tests/integration/export/stream.spec.ts`
- [ ] T029 [US4] Implement async export job enqueue path for >10k rows and notification (email + in-app) wiring `src/services/export-service.ts`

## Final Phase: Polish & Cross-Cutting Concerns
- [ ] T030 [P] [US1] Add audit log entries for checkout actions in `src/services/audit-service.ts`
- [ ] T031 [P] [US1] Ensure checkout responses include standardized error shapes and `X-Request-Id` header (update route & tests)
- [ ] T032 [P] Add cache invalidation calls `revalidateTag(tag, 'max')` on product/category mutations (update services in `src/services/product-service.ts` and `src/services/category-service.ts`)
- [ ] T033 [P] Add migration test harness `scripts/migration-test.sh` and `tests/integration/migrations/migration.spec.ts`
- [ ] T034 [P] Update docs: `specs/002-harden-checkout-tenancy/quickstart.md` and `docs/testing-strategy.md` with new test instructions
- [ ] T035 [P] Add accessibility checks to E2E flows for checkout and newsletter (axe assertions in `tests/e2e/*`)
- [ ] T036 [P] Final audit: run grep for hardcoded `storeId`, run coverage, Lighthouse, and axe and store artifacts in `specs/002-harden-checkout-tenancy/artifacts/`

## Remediation & Constitution Tasks (critical follow-ups)
- [ ] T037 Add integration tests for every modified API route under `src/app/api/**/route.ts`; ensure each modified route has a corresponding integration test in `tests/integration/` and fail pre-merge when missing (map to FR-013, constitution MUST)
- [ ] T038 Schema audit: scan `prisma/schema.prisma` and codebase for CSV/string[] inconsistencies (images, tags, other arrays); create per-field migration tasks and tests under `tests/integration/migrations/`
- [ ] T039 Add k6 load test scripts for checkout and orders export and add Lighthouse CI job to feature CI pipeline; document thresholds and integrate into `.github/workflows/` (map to constitution performance requirements)
- [ ] T040 Background job infra validation: confirm existing job processing infra (worker/queue); if missing, add lightweight dev stub and update `src/services/export-service.ts` to support stub in dev/test
- [ ] T041 Payment pre-validation robustness: add idempotency key handling, retry/backoff policy, and tests for provider outages (update `src/services/payments/intent-validator.ts` and tests)
- [ ] T042 REST audit: scan `src/app/api/**/route.ts` for REST violations (PUT/PATCH misuse, stray `success` flags) and create remediation subtasks to fix each violating endpoint

---

## Dependencies
- Must complete Foundational (T004–T009) before heavy checkout (T010–T015) and tenancy (T016–T020) changes.
- US1 (T010–T015) depends on Foundational pricing service (T005) and transaction wrapper (T006).
- US2 (T016–T020) depends on Foundational resolver (T004).
- US3 (T021–T025) depends on tenancy resolution (T017) so subscriptions are created with correct `storeId`.

## Parallel execution examples
- While T004 and T005 are in progress, T007/T008/T009 can be implemented in parallel (distinct files and low dependency).
- Newsletter UI (T025) can be built in parallel with Server Action T021 once the Server Action API is agreed.

## Implementation strategy
- MVP-first: Start with US1 minimum slice (T010, T011, T013) to get a secure, server-verified checkout that can be validated by E2E; then add payment validation (T012) and tests (T014–T015).
- Incremental: Keep changes small per commit, include unit tests early for each modified file, and run `npm run type-check` + `npx vitest run` frequently.

---

Path to generated tasks.md: `specs/002-harden-checkout-tenancy/tasks.md`

Summary:
- Total tasks: 36
- Tasks per story: US1:6, US2:5, US3:5, US4:4, Foundational:6, Setup:3, Final/Polish:7
- Parallel opportunities: Foundational helpers (T004–T009) and docs/tests (T033–T036)
- Suggested MVP: US1 minimal slice (T010, T011, T013)

All tasks follow checklist format with Task IDs and file paths. Each task is specific and intended to be directly executable by an LLM or developer.
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
