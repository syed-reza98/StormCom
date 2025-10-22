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
**Authentication**: NextAuth.js v5 with JWT sessions, bcrypt password hashing, TOTP MFA (authenticator app with backup codes for recovery), optional SMS fallback, OIDC/SAML SSO. Role/Permission system uses predefined roles (SUPER_ADMIN, STORE_ADMIN, STAFF, CUSTOMER) with fixed permissions (no custom roles in Phase 1). **MFA is optional for all users** including Admins and Super Admins during initial development phase - can be made required in future phases.

**UI Requirements:**
- Login, Register, and Logout UI interfaces for the dashboard must be implemented as per spec.md UI requirements, including:
  - All required UI elements, error messages, loading/feedback states, and edge case handling for each flow (see spec.md User Story 0 UI Requirements).
  - Accessibility (WCAG 2.1 AA): keyboard navigation, ARIA labels, focus management, color contrast, and screen reader support for all interactive elements and messages.
  - Responsive design: layouts must adapt to all breakpoints, with minimum touch target sizes and mobile-first layout.
  - Wireframes must be included in design documentation (docs/audit/login-register-wireframes.md) and specify all element positions, spacing, error/loading/empty states, and visual hierarchy.
  - All terms (e.g., "centered card layout", "dashboard branding") must be defined in design docs. Any conflicts between UI, accessibility, and branding must be resolved in favor of accessibility.
  - Dependencies: Next.js App Router, shadcn/ui, Tailwind CSS, and wireframes are required for implementation and review.
  - **Design System & Styling Standards**: Implement and adhere to the unified design system defined in `spec.md`. Define a core color palette (primary, secondary, neutral, success, warning, danger) with WCAG‑compliant contrast, choose a default font family (Inter) and hierarchy, establish spacing and layout rules (4 px/8 px base units, consistent border radius), and compose UI using shadcn/ui and Tailwind classes. Provide dark mode support, dynamic theming per store, standardized icons via lucide‑react, motion guidelines via Framer Motion, and document tokens and components in `docs/design-system.md` and accompanying design files.
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

## Design System Implementation Plan

### Phase 1 – Foundations
1) **Tailwind v4 tokenization** – define semantic tokens in `tailwind.config.ts` (colors/typography/radii/elevations/z-index).
2) **Global CSS** – `app/styles/globals.css` declares light/dark variables; `data-theme` switch with persisted preference.
3) **Storybook setup** – `@storybook/nextjs` with a11y, interactions, viewport, docs; decorators for theme, locale, and layout shells.

### Phase 2 – Primitives & Patterns
1) **Radix + shadcn wiring** – Button, Input, Label, Select, Dialog, Toast, Tabs, Accordion, Table; tokenized states.
2) **Layout shells** – `DashboardShell` / `StorefrontLayout` (12-col grid, page header, breadcrumbs, toolbar slot).
3) **A11y & quality** – keyboard coverage, APCA contrast verification, Playwright a11y smoke tests for core flows.

### Phase 3 – Tenant Theming & Docs
1) **Per-tenant branding** – load Store branding and inject CSS variables; verify contrast for both themes.
2) **Docs & governance** – `docs/design-system.md` + Storybook as living contract; token changes gated via changesets.

### Deliverables
- Tailwind config + `globals.css`, Storybook with theming toggles, baseline component library wired to Radix/shadcn.
- CI gates: Storybook build, a11y checks, visual regression threshold.

**Session Management**: Sessions have a 30-minute idle timeout and a 12-hour absolute expiration. Session IDs are embedded in JWTs and validated on every request. Session storage uses Vercel KV (Redis-compatible) in production for <10 ms lookups and immediate invalidation; in-memory Map fallback for local development (no Redis dependency). Sessions rotate on privilege change and are stored in HttpOnly, Secure, SameSite=Lax cookies. **State-changing requests** require a valid CSRF token (see CSRF Protection).

### CSRF Protection (NEW)
All state‑changing requests from browsers require a double‑submit anti‑CSRF token and SameSite=Lax cookies. Exempt idempotent GET/HEAD; enforce the token on POST/PUT/PATCH/DELETE. Provide the CSRF token via secure cookie and meta tag; include a nonce binding for forms.

