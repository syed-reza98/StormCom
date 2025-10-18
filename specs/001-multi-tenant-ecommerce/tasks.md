# StormCom Tasks Plan (Executable)

Feature: StormCom Multi-tenant E-commerce Platform
Date: 2025-10-17
Branch: 001-multi-tenant-ecommerce

Context for task generation: (no additional arguments provided)

This tasks.md follows the required structure and strict checklist format. Tasks are organized by user story to enable independent implementation and testing. Tests are not explicitly included as tasks (spec doesn’t mandate TDD tasks), but independent test criteria are provided for each story.

Related docs:
- Spec: ../001-multi-tenant-ecommerce/spec.md
- Plan: ../001-multi-tenant-ecommerce/plan.md
- Data Model: ../001-multi-tenant-ecommerce/data-model.md
- API Contracts (OpenAPI): ../001-multi-tenant-ecommerce/contracts/openapi.yaml

---

## Phase 1 — Setup

Objective: Initialize repo tooling, environment, and baseline scaffolding required by all stories.

- [ ] T001 Create environment example file at .env.example
- [ ] T002 Add Prisma schema seed harness at prisma/seed.ts
- [ ] T003 Add Prisma client singleton at src/lib/prisma.ts
- [ ] T004 Create NextAuth config at src/lib/auth.ts
- [ ] T005 Add API error handler utility at src/lib/errors.ts
- [ ] T006 Add response helper (standard format) at src/lib/response.ts
- [ ] T007 Create Zod validation base helpers at src/lib/validation/index.ts
- [ ] T008 Add rate limit utility (Upstash) at src/lib/rate-limit.ts
- [ ] T009 Configure Tailwind + shadcn/ui base styles at src/app/globals.css and tailwind.config.ts
- [ ] T010 Add shared types barrel at src/types/index.ts
- [ ] T011 Add constants (roles, statuses, limits) at src/lib/constants.ts
- [ ] T012 Configure Sentry client/server initialization at src/lib/monitoring/sentry.ts

---

## Phase 2 — Foundational (Blocking)

Objective: Core foundations required before user stories. Complete these first.

- [ ] T013 Implement Prisma schema per data-model (initial models) at prisma/schema.prisma
- [ ] T014 Add Prisma multi-tenant middleware to auto-inject storeId at src/lib/middleware/tenantIsolation.ts
- [ ] T015 Add request context helper to extract user + store from JWT at src/lib/request-context.ts
- [ ] T016 Implement authentication route for NextAuth at src/app/api/auth/[...nextauth]/route.ts
- [ ] T017 Implement login/logout helpers for API at src/app/api/auth/_helpers.ts
- [ ] T018 Implement RBAC guard utility at src/lib/rbac.ts
- [ ] T019 Implement standard API route wrapper (error/rate-limit/tenant scope) at src/lib/api-wrapper.ts
- [ ] T020 Add Stripe + SSLCommerz gateway clients at src/lib/payments/stripe.ts and src/lib/payments/sslcommerz.ts
- [ ] T021 Add email sender (Resend) at src/lib/email/resend.ts
- [ ] T022 Add background jobs client (Inngest) at src/lib/jobs/inngest.ts
- [ ] T023 Seed default roles/permissions and subscription plans at prisma/seed.ts
- [ ] T024 [P] Create super admin bootstrap script at scripts/create-super-admin.ts
- [ ] T025 Align OpenAPI with SSLCommerz + endpoints at specs/001-multi-tenant-ecommerce/contracts/openapi.yaml

Dependencies: T013 → T014 → T019; T016 requires T004; Payment tasks require T013.

---

## Phase 3 — User Story 1: Create and manage a store (P1)

Goal: Super Admin can create a store, assign admin; Store Admin can log in and is scoped to their store.

Independent Test Criteria:
- End-to-end create store → assign admin → admin logs in → sees only their store.

