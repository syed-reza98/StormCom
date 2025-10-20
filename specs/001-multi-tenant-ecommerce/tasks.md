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

## Phase 0 — User Story 0: Authentication and Authorization (P0)
Goal: Secure authentication, registration, and logout flows with accessible, responsive UI for the dashboard, meeting all requirements in spec.md and ux.md checklist.

Independent Test Criteria:
- Login, Register, and Logout UI must include all required UI elements, error messages, loading/feedback states, and edge case handling as specified in spec.md and ux.md checklist.
- All flows must be accessible (WCAG 2.1 AA), responsive, and handle all error, loading, and edge cases as specified.
- Wireframes must specify all element positions, spacing, error/loading/empty states, and visual hierarchy, and be included in docs/audit/login-register-wireframes.md.

- [x] T0A [US0] Implement Login page UI for dashboard at src/app/(auth)/login/page.tsx (all required fields, error messages, loading, accessibility, edge cases)
- [x] T0B [US0] Implement Register page UI for dashboard at src/app/(auth)/register/page.tsx (all required fields, password checklist, error messages, loading, accessibility, edge cases)
- [x] T0C [US0] Implement Logout action and user menu for dashboard at src/components/auth/user-menu.tsx (accessible, keyboard/screen reader support, redirect with message)
- [x] T0D [US0] Add wireframes for Login and Register pages to design documentation at docs/audit/login-register-wireframes.md (specify all element positions, spacing, error/loading/empty states, visual hierarchy)

Dependencies: Foundational auth (T016, T017), design documentation (wireframes), Next.js App Router, shadcn/ui, Tailwind CSS

---

## Phase 1 — Setup

Objective: Initialize repo tooling, environment, and baseline scaffolding required by all stories.

- [x] T001 Create environment example file at .env.example
- [x] T002 Add Prisma schema seed harness at prisma/seed.ts
- [x] T003 Add Prisma client singleton at src/lib/prisma.ts
- [x] T003a Add connection pooling configuration for serverless at src/lib/prisma.ts
- [x] T004 Create NextAuth config at src/lib/auth.ts
- [x] T005 Add API error handler utility at src/lib/errors.ts
- [x] T006 Add response helper (standard format) at src/lib/response.ts
- [x] T007 Create Zod validation base helpers at src/lib/validation/index.ts
- [x] T008 Add rate limit utility (Upstash) at src/lib/rate-limit.ts
- [x] T009 Configure Tailwind + shadcn/ui base styles at src/app/globals.css and tailwind.config.ts
- [x] T009a Add dark mode support with theme toggle at src/components/theme-toggle.tsx
- [x] T009b Configure responsive breakpoints and container queries at tailwind.config.ts
- [ ] T009c [DESIGN] Define global design tokens (color palette, typography, spacing, border radius) in `tailwind.config.ts`, create design system documentation at `docs/design-system.md`, and verify WCAG 2.1 AA contrast for all color combinations.
- [ ] T009d [DESIGN] Implement base layout and UI kit components (DashboardShell, StorefrontLayout, Card, Button, Input, PageHeader, Badge) using shadcn/ui and Tailwind classes, adhering to the design tokens.
- [ ] T009e [DESIGN] Add dynamic theming support based on `Store.primaryColor` and `Store.secondaryColor` using CSS variables; update the theme toggle to support light/dark mode tokens; implement tests to verify theme switching.
- [ ] T009f [DESIGN] Provide comprehensive design documentation, including Figma files or equivalent design sources, usage guidelines, and examples for all components and tokens in `docs/design-system.md`.
- [x] T010 Add shared types barrel at src/types/index.ts
- [x] T011 Add constants (roles, statuses, limits) at src/lib/constants.ts
- [x] T012 Configure Sentry client/server initialization at src/lib/monitoring/sentry.ts
- [x] T012a Add custom Sentry breadcrumbs for multi-tenant context at src/lib/monitoring/sentry.ts
- [x] T012b Configure Sentry performance monitoring with transaction tracing at src/lib/monitoring/sentry.ts
- [x] T012c Add Sentry error boundary components at src/components/error-boundary.tsx
- [x] T012d Configure Sentry source map upload for production debugging at sentry.config.js

---

## Phase 2 — Foundational (Blocking)

Objective: Core foundations required before user stories. Complete these first.

