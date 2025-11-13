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