- [ ] T026 [US1] Implement Store service (CRUD, settings) at src/services/stores/store-service.ts
- [ ] T027 [P] [US1] Implement Stores API (list/create) at src/app/api/stores/route.ts
- [ ] T028 [P] [US1] Implement Store by ID API (get/update) at src/app/api/stores/[storeId]/route.ts
- [ ] T029 [US1] Implement UserStore linking + assign admin at src/services/stores/user-store-service.ts
- [ ] T030 [US1] Admin dashboard entry page at src/app/(admin)/dashboard/page.tsx
- [ ] T031 [P] [US1] Super Admin stores list page at src/app/(admin)/settings/stores/page.tsx
- [ ] T032 [US1] Super Admin create store form at src/app/(admin)/settings/stores/new/page.tsx
- [ ] T033 [US1] Add store switcher component at src/components/admin/store-switcher.tsx
- [ ] T034 [US1] Add tenant guard in admin layout at src/app/(admin)/layout.tsx
- [ ] T034a [US1] Write unit tests for store service (>80% coverage) at src/services/stores/__tests__/store-service.test.ts
- [ ] T034b [US1] Write integration tests for Stores API at src/app/api/stores/__tests__/route.test.ts
- [ ] T034c [US1] Write E2E test for store creation and admin assignment flow at tests/e2e/stores/create-store.spec.ts

---

## Phase 4 — User Story 2: Product catalog with variants (P1)

Goal: Create products with variants, categories, brands, attributes, media, labels. Enforce SKU/slug uniqueness. Bulk import/export.

Independent Test Criteria:
- Create/edit/delete product and variants; import CSV; export catalog; uniqueness enforced.

- [ ] T035 [US2] Product service (CRUD, search, FTS) at src/services/products/product-service.ts
- [ ] T036 [P] [US2] Variant service (CRUD, stock hooks) at src/services/products/variant-service.ts
- [ ] T037 [P] [US2] Category service at src/services/products/category-service.ts
- [ ] T038 [P] [US2] Brand service at src/services/products/brand-service.ts
- [ ] T039 [P] [US2] Media upload handler (Vercel Blob) at src/app/api/media/route.ts
- [ ] T040 [US2] Products API (list/create) at src/app/api/products/route.ts
- [ ] T041 [P] [US2] Product by ID API (get/update/delete) at src/app/api/products/[productId]/route.ts
- [ ] T042 [P] [US2] Import products API (CSV) at src/app/api/products/import/route.ts
- [ ] T043 [P] [US2] Export products API (CSV) at src/app/api/products/export/route.ts
- [ ] T044 [US2] Admin product list page at src/app/(admin)/products/page.tsx
- [ ] T045 [P] [US2] Admin product create page at src/app/(admin)/products/new/page.tsx
- [ ] T046 [P] [US2] Admin product edit page at src/app/(admin)/products/[productId]/page.tsx
- [ ] T047 [US2] Zod schemas for product/variant at src/lib/validation/product.ts
- [ ] T047a [US2] Write unit tests for product service (>80% coverage) at src/services/products/__tests__/product-service.test.ts
- [ ] T047b [US2] Write integration tests for Products API (CRUD, import/export) at src/app/api/products/__tests__/route.test.ts
- [ ] T047c [US2] Write E2E test for product creation with variants flow at tests/e2e/products/create-product.spec.ts

Dependencies: US1 complete; T035-38 before APIs; media requires Setup storage.

---

## Phase 5 — User Story 3: Checkout with shipping and tax (P1)

Goal: Customer completes checkout with accurate shipping and tax.

Independent Test Criteria:
- Add to cart → checkout → select shipping → tax calculation → payment success.

- [ ] T048 [US3] Shipping zones service at src/services/shipping/shipping-zone-service.ts
- [ ] T049 [P] [US3] Shipping rates service at src/services/shipping/shipping-rate-service.ts
- [ ] T050 [US3] Tax rates service at src/services/tax/tax-rate-service.ts
- [ ] T051 [US3] Cart service (server) at src/services/cart/cart-service.ts
- [ ] T052 [US3] Checkout service (compute totals, shipping, tax) at src/services/checkout/checkout-service.ts
- [ ] T053 [P] [US3] Create order API at src/app/api/orders/route.ts
- [ ] T054 [P] [US3] Order by ID API (get/update) at src/app/api/orders/[orderId]/route.ts
- [ ] T055 [US3] Payment intent API (Stripe/SSLCommerz) at src/app/api/payments/create-intent/route.ts
- [ ] T056 [P] [US3] Payment webhooks (Stripe, SSLCommerz) at src/app/api/payments/webhooks/stripe/route.ts and src/app/api/payments/webhooks/sslcommerz/route.ts
- [ ] T057 [US3] Storefront checkout pages at src/app/(storefront)/checkout/page.tsx
- [ ] T058 [P] [US3] Storefront shipping/tax UI flow at src/app/(storefront)/checkout/(steps)/shipping/page.tsx and /payment/page.tsx
- [ ] T059 [US3] Zod schemas for shipping/tax/checkout at src/lib/validation/checkout.ts
- [ ] T059a [US3] Write unit tests for checkout service with shipping/tax calculation (>80% coverage) at src/services/checkout/__tests__/checkout-service.test.ts
- [ ] T059b [US3] Write integration tests for order creation and payment APIs at src/app/api/orders/__tests__/route.test.ts
- [ ] T059c [US3] Write E2E test for complete checkout with shipping and tax flow at tests/e2e/checkout/complete-checkout.spec.ts