### Security Headers (NEW)
Set the following headers at the edge (middleware):
- Strict‑Transport‑Security: `max‑age=63072000; includeSubDomains; preload`
- Content‑Security‑Policy: a nonce‑based strict CSP with `frame‑ancestors 'none'` for the dashboard
- X‑Content‑Type‑Options: `nosniff`
- Referrer‑Policy: `strict‑origin‑when‑cross‑origin`
- (Legacy) X‑Frame‑Options: `DENY`

### Incident Response & IP Reputation (NEW)
Implement anomaly detection and IP reputation checks on authentication‑critical routes. Create an on‑call runbook with triage procedures, communication templates, evidence preservation, and post‑mortem steps.

### Backups & Restore Drills (NEW)
Nightly database snapshots (retain 30 days) and weekly restore drills. Weekly object storage backup verification. Recovery Point Objective (RPO): 24 hours; Recovery Time Objective (RTO): 4 hours for production.

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
| **Security** | ✅ PASS | NextAuth v5, bcrypt (cost 12), TOTP MFA (authenticator app with backup codes for recovery, optional SMS fallback), OIDC/SAML SSO, RBAC with predefined roles, input validation (Zod), XSS prevention, HTTPS only. **MFA is optional for all users** including Admins and Super Admins during initial development phase. |
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
- Login, Register, and Logout UI wireframes for the dashboard (included in design documentation)

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

## Edge Case Implementation Requirements

**Session 2 Additions** (Post-Phase 1 completion, pre-Phase 2 implementation):

The following edge cases were added to `spec.md` after requirements quality audit Session 2. These must be implemented as part of their respective user stories/tasks:

### 1. Duplicate SKU Handling (CHK002)
**Affected Tasks**: T042 (Import products API), T047 (Product validation schemas)
**Location in spec.md**: Catalog management edge cases section
**Requirements**:
- Real-time validation during CSV preview (before import commit)
- UI feedback: Highlight duplicate SKU rows in red with warning icon
- Resolution options: Auto-rename with suffix, skip duplicates, download error CSV
- Suggest existing similar products by name/category
- Error logging with row numbers for review

**Implementation Notes**:
- Add duplicate detection to `src/services/products/product-service.ts` bulk import validation
- Extend Zod schema at `src/lib/validation/product.ts` to check against existing SKUs
- Return error report with suggested alternatives in API response

---

### 2. Password History Requirements (CHK009)
**Affected Tasks**: T086 (Password policy validators), T013 (Prisma schema - new PasswordHistory table)
**Location in spec.md**: Security edge cases section
**Requirements**:
- Prevent reuse of last 5 passwords
- Separate `PasswordHistory` table with bcrypt hashed values
- Compare new password hash against last 5 historical hashes using `bcrypt.compare()`
- Auto-delete history entries older than 2 years (GDPR compliance)
- Error message: "Password has been used recently. Please choose a different password."

**Data Model Addition**:
```prisma
model PasswordHistory {
  id        String   @id @default(cuid())
  userId    String
  hash      String   // bcrypt hash of password
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  @@index([userId, createdAt])
}
```

**Implementation Notes**:
- Add to `src/lib/security/password-policy.ts` validation logic
- Store hash on every password change in `src/services/security/password-service.ts`
- Add cleanup job to `src/services/jobs/password-history-cleanup.ts`

---

### 3. Zero-Product Onboarding Wizard (CHK054)
**Affected Tasks**: T045 (Product create page - add wizard flow), New task for sample data seeding
**Location in spec.md**: Catalog management edge cases section
**Requirements**:
- 5-step welcome wizard on first login (store branding, **product catalog setup**, payment, shipping, theme)
- Product catalog step options: Import sample products (10 demo products), Upload CSV (with template), Skip
- Empty state UI: Tutorial video (2-min quickstart), three action cards, progress checklist (0/5 products)
- Contextual help tooltips throughout

**Implementation Notes**:
- Add onboarding wizard component at `src/components/admin/onboarding-wizard.tsx`
- Create sample products seed function at `src/services/products/sample-products.ts`
- Add empty state component at `src/components/admin/empty-catalog-state.tsx`
- Track onboarding completion in `Store` model with `onboardingCompleted` boolean

---