- [x] T013 [US12] Implement Prisma schema per data-model (initial models, including predefined roles: SUPER_ADMIN, STORE_ADMIN, STAFF, CUSTOMER) at prisma/schema.prisma
- [x] T013a [US12] Add compound indexes for multi-tenant queries (storeId + createdAt, storeId + slug) at prisma/schema.prisma
- [x] T013b [US12] Add database triggers for soft delete validation at prisma/migrations/
- [x] T013c [US12] Document schema relationships and migration strategy at docs/database/schema-guide.md
- [x] T013d [US12] Add PasswordHistory model to schema (CHK009) at prisma/schema.prisma
- [x] T013e [US12] Add TaxExemption model to schema (CHK091) at prisma/schema.prisma
- [x] T013f [US12] Add allowCouponsWithFlashSale and onboardingCompleted to Store model at prisma/schema.prisma
- [x] T014 [US12] Add Prisma multi-tenant middleware to auto-inject storeId at src/lib/middleware/tenantIsolation.ts
- [x] T015 Add request context helper to extract user + store from JWT at src/lib/request-context.ts
- [x] T015a Implement session store abstraction: Vercel KV (Redis) in production, in-memory Map fallback for local dev at src/lib/session-store.ts
- [x] T016 Implement authentication route for NextAuth at src/app/api/auth/[...nextauth]/route.ts
- [x] T017 Implement login/logout helpers for API at src/app/api/auth/_helpers.ts
- [x] T018 Implement RBAC guard utility (fixed roles, no custom roles) at src/lib/rbac.ts
- [x] T019 Implement standard API route wrapper (error/rate-limit/tenant scope) at src/lib/api-wrapper.ts
- [x] T020 Add Stripe + SSLCommerz gateway clients at src/lib/payments/stripe.ts and src/lib/payments/sslcommerz.ts
- [ ] T020a Add payment webhook signature verification at src/lib/payments/webhook-verification.ts
- [ ] T020b Add idempotency key handling for payment retry safety at src/lib/payments/idempotency.ts
- [ ] T021 Add email sender (Resend) at src/lib/email/resend.ts
- [ ] T022 Add background jobs client (Inngest) at src/lib/jobs/inngest.ts
- [x] T023 Seed default roles/permissions and subscription plans at prisma/seed.ts
- [x] T024 [P] Create super admin bootstrap script at scripts/create-super-admin.ts
- [ ] T025 Align OpenAPI with SSLCommerz + endpoints at specs/001-multi-tenant-ecommerce/contracts/openapi.yaml

Dependencies: T013 → T014 → T019; T016 requires T004; Payment tasks require T013.

---

## Phase 3 — User Story 1: Create and manage a store (P1)

Goal: Super Admin can create a store, assign admin; Store Admin can log in and is scoped to their store.

Independent Test Criteria:
- End-to-end create store → assign admin → admin logs in → sees only their store.

