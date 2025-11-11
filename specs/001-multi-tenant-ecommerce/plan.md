# Implementation Plan: StormCom Multi-tenant E-commerce Platform

**Branch**: `001-multi-tenant-ecommerce` | **Date**: 2025-10-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-multi-tenant-ecommerce/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

StormCom is a comprehensive multi-tenant SaaS e-commerce platform enabling businesses to manage products, orders, inventory, customers, marketing, content, POS, and analytics with strict tenant isolation. The platform provides both admin dashboards and customer-facing storefronts as a complete turnkey solution. Implementation follows spec-driven development methodology with Next.js 16 App Router, React 19 Server Components, TypeScript 5.9.3 strict mode, Prisma ORM with PostgreSQL (production) / SQLite (development), and comprehensive testing using Vitest and Playwright.

## Technical Context

**Language/Version**: TypeScript 5.9.3 (strict mode enabled)
**Framework**: Next.js 16.0.0+ (App Router only, NO Pages Router, **includes built-in Next.js MCP Server**), React 19.x (Server Components by default)
- **Primary Dependencies**: 
- Prisma ORM (latest stable) for type-safe database access
- **NextAuth.js** `v4.24.13` (JWT + Vercel KV session storage) - Verified compatible with Next.js `v16.0.1`. Use NextAuth.js v4.24.13 for authentication and session management; in production prefer Vercel KV for session state.
- Tailwind CSS 4.1.14+ for styling
- Radix UI + shadcn/ui for accessible components
- Zod for runtime validation
- React Hook Form for form state management
**Storage**: PostgreSQL 15+ (production on Vercel Postgres), SQLite (local development only)
**Testing**: 
- Vitest 3.2.4+ for unit/integration tests
- Playwright 1.56.0+ with MCP for E2E tests
- BrowserStack for cross-browser testing + Percy for visual regression
- k6 (Grafana) for load testing
- Lighthouse CI for performance budgets
- axe-core for WCAG 2.1 Level AA accessibility
**Target Platform**: Vercel serverless platform (Edge Network CDN, Vercel KV for session storage)
**Observability**: Vercel native stack (Analytics for Web Vitals, Logs for serverless functions, Speed Insights for real-time performance) - **NOTE**: No external error tracking service (e.g., Sentry); uses Vercel Logs for error monitoring
**Project Type**: Full-stack web application (admin dashboard + customer storefront)
**Performance Goals**: 
- Page load (LCP): <2.0s desktop, <2.5s mobile
- API response (p95): <500ms
- Database query (p95): <100ms
- Checkout flow: <3 minutes end-to-end
**Constraints**: 
- JavaScript bundle: <200KB initial load (gzipped)
- Multi-tenant data isolation (zero cross-tenant leakage)
- WCAG 2.1 Level AA accessibility compliance
- PCI DSS Level 1 compliance (no card data storage)
- 99.9% uptime SLA
**Scale/Scope**: 
- 10K products per store max
- 1M orders/year per store (≈83K/month)
- 250K customers per store
- 100 concurrent users per store (95th percentile)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Code Quality Gates
✅ **TypeScript Strict Mode**: Enabled in tsconfig.json, all types explicit
✅ **Naming Conventions**: camelCase (vars/functions), PascalCase (components/types), UPPER_SNAKE_CASE (constants)
✅ **File Size Limits**: Max 300 lines/file, max 50 lines/function (ESLint enforced)
✅ **File Organization**: Group by feature, co-locate related files, barrel exports

### Testing Standards Gates
✅ **Test Coverage**: 80% business logic, 100% utilities, 100% E2E critical paths, 100% API routes
✅ **Testing Tools**: Vitest + Testing Library, Playwright with MCP, Percy, axe-core, k6, Lighthouse CI
✅ **Test Quality**: AAA pattern, deterministic, no flaky tests, mock external deps
✅ **E2E Requirements**: POM pattern, cross-browser (BrowserStack), test data isolation

### User Experience Gates
✅ **Performance Budgets**: LCP <2s desktop/<2.5s mobile, FID <100ms, CLS <0.1, API <500ms p95
✅ **Accessibility**: WCAG 2.1 Level AA, keyboard navigation, ARIA labels, 4.5:1 contrast, screen reader tested
✅ **Responsive Design**: Mobile-first, breakpoints (640/768/1024/1280/1536px), touch targets ≥44x44px