### 4. Order at Plan Expiration Timing (CHK056)
**Affected Tasks**: T077 (Plan enforcement guard), T053 (Create order API)
**Location in spec.md**: Subscription edge cases section
**Requirements**:
- 60-second grace period after plan expiration
- Server UTC timestamp is authoritative (ignore client-side time)
- Accept order if `serverTime <= planExpiresAt + 60s`, otherwise reject
- Rejection message: "Your subscription has expired. Please renew to accept new orders."
- Admin email notification when plan expiration blocks orders
- Immediate upgrade modal shown to store owner

**Implementation Notes**:
- Add grace period logic to `src/lib/plan-guard.ts` enforcement checks
- Use `new Date()` for server UTC time in order validation
- Send notification via `src/services/notifications/plan-notifier.ts`
- Add upgrade modal component at `src/components/admin/plan-expired-modal.tsx`

---

### 5. Webhook After Auto-Cancellation Race Condition (CHK058)
**Affected Tasks**: T056 (Payment webhooks), T074 (Auto-cancel job)
**Location in spec.md**: Webhook edge cases section
**Requirements**:
- Detect if order status is `cancelled` when webhook received (payment after 15-min timeout)
- Validate payment webhook signature (prevent replay attacks)
- Check idempotency key (prevent duplicate processing): `payment_{paymentGateway}_{transactionId}`
- Restoration workflow: Restore order status (`cancelled` → `processing`), restock inventory, send "Payment Received" email
- Inventory restock only if items still available (prevent overselling)
- Webhook replay protection via Redis cache (24-hour TTL)
- Audit log: Record cancellation, restoration, webhook events with timestamps

**Implementation Notes**:
- Add order restoration logic to `src/services/orders/order-restoration-service.ts`
- Implement idempotency check in `src/lib/payments/idempotency.ts` using Vercel KV
- Extend webhook handlers at `src/app/api/payments/webhooks/*/route.ts`
- Add inventory availability check before restocking

---

### 6. Flash Sale + Coupon Discount Overlap (CHK060)
**Affected Tasks**: T052 (Checkout service - discount calculation), T099 (Flash sales service), T097 (Coupons service)
**Location in spec.md**: Marketing edge cases section
**Requirements**:
- Default stacking order: Apply flash sale first (20% off), then coupon on discounted price (additional 10% off)
- Configuration option: Store setting to block/allow coupon usage during flash sales
- Block mode: Display "Coupon codes cannot be used during flash sales"
- Allow mode: Apply stacking with order above
- Cart UI display: Show discount breakdown (Original Price, Flash Sale discount, Subtotal, Coupon discount, Final Total)
- Admin toggle: "Allow coupons during flash sales" in store settings

**Implementation Notes**:
- Add discount precedence logic to `src/services/checkout/checkout-service.ts`
- Add `allowCouponsWithFlashSale` boolean to `Store` model
- Update cart component at `src/components/storefront/cart-summary.tsx` to show breakdown
- Add store setting at `src/app/(admin)/settings/promotions/page.tsx`

---

### 7. Tax-Exempt Approval Workflow (CHK091)
**Affected Tasks**: New tasks for tax exemption management, T050 (Tax rates service - add exemption check)
**Location in spec.md**: Tax compliance edge cases section
**Requirements**:
- Request workflow: Customer uploads tax-exempt certificate (PDF/JPG, max 5MB), provides certificate details (number, expiration, state)
- Admin review: Email notification with certificate preview, approval/rejection actions, reason for rejection
- Auto-expiration: System revokes exemption on certificate expiration date, sends reminder 30 days before
- Audit trail: Log all requests, approvals, rejections, expirations

**Data Model Addition**:
```prisma
model TaxExemption {
  id              String   @id @default(cuid())
  customerId      String
  certificateUrl  String   // Vercel Blob storage URL
  certificateNum  String
  issuingState    String
  expiresAt       DateTime
  status          String   // pending, approved, rejected, expired
  approvedBy      String?  // Admin user ID
  approvedAt      DateTime?
  createdAt       DateTime @default(now())
  @@index([customerId, status, expiresAt])
}
```

**Implementation Notes**:
- Add tax exemption service at `src/services/tax/tax-exemption-service.ts`
- Add API endpoints at `src/app/api/customers/[customerId]/tax-exemptions/route.ts`
- Add admin review page at `src/app/(admin)/settings/tax-exemptions/page.tsx`
- Add expiration job at `src/services/jobs/tax-exemption-expiry.ts`
- Integrate exemption check into `src/services/tax/tax-rate-service.ts`