- [x] T026 [US1] Implement Store service (CRUD, settings) at src/services/stores/store-service.ts
- [x] T027 [P] [US1] Implement Stores API (list/create) at src/app/api/stores/route.ts
- [x] T028 [P] [US1] Implement Store by ID API (get/update) at src/app/api/stores/[storeId]/route.ts
- [x] T029 [US1] Implement UserStore linking + assign admin at src/services/stores/user-store-service.ts
- [x] T030 [US1] Admin dashboard entry page at src/app/(admin)/dashboard/page.tsx
- [x] T031 [P] [US1] Super Admin stores list page at src/app/(admin)/settings/stores/page.tsx
- [x] T032 [US1] Super Admin create store form at src/app/(admin)/settings/stores/new/page.tsx
- [x] T033 [US1] Add store switcher component at src/components/admin/store-switcher.tsx
- [x] T034 [US1] Add tenant guard in admin layout at src/app/(admin)/layout.tsx
- [x] T034a [US1] Write unit tests for store service (>80% coverage) at src/services/stores/__tests__/store-service.test.ts
- [x] T034b [US1] Write integration tests for Stores API at src/app/api/stores/__tests__/route.test.ts
- [x] T034c [US1] Write E2E test for store creation and admin assignment flow at tests/e2e/stores/create-store.spec.ts

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
- [ ] T042a [US2] Add duplicate SKU detection during CSV import (CHK002) at src/services/products/duplicate-sku-validator.ts
- [ ] T042b [US2] Add inline validation with error CSV generation for duplicate SKUs at src/app/api/products/import/route.ts
- [ ] T042c [US2] Add suggested alternatives for duplicate SKUs (by name/category) at src/services/products/product-suggestions.ts
- [ ] T043 [P] [US2] Export products API (CSV) at src/app/api/products/export/route.ts
- [ ] T044 [US2] Admin product list page at src/app/(admin)/products/page.tsx
- [ ] T045 [P] [US2] Admin product create page at src/app/(admin)/products/new/page.tsx
- [ ] T045a [US2] Add zero-product onboarding wizard (CHK054) at src/components/admin/onboarding-wizard.tsx
- [ ] T045b [US2] Add sample products seed function for onboarding at src/services/products/sample-products.ts
- [ ] T045c [US2] Add empty catalog state with tutorial video and action cards at src/components/admin/empty-catalog-state.tsx
- [ ] T045d [US2] Add onboardingCompleted flag to Store model and track completion at prisma/schema.prisma
- [ ] T046 [P] [US2] Admin product edit page at src/app/(admin)/products/[productId]/page.tsx
- [ ] T047 [US2] Zod schemas for product/variant at src/lib/validation/product.ts
- [ ] T047d [US2] Add product attribute combination validator (prevent duplicate variant combinations) at src/lib/validation/product-variants.ts
- [ ] T047e [US2] Add product SEO metadata validator (title length, description, keywords) at src/lib/validation/product-seo.ts
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
- [ ] T050a [US3] Add tax exemption service (CHK091) at src/services/tax/tax-exemption-service.ts
- [ ] T050b [US3] Add tax exemption API endpoints at src/app/api/customers/[customerId]/tax-exemptions/route.ts
- [ ] T050c [US3] Add admin tax exemption review page at src/app/(admin)/settings/tax-exemptions/page.tsx
- [ ] T050d [US3] Add tax exemption auto-expiry job at src/services/jobs/tax-exemption-expiry.ts
- [ ] T050e [US3] Add TaxExemption model to Prisma schema at prisma/schema.prisma
- [ ] T051 [US3] Cart service (server) at src/services/cart/cart-service.ts
- [ ] T052 [US3] Checkout service (compute totals, shipping, tax) at src/services/checkout/checkout-service.ts
- [ ] T052a [US3] Add flash sale + coupon discount precedence logic (CHK060) at src/services/checkout/discount-precedence.ts
- [ ] T052b [US3] Add discount breakdown display in cart UI at src/components/storefront/cart-summary.tsx
- [ ] T052c [US3] Add allowCouponsWithFlashSale store setting at prisma/schema.prisma
- [ ] T052d [US3] Add admin toggle for coupon+flash sale configuration at src/app/(admin)/settings/promotions/page.tsx
- [ ] T053 [P] [US3] Create order API at src/app/api/orders/route.ts
- [ ] T053a [US3] Add 60-second grace period for plan expiration (CHK056) at src/lib/plan-guard.ts
- [ ] T053b [US3] Add server UTC timestamp validation for order timing at src/services/orders/order-timing-validator.ts
- [ ] T053c [US3] Add plan expiration notification email at src/services/notifications/plan-notifier.ts
- [ ] T053d [US3] Add upgrade modal for expired plans at src/components/admin/plan-expired-modal.tsx
- [ ] T054 [P] [US3] Order by ID API (get/update) at src/app/api/orders/[orderId]/route.ts
- [ ] T055 [US3] Payment intent API (Stripe/SSLCommerz) at src/app/api/payments/create-intent/route.ts
- [ ] T055a [US3] Add payment timeout handler (auto-cancel unpaid orders) at src/lib/jobs/payment-timeout-job.ts
- [ ] T055b [US3] Add payment reconciliation job (webhook replay for missed events) at src/lib/jobs/payment-reconciliation-job.ts
- [ ] T056 [P] [US3] Payment webhooks (Stripe, SSLCommerz) at src/app/api/payments/webhooks/stripe/route.ts and src/app/api/payments/webhooks/sslcommerz/route.ts
- [ ] T056a [US3] Add webhook restoration for cancelled orders (CHK058) at src/services/orders/order-restoration-service.ts
- [ ] T056b [US3] Add idempotency key handling for payment webhooks at src/lib/payments/idempotency.ts
- [ ] T056c [US3] Add inventory restock check before restoration at src/services/inventory/restock-validator.ts
- [ ] T056d [US3] Add webhook replay protection via Redis at src/lib/payments/webhook-replay-guard.ts
- [ ] T057 [US3] Storefront checkout pages at src/app/(storefront)/checkout/page.tsx
- [ ] T057a [US3] Add email template for order confirmation at src/lib/email/templates/order-confirmation.tsx
- [ ] T057b [US3] Add email template for payment received at src/lib/email/templates/payment-received.tsx
- [ ] T057c [US3] Add email template for order shipped at src/lib/email/templates/order-shipped.tsx
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
- [ ] T061a [US3a] Add infinite scroll pagination for product listings at src/components/storefront/product-list-infinite.tsx
- [ ] T062 [P] [US3a] Product detail page at src/app/(storefront)/products/[slug]/page.tsx
- [ ] T062a [US3a] Add product image zoom/lightbox component at src/components/storefront/product-image-gallery.tsx
- [ ] T062b [US3a] Add product quick view modal at src/components/storefront/product-quick-view.tsx
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
- [ ] T074d [US4] Write E2E test for webhook restoration after cancellation (CHK058) at tests/e2e/orders/webhook-restoration.spec.ts