Dependencies: US2 products; Foundational payments; shipping/tax services precede checkout.

---

## Phase 6 — User Story 3a: Storefront browsing and shopping (P1)

Goal: Browsing, search, filters, product details, cart, wishlist.

Independent Test Criteria:
- Browse categories, search, view product, add to cart, manage wishlist.

- [ ] T060 [US3a] Storefront home page at src/app/(storefront)/page.tsx
- [ ] T061 [P] [US3a] Storefront product listing at src/app/(storefront)/products/page.tsx
- [ ] T062 [P] [US3a] Product detail page at src/app/(storefront)/products/[slug]/page.tsx
- [ ] T063 [US3a] Search API (FTS) at src/app/api/search/route.ts
- [ ] T064 [P] [US3a] Cart API at src/app/api/cart/route.ts
- [ ] T065 [P] [US3a] Wish list API at src/app/api/wishlist/route.ts
- [ ] T066 [US3a] Storefront cart page at src/app/(storefront)/cart/page.tsx
- [ ] T067 [US3a] Storefront wishlist page at src/app/(storefront)/account/wishlist/page.tsx
- [ ] T067a [US3a] Write unit tests for cart service (>80% coverage) at src/services/cart/__tests__/cart-service.test.ts
- [ ] T067b [US3a] Write integration tests for search and cart APIs at src/app/api/search/__tests__/route.test.ts
- [ ] T067c [US3a] Write E2E test for product browsing, search, and cart management at tests/e2e/storefront/browse-and-cart.spec.ts

Dependencies: US2.

---

## Phase 7 — User Story 4: Order lifecycle and documents (P1)

Goal: Process orders through statuses, generate documents, notifications, cancellations/refunds.

Independent Test Criteria:
- Place test order → progress status → generate docs → partial refund.

- [ ] T068 [US4] Order workflow service at src/services/orders/order-workflow-service.ts
- [ ] T069 [P] [US4] Invoice/packing slip generation (PDF) at src/services/orders/documents-service.ts
- [ ] T070 [US4] Shipment service (tracking) at src/services/shipping/shipment-service.ts
- [ ] T071 [P] [US4] Refund API at src/app/api/orders/[orderId]/refunds/route.ts
- [ ] T072 [P] [US4] Cancel order API at src/app/api/orders/[orderId]/cancel/route.ts
- [ ] T073 [US4] Notifications on order events at src/services/notifications/order-notifier.ts
- [ ] T074 [US4] Auto-cancel job (Inngest) at src/services/jobs/auto-cancel-unpaid.ts
- [ ] T074a [US4] Write unit tests for order workflow service (>80% coverage) at src/services/orders/__tests__/order-workflow-service.test.ts
- [ ] T074b [US4] Write integration tests for refund and cancel APIs at src/app/api/orders/[orderId]/__tests__/refunds.test.ts
- [ ] T074c [US4] Write E2E test for order lifecycle (place, process, refund) at tests/e2e/orders/order-lifecycle.spec.ts

Dependencies: US3 orders/payments; email sender present.

---

## Phase 8 — User Story 5: Subscription plan selection and limits (P1)

Goal: Plan enforcement and upgrades/downgrades with grace period.

Independent Test Criteria:
- Create store on Free → exceed limit blocked → upgrade → limits apply instantly.

