# StormCom Spec Kit Prompts

## /speckit.specify

Title: StormCom Security, Multi-Tenancy, Data Integrity & Platform Hardening Initiative (Q4 2025)
Version: 1.0.0
Status: Draft
Owner: Architecture & Platform Team
Last Updated: 2025-11-12

### 1. Executive Summary
StormCom has successfully completed the dual-auth migration and now runs exclusively on NextAuth.js. However, three critical issues remain: (1) insecure checkout flow (no auth enforcement, trusts client-submitted prices, incomplete transactional boundaries, missing payment verification), (2) storefront multi-tenancy bypass (hardcoded storeId, inconsistent domain-based store resolution propagation), and (3) a non-functional newsletter signup path. Additional high/medium issues include inconsistent schema arrays vs strings, ad hoc error handling via string matching, absence of a formal caching/tag invalidation strategy, incomplete Prisma multi-tenant middleware enforcement, and partial transaction scope in certain service flows.

This specification defines the objectives, constraints, acceptance criteria, and success measures for remediating these issues while aligning with Next.js 16 (App Router + proxy), React 19 Server Components-first design, strict TypeScript, Prisma tenant isolation, WCAG 2.1 AA accessibility, and performance budgets.

### 2. Goals & Objectives
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

### 3. Scope
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

### 4. Non-Functional Requirements (NFR)
Performance: p95 API <500ms (checkout <650ms including payment), DB p95 queries <100ms.
Reliability: All critical flows wrapped in transactions with rollback semantics.
Security: Auth required for checkout; price calculated server-side; payment intent validated; rate limiting (100 req/min) for newsletter + checkout.
Compliance: GDPR consent recorded; audit log entries for subscription and order creation; PCI boundaries respected (no raw card storage).
Accessibility: Newsletter form & checkout maintain WCAG 2.1 AA; keyboard navigation, ARIA labels, focus ring consistency.
Observability: Structured logs (level, module, correlationId) + error codes surfaced consistently.
Maintainability: Files <300 lines, functions <50 lines, error class hierarchy documented; minimal client-side state.
Testability: Deterministic test data fixtures; coverage thresholds enforced; E2E critical path stable across browsers.

### 5. Functional Requirements (FR)
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

### 6. Acceptance Criteria
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

### 7. Constraints
- Next.js 16 App Router only; async params/searchParams; proxy.ts for auth/rate limiting.
- React 19 Server Components default; minimal Client Components.
- TypeScript strict; no any.
- Prisma only; no raw SQL; multi-tenant enforced.
- Tailwind exclusively; no CSS-in-JS.
- File/function line limits.
- Implementation must not regress performance budgets.

### 8. Risks & Mitigations
R1: Transaction complexity increases risk of deadlocks -> Use minimal locking scope; avoid unnecessary read-after-write inside same transaction.
R2: Schema migrations could impact existing data -> Dry-run & backup; write idempotent migration scripts; add verification tests.
R3: Payment intent validation integration complexity -> Start with stub/adapter; progressive hardening.
R4: Caching misconfiguration -> Start with conservative tags; add observability counters; rollback plan (feature flag).
R5: Error hierarchy adoption regressions -> Provide adapter shim mapping legacy strings to new error codes during transition.

### 9. Glossary (Selected)
StoreId: Tenant discriminator for all multi-tenant data.
Cache Tag: Semantic identifier (e.g., product:<id>, products:list:store:<storeId>) used with revalidateTag.
Server Action: `'use server'` function for form mutation or secure writes.
Atomic Transaction: All-or-nothing database operation group.
Consent Record: GDPR artifact tracking user consent.

### 10. Out of Scope Clarifications
- Real-time inventory sync with external marketplaces.
- Full theme versioning system (documented as future improvement).
- Refund partial ledger (placeholder suggestion only).

### 11. High-Level Data Flow (Checkout)
Client Cart -> Server (Checkout Action/API) -> Re-fetch products & discounts -> Validate payment intent -> Begin Transaction -> Create Order -> Create OrderItems -> Adjust Inventory -> Record Payment -> Commit -> Emit Audit Log -> Return response.

### 12. Initial Test Strategy Summary
- Unit: Price recalculation, payment validation stub, error mapping, store resolution.
- Integration: Transaction success/rollback scenarios, middleware enforcement.
- E2E: Checkout (price tampering attempt), Newsletter subscription, Multi-tenant isolation (cross-store data access attempt blocked).
- Accessibility: Focus traversal on forms, labels, color contrast.
- Performance: k6 smoke (light) & Lighthouse CI gating.