Dependencies: US3 orders/payments; email sender present.

---

## Phase 8 — User Story 5: Subscription plan selection and limits (P1)

Goal: Plan enforcement and upgrades/downgrades with grace period.

Independent Test Criteria:
- Create store on Free → exceed limit blocked → upgrade → limits apply instantly.

- [ ] T075 [US5] Plans service (limits, usage) at src/services/subscriptions/plans-service.ts
- [ ] T076 [P] [US5] Plan usage tracker middleware at src/lib/middleware/plan-usage.ts
- [ ] T077 [US5] Plan enforcement guard at src/lib/plan-guard.ts
- [ ] T077a [US5] Write E2E test for plan expiration grace period (CHK056) at tests/e2e/subscriptions/plan-expiration-grace.spec.ts
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

Goal: Strong passwords, MFA (TOTP authenticator app with backup codes for recovery, optional SMS fallback), account lockouts, RBAC (predefined roles), audit logs.

Independent Test Criteria:
- Enforce password policy; MFA flow (TOTP with backup codes, optional SMS); backup code generation, storage, and recovery; lockouts after failed attempts; audit capture; **MFA is optional for all users** including Super Admins during initial development phase.

- [ ] T086 [US12] Password policy validators at src/lib/security/password-policy.ts
- [ ] T086a [US12] Add password history table and validation (CHK009) at prisma/schema.prisma
- [ ] T086b [US12] Add password history service (last 5 passwords) at src/services/security/password-history-service.ts
- [ ] T086c [US12] Add password history cleanup job (2-year retention) at src/services/jobs/password-history-cleanup.ts
- [ ] T087 [P] [US12] MFA (TOTP authenticator app with backup codes for recovery; **optional for all users**) at src/services/security/mfa-service.ts and src/app/api/auth/mfa/route.ts
- [ ] T087a [US12] Implement backup codes generation service (10 single-use codes, bcrypt hashed) at src/services/security/backup-codes-service.ts
- [ ] T087b [US12] Implement backup codes recovery API endpoint at src/app/api/auth/mfa/backup-codes/verify/route.ts
- [ ] T087c [US12] Implement backup codes regeneration API endpoint at src/app/api/auth/mfa/backup-codes/regenerate/route.ts
- [ ] T087d [US12] Add backup codes UI (display once during enrollment with download/print options) at src/app/(auth)/mfa/backup-codes/page.tsx
- [ ] T087e [US12] Implement SMS fallback service (optional, Twilio integration) at src/services/security/sms-mfa-service.ts
- [ ] T087f [US12] Implement SMS MFA API endpoints (send code, verify code) at src/app/api/auth/mfa/sms/route.ts
- [ ] T087g [US12] Add SMS fallback configuration UI at src/app/(admin)/settings/security/page.tsx
- [ ] T088 [US12] Account lockout policy at src/services/security/lockout-service.ts
- [ ] T089 [P] [US12] RBAC policies and guards integration (predefined roles only) at src/lib/rbac.ts
- [ ] T089a [US12] Add fine-grained permission checks (can_edit_product, can_view_orders, etc.) at src/lib/rbac-permissions.ts
- [ ] T090 [US12] Security audit events at src/services/audit/security-events.ts
- [ ] T090a [US12] Write unit tests for password policy, MFA (TOTP only), and lockout services (100% coverage) at src/services/security/__tests__/security.test.ts
- [ ] T090b [US12] Write integration tests for MFA API (TOTP only) and RBAC guards at src/app/api/auth/__tests__/mfa.test.ts
- [ ] T090c [US12] Write E2E test for authentication, MFA enrollment (TOTP only, no backup codes), and lockout flow at tests/e2e/security/auth-security.spec.ts
- [ ] T090d [US12] Write E2E test for password history enforcement (CHK009) at tests/e2e/security/password-history.spec.ts

Dependencies: Foundational auth.

---

## New Security Hardening Tasks (NEW)

