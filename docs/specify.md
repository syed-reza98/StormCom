## /speckit.specify

StormCom has three critical issues: (1) insecure checkout flow (no auth enforcement, trusts client-submitted prices, incomplete transactional boundaries, missing payment verification), (2) storefront multi-tenancy bypass (hardcoded storeId, inconsistent domain-based store resolution propagation), and (3) a non-functional newsletter signup path. Additional high/medium issues include inconsistent schema arrays vs strings, ad hoc error handling via string matching, absence of a formal caching/tag invalidation strategy, incomplete Prisma multi-tenant middleware enforcement, and partial transaction scope in certain service flows.

This specification defines the objectives, constraints, acceptance criteria, and success measures for remediating these issues while aligning with Next.js 16 (App Router + proxy), React 19 Server Components-first design, strict TypeScript, Prisma tenant isolation, WCAG 2.1 AA accessibility, and performance budgets.

Goals & Objectives:
1. Secure checkout: Enforce authentication, re-verify prices server-side, validate payment intents, wrap all write operations in atomic transactions.
2. Enforce multi-tenancy storefront: Implement canonical store resolution (domain/subdomain -> storeId) and eliminate all hardcoded identifiers.
3. Implement functional newsletter signup (Server Action + validation + rate limit + audit logging + consent record creation).
4. Standardize error handling (Error class hierarchy, typed error codes, unified API response pattern).
5. Align data schema (migrate inconsistent string[]/string fields, add missing deletedAt where necessary, consider JSON column migrations for PostgreSQL).
6. Strengthen Prisma middleware (guaranteed storeId injection for all tenant-scoped models; audit missing models).
7. Expand transactional integrity (checkout, inventory adjustments, discount application, payment capture/refund flows).
8. Introduce caching strategy (cache tags + revalidateTag w/ second arg + optional Cache Components adoption plan, selective stable fetch caching with "use cache").
9. Performance & accessibility validation (maintain budgets: LCP<2.5s mobile, CLS<0.1, JS bundle<200KB gzipped; Axe core zero blocking violations; multi-tenant queries optimized).
10. Comprehensive test coverage uplift (≥80% services, 100% utilities; E2E coverage for checkout, tenancy resolution, newsletter; error handling cases; migration tests).
11. Establish API middleware pipeline (auth, rate limit, request validation, structured logging with requestId header) eliminating string-based error matching.
12. Correct REST semantics & response consistency (PUT requires full resource; PATCH partial; remove inconsistent `success` flags; uniform error payloads).
13. Implement streaming CSV export with size limits & background job fallback for large order datasets.
14. Elevate storefront SEO & accessibility (dynamic per-store metadata, Open Graph/Twitter, optional JSON-LD, figure/figcaption for charts, skip links, aria-live status components).
15. Harden dashboard access (remove DEFAULT_STORE_ID fallback, enforce redirect for unauthenticated, introduce Suspense + skeleton patterns).
16. Integrate GDPR cookie consent banner (ConsentRecord persistence, respect DNT) and align newsletter & tracking behavior.
17. Improve analytics & chart accessibility (textual summaries, data transformation utilities, cache tags for expensive aggregations).

Scope:
IN-SCOPE:
- Checkout route handlers/service logic (pricing, payment, inventory, discount, order creation).
- Storefront domain resolution utility (server-only) + layout propagation.
- Newsletter subscription pipeline (Server Action, GDPR consent, duplicate prevention, audit logging).
- Error handling module refactor (new errors in src/lib/errors.ts + mapping layer).
- Prisma middleware enhancements (src/lib/prisma-middleware.ts or integrated into db.ts).
- Schema migration(s) (prisma/schema.prisma + migration generation) for arrays vs strings and deletedAt additions.
- Caching strategy primitives (tag registry, usage docs, integration into product, category, page fetchers).
- Test suites (unit, integration, E2E) additions & updates.
- Documentation updates (design-system.md, testing-strategy.md, database/schema-guide.md, CHANGELOG.md).

OUT-OF-SCOPE (Future or Separate Initiatives):
- Payment provider abstraction overhaul beyond verification (e.g., multi-gateway expansion).
- Full analytics subsystem redesign.
- Search indexing engine (Elasticsearch/OpenSearch) adoption.
- Full CDN edge caching strategy (beyond Next.js standard).

Non-Functional Requirements (NFR):
Performance: p95 API <500ms (checkout <650ms including payment), DB p95 queries <100ms.
Reliability: All critical flows wrapped in transactions with rollback semantics.
Security: Auth required for checkout; price calculated server-side; payment intent validated; rate limiting (100 req/min) for newsletter + checkout.
Compliance: GDPR consent recorded; audit log entries for subscription and order creation; PCI boundaries respected (no raw card storage).
Accessibility: Newsletter form & checkout maintain WCAG 2.1 AA; keyboard navigation, ARIA labels, focus ring consistency.
Observability: Structured logs (level, module, correlationId) + error codes surfaced consistently.
Maintainability: Files <300 lines, functions <50 lines, error class hierarchy documented; minimal client-side state.
Testability: Deterministic test data fixtures; coverage thresholds enforced; E2E critical path stable across browsers.