---

### 8. Rate Limit Headers in OpenAPI (CHK097)
**Affected Tasks**: API documentation update (already completed in `contracts/openapi.yaml`)
**Location**: `contracts/openapi.yaml` components/headers section
**Status**: ✅ **COMPLETED** - Headers defined, RateLimitExceeded response updated, info/description enhanced

---

## Implementation Sequencing

**Edge cases must be implemented alongside their primary features**:

1. **Phase 4 (US2 - Product catalog)**: CHK002 (duplicate SKU), CHK054 (onboarding wizard)
2. **Phase 5 (US3 - Checkout)**: CHK056 (order expiration), CHK060 (discount stacking), CHK091 (tax exemption)
3. **Phase 5 (US3 - Payments)**: CHK058 (webhook restoration)
4. **Phase 10 (US12 - Security)**: CHK009 (password history)

All edge cases have been documented in `spec.md` with complete workflows, error handling, and acceptance criteria. Implementation tasks added to `tasks.md` as subtasks under their respective user stories.

---

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

No constitution violations detected. All requirements satisfied:
- ✅ Using required tech stack (Next.js 15.5.5, TypeScript 5.9.3, Prisma, PostgreSQL[Production]/SQLite[Local Development], Tailwind CSS)
- ✅ Avoiding prohibited technologies (no Redux, no CSS-in-JS, no GraphQL, no MongoDB, no Pages Router)
- ✅ Following architecture patterns (Server Components first, REST API, Prisma ORM only)
- ✅ Meeting performance budgets and test coverage requirements
- ✅ Implementing security standards (NextAuth v5, RBAC, input validation, multi-tenant isolation)

---

## Testing Strategy

Comprehensive testing framework aligned with `docs/testing-strategy.md` covering unit, integration, E2E, performance, accessibility, and visual regression testing.

### Testing Pyramid (60/30/10 Split)

**Unit Tests (60%)**: Fast, isolated tests for business logic and utilities
- **Coverage Targets**: 80% global, 90% services, 100% utilities
- **Tools**: Vitest 3.2.4 + Testing Library
- **Co-located**: Tests live alongside source files in `__tests__/` subdirectories

**Integration Tests (30%)**: API routes, database queries, service interactions
- **Coverage Targets**: 100% API routes, database query performance validation
- **Tools**: Vitest + Prisma with SQLite in-memory database
- **Location**: `tests/integration/`

**E2E Tests (10%)**: Critical user paths with Page Object Model architecture
- **Coverage Targets**: 100% critical paths (auth, checkout, orders, payments)
- **Tools**: Playwright 1.56.0 with cross-browser support (Chromium, Firefox, WebKit, Mobile)
- **Location**: `tests/e2e/`

### Unit Testing Structure

**Test Organization** (Co-located with source):
```
src/
├── lib/
│   └── utils/
│       ├── format.ts
│       └── __tests__/
│           └── format.test.ts          # 100% coverage required
├── services/
│   └── products/
│       ├── product-service.ts
│       └── __tests__/
│           └── product-service.test.ts # 90% coverage required
└── components/
    └── ui/
        ├── button.tsx
        └── __tests__/
            └── button.test.tsx         # Test all variants/states
```

**Vitest Configuration** (`vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
        '**/index.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        'src/services/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'src/lib/utils/**': {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Example Tests**:

*Utility Function Test* (`src/lib/utils/__tests__/format.test.ts`):
```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate } from '../format';

describe('formatCurrency', () => {
  it('should format USD currency', () => {
    expect(formatCurrency(1299, 'USD')).toBe('$12.99');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });

  it('should handle negative amounts', () => {
    expect(formatCurrency(-1299, 'USD')).toBe('-$12.99');
  });
});
```

*Service Test* (`src/services/products/__tests__/product-service.test.ts`):
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createProduct, validateSKU } from '../product-service';
import { prisma } from '@/lib/prisma';

describe('Product Service', () => {
  beforeEach(async () => {
    await prisma.$executeRaw`DELETE FROM products`;
  });

  describe('validateSKU', () => {
    it('should validate unique SKU per store (SC-001)', async () => {
      await createProduct({
        storeId: 'store_1',
        name: 'Test Product',
        sku: 'TEST-001',
      });

      const result = await validateSKU('store_1', 'TEST-001');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('SKU already exists in this store');
    });

    it('should allow same SKU in different stores', async () => {
      await createProduct({
        storeId: 'store_1',
        name: 'Test Product',
        sku: 'TEST-001',
      });

      const result = await validateSKU('store_2', 'TEST-001');
      expect(result.isValid).toBe(true);
    });
  });
});
```