[ ] T190 [SEC] Implement CSRF middleware (double-submit token) and add e2e tests for all POST/PUT/PATCH/DELETE routes.
[ ] T191 [SEC] Set security headers at edge (HSTS, CSP with nonce, X‑Content‑Type‑Options, Referrer‑Policy, X‑Frame‑Options) and add automated checks.
[ ] T192 [SEC] Add login-specific rate limiting and account lockout (progressive backoff) with unit tests.
[ ] T193 [SEC] Expand AuditLog coverage to include auth events, role changes, sensitive configuration changes; verify immutability.
[ ] T194 [PRIV] Implement DSAR endpoints: export (portable format), erasure, and verification workflow; admin UI to track requests.
[ ] T195 [PRIV] PII retention jobs per data category; configurable retention policies; deletion logs with AuditLog references.
[ ] T196 [OPS] Incident response runbook; on-call rotation; tabletop exercise task.
[ ] T197 [OPS] Integrate IP reputation/threat intel checks on auth routes; instrument anomaly detection metrics.
[ ] T198 [OPS] Nightly DB snapshots (retain 30 days) + weekly restore drills; blob backup verification; document RPO/RTO in runbook.
[ ] T199 [ANALYTICS] Normalize analytics endpoints (`/analytics/track`), implement OpenAPI spec, and add tests & auth.

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
- [ ] T102a [US8] Add email template scheduler (send at specific date/time) at src/lib/jobs/email-schedule-job.ts
- [ ] T102b [US8] Add coupon usage analytics (redemption rate, revenue impact) at src/services/marketing/coupon-analytics-service.ts
- [ ] T102c [US8] Add abandoned cart recovery email sequences at src/lib/jobs/abandoned-cart-recovery-job.ts
- [ ] T102d [US8] Add flash sale countdown timer component at src/components/storefront/flash-sale-timer.tsx
- [ ] T102e [US8] Write unit tests for coupons and flash sales services (>80% coverage) at src/services/marketing/__tests__/coupons-service.test.ts
- [ ] T102f [US8] Write integration tests for marketing campaigns APIs at src/app/api/coupons/__tests__/route.test.ts
- [ ] T102g [US8] Write E2E test for coupon creation, flash sale, and abandoned cart flow at tests/e2e/marketing/campaigns.spec.ts

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
- [ ] T117a Add rate limit monitoring dashboard (admin view) at src/app/(admin)/settings/rate-limits/page.tsx
- [ ] T117b Add rate limit bypass for trusted webhooks at src/lib/rate-limit-bypass.ts
- [ ] T117c Add rate limit metrics collection (usage per plan tier) at src/services/analytics/rate-limit-metrics.ts
- [ ] T118 Add audit logging hooks for security/order/inventory events across services
- [ ] T119 Add accessibility audits (WCAG AA) for storefront/admin critical pages
- [ ] T120 Update OpenAPI with any newly added endpoints and align examples
- [ ] T121 Author developer docs at docs/specifications/001-stormcom-platform/implementation-notes.md
- [ ] T122 Add migration notes and backfill scripts under prisma/migrations/README.md
- [ ] T122a Add database migration rollback procedures at docs/operations/migration-rollback.md
- [ ] T122b Add data migration validation scripts at scripts/validate-migrations.ts
- [ ] T122c Add migration performance testing script at scripts/test-migration-performance.ts
- [ ] T122d Add migration checklist and approval workflow at docs/operations/migration-checklist.md
- [ ] T122e Add seed data regeneration script at scripts/regenerate-seed-data.ts

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

## Phase 16 — User Story 14: GDPR Compliance (P1)

Goal: Support GDPR compliance with consent management, data access requests, data deletion (anonymization), consent audit logging, and data retention policies.

Independent Test Criteria:
- Capture consent during registration, process data access request (export JSON/CSV), anonymize customer data per deletion request, verify consent audit trail, test automated data retention cleanup.

- [ ] T123 [US14] Implement Consent service (capture/update/query) at src/services/gdpr/consent-service.ts
- [ ] T124 [US14] Implement Data Export service (collect all customer data) at src/services/gdpr/data-export-service.ts
- [ ] T125 [US14] Implement Data Deletion service (anonymization) at src/services/gdpr/data-deletion-service.ts
- [ ] T126 [US14] Implement Consent API (capture/update) at src/app/api/gdpr/consent/route.ts
- [ ] T127 [US14] Implement Data Access Request API at src/app/api/gdpr/access/route.ts
- [ ] T128 [US14] Implement Data Deletion Request API at src/app/api/gdpr/delete/route.ts
- [ ] T129 [US14] Admin GDPR dashboard page at src/app/(admin)/settings/gdpr/page.tsx
- [ ] T130 [US14] Add consent capture to registration flow at src/app/(auth)/register/page.tsx
- [ ] T130a [US14] Write unit tests for GDPR services (>80% coverage) at src/services/gdpr/__tests__/
- [ ] T130b [US14] Write integration tests for GDPR APIs at src/app/api/gdpr/__tests__/
- [ ] T130c [US14] Write E2E test for GDPR compliance flow (consent, export, deletion) at tests/e2e/gdpr/compliance.spec.ts

---

## Phase 17 — User Story 13: External Platform Integration (P2)

Goal: Bidirectional synchronization with WooCommerce and Shopify via real-time webhooks, configurable conflict resolution, sync queue management, and retry logic.