Functional Requirements (FR):
FR-001: Secure checkout must reject unauthenticated requests.
FR-002: Checkout recalculates line item totals and discounts server-side ignoring client-submitted prices.
FR-003: Payment intent or token is validated before order creation; failed validation aborts transaction.
FR-004: Order creation, inventory decrement, discount usage mark, and payment record are a single atomic transaction.
FR-005: Storefront requests derive storeId from domain/subdomain mapping; fallback to 404 if unresolvable.
FR-006: No hardcoded storeId remains in storefront components or services.
FR-007: Newsletter subscription uses Server Action with Zod validation, deduplication (email+storeId), GDPR consent creation, optional double opt-in placeholder.
FR-008: Error handling returns consistent shape `{ error: { code, message, details? } }` and success returns `{ data, meta?, message? }`.
FR-009: All tenant-scoped Prisma queries enforce storeId filter either via middleware or explicit where clause.
FR-010: Data schema consistency: targeted fields migrated to correct types (string[] vs CSV string) with backfill and forward validation.
FR-011: Caching: Tag definitions for products, categories, pages; invalidation on create/update/delete (revalidateTag(tag,"max")).
FR-012: Introduce Cache Components plan (flag disabled initially; documented enabling steps).
FR-013: Test coverage thresholds enforced by CI; new tests for checkout fraud scenarios, multi-tenant isolation breach attempts, newsletter flows, error mapping.
FR-014: API middleware pipeline enforces auth, rate limits (100 req/min IP baseline; stricter for login), request validation (Zod), structured logging with requestId.
FR-015: Products endpoints: PUT requires full schema; PATCH allows partial; error payload uniform (no `success` field); uses error classes.
FR-016: Orders CSV export streams response for <=10k rows; >10k triggers background job & downloadable link notification.
FR-017: Dashboard pages redirect unauthenticated users; no DEFAULT_STORE_ID fallback present; list pages use Suspense + skeleton components.
FR-018: Analytics & chart components include `<figure>` + `<figcaption>` or textual summary; axe accessibility audit passes with zero violations.
FR-019: GDPR cookie consent banner writes ConsentRecord per store and honors DNT (no tracking or analytics beyond essential).
FR-020: Storefront dynamic metadata (title, description, Open Graph, Twitter card) per store; optional JSON-LD for product & shop pages.
FR-021: Request/response include `X-Request-Id` header on all API responses produced by middleware.

Acceptance Criteria:
AC-001: All critical issues resolved; manual penetration test reports 0 high severity findings.
AC-002: Hardcoded storeId search yields zero results outside controlled fixtures/tests.
AC-003: Checkout E2E test passes across Chromium/Firefox/WebKit and validates server-side price mismatch correction.
AC-004: Newsletter E2E test shows successful subscription, audit log entry, consent record.
AC-005: Prisma middleware logs storeId injection for all tenant models (verified via instrumentation test).
AC-006: Migration(s) applied cleanly; no orphaned data; dev & prod schema parity.
AC-007: Error responses standardized (sample audit shows 100% conformity for modified endpoints).
AC-008: Cache tag invalidation observed (revalidateTag invoked with second argument) after product update test.
AC-009: Coverage reports meet thresholds (≥80% services, 100% utilities).
AC-010: Lighthouse CI and Axe tests pass budgets and accessibility checks.
AC-011: Streaming CSV export integration test completes under memory threshold; large export job path validated.
AC-012: All API responses include `X-Request-Id`; logs correlate (sampled verification with grep).
AC-013: PUT/PATCH semantics verified by integration tests (PUT fails on partial; PATCH succeeds on partial) & consistent error payloads (no stray `success` flag).
AC-014: Dashboard unauthenticated access redirects to /login; grep confirms absence of DEFAULT_STORE_ID fallback.
AC-015: Storefront metadata dynamic per store; Open Graph tags present; optional JSON-LD validated in test snapshot.
AC-016: Charts audited: each has `<figure>` & `<figcaption>`; accessibility scan shows zero violations in analytics page.
AC-017: GDPR consent persisted; DNT requests bypass non-essential tracking (log sample demonstrates skip).

Constraints:
- Next.js 16 App Router only; async params/searchParams; proxy.ts for auth/rate limiting.
- React 19 Server Components default; minimal Client Components.
- TypeScript strict; no any.
- Prisma only; no raw SQL; multi-tenant enforced.
- Tailwind exclusively; no CSS-in-JS.
- File/function line limits.
- Implementation must not regress performance budgets.

Risks & Mitigations:
R1: Transaction complexity increases risk of deadlocks -> Use minimal locking scope; avoid unnecessary read-after-write inside same transaction.
R2: Schema migrations could impact existing data -> Dry-run & backup; write idempotent migration scripts; add verification tests.
R3: Payment intent validation integration complexity -> Start with stub/adapter; progressive hardening.
R4: Caching misconfiguration -> Start with conservative tags; add observability counters; rollback plan (feature flag).
R5: Error hierarchy adoption regressions -> Provide adapter shim mapping legacy strings to new error codes during transition.

Glossary (Selected):
StoreId: Tenant discriminator for all multi-tenant data.
Cache Tag: Semantic identifier (e.g., product:<id>, products:list:store:<storeId>) used with revalidateTag.
Server Action: `'use server'` function for form mutation or secure writes.
Atomic Transaction: All-or-nothing database operation group.
Consent Record: GDPR artifact tracking user consent.

Out of Scope Clarifications:
- Real-time inventory sync with external marketplaces.
- Full theme versioning system (documented as future improvement).
- Refund partial ledger (placeholder suggestion only).

High-Level Data Flow (Checkout):
Client Cart -> Server (Checkout Action/API) -> Re-fetch products & discounts -> Validate payment intent -> Begin Transaction -> Create Order -> Create OrderItems -> Adjust Inventory -> Record Payment -> Commit -> Emit Audit Log -> Return response.

Initial Test Strategy Summary:
- Unit: Price recalculation, payment validation stub, error mapping, store resolution.
- Integration: Transaction success/rollback scenarios, middleware enforcement.
- E2E: Checkout (price tampering attempt), Newsletter subscription, Multi-tenant isolation (cross-store data access attempt blocked).
- Accessibility: Focus traversal on forms, labels, color contrast.
- Performance: k6 smoke (light) & Lighthouse CI gating.