### Technology Compliance Gates
✅ **Required Stack**: Next.js 16+ App Router, React 19 Server Components, TypeScript 5.9.3+, Prisma, PostgreSQL
✅ **Prohibited**: Redux/Zustand (use RSC+hooks), CSS-in-JS (use Tailwind), GraphQL (use REST), Pages Router
✅ **Architecture**: Server Components first, Route Handlers for APIs, Server Actions for mutations

### Security Requirements Gates
✅ **Authentication**: NextAuth.js v4+, JWT sessions, bcrypt (cost 12), RBAC
✅ **Input Validation**: Zod schemas client+server, DOMPurify sanitization, rate limiting (100 req/min)
✅ **Data Protection**: Multi-tenant isolation (Prisma middleware), HTTPS only, env vars for secrets, GDPR compliance

### Database & API Standards Gates
✅ **Prisma Schema**: snake_case DB columns (camelCase TS), cuid() PKs, timestamps, soft deletes, storeId for tenancy
✅ **REST Conventions**: Standard methods (GET/POST/PUT/PATCH/DELETE), status codes, response format `{data, error, meta}`
✅ **Query Optimization**: Select needed fields, avoid N+1, paginate, index foreign keys + frequent queries

### Performance Requirements Gates
✅ **Frontend**: Server Components 70%+, dynamic imports, Next.js Image, code splitting, CDN
✅ **Backend**: Connection pooling (5/function), caching (5min TTL reports), query optimization, indexes
✅ **Monitoring**: Vercel Analytics (Web Vitals), Speed Insights, error tracking, query performance

**VERDICT**: ✅ ALL GATES PASSED - Constitution compliant, proceed to Phase 0 Research

## Project Structure

### Documentation (this feature)