Independent Test Criteria:
- Connect WooCommerce/Shopify API, initiate manual sync, verify data consistency, review sync logs, test conflict resolution strategies, validate webhook processing, verify retry on failure.

- [ ] T131 [US13] Implement Platform Connection service (validate/store credentials) at src/services/integrations/platform-connection-service.ts
- [ ] T132 [US13] Implement Sync Engine service (bidirectional sync logic) at src/services/integrations/sync-engine-service.ts
- [ ] T133 [US13] Implement Conflict Resolution service (strategies) at src/services/integrations/conflict-resolution-service.ts
- [ ] T134 [US13] Implement Sync Queue worker (background job) at src/lib/jobs/sync-queue-worker.ts
- [ ] T135 [US13] Implement Platform Webhooks handler (inbound events) at src/app/api/webhooks/platforms/route.ts
- [ ] T136 [US13] Implement WooCommerce adapter at src/services/integrations/adapters/woocommerce-adapter.ts
- [ ] T137 [US13] Implement Shopify adapter at src/services/integrations/adapters/shopify-adapter.ts
- [ ] T138 [US13] Admin platform connections page at src/app/(admin)/settings/integrations/page.tsx
- [ ] T139 [US13] Admin sync logs page at src/app/( admin)/settings/integrations/logs/page.tsx
- [ ] T140 [US13] Platform connection form at src/app/(admin)/settings/integrations/new/page.tsx
- [ ] T140a [US13] Write unit tests for integration services (>80% coverage) at src/services/integrations/__tests__/
- [ ] T140b [US13] Write integration tests for sync APIs at src/app/api/webhooks/platforms/__tests__/
- [ ] T140c [US13] Write E2E test for external platform sync flow at tests/e2e/integrations/platform-sync.spec.ts

---

## Phase 18 — Infrastructure: Reliability and Availability (P1)

Goal: Achieve 99.9% uptime SLA with health checks, automated monitoring, scheduled maintenance management, automated backups, disaster recovery procedures, and RTO/RPO compliance.

Independent Test Criteria:
- Verify health check endpoints respond correctly, test automated alerts on service failures, simulate backup and restore, verify maintenance mode blocks customer access but allows admin, measure uptime over test period.

- [ ] T141 [Infra] Implement Health Check API at src/app/api/health/route.ts
- [ ] T142 [Infra] Implement Service Status Monitor at src/lib/monitoring/service-monitor.ts
- [ ] T143 [Infra] Implement Automated Backup job (daily schedule) at src/lib/jobs/backup-job.ts
- [ ] T144 [Infra] Implement Maintenance Mode middleware at src/middleware/maintenance-mode.ts
- [ ] T145 [Infra] Implement Disaster Recovery script at scripts/disaster-recovery.ts
- [ ] T146 [Infra] Configure uptime monitoring (UptimeRobot integration) at docs/operations/uptime-monitoring.md
- [ ] T147 [Infra] Create runbook for incident response at docs/operations/incident-response.md
- [ ] T148 [Infra] Admin maintenance mode toggle at src/app/(admin)/settings/maintenance/page.tsx
- [ ] T149 [Infra] Write integration tests for health checks at src/app/api/health/__tests__/route.test.ts
- [ ] T150 [Infra] Write E2E test for maintenance mode enforcement at tests/e2e/infrastructure/maintenance-mode.spec.ts

---

## Phase 19 — Store Settings and Configuration (P2)

Goal: Expose configurable store settings for checkout, order auto-cancel timeout, email sender config, SEO, maintenance mode, analytics integration, and storefront contact info.

Independent Test Criteria:
- Configure checkout settings (guest checkout, minimum order), update auto-cancel timeout, configure SMTP, update SEO metadata, enable maintenance mode, add analytics codes, update contact info, verify settings persist and apply correctly.

- [ ] T151 [Settings] Implement Store Settings service (get/update by category) at src/services/stores/store-settings-service.ts
- [ ] T152 [Settings] Admin checkout settings page at src/app/(admin)/settings/checkout/page.tsx
- [ ] T153 [Settings] Admin email settings page at src/app/(admin)/settings/email/page.tsx
- [ ] T154 [Settings] Admin SEO settings page at src/app/(admin)/settings/seo/page.tsx
- [ ] T155 [Settings] Admin analytics settings page at src/app/(admin)/settings/analytics/page.tsx
- [ ] T156 [Settings] Admin storefront settings page (contact info, social links) at src/app/(admin)/settings/storefront/page.tsx
- [ ] T156a [Settings] Write unit tests for store settings service (>80% coverage) at src/services/stores/__tests__/store-settings-service.test.ts
- [ ] T156b [Settings] Write integration tests for settings APIs at src/app/api/settings/__tests__/
- [ ] T156c [Settings] Write E2E test for store settings configuration at tests/e2e/settings/store-settings.spec.ts

