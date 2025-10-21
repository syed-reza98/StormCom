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

## Design System Implementation Plan

### Phase 1 — Foundations
1) **Tailwind v4 tokenization** — define semantic tokens in `tailwind.config.ts` (colors/typography/radii/elevations/z-index).
2) **Global CSS** — `app/styles/globals.css` declares light/dark variables; `data-theme` switch with persisted preference.
3) **Storybook setup** — `@storybook/nextjs` with a11y, interactions, viewport, docs; decorators for theme, locale, and layout shells.

### Phase 2 — Primitives & Patterns
1) **Radix + shadcn wiring** — Button, Input, Label, Select, Dialog, Toast, Tabs, Accordion, Table; tokenized states.
2) **Layout shells** — `DashboardShell` / `StorefrontLayout` (12-col grid, page header, breadcrumbs, toolbar slot).
3) **A11y & quality** — keyboard coverage, APCA contrast verification, Playwright a11y smoke tests for core flows.

### Phase 3 — Tenant Theming & Docs
1) **Per-tenant branding** — load Store branding and inject CSS variables; verify contrast for both themes.
2) **Docs & governance** — `docs/design-system.md` + Storybook as living contract; token changes gated via changesets.

### Deliverables
- Tailwind config + `globals.css`, Storybook with theming toggles, baseline component library wired to Radix/shadcn.
- CI gates: Storybook build, a11y checks, visual regression threshold.
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