```
specs/001-multi-tenant-ecommerce/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (generated by /speckit.plan)
├── data-model.md        # Phase 1 output (generated by /speckit.plan)
├── quickstart.md        # Phase 1 output (generated by /speckit.plan)
├── contracts/           # Phase 1 output (generated by /speckit.plan)
│   ├── openapi.yaml     # REST API specification
│   └── README.md        # API documentation
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
StormCom/
├── src/
│   ├── app/                        # Next.js 16 App Router
│   │   ├── (auth)/                 # Auth route group
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── mfa-challenge/
│   │   ├── (admin)/                # Super Admin routes (cross-store)
│   │   │   └── dashboard/
│   │   ├── (dashboard)/            # Store Admin/Staff routes
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── customers/
│   │   │   ├── inventory/
│   │   │   ├── marketing/
│   │   │   ├── content/
│   │   │   ├── pos/
│   │   │   ├── reports/
│   │   │   ├── settings/
│   │   │   └── layout.tsx
│   │   ├── (storefront)/           # Customer-facing storefront
│   │   │   ├── page.tsx            # Homepage
│   │   │   ├── products/
│   │   │   ├── categories/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── account/
│   │   │   └── layout.tsx
│   │   ├── api/                    # API Route Handlers
│   │   │   ├── auth/
│   │   │   ├── stores/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── customers/
│   │   │   ├── inventory/
│   │   │   ├── payments/
│   │   │   ├── shipping/
│   │   │   ├── webhooks/
│   │   │   └── health/
│   │   ├── globals.css             # Global styles
│   │   └── layout.tsx              # Root layout
│   ├── components/                 # React components
│   │   ├── ui/                     # shadcn/ui primitives
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── storefront/
│   │   ├── forms/
│   │   ├── tables/
│   │   └── charts/
│   ├── lib/                        # Utilities & helpers
│   │   ├── auth.ts                 # Auth utilities (deprecated - use services/auth-service.ts)
│   │   ├── db.ts                   # Prisma client singleton
│   │   ├── utils.ts                # General utilities (cn, formatters)
│   │   ├── validation.ts           # Zod validation schemas library (User, Store, Product, Order)
│   │   ├── api-client.ts           # API client wrapper
│   │   ├── constants.ts            # Global constants
│   │   ├── error-handler.ts        # Error handling utilities with customer-facing messages
│   │   ├── api-response.ts         # API response formatter ({data, error, meta})
│   │   ├── csrf.ts                 # CSRF protection middleware
│   │   ├── rate-limit.ts           # Rate limiting middleware (tiered by subscription plan)
│   │   ├── email.ts                # Resend email service integration
│   │   ├── storage.ts              # Vercel Blob integration for file uploads
│   │   ├── encryption.ts           # AES-256-GCM encryption utilities
│   │   ├── password.ts             # bcrypt password hashing and validation
│   │   ├── mfa.ts                  # TOTP generation, QR codes, backup codes
│   │   ├── audit.ts                # Audit logging utilities
│   │   ├── session-storage.ts      # Session storage layer (Vercel KV / in-memory)
│   │   └── prisma-middleware.ts    # Multi-tenant isolation middleware
│   ├── services/                   # Business logic
│   │   ├── auth/
│   │   ├── stores/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── shipping/
│   │   ├── inventory/
│   │   ├── customers/
│   │   ├── marketing/
│   │   └── analytics/
│   ├── middleware.ts               # Next.js middleware (auth, rate limiting)
│   └── types/                      # TypeScript types
│       ├── api.ts
│       ├── models.ts
│       └── index.ts
├── prisma/
│   ├── schema.prisma               # Database schema
│   ├── migrations/                 # Migration history
│   ├── seed.ts                     # Seed data script
│   └── dev.db                      # SQLite (local dev, gitignored)
├── tests/
│   ├── unit/                       # Vitest unit tests
│   │   ├── lib/
│   │   ├── services/
│   │   └── components/
│   ├── integration/                # Vitest integration tests
│   │   ├── api/
│   │   └── services/
│   └── e2e/                        # Playwright E2E tests
│       ├── pages/                  # Page Object Model
│       │   ├── auth/
│       │   ├── admin/
│       │   └── storefront/
│       ├── fixtures/               # Test data fixtures
│       │   ├── stores.ts
│       │   ├── users.ts
│       │   └── products.ts
│       └── scenarios/              # E2E test scenarios
│           ├── us0-authentication.spec.ts
│           ├── us1-store-management.spec.ts
│           ├── us2-product-catalog.spec.ts
│           ├── us3-checkout.spec.ts
│           └── us7-dashboard-analytics.spec.ts
├── public/                         # Static assets
│   ├── images/
│   ├── fonts/
│   └── favicon.ico
├── .github/
│   ├── copilot-instructions.md     # Copilot guidance
│   ├── instructions/               # Area-specific rules
│   │   ├── api-routes.instructions.md
│   │   ├── components.instructions.md
│   │   ├── database.instructions.md
│   │   ├── documentation.instructions.md
│   │   └── testing.instructions.md
│   └── workflows/                  # CI/CD pipelines
│       ├── test.yml
│       ├── lint.yml
│       └── deploy.yml
├── docs/
│   ├── design-system.md
│   ├── testing-strategy.md
│   ├── ci-cd-configuration.md
│   └── webhook-standards.md
├── .specify/
│   └── memory/
│       └── constitution.md         # Project standards
├── specs/                          # Feature specifications
│   └── 001-multi-tenant-ecommerce/
├── .env.example                    # Environment template
├── .env.local                      # Local environment (gitignored)
├── .eslintrc.json                  # ESLint config
├── .prettierrc                     # Prettier config
├── tsconfig.json                   # TypeScript config
├── tailwind.config.ts              # Tailwind config
├── next.config.ts                  # Next.js config
├── vitest.config.ts                # Vitest config
├── playwright.config.ts            # Playwright config
├── package.json
└── README.md
```

**Structure Decision**: Full-stack web application structure selected. Rationale:
- **App Router structure**: Next.js 16 App Router with route groups for logical separation (auth, admin, dashboard, storefront, API routes)
- **Server Components first**: Most components in `src/components/` are Server Components; Client Components explicitly marked with `'use client'` directive
- **Feature-based organization**: Services organized by business domain (auth, products, orders, etc.) for maintainability
- **Test organization**: Separate directories for unit/integration/E2E tests following best practices (POM pattern for E2E)
- **Multi-tenant aware**: All data access through Prisma with middleware auto-injecting `storeId` for tenant isolation
- **Type safety**: TypeScript strict mode throughout, types co-located with features
- **Scalability**: Structure supports 10K products, 83K orders/month per store without refactoring

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