---

## Phase 20 — Data Retention and Compliance (P1)

Goal: Implement automated data retention policies to meet compliance requirements (FR-121 to FR-127) with 3-year order retention, 1-year audit logs, 90-day backups, GDPR data deletion/export, and configurable retention policies per store.

Independent Test Criteria:
- Orders/invoices retained for 3 years with automated cleanup, audit logs stored immutably for 1 year, backups auto-deleted after 90 days, GDPR data deletion requests complete within 30 days, data export generates complete JSON/CSV, retention policies configurable per store, all retention events logged to audit trail.

- [ ] T157 [US14] [Data Retention] Add retention metadata to Prisma schema (archivedAt, retentionExpiresAt fields) for Order, AuditLog, Backup models at prisma/schema.prisma
- [ ] T158 [US14] [Data Retention] Implement data retention service with policy enforcement logic at src/services/compliance/data-retention-service.ts
- [ ] T159 [US14] [Data Retention] Create order/invoice archival job (3-year retention, FR-121) at src/services/jobs/archive-orders-job.ts
- [ ] T160 [US14] [Data Retention] Create audit log cleanup job (1-year retention, immutable storage, FR-122) at src/services/jobs/cleanup-audit-logs-job.ts
- [ ] T161 [US14] [Data Retention] Create backup cleanup job (90-day retention, FR-123) at src/services/jobs/cleanup-backups-job.ts
- [ ] T162 [US14] [GDPR] Implement GDPR data deletion service (30-day SLA, FR-124) at src/services/compliance/gdpr-deletion-service.ts
- [ ] T163 [US14] [GDPR] Implement GDPR data export service (48-hour SLA, JSON/CSV, FR-125) at src/services/compliance/gdpr-export-service.ts
- [ ] T164 [US14] [Data Retention] Create retention policy executor job (scheduled, FR-126) with Inngest at src/services/jobs/execute-retention-policies-job.ts
- [ ] T165 [US14] [Data Retention] Admin retention policy configuration page (per-store, FR-127) at src/app/(admin)/settings/compliance/retention/page.tsx
- [ ] T166 [US14] [GDPR] Customer data deletion request page at src/app/(storefront)/account/privacy/page.tsx
- [ ] T167 [US14] [GDPR] Customer data export request page at src/app/(storefront)/account/data-export/page.tsx
- [ ] T168 [US14] [Data Retention] Admin GDPR requests queue page (approve/process deletion requests) at src/app/(admin)/settings/compliance/gdpr-requests/page.tsx
- [ ] T169 [US14] [Data Retention] API endpoint for retention policy CRUD at src/app/api/compliance/retention-policies/route.ts
- [ ] T170 [US14] [GDPR] API endpoint for GDPR deletion requests at src/app/api/compliance/gdpr-deletion/route.ts
- [ ] T171 [US14] [GDPR] API endpoint for GDPR data export at src/app/api/compliance/gdpr-export/route.ts
- [ ] T172 [US14] [Data Retention] Add retention policy audit trail with failure handling (job crashes, rollback) to audit log service
- [ ] T173 [US14] [Data Retention] Add retention policy monitoring dashboard (metrics: records archived, errors, policy execution status) at src/app/(admin)/settings/compliance/monitoring/page.tsx
- [ ] T173a [US14] [Data Retention] Write unit tests for data retention service (>80% coverage) at src/services/compliance/__tests__/data-retention-service.test.ts
- [ ] T173b [US14] [Data Retention] Write unit tests for GDPR deletion service (>80% coverage) at src/services/compliance/__tests__/gdpr-deletion-service.test.ts
- [ ] T173c [US14] [Data Retention] Write unit tests for GDPR export service (>80% coverage) at src/services/compliance/__tests__/gdpr-export-service.test.ts
- [ ] T173d [US14] [Data Retention] Write integration tests for retention policy APIs at src/app/api/compliance/__tests__/
- [ ] T173e [US14] [Data Retention] Write E2E test for GDPR data deletion workflow at tests/e2e/compliance/gdpr-deletion.spec.ts
- [ ] T173f [US14] [Data Retention] Write E2E test for GDPR data export workflow at tests/e2e/compliance/gdpr-export.spec.ts
- [ ] T173g [US14] [Data Retention] Write E2E test for automated retention policy execution at tests/e2e/compliance/retention-policies.spec.ts

---

## Phase 21 — Scalability Monitoring and Performance (P1)

