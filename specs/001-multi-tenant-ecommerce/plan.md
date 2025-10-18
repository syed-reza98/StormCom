# Implementation Plan: StormCom Multi-tenant E-commerce Platform

**Branch**: `001-multi-tenant-ecommerce` | **Date**: 2025-10-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-multi-tenant-ecommerce/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

StormCom is a comprehensive multi-tenant e-commerce SaaS platform enabling businesses to manage complete online stores with products, orders, inventory, customers, marketing campaigns, content management, POS, and security. The platform provides both an admin dashboard for store management and a customer-facing storefront for shopping experiences. Built using Next.js 15.5.5 with TypeScript 5.9.3, the system enforces strict tenant isolation, supports subscription-based plans with usage limits, and integrates with external platforms (WooCommerce/Shopify) via real-time webhooks. Target scalability: 10K products, 1M orders/year, 250K customers per store with 99.9% uptime SLA.

## Technical Context

**Language/Version**: TypeScript 5.9.3 (strict mode enabled)  
**Primary Framework**: Next.js 15.5.5 (App Router only, React 19.x Server Components)  
**Primary Dependencies**:
- **Database**: Prisma ORM (latest stable) with PostgreSQL (production) / SQLite (development)
- **Authentication**: NextAuth.js v5 with JWT sessions, bcrypt password hashing, TOTP MFA, OIDC/SAML SSO
- **Validation**: Zod for runtime schema validation
- **Forms**: React Hook Form for form state management
- **UI**: Tailwind CSS 4.1.14+, Radix UI + shadcn/ui (accessible components)
- **Payments**: For Bangladesh: SSLCOMMERZ (https://developer.sslcommerz.com) (High Priority), bKash (https://developer.bka.sh) (optional: skip for now). For International: Stripe + PayPal SDKs for payment processing
- **Email**: Resend with React Email templates (transactional emails)
- **File Storage**: Vercel Blob (product images, invoices, backups)
- **Background Jobs**: Inngest (cron scheduling, event-driven tasks, auto-retries)
- **Search**: PostgreSQL Full-Text Search (Phase 1) → Algolia (Phase 2 optional upgrade)
- **Rate Limiting**: Vercel KV (serverless Redis) for tiered API rate limiting per subscription plan
- **Monitoring**: Vercel Analytics (performance/Web Vitals) + Sentry (error tracking/logging) + Uptime monitoring (external service like UptimeRobot for availability tracking)

**Storage**: PostgreSQL (production on Vercel Postgres), SQLite (local development via Prisma file: ./prisma/dev.db)

**Testing**: 
- Unit/Integration: Vitest 3.2.4 + Testing Library
- E2E: Playwright 1.56.0 with MCP support
- Coverage: Vitest coverage (80% business logic, 100% utilities, 100% API routes, 100% critical paths)

**Target Platform**: Web (Next.js serverless deployment on Vercel)

**Project Type**: Web application (monorepo structure with Next.js App Router)

**Performance Goals**:
- Page Load (LCP): <2.0s desktop, <2.5s mobile (95th percentile)
- API Response: <500ms (95th percentile)
- Database Query: <100ms (95th percentile)
- Uptime SLA: 99.9% (≈43 minutes downtime/month)
- Support 10K products, 83K orders/month, 250K customers per store

**Constraints**:
- JavaScript Bundle: <200KB initial load (gzipped)
- WCAG 2.1 Level AA accessibility compliance
- Multi-tenant data isolation (no cross-tenant queries)

**Scale/Scope**:
- 132 functional requirements (FR-001 to FR-132)
- 13 user stories with acceptance scenarios
- 34 success criteria (measurable outcomes)
- 45+ database entities with relationships
- Multi-tenant SaaS serving mid-market e-commerce businesses

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Requirement | Status | Notes |
|-------------|--------|-------|
| **TypeScript Strict Mode** | ✅ PASS | TypeScript 5.9.3 with `strict: true` required |
| **No Prohibited Tech** | ✅ PASS | Using Next.js App Router (NO Pages Router), Tailwind CSS (NO CSS-in-JS), Prisma (NO raw SQL), REST API (NO GraphQL), PostgreSQL/SQLite (NO MongoDB) |
| **Required Stack** | ✅ PASS | All dependencies resolved via Phase 0 research: Resend (email), Vercel Blob (storage), Inngest (jobs), PostgreSQL FTS (search), Vercel Analytics + Sentry (monitoring) |
| **Test Coverage** | ✅ PASS | Vitest + Playwright configured; targets: 80% business logic, 100% utilities, 100% API routes, 100% critical E2E paths |
| **Performance Budgets** | ✅ PASS | Defined: LCP <2.0s desktop, API <500ms p95, DB <100ms p95, bundle <200KB, 99.9% uptime |
| **Accessibility** | ✅ PASS | WCAG 2.1 Level AA required (SC-027); using Radix UI accessible components |
| **File Size Limits** | ✅ PASS | Constitution requires ≤300 lines per file, ≤50 lines per function; will enforce via ESLint |
| **Naming Conventions** | ✅ PASS | camelCase (variables), PascalCase (components/types), UPPER_SNAKE_CASE (constants) |
| **Database Schema** | ✅ PASS | Prisma with cuid() PKs, createdAt/updatedAt timestamps, deletedAt soft deletes, storeId tenant isolation, compound indexes |
| **API Standards** | ✅ PASS | RESTful conventions, standardized response format, HTTP status codes, tiered rate limiting (FR-128 to FR-132) |
| **Security** | ✅ PASS | NextAuth v5, bcrypt (cost 12), TOTP MFA, OIDC/SAML SSO, RBAC, input validation (Zod), XSS prevention, HTTPS only |
| **Multi-tenant Isolation** | ✅ PASS | Prisma middleware auto-injects storeId; all queries filtered by tenant; cross-tenant access prohibited (FR-095) |

**Gate Decision**: ✅ **PROCEED TO PHASE 1**

All technical dependencies resolved via Phase 0 research (see `research.md`). All 12 constitution requirements now PASS. Ready for Phase 1: data model design, API contract generation, and quickstart guide.

---

## Phase 1 Completion

**Date:** 2025-10-18

**Deliverables:**
- `data-model.md`: Complete database schema (42 Prisma models, ER diagram, relationships, indexes)
- `contracts/openapi.yaml`: OpenAPI 3.1 specification (60+ endpoints, 42+ schemas)
- `contracts/README.md`: API design documentation (authentication, rate limiting, error handling, pagination, webhooks, security)
- `quickstart.md`: Local development setup guide

**Constitution Check (Final):**

| Requirement | Status | Notes |
|-------------|--------|-------|
| **TypeScript Strict Mode** | ✅ PASS | All code and API contracts use strict types |
| **No Prohibited Tech** | ✅ PASS | No prohibited technologies used |
| **Required Stack** | ✅ PASS | All Phase 0 decisions implemented |
| **Test Coverage** | ✅ PASS | Test targets and coverage tools defined |
| **Performance Budgets** | ✅ PASS | Budgets set and documented |
| **Accessibility** | ✅ PASS | WCAG 2.1 AA enforced |
| **File Size Limits** | ✅ PASS | File/function size limits documented |
| **Naming Conventions** | ✅ PASS | Naming conventions enforced |
| **Database Schema** | ✅ PASS | Schema matches constitution and spec |
| **API Standards** | ✅ PASS | OpenAPI spec and docs match standards |
| **Security** | ✅ PASS | Auth, RBAC, input validation, HTTPS, webhooks |
| **Multi-tenant Isolation** | ✅ PASS | Tenant isolation via Prisma middleware |

**Gate Decision:** ✅ **PHASE 1 COMPLETE**

All deliverables for Phase 1 are complete and constitution requirements are fully satisfied. Ready to proceed to Phase 2 (task breakdown and implementation).

## Project Structure

### Documentation (this feature)

```
specs/001-multi-tenant-ecommerce/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (technical decisions)
├── data-model.md        # Phase 1 output (database schema)
├── quickstart.md        # Phase 1 output (setup guide)
├── contracts/           # Phase 1 output (API contracts)
│   ├── openapi.yaml     # OpenAPI 3.1 specification
│   └── README.md        # Contract documentation
├── checklists/          # Quality validation
│   └── requirements.md  # Requirements checklist (completed)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
StormCom/
├── .github/
│   ├── copilot-instructions.md          # GitHub Copilot guidance
│   ├── prompts/                         # SpecKit prompt templates
│   └── instructions/                    # File-specific coding rules
├── .specify/
│   ├── memory/
│   │   └── constitution.md              # Project constitution
│   ├── scripts/powershell/              # SpecKit automation scripts
│   └── templates/                       # Document templates
├── docs/
│   ├── specifications/                  # SpecKit specifications
│   ├── analysis/                        # SRS analysis documents
│   └── references/                      # Legacy documentation
├── specs/                               # Feature-specific documentation
│   └── 001-multi-tenant-ecommerce/      # This feature (see above)
├── src/
│   ├── app/                             # Next.js App Router
│   │   ├── (admin)/                     # Admin dashboard routes
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── customers/
│   │   │   ├── inventory/
│   │   │   ├── marketing/
│   │   │   ├── content/
│   │   │   ├── settings/
│   │   │   └── layout.tsx
│   │   ├── (storefront)/                # Customer-facing storefront
│   │   │   ├── page.tsx                 # Home page
│   │   │   ├── products/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── account/
│   │   │   └── layout.tsx
│   │   ├── (auth)/                      # Authentication routes
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── layout.tsx
│   │   ├── api/                         # API Route Handlers
│   │   │   ├── auth/
│   │   │   ├── stores/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── customers/
│   │   │   ├── inventory/
│   │   │   ├── shipping/
│   │   │   ├── payments/
│   │   │   ├── webhooks/
│   │   │   └── sync/
│   │   ├── layout.tsx                   # Root layout
│   │   ├── globals.css                  # Global styles
│   │   └── providers.tsx                # React providers
│   ├── components/                      # React components
│   │   ├── ui/                          # shadcn/ui base components
│   │   ├── admin/                       # Admin-specific components
│   │   ├── storefront/                  # Storefront-specific components
│   │   └── shared/                      # Shared components
│   ├── services/                        # Business logic layer
│   │   ├── stores/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── inventory/
│   │   ├── shipping/
│   │   ├── payments/
│   │   ├── subscriptions/
│   │   ├── marketing/
│   │   ├── auth/
│   │   └── sync/
│   ├── lib/                             # Utilities & configuration
│   │   ├── prisma.ts                    # Prisma client singleton
│   │   ├── auth.ts                      # NextAuth configuration
│   │   ├── validation/                  # Zod schemas
│   │   ├── utils.ts                     # Utility functions
│   │   ├── constants.ts                 # App constants
│   │   └── middleware/                  # Custom middleware
│   ├── hooks/                           # Custom React hooks
│   ├── types/                           # TypeScript type definitions
│   └── actions/                         # Server Actions
├── prisma/
│   ├── schema.prisma                    # Database schema
│   ├── migrations/                      # Database migrations
│   ├── seed.ts                          # Database seed data
│   └── README.md                        # Prisma documentation
├── tests/
│   ├── unit/                            # Unit tests
│   ├── integration/                     # Integration tests
│   ├── e2e/                             # Playwright E2E tests
│   ├── fixtures/                        # Test fixtures
│   └── helpers/                         # Test utilities
├── public/                              # Static assets
│   ├── images/
│   ├── icons/
│   └── fonts/
├── .env.example                         # Environment variables template
├── .env.local                           # Local environment (gitignored)
├── .eslintrc.json                       # ESLint configuration
├── .prettierrc                          # Prettier configuration
├── next.config.js                       # Next.js configuration
├── tailwind.config.ts                   # Tailwind CSS configuration
├── tsconfig.json                        # TypeScript configuration
├── vitest.config.ts                     # Vitest configuration
├── playwright.config.ts                 # Playwright configuration
├── package.json                         # Dependencies
└── README.md                            # Project documentation
```

**Structure Decision**: Web application using Next.js 15.5.5 App Router with monorepo structure. The app is organized into three main route groups: `(admin)` for store management dashboard, `(storefront)` for customer-facing shopping experience, and `(auth)` for authentication flows. Business logic is centralized in `/src/services/` to maintain separation of concerns and facilitate testing. Prisma ORM manages database access with strict multi-tenant isolation via middleware. The structure follows Next.js best practices and constitution requirements for feature-based organization.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

No constitution violations detected. All requirements satisfied:
- ✅ Using required tech stack (Next.js 15.5.5, TypeScript 5.9.3, Prisma, PostgreSQL[Production]/SQLite[Local Development], Tailwind CSS)
- ✅ Avoiding prohibited technologies (no Redux, no CSS-in-JS, no GraphQL, no MongoDB, no Pages Router)
- ✅ Following architecture patterns (Server Components first, REST API, Prisma ORM only)
- ✅ Meeting performance budgets and test coverage requirements
- ✅ Implementing security standards (NextAuth v5, RBAC, input validation, multi-tenant isolation)

