# StormCom – Consolidated Issues, Recommendations, Status Tracker
Date: 2025-11-11
Scope: docs/reviews/*.md and subfolders (detailed, components, database)
Branch/ref reviewed: 6b033f33e1bd887870f48211b0659889c6657b5d (where applicable)

Methodology
- Enumerated and read all review markdowns under docs/reviews and subfolders:
  - Executive/summary: [EXECUTIVE_SUMMARY.md](./docs/reviews/EXECUTIVE_SUMMARY.md), [FINAL_SYNTHESIS_REPORT.md](./docs/reviews/FINAL_SYNTHESIS_REPORT.md), [INDEX.md](./docs/reviews/INDEX.md)
  - App & components: [app.md](./docs/reviews/app.md), components/* (UI, theme, root, storefront, etc.)
  - Deep dives: [detailed/INDEX.md](./docs/reviews/detailed/INDEX.md), [detailed/api-routes.md](./docs/reviews/detailed/api-routes.md), [detailed/app-storefront-pages.md](./docs/reviews/detailed/app-storefront-pages.md), [detailed/app-dashboard-pages.md](./docs/reviews/detailed/app-dashboard-pages.md), [detailed/app-auth-pages.md](./docs/reviews/detailed/app-auth-pages.md), [detailed/app-root-files.md](./docs/reviews/detailed/app-root-files.md)
  - Auth migration: [AUTHENTICATION_AUDIT_REPORT.md](./docs/reviews/AUTHENTICATION_AUDIT_REPORT.md), [AUTH_MIGRATION_PHASE_1_2_SUMMARY.md](./docs/reviews/AUTH_MIGRATION_PHASE_1_2_SUMMARY.md), [AUTH_MIGRATION_PHASE_3_6_SUMMARY.md](./docs/reviews/AUTH_MIGRATION_PHASE_3_6_SUMMARY.md) (index), [AUTH_MIGRATION_PROGRESS.md](./docs/reviews/AUTH_MIGRATION_PROGRESS.md)
  - Architecture/lib/services/database: [architecture-overview.md](./docs/reviews/architecture-overview.md), [lib.md](./docs/reviews/lib.md), [services.md](./docs/reviews/services.md), [database/prisma-schema.md](./docs/reviews/database/prisma-schema.md)
  - Others: hooks, providers, contexts, emails, components/*

Status Legend: NOT FIXED, PARTIAL, FIXED. Evidence drawn from deep-dive verification where available.

---

1) Critical Security & Tenancy Issues

- C-01 Checkout endpoint unauthenticated and trusts client prices
  - Severity: CRITICAL
  - Status: NOT FIXED
  - Sources: Executive Summary (Critical #1), Deep Dive [api-routes.md] (checkout section), Final Synthesis (verified not fixed)
  - Affected: POST /api/checkout/complete
  - Recommendation: Require NextAuth session; compute/verify server-side totals; verify payment intent; transactionally create order/inventory/payment; add idempotency.
  - Related fixes to implement: Auth check, price verification, stock check, payment verification, db transaction, idempotency key.

- C-02 Storefront multi-tenancy bypass (hardcoded storeId)
  - Severity: CRITICAL
  - Status: PARTIAL (layout resolves store by headers; pages still hardcode)
  - Sources: Executive Summary (Critical #2), Deep Dive [app-storefront-pages.md], Final Synthesis (partial propagation)
  - Affected: shop/page.tsx and other storefront pages
  - Recommendation: Centralize getCurrentStoreId() from domain; propagate via shared server utility/context; refactor all storefront pages to consume.

- C-03 Newsletter form non-functional, lacks CSRF
  - Severity: HIGH
  - Status: NOT FIXED
  - Sources: Executive Summary (Critical #3), Deep Dive [app-storefront-pages.md], Final Synthesis (not implemented)
  - Affected: shop/page.tsx
  - Recommendation: Implement Server Action with Zod validation, CSRF, rate limit, email sending, success/error UI; or POST to API route with CSRF.

- C-04 Dual authentication systems active (NextAuth + Custom)
  - Severity: CRITICAL
  - Status: PARTIAL (Phase 1 & 2 auth migration completed; dual endpoints still present)
  - Sources: [AUTHENTICATION_AUDIT_REPORT.md], [AUTH_MIGRATION_PHASE_1_2_SUMMARY.md]
  - Affected: /api/auth/login|logout|register|custom-session, session-service, session-storage
  - Recommendation: Complete migration plan: delete custom login/logout/custom-session; keep registration as user creation only; remove session-service & KV; clear legacy cookies on NextAuth login.

- C-05 Multiple auth cookies present (next-auth.session-token + sessionId)
  - Severity: MEDIUM
  - Status: NOT FIXED
  - Sources: Auth Audit (Issue 5)
  - Recommendation: Remove legacy endpoints; explicitly clear sessionId cookie on NextAuth login.

2) API Design, Validation, Error Handling

- A-01 Data type inconsistency: Product images/metaKeywords as String vs arrays
  - Severity: HIGH
  - Status: NOT FIXED
  - Sources: Executive Summary (High #4), Deep Dive [api-routes.md], Final Synthesis (verified)
  - Affected: Prisma schema Product.images/metaKeywords; /api/products normalizes at edge
  - Recommendation: Migrate Prisma fields to String[] (Postgres arrays); write data migration; remove edge normalization.

- A-02 PUT/PATCH semantic mismatch on products/[id]
  - Severity: HIGH
  - Status: NOT FIXED
  - Sources: Executive Summary (High #5), Deep Dive [api-routes.md]
  - Recommendation: PUT require full schema; PATCH allow partial; standardize error/response structure.

- A-03 String-based error matching; lack of error class hierarchy
  - Severity: HIGH
  - Status: NOT FIXED (one-off local class exists; not standardized)
  - Sources: Executive Summary (High #6), Deep Dive [api-routes.md], Final Synthesis
  - Recommendation: Introduce lib/errors.ts (AppError + subclasses), standardize across services/routes.

- A-04 Inconsistent response shapes across routes
  - Severity: MEDIUM
  - Status: NOT FIXED
  - Sources: Deep Dive [api-routes.md]
  - Recommendation: Centralize apiResponse helpers; enforce { data, meta? } or { error } shape.

- A-05 Missing rate limiting on sensitive endpoints
  - Severity: HIGH
  - Status: NOT FIXED
  - Sources: app.md (API routes rubric), lib.md, Deep Dive [api-routes.md]
  - Recommendation: Middleware-based rate limiting (per-IP/user); return 429 with headers; captcha after repeated failures.

- A-06 Missing request logging/IDs, API versioning, OpenAPI docs
  - Severity: MEDIUM
  - Status: NOT FIXED
  - Sources: Deep Dive [api-routes.md]
  - Recommendation: Add request ID middleware, /api/v1 versioning, generate OpenAPI, structured logging.

- A-07 Orders export: memory-heavy, no size limits
  - Severity: MEDIUM
  - Status: NOT FIXED
  - Sources: Deep Dive [api-routes.md] (orders)
  - Recommendation: Stream CSV; set size limits; consider background jobs with email link.

3) Authentication Migration Specifics

- M-01 Password reset flow duplicated in custom auth
  - Severity: HIGH
  - Status: FIXED (migrated to standalone utility)
  - Sources: Auth Audit (Issue 2), [AUTH_MIGRATION_PHASE_1_2_SUMMARY.md] (created src/lib/password-reset.ts)
  - Recommendation: Ensure NextAuth-compatible usage across UI/API; delete custom reset endpoints when safe.

- M-02 Email verification standalone utility missing
  - Severity: HIGH
  - Status: FIXED
  - Sources: [AUTH_MIGRATION_PHASE_1_2_SUMMARY.md] (created src/lib/email-verification.ts)
  - Recommendation: Integrate with sign-up flow; delete legacy custom verification code.

- M-03 Login page using custom endpoint instead of NextAuth
  - Severity: HIGH
  - Status: FIXED
  - Sources: [AUTH_MIGRATION_PHASE_1_2_SUMMARY.md] (login page updated to signIn('credentials'))
  - Recommendation: N/A

- M-04 Legacy endpoints/services still present
  - Severity: MEDIUM
  - Status: NOT FIXED
  - Sources: Auth Audit (Issues 1,4)
  - Recommendation: Delete custom login/logout/custom-session; remove session-service and session-storage; update tests.

- M-05 MFA tokenization flow (mfaToken vs sessionId pre-verification)
  - Severity: MEDIUM
  - Status: NOT FIXED
  - Sources: Deep Dive [api-routes.md] (login)
  - Recommendation: Return mfaToken until MFA challenge completes; establish partial-auth state patterns.

4) Storefront UX, Performance, Accessibility, SEO

- S-01 Missing caching primitives (unstable_cache, tags)
  - Severity: MEDIUM
  - Status: NOT FIXED
  - Sources: Deep Dive [app-storefront-pages.md], Final Synthesis (grep shows none)
  - Recommendation: Add unstable_cache with tags & revalidate; invalidate on theme/catalog updates.

- S-02 Accessibility gaps: skip links, aria-labels, form labels
  - Severity: MEDIUM
  - Status: NOT FIXED (login page is strong; storefront missing)
  - Sources: [app-root-files.md], [app-storefront-pages.md]
  - Recommendation: Add skip-to-content; label newsletter/email; aria for buttons/grids.

- S-03 Missing error boundaries/loading states per section
  - Severity: MEDIUM
  - Status: NOT FIXED
  - Sources: [app-storefront-pages.md]
  - Recommendation: Suspense boundaries & granular loading skeletons; error handling.

- S-04 Static trust metrics and metadata not dynamic per store
  - Severity: LOW
  - Status: NOT FIXED
  - Sources: [app-storefront-pages.md]
  - Recommendation: Populate from store settings; dynamic metadata; add OG/Twitter and JSON-LD.

5) Dashboard Pages Consistency

- D-01 DEFAULT_STORE_ID fallback instead of redirect on products page
  - Severity: MEDIUM
  - Status: NOT FIXED
  - Sources: [app-dashboard-pages.md]
  - Recommendation: Redirect to login if no session; never use env fallback for tenant pages.

- D-02 Orders page lacks explicit storeId handling and pagination display
  - Severity: MEDIUM
  - Status: NOT FIXED
  - Sources: [app-dashboard-pages.md]
  - Recommendation: Explicit storeId filter; add pagination controls; date range validation; size limits on export.

- D-03 Missing Suspense boundaries and input sanitization on list pages
  - Severity: MEDIUM
  - Status: NOT FIXED
  - Sources: [app-dashboard-pages.md]
  - Recommendation: Add Suspense/skeletons; sanitize search; validate page bounds.

6) Cross-cutting App/Root and Libraries

- X-01 No explicit CSP/security headers in middleware/proxy
  - Severity: MEDIUM
  - Status: NOT FIXED (not evidenced as implemented)
  - Sources: [detailed/app-root-files.md], [app.md]
  - Recommendation: Add CSP, Referrer-Policy, X-Frame-Options, Permissions-Policy via proxy.

- X-02 Analytics scripts overhead at root layout
  - Severity: LOW-MEDIUM
  - Status: NOT FIXED
  - Sources: [detailed/app-root-files.md]
  - Recommendation: Lazy/conditional load in production; measure impact.

- X-03 Providers/contexts risk of re-render storms
  - Severity: LOW
  - Status: NOT FIXED (advisory)
  - Sources: [components/root.md], [providers.md], [contexts.md]
  - Recommendation: Memoize context values; split heavy contexts; keep provider surface minimal.

- X-04 Rate limiting helpers present but not uniformly applied
  - Severity: HIGH
  - Status: NOT FIXED
  - Sources: [lib.md], [app.md], [detailed/api-routes.md]
  - Recommendation: Central middleware pipeline with rate limiting & logging; per-route overrides.

- X-05 Standardized API response and error handling not centralized
  - Severity: HIGH
  - Status: NOT FIXED
  - Sources: [lib.md], [detailed/api-routes.md]
  - Recommendation: Create api-response.ts, errors.ts, api-middleware.ts; enforce usage.

7) Services Layer Concerns

- SV-01 Missing transactions for multi-step ops (checkout, inventory, order status)
  - Severity: HIGH
  - Status: NOT FIXED (advisory)
  - Sources: [services.md], [detailed/api-routes.md]
  - Recommendation: Wrap in prisma.$transaction; design compensating actions for external calls.

- SV-02 Analytics aggregations may be heavy inline
  - Severity: MEDIUM
  - Status: NOT FIXED
  - Sources: [services.md]
  - Recommendation: Background jobs/materialized tables; add indexes per query patterns.

- SV-03 Cache invalidation flows (theme/storefront) incomplete
  - Severity: MEDIUM
  - Status: NOT FIXED
  - Sources: [services.md], [components/theme.md]
  - Recommendation: Tag-based invalidation on updates; test for freshness <5s.

- SV-04 Bulk import validation and streaming
  - Severity: MEDIUM
  - Status: NOT FIXED
  - Sources: [components/bulk-import.md], [services.md]
  - Recommendation: Stream parsing; per-row Zod; row/size limits; aggregated error report.

- SV-05 Audit logs for admin mutations not universally applied
  - Severity: MEDIUM
  - Status: NOT FIXED
  - Sources: [app.md], [services.md], [detailed/api-routes.md]
  - Recommendation: Centralize audit logging; standard fields (actor, action, resource, metadata).

8) Database Schema & Data Governance

- DB-01 Soft delete consistency: some entities may lack deletedAt where needed
  - Severity: MEDIUM
  - Status: NOT FIXED (review needed)
  - Sources: [database/prisma-schema.md]
  - Recommendation: Add deletedAt to entities requiring archival behavior.

- DB-02 Index bloat risk; governance needed
  - Severity: LOW-MEDIUM
  - Status: NOT FIXED
  - Sources: [database/prisma-schema.md]
  - Recommendation: Monitor index usage; prune unused; consider partitioning for high-growth tables.

- DB-03 Images/metaKeywords stored as JSON strings (array type mismatch)
  - Severity: HIGH
  - Status: NOT FIXED (see A-01)
  - Sources: [database/prisma-schema.md], [detailed/api-routes.md]

- DB-04 Cascade/relations review for optional FKs (OrderItem/Variant/Product)
  - Severity: MEDIUM
  - Status: NOT FIXED
  - Sources: [database/prisma-schema.md]
  - Recommendation: Validate deletion semantics, set appropriate onDelete behaviors.

- DB-05 Refunds model (partial/multiple) lacking dedicated entity
  - Severity: MEDIUM
  - Status: NOT FIXED
  - Sources: [database/prisma-schema.md]
  - Recommendation: Introduce Refund entity for auditability.

- DB-06 GDPR request indexing optimization (storeId + status)
  - Severity: LOW-MEDIUM
  - Status: NOT FIXED
  - Sources: [database/prisma-schema.md]
  - Recommendation: Add composite index aligned with query patterns.

9) Accessibility and UI Components

- UI-01 WCAG compliance gaps in primitives & storefront
  - Severity: MEDIUM
  - Status: NOT FIXED (login page strong)
  - Sources: [components/ui.md], [app-storefront-pages.md], [detailed/app-root-files.md]
  - Recommendation: Ensure proper roles/aria, focus styles, keyboard support; add automated axe checks.

- UI-02 Theme editor heavy; performance optimization needed
  - Severity: MEDIUM
  - Status: NOT FIXED
  - Sources: [components/theme.md]
  - Recommendation: Dynamic import sub-editors; debounce; server-validated persistence; cache invalidation.

10) Tooling, Testing, Quality

- T-01 Testing coverage gaps (hooks, interactive UI, auth edges)
  - Severity: MEDIUM
  - Status: NOT FIXED
  - Sources: [hooks.md], [services.md], [detailed/api-routes.md], Exec Summary
  - Recommendation: ≥80% coverage business logic; unit tests for hooks (cart math, analytics formatting); E2E for checkout/newsletter once fixed.

- T-02 Lint/type patterns: avoid any; function/file size limits
  - Severity: LOW
  - Status: PARTIAL (guidelines exist; occasional any)
  - Sources: [types.md], [architecture-overview.md]
  - Recommendation: Enforce ESLint no-explicit-any; CI gates; refactor >50-line functions.

- T-03 Command/tooling reliability (from project onboarding notes)
  - Severity: MEDIUM
  - Status: KNOWN (workarounds documented)
  - Context: type-check errors, lint/test via npx, build fails for unrelated reasons (not from review docs)
  - Recommendation: Fix build & lint scripts; ensure CI stability.

Already Fixed (as per docs)
- Login page now uses NextAuth’s signIn('credentials') instead of custom endpoint
  - Source: [AUTH_MIGRATION_PHASE_1_2_SUMMARY.md]
- Standalone password reset utility implemented (1h token, password history, logging)
  - Source: [AUTH_MIGRATION_PHASE_1_2_SUMMARY.md]
- Standalone email verification utility implemented (24h token, audit)
  - Source: [AUTH_MIGRATION_PHASE_1_2_SUMMARY.md]

Priority Backlog (from consolidated recommendations)

Immediate (Week 1)
- Fix checkout endpoint (auth, price verification, payment, stock, transaction, idempotency)
- Implement domain/subdomain-based store resolution and remove storefront hardcoded storeId
- Implement functional, secure newsletter Server Action (validation, CSRF, rate limit)
- Introduce API middleware pipeline: authenticate, rateLimit, logRequest
- Standardize error classes and response shape, start applying to high-traffic routes

Short Term (Weeks 2–3)
- Remove custom auth endpoints and custom session stack; clear legacy cookies
- Migrate Product.images/metaKeywords to array types; remove API edge normalization
- Correct PUT vs PATCH semantics; unify error responses
- Add CSV streaming/sizing for orders export
- Add CSP/security headers via proxy; lazy-load analytics in prod

Medium Term (Month 1)
- Add storefront caching (unstable_cache + tags) and invalidate on updates
- Add Suspense, loading skeletons, and granular error boundaries
- Strengthen A11y across storefront and UI primitives (axe automation)
- Transactionalize multi-step service operations; audit logging for mutations
- Introduce API versioning, request IDs, OpenAPI; structured logging

Governance & Data
- Review Prisma schema soft-delete coverage; cascade rules; refunds entity; GDPR indexes
- Index usage analysis and pruning; consider partitioning for high-growth tables

Verification & Success Criteria
- Checkout fixes validated via E2E tests; attempts to manipulate prices are rejected
- Domain-to-store isolation verified with E2E (no cross-tenant leakage)
- All sensitive endpoints rate-limited; 429 headers present
- Product schema arrays deployed; normalization code removed; tests adjusted
- Error class hierarchy adopted in ≥80% of services/routes
- Storefront caching shows reduced P95 latency; theme changes propagate <5s
- Axe accessibility violations reduced to zero criticals
- Auth legacy code removed; only NextAuth tokens used; no sessionId cookies issued

References
- Critical and high-level: [EXECUTIVE_SUMMARY.md](./docs/reviews/EXECUTIVE_SUMMARY.md), [FINAL_SYNTHESIS_REPORT.md](./docs/reviews/FINAL_SYNTHESIS_REPORT.md), [INDEX.md](./docs/reviews/INDEX.md)
- Deep dives: [detailed/api-routes.md](./docs/reviews/detailed/api-routes.md), [detailed/app-storefront-pages.md](./docs/reviews/detailed/app-storefront-pages.md), [detailed/app-dashboard-pages.md](./docs/reviews/detailed/app-dashboard-pages.md), [detailed/app-auth-pages.md](./docs/reviews/detailed/app-auth-pages.md), [detailed/app-root-files.md](./docs/reviews/detailed/app-root-files.md)
- Auth: [AUTHENTICATION_AUDIT_REPORT.md](./docs/reviews/AUTHENTICATION_AUDIT_REPORT.md), [AUTH_MIGRATION_PHASE_1_2_SUMMARY.md](./docs/reviews/AUTH_MIGRATION_PHASE_1_2_SUMMARY.md)
- Architecture/lib/services/db: [architecture-overview.md](./docs/reviews/architecture-overview.md), [lib.md](./docs/reviews/lib.md), [services.md](./docs/reviews/services.md), [database/prisma-schema.md](./docs/reviews/database/prisma-schema.md)

Notes
- Status judgments are based on explicit verification statements in Final Synthesis and Deep Dives. Where only recommendations were given without verification of implementation, status is marked NOT FIXED.
- As the review coverage reported is ~5.3% of the codebase, more issues may exist outside the reviewed set.