Goal: Implement scalability monitoring (FR-113 to FR-115) to maintain performance targets (10K products, 83K orders/month, 250K customers) with real-time metrics dashboard, alerting, query optimization, and caching strategies.

Independent Test Criteria:
- Performance metrics collected in real-time, dashboard displays per-store resource usage, alerts triggered at 80% of plan limits, query times <100ms (p95), caching reduces API response times by 40%, all metrics stored for 90 days retention.

- [ ] T174 [Infrastructure] Implement scalability metrics collection service at src/services/monitoring/scalability-metrics-service.ts
- [ ] T175 [Infrastructure] Create performance monitoring middleware (track API response times, query counts) at src/lib/middleware/performance-monitoring.ts
- [ ] T176 [Infrastructure] Admin scalability monitoring dashboard (FR-114: per-store resource usage) at src/app/(admin)/monitoring/scalability/page.tsx
- [ ] T177 [Infrastructure] Implement alerting service (FR-114: 80% plan limits, query time >200ms) at src/services/monitoring/alerting-service.ts
- [ ] T178 [Infrastructure] Add query optimization layer with Prisma query analysis at src/lib/database/query-optimizer.ts
- [ ] T179 [Infrastructure] Implement caching strategy with Vercel KV (FR-115: 5-min TTL for analytics/reports) at src/lib/caching/cache-manager.ts
- [ ] T180 [Infrastructure] Add database performance monitoring (FR-113: track query times, connection pool usage) at src/services/monitoring/database-monitoring-service.ts
- [ ] T181 [Infrastructure] Create scalability metrics aggregation job (hourly aggregation) at src/services/jobs/aggregate-scalability-metrics-job.ts
- [ ] T182 [Infrastructure] Add metrics retention policy (90 days for historical data) at src/services/monitoring/metrics-retention-service.ts
- [ ] T183 [Infrastructure] API endpoint for scalability metrics retrieval at src/app/api/monitoring/scalability/route.ts
- [ ] T184 [Infrastructure] Real-time metrics dashboard component with auto-refresh at src/components/admin/scalability-dashboard.tsx
- [ ] T185 [Infrastructure] Alert notification service (email admins when thresholds exceeded) at src/services/notifications/alert-notifier.ts
- [ ] T185a [Infrastructure] Write unit tests for scalability metrics service (>80% coverage) at src/services/monitoring/__tests__/scalability-metrics-service.test.ts
- [ ] T185b [Infrastructure] Write unit tests for alerting service (>80% coverage) at src/services/monitoring/__tests__/alerting-service.test.ts
- [ ] T185c [Infrastructure] Write integration tests for monitoring APIs at src/app/api/monitoring/__tests__/
- [ ] T185d [Infrastructure] Write E2E test for scalability monitoring dashboard at tests/e2e/monitoring/scalability-dashboard.spec.ts

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
- Total tasks: 237 (173 implementation + 64 test tasks)
- Per story counts:
  - US1: 12 (9 implementation + 3 test)
  - US2: 18 (15 implementation + 3 test) — added variant/SEO validators
  - US3: 20 (17 implementation + 3 test) — added payment timeout, email templates
  - US3a: 14 (11 implementation + 3 test) — added infinite scroll, image zoom, quick view
  - US4: 10 (7 implementation + 3 test)
  - US5: 9 (6 implementation + 3 test)
  - US6: 8 (5 implementation + 3 test)
  - US12: 9 (6 implementation + 3 test) — added RBAC permissions
  - US7: 9 (6 implementation + 3 test)
  - US8: 13 (10 implementation + 3 test) — added email scheduler, analytics, recovery sequences
  - US9: 9 (6 implementation + 3 test)
  - US10: 7 (4 implementation + 3 test)
  - US11: 7 (4 implementation + 3 test)
  - US13: 13 (10 implementation + 3 test) — NEW: external platform integration
  - US14: 11 (8 implementation + 3 test) — NEW: GDPR compliance
- Infrastructure tasks: 10 (8 implementation + 2 test) — NEW: reliability & availability
- Store Settings tasks: 9 (6 implementation + 3 test) — NEW: configurable store settings
- Setup/Foundational enhancements: +8 tasks (connection pooling, dark mode, Sentry enhancements, database indexes, payment idempotency)
- Polish phase enhancements: +11 tasks (rate limit monitoring, migration procedures, validation scripts)
- Test coverage: 3 test tasks per user story (unit, integration, E2E) to meet 80% coverage requirement
- Parallel opportunities identified: 20+
- MVP scope: US1, US2, US3 (+ core of US3a), US4 minimal, US5 basic, US6 low-stock, US12 security basics, US14 GDPR basics
- Phase 2 scope (post-MVP): US13 external integrations, full Infrastructure phase, Store Settings phase, enhanced marketing features