---

## /speckit.plan

Title: StormCom Hardening Plan (Phased Implementation)
Version: 1.0.0
Status: Draft

### Phase Structure Overview
P0 Verification Baseline
P1 Security & Isolation Core (Checkout + Storefront Tenancy)
P2 Transaction & Data Integrity Expansion
P3 Error Handling & Response Standardization
P4 Schema & Migration Alignment
P5 Caching & Performance Foundations
P6 Newsletter Engagement Feature Delivery
P7 Testing Coverage Uplift & Tooling
P8 Documentation, Observability & Final Audit

### Phase Details

Phase 0: Verification Baseline
Deliverables: Current metrics snapshot (coverage, Lighthouse, Axe), inventory of hardcoded storeIds, pricing tamper test script.
Risks: Hidden edge cases. Mitigation: grep + dynamic runtime assertion tests.
Exit Criteria: Inventory complete; baseline reports stored.

Phase 1: Security & Isolation Core
Actions: Implement server-side price recalculation service, auth enforcement in checkout route/server action, domain-based store resolver (lib/store/resolve-store.ts), remove hardcoded storeIds, adjust proxy.ts to enforce tenancy for storefront paths.
Testing: E2E checkout tamper test; unit tests store resolver; integration test unauthorized checkout.
Exit: Tamper attempt corrected; unauthorized blocked; no hardcoded storeIds left.

Phase 2: Transaction & Data Integrity
Actions: Introduce transaction wrapper (services/transaction.ts), refactor checkout to single transaction, include inventory adjustments & discount usage. Add payment validation adapter (services/payments/intent-validator.ts).
Testing: Integration rollback tests (forced failure at payment validation), inventory consistency assertions.
Exit: All writes atomic; rollback verified.

Phase 3: Error Handling Standardization
Actions: Create src/lib/errors.ts (BaseError subclasses: ValidationError, AuthError, NotFoundError, ConflictError, RateLimitError, InternalError); refactor API route handlers & services to throw typed errors; implement mapper (lib/error-response.ts).
Testing: Unit map tests, integration endpoint error shape tests.
Exit: 100% of modified endpoints conform; legacy string matching removed.

Phase 4: Schema & Migration Alignment
Actions: Identify inconsistent fields (e.g., images stored as CSV vs string[]), add missing deletedAt, plan JSON column migrations (PostgreSQL only) backlog entry, run `prisma migrate dev` with descriptive names, update validation schemas.
Testing: Migration test script (seed pre-migration, run, verify shape), unit validators.
Exit: Schema consistent; migrations applied; green type-check.

Phase 5: Caching & Performance Foundations
Actions: Define cache tag registry (lib/cache/tags.ts), implement tag usage in product/category/page fetch services, call revalidateTag(tag,"max") on mutations, document enabling Cache Components; add minimal metrics logging.
Testing: Integration mutation triggers tag invalidation; manual build check; Lighthouse unaffected.
Exit: Tags operational; invalidations logged; docs updated.

Phase 6: Newsletter Engagement
Actions: Implement Server Action (app/(storefront)/newsletter/actions.ts) with Zod schema, consent record creation, audit log entry, rate limiting integration, optimistic UI state.
Testing: Unit validation tests, integration duplication prevention, E2E subscription path.
Exit: Newsletter functional; consent & audit rows created; E2E passes.

Phase 7: Testing Coverage Uplift & Tooling
Actions: Add missing unit tests (transactions, payment validator, error mapper, cache tags), add E2E isolation attempts, ensure coverage >= targets, integrate coverage threshold gating in CI.
Testing: Automated via Vitest + Playwright; coverage report.
Exit: Coverage thresholds met; CI gating green.

Phase 8: Documentation & Final Audit
Actions: Update design-system.md (error classes, cache tags), testing-strategy.md (new suites), CHANGELOG.md entries, generate final audit report, risk register updates.
Testing: Review checklists; grep verification; accessibility scan.
Exit: Final report stored; all acceptance criteria satisfied.

### Architectural Decisions
- Use Server Actions where form-based (checkout optional; ensure auth & price recalculation in server boundary).
- Maintain services layer segregation (pure business logic). Keep transaction wrapper isolated.
- Error classes centralize codes; enumerated codes exported.
- Cache tags minimal first iteration; avoid premature complexity.

### Testing Strategy (Detailed)
- Use fixtures under tests/fixtures for deterministic product/discount/inventory states.
- Payment validator stub with scenario variants (valid/invalid/expired).
- Timeout & rate limit tests using synthetic fast repeated calls.
- Accessibility check integrated into E2E for checkout & newsletter forms.