*Component Test* (`src/components/ui/__tests__/button.test.tsx`):
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button Component', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('should call onClick handler', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should apply variant styles', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-secondary');
  });
});
```

### Integration Testing

**Test Structure** (`tests/integration/`):
```
tests/integration/
├── api/
│   ├── products.test.ts       # Product API routes
│   ├── orders.test.ts         # Order API routes
│   └── auth.test.ts           # Auth API routes
├── services/
│   └── checkout-service.test.ts
└── database/
    └── query-performance.test.ts
```

**Database Setup** (SQLite in-memory for speed):
```typescript
// tests/setup.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db',
    },
  },
});

beforeAll(async () => {
  // Push schema to test database
  execSync('npx prisma db push --skip-generate', {
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
  });
  
  // Seed test data
  await seedTestData();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

**Example Integration Test** (`tests/integration/api/products.test.ts`):
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/products/route';
import { NextRequest } from 'next/server';

describe('Products API', () => {
  beforeEach(async () => {
    await prisma.product.deleteMany();
  });

  describe('GET /api/products', () => {
    it('should return paginated products (SC-007)', async () => {
      // Seed 30 products
      await Promise.all(
        Array.from({ length: 30 }, (_, i) =>
          prisma.product.create({
            data: {
              storeId: 'store_1',
              name: `Product ${i + 1}`,
              sku: `SKU-${i + 1}`,
              price: 1000,
            },
          })
        )
      );

      const request = new NextRequest('http://localhost:3000/api/products?page=1&perPage=20');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(20);
      expect(data.meta.total).toBe(30);
      expect(data.meta.page).toBe(1);
      expect(data.meta.perPage).toBe(20);
    });

    it('should return in <500ms for 10K products (SC-003)', async () => {
      const start = Date.now();
      await GET(new NextRequest('http://localhost:3000/api/products'));
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    });
  });

  describe('POST /api/products', () => {
    it('should enforce unique SKU per store', async () => {
      await POST(
        new NextRequest('http://localhost:3000/api/products', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Product 1',
            sku: 'TEST-001',
            price: 1000,
          }),
        })
      );

      const response = await POST(
        new NextRequest('http://localhost:3000/api/products', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Product 2',
            sku: 'TEST-001',
            price: 2000,
          }),
        })
      );

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('DUPLICATE_SKU');
    });
  });
});
```

**Database Performance Test** (`tests/integration/database/query-performance.test.ts`):
```typescript
import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('Database Query Performance', () => {
  it('should query order with items in <100ms (SC-023)', async () => {
    const order = await prisma.order.create({
      data: {
        storeId: 'store_1',
        customerId: 'customer_1',
        total: 5000,
        items: {
          create: Array.from({ length: 10 }, (_, i) => ({
            productId: `product_${i}`,
            quantity: 1,
            price: 500,
          })),
        },
      },
    });

    const start = Date.now();
    await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true, customer: true },
    });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });
});
```

### E2E Testing (Playwright)

**Test Structure** with Page Object Model:
```
tests/e2e/
├── pages/                     # Page Object Models
│   ├── login-page.ts
│   ├── dashboard-page.ts
│   ├── products-page.ts
│   └── checkout-page.ts
├── fixtures/                  # Test data fixtures
│   ├── users.ts
│   ├── products.ts
│   └── stores.ts
├── auth.spec.ts              # Authentication flows (US0)
├── products.spec.ts          # Product management (US2)
├── checkout.spec.ts          # Checkout flow (US3)
└── orders.spec.ts            # Order management (US4)
```

**Playwright Configuration** (`playwright.config.ts`):
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Page Object Model Example** (`tests/e2e/pages/login-page.ts`):
```typescript
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly mfaCodeInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.mfaCodeInput = page.getByLabel('MFA Code');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/auth/login');
  }

  async login(email: string, password: string, mfaCode?: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    
    if (mfaCode) {
      await this.mfaCodeInput.fill(mfaCode);
    }
    
    await this.loginButton.click();
  }

  async waitForRedirect() {
    await this.page.waitForURL('/dashboard');
  }
}
```

**E2E Test Example** (`tests/e2e/auth.spec.ts`):
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login-page';
import { seedUser } from './fixtures/users';

test.describe('Authentication Flow (US0)', () => {
  test('should login with valid credentials', async ({ page }) => {
    const user = await seedUser({ email: 'test@example.com', password: 'SecurePass123!' });
    
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(user.email, 'SecurePass123!');
    await loginPage.waitForRedirect();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(`Welcome, ${user.name}`)).toBeVisible();
  });

  test('should show error for invalid password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'wrong password');

    await expect(loginPage.errorMessage).toContainText('Invalid email or password');
  });

  test('should require MFA code when enabled', async ({ page }) => {
    const user = await seedUser({ mfaEnabled: true });
    
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(user.email, 'SecurePass123!');

    await expect(loginPage.mfaCodeInput).toBeVisible();
  });
});
```