- [ ] T075 [US5] Plans service (limits, usage) at src/services/subscriptions/plans-service.ts
- [ ] T076 [P] [US5] Plan usage tracker middleware at src/lib/middleware/plan-usage.ts
- [ ] T077 [US5] Plan enforcement guard at src/lib/plan-guard.ts
- [ ] T078 [P] [US5] Plan settings UI at src/app/(admin)/settings/plan/page.tsx
- [ ] T079 [US5] Dashboard usage indicators at src/app/(admin)/dashboard/_components/usage-widgets.tsx
- [ ] T080 [US5] Plan lifecycle jobs (trial expiry, grace) at src/services/jobs/plan-lifecycle.ts
- [ ] T080a [US5] Write unit tests for plans service and enforcement guards (>80% coverage) at src/services/subscriptions/__tests__/plans-service.test.ts
- [ ] T080b [US5] Write integration tests for plan usage middleware at src/lib/middleware/__tests__/plan-usage.test.ts
- [ ] T080c [US5] Write E2E test for plan limits and upgrade flow at tests/e2e/subscriptions/plan-limits.spec.ts

Dependencies: US1; Foundational seed for plans.

---

## Phase 9 — User Story 6: Inventory tracking and alerts (P1)

Goal: Accurate stock per variant, audit trail, low-stock alerts, concurrency safety.

Independent Test Criteria:
- Manual adjustments; confirm/cancel/refund adjusts correctly; low-stock alert.

- [ ] T081 [US6] Inventory adjustment service at src/services/inventory/adjustment-service.ts
- [ ] T082 [P] [US6] Inventory adjustments API at src/app/api/inventory/adjustments/route.ts
- [ ] T083 [US6] Low-stock alert job + dashboard widget at src/services/jobs/low-stock-alerts.ts and src/app/(admin)/dashboard/_components/low-stock.tsx
- [ ] T084 [P] [US6] Concurrency safety using DB locking at src/services/inventory/locks.ts
- [ ] T085 [US6] Audit log on adjustments at src/services/audit/audit-log.ts
- [ ] T085a [US6] Write unit tests for inventory adjustment service with concurrency (>80% coverage) at src/services/inventory/__tests__/adjustment-service.test.ts
- [ ] T085b [US6] Write integration tests for inventory adjustments API at src/app/api/inventory/__tests__/adjustments.test.ts
- [ ] T085c [US6] Write E2E test for inventory tracking, alerts, and concurrency at tests/e2e/inventory/inventory-tracking.spec.ts

Dependencies: US2, US4.

---

## Phase 10 — User Story 12: Security and access control (P1)

Goal: Strong passwords, MFA, account lockouts, RBAC, audit logs.

Independent Test Criteria:
- Enforce password policy; MFA flow; lockouts after failed attempts; audit capture.

- [ ] T086 [US12] Password policy validators at src/lib/security/password-policy.ts
- [ ] T087 [P] [US12] MFA (TOTP + recovery codes) at src/services/security/mfa-service.ts and src/app/api/auth/mfa/route.ts
- [ ] T088 [US12] Account lockout policy at src/services/security/lockout-service.ts
- [ ] T089 [P] [US12] RBAC policies and guards integration at src/lib/rbac.ts
- [ ] T090 [US12] Security audit events at src/services/audit/security-events.ts
- [ ] T090a [US12] Write unit tests for password policy, MFA, and lockout services (100% coverage) at src/services/security/__tests__/security.test.ts
- [ ] T090b [US12] Write integration tests for MFA API and RBAC guards at src/app/api/auth/__tests__/mfa.test.ts
- [ ] T090c [US12] Write E2E test for authentication, MFA enrollment, and lockout flow at tests/e2e/security/auth-security.spec.ts

Dependencies: Foundational auth.

---

## Phase 11 — User Story 7: Customer management and analytics (P2)

Goal: Customer profiles, addresses, order history, LTV, search/filter/export.

Independent Test Criteria:
- Create customer; add addresses; place orders; view LTV; filtered search.

- [ ] T091 [US7] Customer service at src/services/customers/customer-service.ts
- [ ] T092 [P] [US7] Customers API (list/create) at src/app/api/customers/route.ts
- [ ] T093 [P] [US7] Customer by ID API at src/app/api/customers/[customerId]/route.ts
- [ ] T094 [US7] Admin customers page at src/app/(admin)/customers/page.tsx
- [ ] T095 [P] [US7] Export customers API at src/app/api/customers/export/route.ts
- [ ] T096 [US7] LTV calculation helper at src/services/customers/ltv.ts
- [ ] T096a [US7] Write unit tests for customer service and LTV calculation (>80% coverage) at src/services/customers/__tests__/customer-service.test.ts
- [ ] T096b [US7] Write integration tests for customers API (CRUD, export) at src/app/api/customers/__tests__/route.test.ts
- [ ] T096c [US7] Write E2E test for customer profile, addresses, and analytics at tests/e2e/customers/customer-management.spec.ts