### Performance Strategy
- Monitor query times via instrumentation logs (only around new transaction boundary).
- Ensure product fetch selects minimal fields.
- Avoid client component sprawl; keep newsletter form minimal client footprint.

### Risk Matrix (Expanded)
| Risk | Phase | Impact | Likelihood | Mitigation |
|------|-------|--------|------------|------------|
| Deadlocks | P2 | High | Low | Short-living transactions, index usage review |
| Migration Data Loss | P4 | High | Medium | Backup + dry-run + verification script |
| Cache Incorrectness | P5 | Medium | Medium | Observability logging, staged rollout |
| Test Flakiness | P7 | Medium | Medium | Deterministic fixtures, retry budget |
| Performance Regress | Any | High | Medium | Lighthouse & k6 gate before merge |

### Phase Dependencies
- P2 depends on secure base from P1.
- P3 waits for transaction shapes from P2.
- P4 independent but safer post-P2.
- P5 builds on product/category service stability from earlier phases.
- P6 newsletter can start after tenancy (P1) to ensure correct storeId.

### Exit Review Checklist (Global)
- All acceptance criteria mapped to test IDs.
- Coverage thresholds enforced.
- No hardcoded storeId.
- Error codes documented.
- Cache tags listed & referenced.

---

## /speckit.tasks

Title: StormCom Hardening Tasks
Version: 1.0.0
Status: Draft

### Task Format Legend
ID | Title | Category | Depends | Target Files | Estimation | Type (dev/test/doc)