### Test Fixtures

**Centralized Fixture Strategy** (`tests/fixtures/`):
```typescript
// tests/fixtures/stores.ts
export async function seedStore(overrides = {}) {
  return prisma.store.create({
    data: {
      name: 'Test Store',
      slug: 'test-store',
      email: 'test@store.com',
      plan: 'PRO',
      status: 'ACTIVE',
      ...overrides,
    },
  });
}

// tests/fixtures/products.ts
export async function seedProducts(storeId: string, count: number) {
  return Promise.all(
    Array.from({ length: count }, (_, i) =>
      prisma.product.create({
        data: {
          storeId,
          name: `Product ${i + 1}`,
          sku: `SKU-${i + 1}`,
          price: Math.floor(Math.random() * 10000) + 1000,
          stock: Math.floor(Math.random() * 100),
          isActive: true,
        },
      })
    )
  );
}

// tests/fixtures/users.ts
export async function seedUser(overrides = {}) {
  const password = await hashPassword('SecurePass123!');
  
  return prisma.user.create({
    data: {
      email: 'test@example.com',
      password,
      name: 'Test User',
      role: 'STORE_ADMIN',
      ...overrides,
    },
  });
}
```

**Database Seeding Script** (`prisma/seed.ts`):
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed subscription plans
  await prisma.subscriptionPlan.createMany({
    data: [
      { name: 'FREE', price: 0, maxProducts: 50, maxOrders: 100 },
      { name: 'BASIC', price: 2900, maxProducts: 500, maxOrders: 1000 },
      { name: 'PRO', price: 9900, maxProducts: 10000, maxOrders: 10000 },
    ],
    skipDuplicates: true,
  });

  // Seed test store
  const store = await prisma.store.upsert({
    where: { email: 'demo@stormcom.io' },
    update: {},
    create: {
      name: 'Demo Store',
      slug: 'demo-store',
      email: 'demo@stormcom.io',
      plan: 'PRO',
      status: 'ACTIVE',
    },
  });

  // Seed admin user
  await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      password: await hashPassword('Admin123!'),
      name: 'Demo Admin',
      role: 'STORE_ADMIN',
      storeId: store.id,
    },
  });

  console.log('✅ Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Performance Testing (k6)

**Load Test Script** (`tests/performance/load-test.js`):
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  },
};

