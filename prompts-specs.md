# StormCom Hardening & Consolidation (Initial Findings)

Summarized conversation historyRefining the full Spec Kit prompt suite now with all additional evidence from the docs/reviews folder (architecture overview, executive summary, synthesis, deep dives, schema, services, components, authentication audit). Each prompt is standalone and ready to run. All refinements incorporate newly surfaced critical items: dual authentication system, multi-tenancy storefront bypass, schema normalization gaps (arrays, Refund entity, soft delete gaps), fragile error handling via string matching, missing caching/tag invalidation, accessibility & newsletter form deficiencies, lack of rate limiting & request IDs in some flows, inconsistent export/pagination, and incomplete audit logging.  

## /speckit.specify

````text
/speckit.specify

Title: StormCom Hardening & Consolidation Sprint (Security, Auth, Tenancy, Data Consistency, API Reliability, Accessibility, Performance, Testing)

**Note**: Only 'EXTRACTED_ISSUES_AND_RECOMMENDATIONS.md' is in the root directory. All the documents referenced are in the 'docs/reviews' folder and its sub-folders.

Executive Summary:
StormCom is a multi-tenant e-commerce SaaS (Next.js 16 App Router, React 19 Server Components, Prisma, NextAuth). Review documents (EXECUTIVE_SUMMARY.md, FINAL_SYNTHESIS_REPORT.md, AUTHENTICATION_AUDIT_REPORT.md, deep dive files) confirm strong foundational architecture but expose urgent issues:
1. CRITICAL: Checkout endpoint (`src/app/api/checkout/complete/route.ts`) unauthenticated, trusts client prices, lacks payment verification & idempotency.
2. CRITICAL: Storefront hardcodes storeId in 5+ pages (`shop/page.tsx`, products, categories, search), bypassing domain-based resolution—tenant isolation broken.
3. CRITICAL: Dual authentication systems (NextAuth + custom sessionId) run in parallel (AUTHENTICATION_AUDIT_REPORT.md) — must unify to NextAuth only.
4. HIGH: Newsletter form non-functional, no CSRF or server action; accessibility gaps (labels, ARIA, skip links).
5. HIGH: Data model inconsistencies (Product.images/metaKeywords as JSON strings normalized at API edge; lack of Refund entity; missing deletedAt on FlashSale-variant models).
6. HIGH: Error handling relies on brittle string matching across API routes (api-routes.md); absence of standardized error class hierarchy & API response builder.
7. HIGH: Missing rate limiting at endpoint layer for login, newsletter, checkout; IP fallback to 'unknown' accepted.
8. MEDIUM: Missing request correlation IDs & structured logging in proxy/application; audit logging not uniformly invoked (login success/failure vs others).
9. MEDIUM: Orders export may lack streaming/backpressure; inconsistent export patterns between products vs orders pages.
10. MEDIUM: Incomplete caching strategy (no unstable_cache tags, no tag invalidation for product/category/theme changes).
11. MEDIUM: Accessibility improvements required (storefront sections, forms, product tables, filter inputs).
12. MEDIUM: Testing coverage gaps—need systematic unit/integration/E2E for security flows (checkout price tamper, multi-tenancy domain isolation, auth lockout + MFA), plus performance & accessibility regression.

Goals:
- Eliminate security vulnerabilities and tenant bypass.
- Consolidate authentication to NextAuth only; decommission custom session system.
- Normalize data model for correctness and performance.
- Standardize error & response patterns across API/services.
- Introduce domain-based store resolution utilities and propagate storeId safely.
- Harden checkout: auth, server price recompute, payment intent verification, inventory transactional integrity, idempotency lock.
- Implement newsletter subscription Server Action (secure, validated, rate limited).
- Improve accessibility and SEO baseline (dynamic metadata, ARIA, labels).
- Add caching/tag strategy + invalidation on product/category/theme updates.
- Add request IDs, structured logging, audit log coverage.
- Achieve ≥80% business logic test coverage, ≥100% utilities, E2E for critical paths.

In-Scope:
- API route modifications (checkout, products, orders, auth endpoints).
- Removal/refactor of legacy custom auth endpoints & session store.
- Prisma migrations (array fields, Refund model, optional deletedAt additions).
- Caching + invalidation (unstable_cache, revalidateTag usage with profiles).
- Error class hierarchy + API response formatter module.
- Request correlation ID injection in proxy + logging enhancements.
- Server Action for newsletter subscribe.
- Domain-based store resolution utilities & refactor storefront pages.
- Accessibility improvements (labels, semantics, skip link, focus management).
- Testing additions: unit, integration, E2E (Playwright), axe accessibility checks.
- Rate limiting (login, newsletter, checkout, product create).
- Streaming/async export for large orders sets.

Out-of-Scope (for this sprint):
- Full performance benchmarking (k6 load tests) – only enabling infrastructure hooks.
- Advanced analytics refactors (analytics-service heavy queries).
- Payment provider integration expansion beyond verification step.
- Internationalization (i18n) features.
- A/B testing and personalization blocks.