Dependencies: US4 orders for LTV.

---

## Phase 12 — User Story 8: Marketing campaigns (P2)

Goal: Coupons, flash sales, abandoned-cart campaigns, newsletters, metrics.

Independent Test Criteria:
- Create coupon; schedule flash sale; run abandoned cart recovery; view metrics.

- [ ] T097 [US8] Coupons service at src/services/marketing/coupons-service.ts
- [ ] T098 [P] [US8] Coupons API at src/app/api/coupons/route.ts
- [ ] T099 [US8] Flash sales service at src/services/marketing/flash-sales-service.ts
- [ ] T100 [P] [US8] Flash sales API at src/app/api/flash-sales/route.ts
- [ ] T101 [US8] Abandoned cart job at src/services/jobs/abandoned-cart.ts
- [ ] T102 [P] [US8] Newsletter campaign service at src/services/marketing/newsletter-service.ts
- [ ] T102a [US8] Write unit tests for coupons and flash sales services (>80% coverage) at src/services/marketing/__tests__/coupons-service.test.ts
- [ ] T102b [US8] Write integration tests for marketing campaigns APIs at src/app/api/coupons/__tests__/route.test.ts
- [ ] T102c [US8] Write E2E test for coupon creation, flash sale, and abandoned cart flow at tests/e2e/marketing/campaigns.spec.ts

Dependencies: US3 cart/orders.

---

## Phase 13 — User Story 9: Content management (P2)

Goal: Pages, blogs, menus, FAQs, testimonials with publish/unpublish.

Independent Test Criteria:
- Create page/post; organize menu; publish/unpublish; testimonials.

- [ ] T103 [US9] Pages API at src/app/api/content/pages/route.ts
- [ ] T104 [P] [US9] Blogs API at src/app/api/content/blogs/route.ts
- [ ] T105 [US9] Menus API at src/app/api/content/menus/route.ts
- [ ] T106 [P] [US9] FAQs API at src/app/api/content/faqs/route.ts
- [ ] T107 [US9] Testimonials API at src/app/api/content/testimonials/route.ts
- [ ] T108 [P] [US9] Admin CMS pages at src/app/(admin)/content/pages/page.tsx and related CRUD pages
- [ ] T108a [US9] Write unit tests for content management APIs (>80% coverage) at src/app/api/content/__tests__/pages.test.ts
- [ ] T108b [US9] Write integration tests for blogs, menus, FAQs, testimonials APIs at src/app/api/content/__tests__/blogs.test.ts
- [ ] T108c [US9] Write E2E test for content creation, publishing, and menu management at tests/e2e/content/content-management.spec.ts

Dependencies: None beyond foundational/auth.

---

## Phase 14 — User Story 10: Dashboards and reports (P2)

Goal: KPIs dashboards and CSV/Excel report exports with thresholds.

Independent Test Criteria:
- Open dashboard; adjust thresholds; export reports; verify accuracy.

