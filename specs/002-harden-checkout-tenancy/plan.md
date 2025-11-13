# Implementation Plan: Harden Checkout, Tenancy, and Newsletter

**Branch**: `002-harden-checkout-tenancy` | **Date**: 2025-11-13 | **Spec**: `specs/002-harden-checkout-tenancy/spec.md`
**Input**: Feature specification from `/specs/002-harden-checkout-tenancy/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Remediate critical issues in checkout security, storefront multi-tenancy, and newsletter subscription. We will:
- Enforce authentication for checkout, recalculate all pricing server-side, validate payment intents pre-commit, and wrap order+inventory+discount+payment record in a single atomic transaction.
- Implement canonical store resolution (domain/subdomain → storeId) and canonicalize to the custom domain (redirect subdomain → custom domain). Remove hardcoded tenant identifiers and ensure tenant scoping across all queries.
- Provide a functional newsletter subscription via Server Action with Zod validation, rate limiting, deduplication by (storeId,email), consent record creation honoring DNT, and single opt‑in activation with audit trail.
- Standardize API error handling with typed error classes and a uniform response shape; align schema (arrays vs strings, deletedAt fields); strengthen Prisma multi-tenant middleware; add cache tags with explicit invalidation; uplift test coverage; and add CSV export streaming with async fallback and dual delivery (email and in‑app notification).

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.9.3 (strict) + React 19
**Primary Dependencies**: Next.js 16.0.1 (App Router, built‑in MCP), Prisma ORM, NextAuth.js v4.24.13, Zod, React Hook Form, Tailwind CSS 4.1.14, Radix UI + shadcn/ui
**Storage**: SQLite (local dev), PostgreSQL (production)
**Testing**: Vitest 3.2.4 (unit/integration + v8 coverage), Playwright 1.56.0 (E2E, MCP), axe-core (a11y), Lighthouse CI (performance), k6 (load)
**Target Platform**: Vercel (Serverless/Edge, Analytics, Speed Insights)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: LCP < 2.5s (mobile), CLS < 0.1, API p95 < 500ms (checkout ≤ 650ms including payment), DB p95 < 100ms, JS bundle < 200KB gzipped
**Constraints**: Server Components‑first (minimize client JS), REST route handlers + Server Actions for form mutations, multi‑tenant isolation enforced, WCAG 2.1 AA
**Scale/Scope**: Multi‑tenant e‑commerce; CSV exports up to 10k streamed, larger via async jobs; coverage thresholds (≥80% services, 100% utilities)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Gates from constitution: 
- Next.js 16.0.0+ App Router only; React 19; TypeScript strict — PASS
- Prisma ORM only; multi‑tenant middleware; soft deletes; transactions — PASS
- Tailwind + shadcn/ui/Radix; no CSS‑in‑JS — PASS
- API response standardization; REST semantics; Server Actions for forms — PASS
- Performance budgets (LCP/CLS/API/DB/JS) — Targeted and testable — PASS
- Testing thresholds (80% services, 100% utils), E2E on critical paths — PLANNED
- Accessibility (WCAG 2.1 AA, axe‑core) — PLANNED ENFORCEMENT

No violations detected at plan time. Re‑check after Phase 1 artifacts.

## Project Structure

### Documentation (this feature)

```
specs/002-harden-checkout-tenancy/
├── plan.md              # This file (/speckit.plan)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI)
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```
src/
├── app/                 # Next.js 16 App Router (route handlers, server actions)
├── components/          # Server + Client components; shadcn/ui primitives in components/ui
├── lib/                 # utilities (cache tags, error classes, store resolution)
├── services/            # business logic (checkout, inventory, discounts, payments)
├── types/               # shared types
└── services/__tests__/  # unit/integration tests

tests/
├── unit/
├── integration/
└── e2e/                 # Playwright (checkout, tenancy, newsletter, export)
```

**Structure Decision**: Single web application (Next.js App Router). Business logic lives in `src/services/`, route handlers and server actions in `src/app/`, shared utilities in `src/lib/`, UI primitives under `src/components/ui/` (shadcn/ui). Tests under `tests/` with unit+integration+E2E.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase Structure Overview

This project is broken into clearly scoped phases to reduce risk and provide verifiable exit criteria at each stage:

- P0 — Verification Baseline
- P1 — Security & Isolation Core (Checkout + Storefront Tenancy)
- P2 — Transaction & Data Integrity Expansion
- P3 — Error Handling & Response Standardization
- P4 — Schema & Migration Alignment
- P5 — Caching & Performance Foundations
- P6 — Newsletter Engagement Feature Delivery
- P7 — Testing Coverage Uplift & Tooling
- P8 — Documentation, Observability & Final Audit

Each phase has explicit actions, tests, exit criteria and a short risk/mitigation summary. Work should proceed sequentially unless a parallel low‑risk task is approved (e.g., docs updates or isolated unit tests).

---

## Phase Details

### Phase 0: Verification Baseline
Deliverables:
- Current metrics snapshot (coverage, Lighthouse, Axe)
- Inventory of hardcoded `storeId` usages (grep + review)
- Pricing tamper test script (automated E2E that attempts price override)

Risks:
- Hidden edge cases where `storeId` is injected at runtime. Mitigation: static grep + runtime assertion tests.

Exit Criteria:
- Inventory complete and checked into `specs/002-harden-checkout-tenancy/artifacts/`
- Baseline reports stored (coverage HTML, Lighthouse report, axe results)

### Phase 1: Security & Isolation Core
Actions:
- Implement server-side price recalculation service (e.g., `src/services/pricing-service.ts`)
- Enforce auth in checkout route/server action; require session with `storeId`
- Implement domain-based store resolver at `src/lib/store/resolve-store.ts`
- Remove all hardcoded `DEFAULT_STORE_ID` fallbacks and sanitize code paths
- Adjust `proxy.ts` to enforce tenancy rules for storefront paths and canonical redirect from subdomain → custom domain
- Add Suspense + skeleton components for dashboard lists and ensure unauthenticated redirects

Testing:
- E2E checkout tamper test (price override should be corrected)
- Unit tests for store resolver (domain->storeId mapping)
- Integration test for unauthorized checkout attempts

Exit:
- Tamper attempt corrected server-side
- Unauthorized checkout blocked
- No hardcoded `storeId` occurrences remain (verify via grep)

### Phase 2: Transaction & Data Integrity
Actions:
- Introduce transaction wrapper `src/services/transaction.ts` to centralize `prisma.$transaction` usage
- Refactor checkout flow to use a single transaction that includes order, items, inventory adjustments, discount consumption, and payment record
- Add payment validation adapter `src/services/payments/intent-validator.ts` to pre-validate payment intents before commit

Testing:
- Integration rollback tests that force failure at payment validation to assert no partial writes
- Inventory consistency assertions after simulated concurrent purchases

Exit:
- All writes for checkout are atomic and rollback on failure
- Rollback behavior validated by tests

### Phase 3: Error Handling & Response Standardization
Actions:
- Create `src/lib/errors.ts` with `BaseError` subclasses: `ValidationError`, `AuthError`, `NotFoundError`, `ConflictError`, `RateLimitError`, `InternalError`
- Refactor API route handlers and services to throw typed errors instead of returning strings
- Implement error mapper `src/lib/error-response.ts` to convert errors to uniform response shapes and HTTP codes
- Introduce API middleware pipeline (auth, rate limit, validation, logging, requestId header) and migrate routes to use it

Testing:
- Unit tests for error mapping
- Integration tests to assert API error shape and HTTP status codes

Exit:
- 100% of modified endpoints conform to new error shape
- Legacy string-matching error paths removed

### Phase 4: Schema & Migration Alignment
Actions:
- Identify inconsistent column types (e.g., images CSV vs string[]), missing `deletedAt` fields, and JSON column candidates
- Create migration plan and backlog for PostgreSQL-only JSON migrations where necessary
- Run `prisma migrate dev --name <descriptive>` for each change and update validation schemas (Zod)

Testing:
- Migration test script: seed pre-migration DB, run migrations, verify shape and data integrity
- Unit validators updated and tested

Exit:
- Schema consistent across environments; migrations applied; `npm run type-check` and tests green

### Phase 5: Caching & Performance Foundations
Actions:
- Define cache tag registry `src/lib/cache/tags.ts` and document tag naming conventions
- Implement tag usage in product/category/page fetch services and call `revalidateTag(tag, 'max')` on mutations
- Add minimal metrics logging around transaction boundaries
- Add Cache Components wrappers/un-stable cache usage for featured products and category tree with tag-based invalidation