Non-Goals:
- Introducing GraphQL or new state management libraries.
- Replacing existing UI component library (Radix + Tailwind).
- Reimagining entire architecture beyond hardening.

Primary Stakeholders:
- Security Lead (checkout, auth consolidation)
- Backend Lead (Prisma migrations, services)
- Frontend Lead (storefront tenancy, accessibility)
- QA Lead (test matrix, regression coverage)
- DevOps (rate limiting, logging, monitoring)

Success Criteria:
Short-term (2 weeks):
- Checkout secure (auth + price verification + payment check + idempotency).
- Storefront uses dynamic store resolution everywhere.
- Legacy custom auth endpoints removed or feature-parity migrated to NextAuth extensions.
- Newsletter subscription functional (Server Action, CSRF, rate limited).
Medium-term (1 month):
- Data model normalized (arrays + Refund model + deletedAt additions).
- Error classes in place; API responses standardized.
- Request IDs + audit logging coverage > 90% of mutations.
- Test coverage ≥60%; E2E critical flows green.
Long-term (3 months):
- Test coverage ≥80% logic, 100% utils.
- Accessibility WCAG 2.1 AA baseline validated.
- Caching tags & invalidation stable; performance regressions prevented.
- Dual auth fully removed; no stray sessionId cookies.

Constraints and Standards:
- File < 300 lines, function < 50 lines.
- No any types; strict TS.
- Multi-tenant isolation enforced (storeId always filtered).
- Server Component default; client only when interactivity required.
- Response format: { data, meta?, message? } or { error: { code, message, details? } }.
- Rate limiting: 100 req/min general; tighter (e.g., 10 login attempts/hour/IP).
- Accessibility: keyboard navigable, contrast ≥4.5:1, proper labels/ARIA.

Risks:
- Migration downtime (schema changes) – plan zero-downtime by phased dual fields.
- Breaking existing consumers with response format changes – introduce version header / api/v1 path.
- Auth consolidation confusion – clear migration guide; freeze legacy endpoints then remove.
- Cache invalidation complexity – start with conservative TTL + explicit tag revalidation.