- [ ] T109 [US10] Dashboard metrics service at src/services/analytics/metrics-service.ts
- [ ] T110 [P] [US10] Threshold config API at src/app/api/analytics/thresholds/route.ts
- [ ] T111 [US10] Reports export API at src/app/api/reports/export/route.ts
- [ ] T112 [P] [US10] Admin dashboard pages at src/app/(admin)/dashboard/_pages/*.tsx
- [ ] T112a [US10] Write unit tests for metrics service and threshold logic (>80% coverage) at src/services/analytics/__tests__/metrics-service.test.ts
- [ ] T112b [US10] Write integration tests for reports export API at src/app/api/reports/__tests__/export.test.ts
- [ ] T112c [US10] Write E2E test for dashboard KPIs and report exports at tests/e2e/analytics/dashboard-reports.spec.ts

Dependencies: Aggregations available from services.

---

## Phase 15 — User Story 11: POS checkout (P3)

Goal: In-store POS checkout with receipt, inventory updates.

Independent Test Criteria:
- Add items, apply coupon, accept payment, print receipt, stock updated.

- [ ] T113 [US11] POS cart/service at src/services/pos/pos-service.ts
- [ ] T114 [P] [US11] POS API at src/app/api/pos/route.ts
- [ ] T115 [US11] POS UI at src/app/(admin)/pos/page.tsx
- [ ] T116 [P] [US11] Receipt generation at src/services/pos/receipt-service.ts
- [ ] T116a [US11] Write unit tests for POS service and receipt generation (>80% coverage) at src/services/pos/__tests__/pos-service.test.ts
- [ ] T116b [US11] Write integration tests for POS API at src/app/api/pos/__tests__/route.test.ts
- [ ] T116c [US11] Write E2E test for POS checkout flow with receipt printing at tests/e2e/pos/pos-checkout.spec.ts

Dependencies: US2, US4, payments.

---

## Final Phase — Polish & Cross-Cutting

Goal: Hardening, rate limits, observability, docs alignment, accessibility.

- [ ] T117 Add per-endpoint rate limits using src/lib/rate-limit.ts in all APIs
- [ ] T118 Add audit logging hooks for security/order/inventory events across services
- [ ] T119 Add accessibility audits (WCAG AA) for storefront/admin critical pages
- [ ] T120 Update OpenAPI with any newly added endpoints and align examples
- [ ] T121 Author developer docs at docs/specifications/001-stormcom-platform/implementation-notes.md
- [ ] T122 Add migration notes and backfill scripts under prisma/migrations/README.md

---

## Dependency Graph (Story Order)

1) Phase 1 Setup → Phase 2 Foundational
2) P1 Stories (parallel with caution):
   - US1 Stores → prerequisite for all
   - US2 Products → prerequisite for US3, US3a, US6
   - US12 Security → can run in parallel with US1/US2
   - US3 Checkout → depends on US2 + payments + shipping/tax services
   - US3a Storefront → depends on US2
   - US4 Orders → depends on US3
   - US5 Plans → depends on US1
   - US6 Inventory → depends on US2 and US4
3) P2 Stories (after P1 core): US7 → US8 → US9 → US10 (can overlap)
4) P3: US11 POS (after P1 core + payments)

---

## Parallel Execution Examples

- US2 Product services (T035–T038) can be built in parallel with APIs (T040–T043) and admin pages (T044–T046).
- US3 shipping (T048–T049) and tax (T050) can run in parallel with cart/checkout (T051–T052) and payment endpoints (T055–T056).
- US4 documents generation (T069) can run in parallel with refund/cancel APIs (T071–T072).
- US5 plan UI (T078) is parallelizable with middleware/guards (T076–T077).
- US7 customer APIs (T092–T093) can run in parallel with admin page (T094) and export (T095).

---

## Implementation Strategy

- MVP scope: P1 stories US1, US2, US3, US3a core browsing, US4 minimal (confirm/ship), US5 basic enforcement, US6 low-stock, US12 password/MFA/lockout.
- Deliver incrementally per story; each story is independently testable via API + UI.
- Favor Server Components; use Client Components only for interactivity.
- Strict tenant isolation enforced via middleware and service layer.
- Use Zod for all API input validation; never accept unvalidated input.
- Apply per-endpoint rate limiting per plan tier; exempt trusted webhooks.

---

## Format Validation

- All tasks adhere to required checklist format: "- [ ] T### [P]? [US?]? Description with file path".
- Story phases include [US#] labels; setup/foundational/polish phases do not include story labels.

---

## Summary Report

Output path: specs/001-multi-tenant-ecommerce/tasks.md

Totals:
- Total tasks: 158 (122 implementation + 36 test tasks)
- Per story counts:
  - US1: 12 (9 implementation + 3 test)
  - US2: 16 (13 implementation + 3 test)
  - US3: 15 (12 implementation + 3 test)
  - US3a: 11 (8 implementation + 3 test)
  - US4: 10 (7 implementation + 3 test)
  - US5: 9 (6 implementation + 3 test)
  - US6: 8 (5 implementation + 3 test)
  - US12: 8 (5 implementation + 3 test)
  - US7: 9 (6 implementation + 3 test)
  - US8: 9 (6 implementation + 3 test)
  - US9: 9 (6 implementation + 3 test)
  - US10: 7 (4 implementation + 3 test)
  - US11: 7 (4 implementation + 3 test)
- Test coverage: 3 test tasks per user story (unit, integration, E2E) to meet 80% coverage requirement
- Parallel opportunities identified: 14
- MVP scope: US1, US2, US3 (+ core of US3a), US4 minimal, US5 basic, US6 low-stock, US12 security basics