Testing:
- Integration test: mutation triggers tag invalidation and revalidation request
- Manual Lighthouse check to ensure no regression

Exit:
- Cache tags operational and logged; documentation updated

### Phase 6: Newsletter Engagement Feature Delivery
Actions:
- Implement Server Action at `app/(storefront)/newsletter/actions.ts` with Zod validation, rate limiting, optimistic UI, and consent recording
- Create `ConsentRecord` entries; write audit logs; respect DNT and cookie consent banner
- Ensure deduplication by `(storeId,email)` and single opt-in flow; send CSV export link via email + in-app notification when admin requests subscriber export

Testing:
- Unit validation tests for Zod schema
- Integration tests preventing duplicate subscriptions
- E2E subscription path including consent banner and in-app notification

Exit:
- Newsletter signup functional; consent & audit rows created; E2E passes

### Phase 7: Testing Coverage Uplift & Tooling
Actions:
- Add missing unit tests (transaction wrapper, payment validator, error mapper, cache tags)
- Add E2E isolation attempts that simulate tampering and concurrency
- Integrate coverage thresholds into CI and enforce gates

Testing:
- Automated Vitest + Playwright runs with coverage reporting

Exit:
- Coverage thresholds met and CI gating green

### Phase 8: Documentation, Observability & Final Audit
Actions:
- Update `docs/design-system.md` with error classes and cache tag conventions
- Update `docs/testing-strategy.md` and `CHANGELOG.md` entries
- Produce final audit report and update risk register
- Run full accessibility scan and store artifacts

Testing:
- Review checklists; grep verification of no hardcoded `storeId`; accessibility scans (axe)

Exit:
- Final audit report stored and all acceptance criteria satisfied

---

## Architectural Decisions
- Use Server Actions where form-based flows are appropriate (newsletter, optional checkout Server Action) while ensuring auth and price recalculation happen on the server boundary.
- Keep a clear services layer for pure business logic; transaction wrapper isolated at `src/services/transaction.ts`.
- Centralize error classes and codes in `src/lib/errors.ts`; export enumerated error codes for clients and logs.
- Keep cache tags minimal in the first iteration to avoid complexity; expand based on metrics.
- Centralize API middleware for auth, rate limiting, validation, logging and requestId propagation to improve consistency and observability.

## Testing Strategy (Detailed)
- Use deterministic fixtures under `tests/fixtures` for product/discount/inventory states.
- Payment validator to support stubbed scenarios (valid, invalid, expired, network-failure).
- Include timeout & rate limit tests using synthetic rapid calls.
- Integrate accessibility checks (axe) into E2E for checkout and newsletter forms.

## Performance Strategy
- Instrument query timing around new transaction boundaries and log slow queries for review.
- Ensure product fetch `select` lists minimal fields required for UI.
- Limit client component usage; newsletter form should be a minimal client component with optimistic UI and server actions.
- Use dynamic import + Suspense for heavy analytics components; prefer server-side aggregation + cache tags.

## Risk Matrix (Expanded)
| Risk | Phase | Impact | Likelihood | Mitigation |
|------|-------|--------|------------|------------|
| Deadlocks | P2 | High | Low | Short-living transactions, index usage review |
| Migration Data Loss | P4 | High | Medium | Backup + dry-run + verification script |
| Cache Incorrectness | P5 | Medium | Medium | Observability logging, staged rollout |
| Test Flakiness | P7 | Medium | Medium | Deterministic fixtures, retry budget |
| Performance Regress | Any | High | Medium | Lighthouse & k6 gate before merge |

## Phase Dependencies
- P2 depends on secure base from P1
- P3 waits for transaction shapes from P2
- P4 is safer post-P2 but can be prepared earlier
- P5 builds on stable product/category services
- P6 requires tenancy resolved in P1

## Exit Review Checklist (Global)
- All acceptance criteria mapped to test IDs in `specs/002-harden-checkout-tenancy/tasks.md`
- Coverage thresholds enforced in CI
- No hardcoded `storeId` occurrences
- Error codes documented in `src/lib/errors.ts`
- Cache tags enumerated and documented
- Migration plan created and backups confirmed