### Critical Path (Phases 1-2)
T-001 | Implement store resolver utility | tenancy | none | src/lib/store/resolve-store.ts | 2h | dev
T-002 | Integrate resolver in storefront layout | tenancy | T-001 | src/app/(storefront)/layout.tsx | 1h | dev
T-003 | Remove hardcoded storeIds | tenancy | T-001 | grep repo; modify affected components/services | 1h | dev
T-004 | Proxy tenancy enforcement for storefront | tenancy | T-001 | proxy.ts | 1h | dev
T-005 | Checkout auth guard & server action refactor | checkout | none | src/app/api/checkout/route.ts or actions.ts | 3h | dev
T-006 | Price recalculation service | checkout | T-005 | src/services/checkout/pricing-service.ts | 3h | dev
T-007 | Payment intent validation adapter | checkout | T-005 | src/services/payments/intent-validator.ts | 2h | dev
T-008 | Transaction wrapper introduction | integrity | T-005 | src/services/transaction.ts | 2h | dev
T-009 | Checkout transaction integration | integrity | T-008 | src/services/checkout/checkout-service.ts | 3h | dev
T-010 | Inventory & discount atomic integration | integrity | T-009 | same as above | 2h | dev
T-011 | Integration tests: checkout success/rollback | testing | T-009 | tests/integration/checkout/*.test.ts | 3h | test

### Error Handling & Responses (Phase 3)
T-012 | Define error classes hierarchy | errors | none | src/lib/errors.ts | 2h | dev
T-013 | Error mapper utility | errors | T-012 | src/lib/error-response.ts | 1h | dev
T-014 | Refactor modified endpoints to use errors | errors | T-013 | selective API route files | 4h | dev
T-015 | Unit tests error mapping | testing | T-013 | tests/unit/errors/*.test.ts | 2h | test

### Schema & Migrations (Phase 4)
T-016 | Identify inconsistent fields & plan | schema | none | prisma/schema.prisma (analysis) | 2h | dev
T-017 | Implement migrations (arrays/deletedAt) | schema | T-016 | prisma/migrations/* | 3h | dev
T-018 | Update Zod validators for new shapes | schema | T-017 | src/lib/validation.ts | 1h | dev
T-019 | Migration verification script | schema | T-017 | scripts/verify-migration.ts | 2h | dev
T-020 | Unit tests validation new schema | testing | T-018 | tests/unit/validation/*.test.ts | 2h | test

### Caching & Performance (Phase 5)
T-021 | Tag registry definition | caching | none | src/lib/cache/tags.ts | 1h | dev
T-022 | Apply tags in fetch services | caching | T-021 | src/services/products/*, categories/*, pages/* | 3h | dev
T-023 | Mutation invalidation calls | caching | T-022 | product/category/page mutations | 2h | dev
T-024 | Cache Components enablement doc stub | caching | none | docs/cache-components.md | 1h | doc
T-025 | Integration tests tag invalidation | testing | T-023 | tests/integration/cache/*.test.ts | 2h | test

### Newsletter Engagement (Phase 6)
T-026 | Zod schema for newsletter action | newsletter | none | src/lib/validation/newsletter.ts | 1h | dev
T-027 | Newsletter Server Action implementation | newsletter | T-026 | src/app/(storefront)/newsletter/actions.ts | 2h | dev
T-028 | Audit + consent record creation | newsletter | T-027 | services/newsletter/newsletter-service.ts | 2h | dev
T-029 | E2E newsletter subscription test | testing | T-027 | tests/e2e/newsletter.spec.ts | 2h | test

### Testing Uplift (Phase 7)
T-030 | Add price tamper E2E | testing | T-006 | tests/e2e/checkout-price-tamper.spec.ts | 2h | test
T-031 | Multi-tenancy isolation attempt test | testing | T-001 | tests/e2e/tenancy-isolation.spec.ts | 2h | test
T-032 | Error mapper unit tests (additional cases) | testing | T-013 | tests/unit/errors/*.test.ts | 1h | test
T-033 | Cache performance smoke test | testing | T-022 | tests/integration/cache/perf.test.ts | 2h | test
T-034 | Coverage threshold CI enforcement update | ci | none | .github/workflows/test.yml | 1h | dev

### Documentation & Final Audit (Phase 8)
T-035 | Update design-system.md (errors, cache tags) | docs | T-014/T-021 | docs/design-system.md | 1h | doc
T-036 | Update testing-strategy.md | docs | T-011/T-025/T-030 | docs/testing-strategy.md | 1h | doc
T-037 | Update database schema guide | docs | T-017 | docs/database/schema-guide.md | 1h | doc
T-038 | Add CHANGELOG entry | docs | all | docs/CHANGELOG.md | 0.5h | doc
T-039 | Final audit & verification matrix update | audit | all | docs/validation-YYYY-MM-DD.md | 2h | doc
T-040 | Grep verification (storeId, error codes) | audit | all | scripts/verify-hardening.ps1 | 1h | dev

### Cross-Cutting
T-041 | Prisma middleware enhancement & tests | tenancy | P1/P2 | src/lib/prisma-middleware.ts + tests/integration/tenant-middleware.test.ts | 3h | dev
T-042 | Observability log format standardization | ops | P3 | src/lib/logger.ts + usage sites | 2h | dev
T-043 | Rate limit refinement (tier check) | ops | P1 | src/lib/rate-limit.ts | 1h | dev

### Quality Gates
- Each dev task accompanied by unit/integration tests tasks when applicable.
- No task produces functions >50 lines or files >300 lines (split earlier if predicted overage).
- All new modules strictly typed (no any).

### Parallelization Notes
- P1 tasks T-001..T-005 mostly sequential (resolver before usage); pricing service (T-006) parallelizable with intent validator (T-007).
- Error handling (P3) can begin after foundational checkout/transaction changes stabilize (P2 exit).
- Newsletter tasks can start once tenancy resolution complete (after T-002/T-004).
- Schema migrations (P4) isolated; run before caching additions to avoid divergence.

### Test Coverage Mapping
- Checkout: T-011, T-030
- Tenancy: T-031, T-041
- Error Handling: T-015, T-032
- Caching: T-025, T-033
- Newsletter: T-029
- Schema Validation: T-020

### Success Metrics
- 0 high severity security findings post-remediation.
- Coverage thresholds achieved and enforced.
- Cache invalidations verified in logs and tests.
- No hardcoded storeId instances (automated script passes).
- Error response uniformity (100% sample compliance).

---

## /speckit.risks (Supplemental Prompt)

List and analyze newly introduced or residual risks post-hardening with probability & impact, then produce mitigation backlog tasks for any risk scoring High.

Input Expectations: Current architecture overview; implemented phases; test reports; performance baseline.
Output: Risk table, mitigation items referencing task IDs or proposing new ones, confidence assessment.

---

## /speckit.validation (Supplemental Prompt)

Validation prompt to confirm all acceptance criteria met. It should:
- Re-run grep checks (storeId, error codes)
- Summarize coverage reports
- Summarize Lighthouse & Axe outcomes
- Enumerate cache tag invalidation events count
- Provide transactional success vs rollback test stats

---

## Notes
These prompts intentionally embed Next.js 16 specifics (async params, proxy enforcement, revalidateTag second arg usage) and constitution constraints (file/function size, coverage, accessibility, performance budgets, multi-tenancy isolation). Adjust dates/placeholders (YYYY-MM-DD) during execution.