export default function () {
  const res = http.get('http://localhost:3000/api/products');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

**Run Command**:
```bash
k6 run tests/performance/load-test.js
```

### Test Commands (package.json)

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:chromium": "playwright test --project=chromium",
    "test:e2e:firefox": "playwright test --project=firefox",
    "test:e2e:webkit": "playwright test --project=webkit",
    "test:e2e:mobile": "playwright test --project='Mobile Chrome'",
    "test:e2e:ui": "playwright test --ui",
    "test:performance": "k6 run tests/performance/load-test.js",
    "test:all": "npm run test:coverage && npm run test:integration && npm run test:e2e"
  }
}
```

### CI Integration

Tests run automatically in GitHub Actions on every push/PR (see CI/CD Configuration section below).

---

## CI/CD Configuration

Comprehensive continuous integration and deployment pipeline aligned with `docs/ci-cd-configuration.md` enforcing quality gates at every stage.

### GitHub Actions Workflows

**Main CI Pipeline** (`.github/workflows/ci.yml`):

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '18'
  DATABASE_URL: 'file:./test.db'

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npx prisma generate
      - run: npm run test:integration

  build:
    name: Build & Bundle Analysis
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npx prisma generate
      - run: npm run build
      - name: Check bundle size
        run: |
          SIZE=$(du -sb .next | cut -f1)
          SIZE_KB=$((SIZE / 1024))
          echo "Bundle size: ${SIZE_KB} KB"
          if [ $SIZE_KB -gt 204800 ]; then
            echo "❌ Bundle exceeds 200 KB limit"
            exit 1
          elif [ $SIZE_KB -gt 184320 ]; then
            echo "⚠️ Bundle exceeds 180 KB warning threshold"
          fi
      - uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: .next

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - uses: actions/download-artifact@v4
        with:
          name: build-output
          path: .next
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  lighthouse:
    name: Performance Tests (Lighthouse CI)
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - uses: actions/download-artifact@v4
        with:
          name: build-output
          path: .next
      - run: npm run start &
      - run: npx wait-on http://localhost:3000
      - run: npx @lhci/cli@0.14.x autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

  accessibility:
    name: Accessibility Tests
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:a11y

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=moderate
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    needs: [e2e-tests, lighthouse, accessibility, security]
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Quality Gates

All deployments **MUST PASS** the following gates:

1. **✅ Linting**: ESLint with no errors
2. **✅ Type Checking**: TypeScript strict mode with no errors
3. **✅ Unit Tests**: 80% coverage minimum, all tests passing
4. **✅ Integration Tests**: All API/database tests passing
5. **✅ Build**: Next.js build succeeds, bundle < 200 KB
6. **✅ E2E Tests**: Critical paths passing (auth, checkout, orders)
7. **✅ Performance**: Lighthouse CI budgets met (LCP < 2s, CLS < 0.1, TBT < 300ms)
8. **✅ Accessibility**: axe-core WCAG 2.1 Level AA with 0 violations
9. **✅ Security**: No critical/high vulnerabilities

### Performance Budgets (Lighthouse CI)

**Configuration** (`lighthouserc.json`):
```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/products",
        "http://localhost:3000/checkout"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 1.0}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
        "total-blocking-time": ["error", {"maxNumericValue": 300}]
      }
    }
  }
}
```

### Monitoring Setup

**Vercel Analytics** (Built-in):
```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Sentry Error Tracking** (`sentry.client.config.ts`):
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({ maskAllText: true, blockAllMedia: true }),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

**Slow Query Monitoring** (`src/lib/prisma.ts`):
```typescript
import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

const prisma = new PrismaClient({
  log: [{ emit: 'event', level: 'query' }],
});

prisma.$on('query', (e) => {
  if (e.duration > 100) {
    console.warn('[SLOW_QUERY]', { query: e.query, duration: e.duration });
    Sentry.captureMessage('Slow database query', {
      level: 'warning',
      extra: { query: e.query, duration: e.duration },
    });
  }
});

export { prisma };
```

### Deployment Strategy

| Environment | Branch | Auto-Deploy | Database | URL |
|-------------|--------|-------------|----------|-----|
| **Production** | `main` | ✅ Yes | Vercel Postgres | https://stormcom.vercel.app |
| **Staging** | `develop` | ✅ Yes | Vercel Postgres (staging) | https://stormcom-staging.vercel.app |
| **Preview** | PR branches | ✅ Yes | Vercel Postgres (preview) | https://stormcom-pr-123.vercel.app |

**Health Check Endpoint** (`src/app/api/health/route.ts`):
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
```

---

## Implementation References

For complete implementation details, see:
- **Testing Strategy**: `docs/testing-strategy.md`
- **CI/CD Configuration**: `docs/ci-cd-configuration.md`
- **Design System**: `docs/design-system.md`
- **Webhook Standards**: `docs/webhook-standards.md`
- **API Contracts**: `specs/001-multi-tenant-ecommerce/contracts/openapi.yaml`
- **API Enhancement Plan**: `specs/001-multi-tenant-ecommerce/contracts/openapi-enhancement-plan.md`