References (Evidence Sources: 'docs/reviews' folder):
- EXECUTIVE_SUMMARY.md (critical vulnerabilities list)
- FINAL_SYNTHESIS_REPORT.md (multi-tenancy, storefront, checkout, schema normalization)
- AUTHENTICATION_AUDIT_REPORT.md (dual auth details)
- detailed/api-routes.md (error string matching, schema inconsistency)
- detailed/app-storefront-pages.md (hardcoded storeId, newsletter)
- detailed/app-dashboard-pages.md (DEFAULT_STORE_ID fallback, pagination consistency issues)
- database/prisma-schema.md (soft delete gaps, arrays, refund need)
- services.md (transaction & idempotency expectations)
- components/*.md (checkout, product, storefront accessibility/performance)
- lib.md (rate limit, middleware, logging & correlation)

Versioning:
Introduce /api/v1. Legacy endpoints remain temporarily under /api/ until migration complete (2-week deprecation window). Response header: X-StormCom-API-Version: v1.

Acceptance Criteria (selected examples):
AC-SEC-01: Unauthenticated checkout attempt returns 401 and no order created.
AC-SEC-02: Price tamper (client price != DB price) returns 400 with VALIDATION_ERROR.
AC-TENANCY-01: Visiting tenant domain resolves correct storeId and no cross-store product leakage (verified by E2E).
AC-AUTH-01: Legacy custom auth endpoints return 410 GONE after deprecation date; NextAuth flows provide password reset & history replaced via NextAuth extension.
AC-DATA-01: Product.images returns string[] from Prisma; no JSON parse in API handler.
AC-ERR-01: All API errors use error classes with statusCode and code fields.
AC-ACCESS-01: Axe scan of storefront homepage returns zero critical violations.
AC-TEST-01: Checkout tamper E2E test passes (manipulated payload blocked).
AC-CACHE-01: Product update triggers revalidateTag('products') and storefront shows updated info after next request.

Deliverables:
- Updated Prisma migrations
- New modules: error-classes.ts, api-response.ts, request-context.ts
- Refactored storefront pages
- Updated proxy.ts with request ID injection and structured log
- Newsletter Server Action (actions/newsletter.ts)
- Tests: unit (services), integration (API), E2E (multi-tenancy, checkout, newsletter)
- Migration guide: AUTH_CONSOLIDATION.md
- Updated OpenAPI spec including new error shapes

End of Specification.
````

## /speckit.clarify

````text
/speckit.clarify

List of Clarification Questions:

1. Payment Verification Scope:
   - Which gateway(s) currently integrated (Stripe only or placeholder)? Should we verify PaymentIntent status or generic paid flag?
2. Idempotency Strategy:
   - Reuse existing webhook-idempotency KV approach for checkout finalize or introduce Redis-based lock? Confirm storage layer availability (Upstash / Vercel KV).
3. Password Reset & History:
   - Migrate custom password reset & history to NextAuth extension or retain a minimal custom endpoint? Confirm target state.
4. Refund Model:
   - Requirements: Partial refunds, multi-refunds per Payment? Should Refund link to OrderItem(s) or just Payment? Include reason codes & metadata?
5. FlashSale deletedAt:
   - Is soft delete required for FlashSale entities or is isActive flag sufficient per business rules?
6. API Versioning:
   - Prefer path prefix (/api/v1) or header-only for first release? Any external consumers requiring legacy path?
7. Store Resolution:
   - Domain mapping spec: subdomain only (storeSlug.example.com) or full custom domains? Need fallback for ‘www’?
8. Caching TTL:
   - Proposed revalidate: 3600s for products/categories. Adjust shorter (300s) for prices or keep uniform? Any SLAs?
9. Rate Limiting:
   - Login attempt: limit 10/hour/IP; newsletter: 5/hour/IP; checkout finalize: 30/min/IP — confirm thresholds.
10. Request Correlation ID:
    - Format preference: cuid2 vs UUID v4? Add to response header X-Request-ID?
11. Error Codes:
    - Canonical list needed (e.g., AUTH_INVALID_CREDENTIALS, CHECKOUT_PRICE_MISMATCH, TENANCY_STORE_NOT_FOUND). Provide domain categories?
12. Accessibility Goal:
    - Mandatory immediate fixes limited to critical forms/navigation or full WCAG 2.1 AA audit this sprint?
13. Newsletter Data:
    - Persist subscribers in newsletterSubscriber table (already exists?) or create new model?
14. Export Limits:
    - Maximum orders exported inline? Implement streaming after threshold (10k) or earlier?
15. Refund Accounting:
    - Adjust inventory on refund (if returned) or no inventory change? Business rule required.
16. Legacy Auth Decommission Timeline:
    - Hard deadline for 410 responses? Two weeks okay or need phased brownout schedule?
17. Testing Environments:
    - Are Playwright browsers installed in CI currently or do we need setup step modifications?
18. Correlation & Audit Log:
    - Add correlationId to auditLog records? Confirm schema field or add migration?
19. API Response Meta:
    - Include totalPages and perPage consistently? Confirm standard presence in all list endpoints.
20. SEO Enhancements:
    - Include OpenGraph/Twitter by default or gated by future marketing sprint?

Please respond with decisions or defaults can be applied (will assume Stripe, UUID v4, path-based versioning, TTL 3600, limits as proposed if unanswered).
````

## /speckit.plan

````text
/speckit.plan

Phased Implementation Plan (aligned with reviewed documents)

Phase 0 (Preparation & Standards Alignment) – Day 0–1
- Confirm clarification answers (/speckit.clarify).
- Create branch: hardening-sprint-security-auth.
- Add baseline modules: error-classes.ts, api-response.ts, request-context.ts.
- Introduce request ID injection + structured logging skeleton in proxy.ts.
- Draft AUTH_CONSOLIDATION.md migration guide (refer AUTHENTICATION_AUDIT_REPORT.md).

Phase 1 (Critical Security & Tenancy) – Days 1–3
- Refactor checkout finalize endpoint: add auth, recompute prices server-side, verify payment intent, idempotency lock, transaction wrap (EXECUTIVE_SUMMARY.md, FINAL_SYNTHESIS_REPORT.md).
- Implement domain-based store resolution utility: getStoreByDomain() + propagate via layout/context; remove hardcoded IDs (app-storefront-pages.md).
- Replace DEFAULT_STORE_ID fallback in dashboard products page with redirect-to-login pattern (app-dashboard-pages.md).
- Add request correlation ID (proxy.ts) and ensure passed to audit logging.
- Rate limit sensitive endpoints: login, checkout, newsletter, product create (api-routes.md + lib.md).

Phase 2 (Authentication Consolidation) – Days 3–5
- Migrate password reset & history flows into NextAuth extension or dedicated NextAuth-compatible endpoints.
- Deprecate custom session endpoints: mark responses with deprecation header.
- Remove sessionId cookie write logic; map required legacy fields onto NextAuth JWT/session.
- Update proxy to rely solely on NextAuth (already does) and purge unused legacy references.

Phase 3 (Data Model Normalization) – Days 5–7
- Prisma migrations:
  - Convert Product.images & metaKeywords from String JSON to String[].
  - Introduce Refund model (link to Payment & optionally OrderItem).
  - Add deletedAt to FlashSale entities if required.
  - Add correlationId field to AuditLog (if absent).
- Backfill data for existing rows (parse JSON strings into arrays).
- Dual-field migration strategy if downtime risk (retain old columns until data verified then drop).

Phase 4 (Error Handling & API Consistency) – Days 7–9
- Implement error class hierarchy: BaseAppError, ValidationError, AuthError, TenancyError, CheckoutError, RateLimitError.
- Refactor API routes to use try/catch with instance checks (replace string matching).
- Standardize success: { data, meta?, message? } and error: { error: { code, message, details? } }.
- Introduce /api/v1 path & version header adoption; maintain temporary redirects for legacy paths.

Phase 5 (Caching, Invalidation, Performance) – Days 9–11
- Add unstable_cache wrappers for product/category/theme storefront queries with tags.
- Trigger revalidateTag() calls upon product/category/theme changes.
- Implement streaming CSV export for large order sets with chunked generator.
- Optimize storefront page with Suspense boundaries per section & skeleton components.

Phase 6 (Accessibility & Newsletter) – Days 11–13
- Implement newsletter subscribe Server Action (zod validation, rate limit, honeypot).
- Accessibility fixes (labels, aria, focus, skip link, role attribution).
- Dynamic metadata generation (OpenGraph/Twitter) using store settings.
- Automated axe checks integrated into Playwright E2E.

Phase 7 (Testing & Quality Gates) – Days 13–15
- Unit tests: services (checkout, product, order, refund, store resolution).
- Integration tests: API error mapping, response format, rate limiting, versioning.
- E2E tests: multi-tenant domain isolation, checkout tamper prevention, newsletter subscription, refund issuance.
- Accessibility & performance acceptance thresholds (LCP < 2.5s, no critical axe violations).
- Coverage target ≥60% (gateway to next sprint 80%).

Phase 8 (Documentation & Finalization) – Days 15–16
- Update OpenAPI spec with new endpoints & error codes.
- Update README + AUTH_CONSOLIDATION.md, MIGRATION_NOTES.md.
- Write RELEASE_NOTES including breaking changes & deprecation timeline.
- Run final regression suite; resolve residual issues.

Dependencies & Sequencing:
- Auth consolidation must wait until critical security (checkout) patched (do not delay patch for consolidation).
- Data migrations post-auth changes to avoid compounding complexity with simultaneous security patch deployments.
- Caching after error format standardization (ensures consistent invalidation semantics).
- Accessibility improvements after stable tenancy resolution (avoid rework).

Rollout Strategy:
- Feature flags for new checkout logic (shadow execution comparing new vs old totals).
- Dual field migration for arrays (imagesArray temp) then swap & drop original.
- Deprecation schedule: legacy auth endpoints return warning headers Day 3–10, return 410 Day 11+.

Monitoring & Observability:
- Include correlationId in logs & auditLog.
- Metrics: count of blocked checkout tamper attempts, rate limit rejects, auth consolidation success rate.
- Dashboard panels (requests/min, error distribution, average processing time).

Risk Mitigation:
- If migration fails (arrays parse errors), fallback to old normalization logic temporarily.
- Idempotency race conditions: implement atomic KV set NX semantics.

References:
Map each phase tasks to review docs evidence (embedded in tasks prompt).

End of Plan.
````

## /speckit.tasks

````text
/speckit.tasks

Task List (Grouped by Phase, With IDs, Priority, Evidence Source, Acceptance Criteria)

Phase 1 – Critical Security & Tenancy
[SEC-001] Add authentication & session retrieval to checkout finalize route.
  Evidence: EXECUTIVE_SUMMARY.md (Checkout Security Vulnerability), FINAL_SYNTHESIS_REPORT.md.
  AC: Unauthenticated POST returns 401; authenticated uses server recomputed totals.
[SEC-002] Implement server-side price/tax/shipping recomputation & ensure mismatch returns 400 CODE=CHECKOUT_PRICE_MISMATCH.
  Evidence: api-routes.md (trusts client prices).
[SEC-003] Add payment intent verification step (Stripe PaymentIntent status) before order creation.
  Evidence: EXECUTIVE_SUMMARY.md missing payment verification.
[SEC-004] Implement idempotency lock for checkout finalize (reuse webhook-idempotency utilities).
  Evidence: services.md (checkout-service), lib/webhook-idempotency.ts.
[SEC-005] Wrap checkout logic in db.$transaction (inventory decrements, order create, payment record).
  Evidence: checkout-service.ts risk; finalize route lacked transaction comprehension.
[TEN-001] Create getStoreByDomain(host) utility + unify domain/subdomain logic.
  Evidence: app-storefront-pages.md (hardcoded ID).
[TEN-002] Refactor storefront pages (home, products list, product detail, categories, search) to use resolved storeId.
  Evidence: FINAL_SYNTHESIS_REPORT.md multi-tenancy bypass listing.
[TEN-003] Remove DEFAULT_STORE_ID fallback from dashboard products page; redirect to login if no session storeId.
  Evidence: app-dashboard-pages.md.
[SEC-006] Rate limit login, checkout finalize, newsletter subscribe, product create.
  Config: login 10/hour/IP, checkout 30/min/IP, newsletter 5/hour/IP, product create 100/hour/IP.
  Evidence: lib.md (rate-limit review), api-routes.md (missing).
[SEC-007] Inject correlationId (UUID v4 or cuid2) in proxy.ts; set X-Request-ID response header.
  Evidence: lib.md logging & audit recommendations; FINAL_SYNTHESIS_REPORT.md absence.

Phase 2 – Authentication Consolidation
[AUTH-001] Inventory all custom auth endpoints & session-service usage.
  Evidence: AUTHENTICATION_AUDIT_REPORT.md (list).
[AUTH-002] Implement NextAuth password reset & email verification flows (extend callbacks).
[AUTH-003] Migrate password history & lockout logic into NextAuth authorize() or custom adapter calls.
[AUTH-004] Mark legacy endpoints with Deprecation headers (X-Deprecated: true).
[AUTH-005] Remove sessionId cookie issuance; strip custom session storage references.
[AUTH-006] Produce AUTH_CONSOLIDATION.md guide (mapping old to new flows).
[AUTH-007] Add E2E tests ensuring only NextAuth cookies recognized by protected routes.

Phase 3 – Data Model Normalization
[DATA-001] Prisma migration: Product.images & metaKeywords → String[] (with default []).
  Evidence: api-routes.md normalization bug; prisma-schema.md improvement area.
[DATA-002] Backfill data: parse existing string JSON into arrays; log exceptions.
[DATA-003] Add Refund model (id, paymentId, orderId?, amount, currency, reasonCode enum, metadata JSON, createdAt).
  Evidence: prisma-schema.md recommendation; services (payment-service) future audit.
[DATA-004] Add deletedAt to FlashSale entities (if business requires soft delete).
[DATA-005] Add correlationId String? to AuditLog for request linkage.
[DATA-006] Generate migration script & update schema docs (database/prisma-schema.md).
[DATA-007] Add unit tests verifying array fields returned correctly (no JSON parsing code left in handlers).

Phase 4 – Error Handling & API Consistency
[API-001] Implement error classes (BaseAppError, ValidationError, AuthError, TenancyError, CheckoutError, RateLimitError, ConflictError).
[API-002] Create api-response.ts (success & error helper).
[API-003] Refactor products, checkout, auth, orders routes to use new pattern (remove string matching).
[API-004] Introduce /api/v1 prefix; legacy endpoints remain temporarily.
[API-005] Add OpenAPI spec updates (status codes, error codes).
[API-006] Enforce numeric query param validation (minPrice, maxPrice, page > 0).
[API-007] Add pagination meta uniform (page, perPage, total, totalPages).
[API-008] Add global RateLimitError mapping (429 with headers).
[API-009] Add automated tests for error mapping & response structure.

Phase 5 – Caching, Invalidation, Performance
[PERF-001] Wrap product/category/theme queries in unstable_cache with tags & 3600s TTL; support manual revalidateTag.
[PERF-002] Add revalidateTag triggers in product/category/theme mutation services.
[PERF-003] Implement streaming/chunked CSV exports for orders (backpressure, flush every N rows).
[PERF-004] Add Suspense boundaries + skeleton components for storefront sections.
[PERF-005] Add dynamic metadata generation (OpenGraph/Twitter) per store settings.
[PERF-006] Add server-side price formatting utility & ensure minimal fields fetched.

Phase 6 – Accessibility & Newsletter
[ACC-001] Add skip-to-content link & focus ring standardizations.
[ACC-002] Add labels/ARIA attributes for newsletter form, product filters, tables.
[ACC-003] Implement newsletter Server Action (subscribeNewsletter) with Zod validation, honeypot, CSRF (via default server action protection).
[ACC-004] Rate limit newsletter (tie to SEC-006).
[ACC-005] Add axe accessibility E2E tests for core pages.
[ACC-006] Add descriptive alt texts, aria-live region for subscription success/error.
[ACC-007] Add heading hierarchy check in tests (no skipped levels).

Phase 7 – Testing & Coverage
[TEST-001] Unit tests: checkout-service (price recompute mismatch), product-service (images arrays), refund-service.
[TEST-002] Integration tests: products API validation, error codes, rate limiting.
[TEST-003] E2E multi-tenancy domain isolation (different domain shows distinct catalog).
[TEST-004] E2E checkout tamper prevention (client-altered price blocked).
[TEST-005] E2E newsletter subscription (success, duplicate email rate limit).
[TEST-006] E2E refund issuance & order totals adjustment (if required).
[TEST-007] Accessibility axe scan integrated (Playwright).
[TEST-008] Coverage threshold enforcement (≥60% lines/functions). Report tasks failing coverage.

Phase 8 – Documentation & Finalization
[DOC-001] Update OpenAPI spec (contracts/openapi.yaml) with new endpoints + error shapes.
[DOC-002] Create MIGRATION_NOTES.md (schema changes, auth consolidation).
[DOC-003] Update README security section (checkout fix, single auth).
[DOC-004] Document caching/tag strategy & invalidation triggers.
[DOC-005] Add RELEASE_NOTES for sprint.
[DOC-006] Update database schema guide with array + Refund + deletedAt additions.
[DOC-007] Add testing matrix (VERIFICATION_MATRIX.md reference) linking new tests.

Cross-Cutting
[OBS-001] Logging: Add structured log wrapper with correlationId & severity levels.
[OBS-002] Audit logging: Add audit calls to checkout finalize, product create/update/delete, refund.
[OBS-003] Monitoring counters: blockedCheckoutTamper, rateLimitHits, legacyAuthCalls (for deprecation window).

Each task should maintain file/function size constraints and include tests where applicable.

End of Tasks.
````

## /speckit.checklist

````text
/speckit.checklist

Checklist (Mark when complete):

Security & Tenancy
[ ] SEC-001 Checkout route requires auth & rejects unauth.
[ ] SEC-002 Server recompute prevents price tamper (unit + E2E).
[ ] SEC-003 Payment intent verified before order creation.
[ ] SEC-004 Idempotency prevents duplicate orders (log keys).
[ ] TEN-001 Domain-based store resolution utility implemented.
[ ] TEN-002 All storefront pages use dynamic storeId (no hardcoded IDs).
[ ] TEN-003 DEFAULT_STORE_ID fallback removed (dashboard).
[ ] SEC-006 Rate limiting applied & returns correct headers.
[ ] SEC-007 Correlation ID present in responses & logs.

Authentication
[ ] AUTH-001 Legacy endpoints inventoried.
[ ] AUTH-002 Password reset migrated to NextAuth.
[ ] AUTH-003 Password history integrated.
[ ] AUTH-004 Deprecation headers live for legacy endpoints.
[ ] AUTH-005 SessionId cookie elimination verified (no writes).
[ ] AUTH-006 Consolidation doc published.
[ ] AUTH-007 E2E: Protected route rejects legacy-only auth.

Data Model
[ ] DATA-001 Arrays migration applied.
[ ] DATA-002 Data backfill correct (no parse failures).
[ ] DATA-003 Refund model implemented & accessible.
[ ] DATA-004 FlashSale soft delete decision documented.
[ ] DATA-005 AuditLog correlationId field usable.
[ ] DATA-006 Schema docs updated.
[ ] DATA-007 API handlers free of JSON parse normalization.

Error & API
[ ] API-001 Error classes exported.
[ ] API-002 api-response helpers used across routes.
[ ] API-003 Refactors complete (no string matching).
[ ] API-004 /api/v1 prefix active & legacy fallback defined.
[ ] API-005 OpenAPI spec updated with codes.
[ ] API-006 Numeric validation enforced.
[ ] API-007 Pagination meta uniform.
[ ] API-008 RateLimitError mapping returns 429 + headers.
[ ] API-009 Integration tests pass.

Performance & Caching
[ ] PERF-001 Cached queries live with tags.
[ ] PERF-002 Tag revalidation triggers on mutation.
[ ] PERF-003 Streaming export handles >10k records.
[ ] PERF-004 Suspense boundaries & skeletons added.
[ ] PERF-005 Dynamic metadata generated.
[ ] PERF-006 Select statements minimized payload.

Accessibility & Newsletter
[ ] ACC-001 Skip link & focus styles implemented.
[ ] ACC-002 ARIA/labels added to interactive elements.
[ ] ACC-003 Newsletter Server Action functional.
[ ] ACC-004 Newsletter rate limited.
[ ] ACC-005 Axe tests zero critical violations.
[ ] ACC-006 aria-live feedback on subscription.
[ ] ACC-007 Heading hierarchy validated.

Testing & Coverage
[ ] TEST-001–TEST-008 all green.
[ ] Coverage ≥60% (report attached).
[ ] E2E multi-tenancy isolation validated (distinct stores).
[ ] Refund flow tests complete (if implemented).
[ ] Accessibility E2E integrated in CI.

Documentation
[ ] DOC-001 OpenAPI updated.
[ ] DOC-002 MIGRATION_NOTES.md created.
[ ] DOC-003 README updated.
[ ] DOC-004 Caching strategy docs.
[ ] DOC-005 RELEASE_NOTES published.
[ ] DOC-006 Schema guide updated.
[ ] DOC-007 Test matrix updated.

Observability
[ ] OBS-001 Structured logging & correlationId present.
[ ] OBS-002 Audit logging for all mutations.
[ ] OBS-003 Metrics counters collected.

Final Validation
[ ] All critical issues resolved (mapped to original docs).
[ ] Legacy auth returns 410 after window.
[ ] No hardcoded storeId found via grep.
[ ] No JSON.parse normalization for images deployed.
[ ] Manual smoke test of checkout & multi-tenancy passes.

End of Checklist.
````

## /speckit.analyze

````text
/speckit.analyze

Risk & Impact Analysis:

Critical Risks:
1. Dual Auth Persistence: If consolidation delayed, confusion & security surface remain.
   Mitigation: Fast deprecation schedule, authoritative one-time migration script, warnings early.
2. Checkout Race Conditions: Idempotency failure could duplicate inventory decrement.
   Mitigation: Atomic KV lock; add compensation routine for detected duplicates.
3. Data Migration Corruption (JSON parse failures):
   Mitigation: Dry-run parse, log anomalies, fallback snapshot, transaction rollback on fatal error.
4. Multi-Tenancy Regression: Refactor could introduce storeId leakage.
   Mitigation: Add E2E tests before merge; enforce storeId filter in service layer (assertions).
5. Error Refactor Breakage: Changing error patterns may break existing client handling.
   Mitigation: Dual-mode error mapping (legacy code path -> map to new structure) during transition.

Medium Risks:
1. Refund Model Complexity: Partial refunds vs full; accounting correctness.
   Mitigation: Start with simple full refund model; extend partial later.
2. Caching Staleness: Tag misuse leads to stale content.
   Mitigation: Use deterministic tag naming; tests verifying revalidateTag on mutations.
3. Accessibility Scope Creep: Attempting full audit may delay critical security fixes.
   Mitigation: Limit to critical form & navigation issues this sprint.

Low Risks:
1. Logging Overhead: Correlation logging might increase latency.
   Mitigation: Structured JSON logs only for mutation routes.
2. Schema Additions Performance: Additional indexes may impact write throughput.
   Mitigation: Add only necessary indexes; monitor performance post-deploy.

Technical Debt Reduction:
- Remove brittle string error matching (api-routes.md).
- Eliminate JSON parse data normalization (products route).
- Consolidate auth logic (AUTHENTICATION_AUDIT_REPORT.md).
- Introduce consistent observability (lib.md logging recommendations).

Test Strategy Mapping:
- Security: Tamper test (checkout), unauthorized attempt, rate limit exceed.
- Tenancy: Domain resolution for two distinct test stores.
- Data Integrity: Images/metaKeywords arrays returned raw in responses.
- Error Consistency: Snapshot tests of API error bodies.
- Accessibility: Axe + keyboard navigation flows.
- Performance: Streaming export generating large file under threshold (< memory blowout).
- Observability: Assert presence of X-Request-ID header.

Backout Plan:
- If migration fails, revert schema migration commit; retain old columns until parse stable.
- If NextAuth consolidation breaks password reset flows, temporarily keep minimal legacy endpoint with warning.

Metrics Post-Deployment:
- checkoutTamperBlockedCount
- domainResolutionFailures
- legacyAuthRequests (expected trending to zero)
- cacheInvalidationsTriggered
- accessibilityViolationsCount (expected zero)
- refundRequestsProcessed

End of Analysis.
````

## /speckit.implement

````text
/speckit.implement

Initial Implementation Guidance (Focus: Phase 1 Critical Items):

1. Checkout Finalize Refactor:
   - Add session: const session = await getServerSession(authOptions); if !session return 401.
   - Parse body; ignore client prices; fetch products & variants and recompute subtotal, taxes, discounts.
   - Verify payment intent status (Stripe: retrieve PaymentIntent, check status === 'succeeded' or 'requires_capture' if capture later).
   - Idempotency:
     acquire = tryAcquireIdempotency(key: hash(session.user.id + cartHash))
     if !acquire -> return 409 DUPLICATE_REQUEST
     finally mark success.
   - Transaction:
     db.$transaction(tx => { createOrder; decrement inventory; record payment; write audit log with correlationId }).
   - API Response: { data: order, message: 'Checkout complete' }.

2. Domain-Based Store Resolution:
   - lib/store-resolution.ts → export async function resolveStoreFromHost(host: string): Promise<Store| null>.
   - Proxy passes host via request headers (already accessible).
   - In shop layout: const store = await resolveStoreFromHost(host); provide StoreContext; children pages read via context rather than hardcoding.

3. Remove DEFAULT_STORE_ID fallback:
   - In dashboard products page: if !session?.user?.storeId redirect('/login'); never fallback to env var.

4. Rate Limiting:
   - Extend existing rate-limit utility; add wrapper for route handlers:
     await enforceRateLimit(request, 'checkout_finalize', limits.checkoutFinalize)
   - Return 429 with { error: { code: 'RATE_LIMIT_EXCEEDED', message } } and appropriate headers.

5. Correlation ID:
   - In proxy.ts: const correlationId = crypto.randomUUID(); attach to request context (global AsyncLocalStorage); add X-Request-ID header; include in auditLog.

6. Newsletter Server Action (stub for Phase 6 but scaffold early to avoid merging conflicts):
   - actions/newsletter.ts 'use server'; validate email; rate limit; insert into newsletterSubscriber; send confirmation email (stub); return structured response.

7. Add Temporary Feature Flag for New Checkout:
   - env: CHECKOUT_HARDENING_ENABLED=true; run old code in shadow comparison for 24h in staging.

8. Test Stubs:
   - Add integration tests verifying unauthorized checkout returns 401 pre-refactor (to see change).
   - Add tests for domain resolution (two fake hosts mapping to distinct storeIds).

Prioritization:
Execute SEC-001 through SEC-007 before touching schema or auth consolidation.

End of Initial Implementation Guidance.
````

## /speckit.constitution

````text
/speckit.constitution

Amendments Proposal:

1. Authentication Uniqueness:
   - Add clause: “StormCom SHALL operate a single authentication stack (NextAuth). Parallel custom session systems are prohibited post consolidation. Legacy auth endpoints MUST be removed or return 410 status after deprecation window.”

2. Data Normalization:
   - Add requirement: “API handlers MUST NOT perform data-type normalization for persistence layer inconsistencies. Data schemas MUST be corrected via migrations.”

3. Error Handling Standard:
   - Add: “String-based error discrimination is forbidden. All application errors MUST derive from a BaseAppError with code and statusCode.”

4. Observability:
   - Add: “Every mutation request MUST include a correlationId accessible to logging + audit records. Response MUST include X-Request-ID header.”

5. Tenancy Resolution:
   - Add: “Storefront pages MUST derive storeId from domain/subdomain resolution; hardcoded storeId literals in pages/components are prohibited.”

6. Idempotency:
   - Add: “Critical financial or inventory-affecting operations (checkout finalize, refund, bulk import) MUST be idempotent with atomic lock semantics.”

7. Caching & Invalidation:
   - Add: “Any cached query MUST declare its tags; mutation operations MUST trigger explicit tag revalidation for affected resources.”

8. Accessibility Immediate Scope:
   - Add: “Forms, navigation, and interactive tables MUST include proper labels, ARIA roles, and pass axe critical checks prior to merging.”

9. Rate Limiting:
   - Add: “Sensitive endpoints (auth, checkout, newsletter, product mutation) MUST implement per-IP rate limiting with documented thresholds.”

10. Response Format Enforcement:
    - Add: “All API responses MUST conform to unified schema: success { data, meta?, message? } / error { error: { code, message, details? } } across /api/v1 endpoints.”

Version Increment:
Update constitution version: 1.3.0 → 1.4.0 upon adoption.

End of Amendments.
````

## Optional Additional Prompts

### /speckit.regression

````text
/speckit.regression

Regression Targets:
- Checkout order creation with identical payload twice → second blocked (idempotency).
- Multi-tenancy: Visiting storeA domain shows only storeA products, storeB domain only storeB products.
- Products API no longer parsing JSON strings (array fields native).
- Legacy auth endpoints return 410 post-cutover.
- Error responses all match new schema (snapshot check).
- Newsletter subscription rate limit returns 429 on 6th attempt/hour/IP.
- Streaming export memory stable (<200MB) with 25k orders.
- Accessibility axe scan: zero critical violations on shop homepage and dashboard products page.
````

### /speckit.monitor

````text
/speckit.monitor

Monitoring Plan:
Metrics:
- checkoutTamperBlockedCount (counter)
- checkoutIdempotencyLockContention (counter)
- rateLimitHits{endpoint}
- domainResolutionFailures
- productCacheHits / productCacheMisses
- auditLogWriteFailures
- accessibilityViolationCount (nightly scan)

Alerts:
- If checkoutTamperBlockedCount > threshold (investigate fraud attempts).
- If domainResolutionFailures > 0 in 24h (tenancy regression).
- If auditLogWriteFailures > 0 (logging integrity risk).
- If rateLimitHits spiking unsustainably (potential attack).

Log Structure:
{
  timestamp,
  correlationId,
  level,
  event,
  userId?,
  storeId?,
  code?,
  durationMs,
  metadata
}

End of Monitoring Plan.
````

## /speckit.validate

````text
/speckit.validate

Validation Queries:
1. grep -R "fa30516f-dd0d-4b24-befe-e4c7606b841e" src/app/shop → EXPECT 0 matches post-refactor.
2. grep -R "DEFAULT_STORE_ID" src/app/(dashboard) → EXPECT 0 matches.
3. grep -R "JSON.parse(p.images" → EXPECT 0 matches.
4. grep -R "sessionId" src/app/api/auth → EXPECT only in deprecation responses.
5. Run E2E multi-tenancy script: verify distinct catalogs.
6. Confirm OpenAPI spec lists Refund endpoints & updated Product schema arrays.
7. Run axe scan scripts; produce zero critical violations report.
End of Validation Queries.
````

---

If you need any adjustment, deeper granularity for a subset (e.g., error codes taxonomy), or immediate conversion into actual code scaffolds, let me know and I will proceed. All prompts now integrate the insights from the review markdown files.