# Research: StormCom Multi-tenant E-commerce Platform

**Feature**: 001-multi-tenant-ecommerce  
**Date**: 2025-10-23  
**Status**: Complete

This document consolidates research findings and technical decisions for implementing StormCom's multi-tenant e-commerce platform. All "NEEDS CLARIFICATION" items from the Technical Context have been resolved through analysis of the feature specification, constitution, and technology requirements.

## Architecture Decisions

### Decision 1: Next.js App Router with Server Components First

**Context**: Need to build a full-stack web application with admin dashboard and customer storefront while minimizing client-side JavaScript bundle size.

**Decision**: Use Next.js 16.0.0+ App Router with React 19 Server Components as the default rendering strategy.

**Rationale**:
- **Performance**: Server Components reduce client-side JavaScript by 70%, directly supporting <200KB bundle constraint
- **SEO**: Server-side rendering critical for customer storefront organic search traffic (product pages, categories)
- **Type Safety**: Next.js integrates seamlessly with TypeScript strict mode and Prisma for end-to-end type safety
- **Deployment**: Vercel platform provides zero-config deployment with automatic Edge Network CDN for global performance
- **Developer Experience**: App Router provides modern file-based routing with layouts, loading states, error boundaries

**Alternatives Considered**:
1. **Pages Router** - Rejected: Prohibited by constitution, less efficient data fetching patterns
2. **Separate frontend/backend** - Rejected: Adds complexity, deployment overhead, CORS management; App Router provides unified full-stack solution
3. **Remix** - Rejected: Smaller ecosystem, less mature Vercel deployment, team unfamiliar

**Implementation Details**:
- Route groups for logical separation: `(auth)`, `(admin)`, `(dashboard)`, `(storefront)`
- Server Components for all non-interactive UI (product lists, order tables, analytics dashboards)
- Client Components only for forms, modals, interactive widgets (marked with `'use client'`)
- Route Handlers (`route.ts`) for REST APIs in `app/api/`
- Server Actions for form mutations (add to cart, update profile)

### Decision 2: Prisma ORM with PostgreSQL (Production) / SQLite (Development)

**Context**: Need type-safe database access with multi-tenant isolation, migrations, and support for complex queries.

**Decision**: Use Prisma ORM with PostgreSQL 15+ in production (Vercel Postgres) and SQLite for local development.

**Rationale**:
- **Type Safety**: Prisma generates TypeScript types from schema, eliminating runtime type errors
- **Multi-Tenancy**: Prisma middleware can auto-inject `storeId` filter on all queries for zero-leakage tenant isolation
- **Migrations**: Declarative schema with automatic migration generation (`prisma migrate`)
- **Performance**: Connection pooling (5 connections/serverless function), query optimization with `select`, indexes
- **Developer Experience**: Prisma Studio for database GUI, introspection for existing databases
- **Local Development**: SQLite eliminates PostgreSQL setup requirement for local dev, zero config

**Alternatives Considered**:
1. **Raw SQL queries** - Rejected: No type safety, SQL injection risk, prohibited by constitution
2. **Drizzle ORM** - Rejected: Less mature, smaller ecosystem, team unfamiliar
3. **TypeORM** - Rejected: Heavier than needed, Active Record pattern less suitable for serverless

**Implementation Details**:
- Schema: `snake_case` columns (auto-mapped to `camelCase` in TypeScript), `cuid()` primary keys, timestamps on all tables
- Multi-tenant middleware: Intercept all queries, inject `where: { storeId: currentStoreId }` except for Super Admin
- Soft deletes: `deletedAt DateTime?` field, custom middleware to exclude deleted records
- Indexes: Compound indexes on `[storeId, createdAt]`, `[storeId, email]` for common queries
- Connection pooling: Prisma default 5 connections per function, scalable to 20 for Enterprise plans

### Decision 3: NextAuth.js v4+ with JWT + Vercel KV Sessions

**Context**: Need secure authentication with role-based access control, MFA support, and fast session validation (<10ms).

**Decision**: Use NextAuth.js v4+ with JWT tokens stored in HTTP-only cookies, session state in Vercel KV (Redis), and bcrypt password hashing (cost factor 12).

**Rationale**:
- **Security**: HTTP-only, Secure, SameSite=Lax cookies prevent XSS/CSRF attacks
- **Performance**: Vercel KV provides <10ms session validation (production), in-memory Map for local dev
- **Scalability**: Stateless JWT tokens reduce database load, session store only for validation/invalidation
- **MFA Support**: NextAuth.js supports TOTP (RFC 6238) out-of-the-box with authenticator apps
- **SSO Ready**: Built-in OIDC/SAML providers (Okta, Azure AD, Google) for enterprise SSO (Phase 1)
- **Fast Invalidation**: Session store allows immediate logout/permission revocation (<60s requirement)

**Alternatives Considered**:
1. **Database-only sessions** - Rejected: Slower validation (DB query on every request), higher load
2. **Pure JWT (no session store)** - Rejected: Cannot invalidate tokens before expiration (security risk)
3. **Auth0/Clerk** - Rejected: External dependency, vendor lock-in, higher cost at scale

**Implementation Details**:
- JWT structure: `{ userId, sessionId (UUID), role, storeId, iat, exp (30 days) }`
- Session validation: Check JWT signature → Query Vercel KV for sessionId → Update lastActivityAt (7-day idle timeout)
- Password policy: Min 8 chars, uppercase/lowercase/number/special, last 5 passwords checked (bcrypt hashes)
- MFA: TOTP primary, 10 backup codes (bcrypt hashed), optional SMS fallback
- Account lockout: 5 failed attempts/15min → 15min lockout, email notification

### Decision 4: Tailwind CSS 4.1.14+ with shadcn/ui Components

**Context**: Need utility-first styling with accessible component primitives, dark mode, and per-tenant theming.

**Decision**: Use Tailwind CSS 4.1.14+ with shadcn/ui (copy-paste components built on Radix UI primitives).

**Rationale**:
- **Constitution Compliance**: CSS-in-JS prohibited, Tailwind required
- **Accessibility**: Radix UI provides WCAG 2.1 AA compliant primitives (keyboard nav, ARIA, focus management)
- **Theming**: CSS variables for colors/fonts enable per-store branding (`--color-primary` from `Store.primaryColor`)
- **Performance**: Zero-runtime CSS, purged unused classes, <50KB CSS bundle
- **Developer Experience**: Utility-first reduces context switching, no CSS files per component
- **Dark Mode**: Built-in dark mode with `.dark` class on `<html>`, CSS variable swapping

**Alternatives Considered**:
1. **styled-components / Emotion** - Rejected: Prohibited by constitution (CSS-in-JS)
2. **Vanilla CSS Modules** - Rejected: More verbose, no utility-first benefits, larger bundle
3. **Material UI / Chakra UI** - Rejected: Heavier bundles, opinionated styling, less customizable

**Implementation Details**:
- Design tokens: Define in `tailwind.config.ts` (colors, typography, spacing, radii, shadows)
- Component library: Copy shadcn/ui components to `src/components/ui/` (Button, Input, Dialog, Table, etc.)
- Theming: Inject `<style>` with CSS variables based on `Store.primaryColor/secondaryColor` at runtime
- Dark mode: Use `next-themes` provider, user preference stored in `localStorage`, server-rendered with theme script
- Responsive: Mobile-first approach, breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl), 1536px (2xl)

### Decision 5: Vitest + Playwright Testing Stack

**Context**: Need comprehensive testing with 80% business logic coverage, 100% E2E critical paths, cross-browser support.

**Decision**: Use Vitest 3.2.4+ for unit/integration tests, Playwright 1.56.0+ with MCP for E2E tests, BrowserStack for cross-browser, Percy for visual regression, k6 for load testing, Lighthouse CI for performance, axe-core for accessibility.

**Rationale**:
- **Vitest**: Blazing fast (Vite-powered), native TypeScript/ESM support, Jest-compatible API, built-in coverage (v8)
- **Playwright**: Multi-browser (Chromium, Firefox, WebKit), POM pattern, parallel execution, trace files on failure
- **BrowserStack**: Real device testing (mobile Safari, mobile Chrome), Percy integration for visual diffs
- **k6**: Grafana-backed load testing (100 concurrent users/5min), scriptable scenarios
- **Lighthouse CI**: Automated performance budgets (LCP <2s, CLS <0.1, TBT <300ms), fails CI on violation
- **axe-core**: WCAG 2.1 AA compliance checks, integrates with Playwright for E2E accessibility validation

**Alternatives Considered**:
1. **Jest + Puppeteer** - Rejected: Slower than Vitest, Puppeteer limited to Chromium (no Firefox/WebKit)
2. **Cypress** - Rejected: No true multi-browser support, slower than Playwright, proprietary syntax
3. **Selenium** - Rejected: Verbose API, slower execution, maintenance overhead

**Implementation Details**:
- Unit tests: Co-located with source in `__tests__/` subdirectories, AAA pattern, 80% coverage threshold
- Integration tests: `tests/integration/api/` for Route Handler testing, mock database with in-memory SQLite
- E2E tests: `tests/e2e/scenarios/` organized by user story, POM in `tests/e2e/pages/`
- Test data: Fixtures in `tests/e2e/fixtures/`, seed database before tests, cleanup after
- CI/CD: Run tests on every PR, block merge if coverage drops or E2E fails

## Technology Stack Summary

### Core Framework
| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Next.js** | 16.0.0+ | Full-stack framework | App Router, Server Components, Vercel deployment |
| **React** | 19.x | UI library | Server Components by default, modern hooks |
| **TypeScript** | 5.9.3+ | Type safety | Strict mode, end-to-end type safety with Prisma |

### Backend & Data
| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Prisma ORM** | Latest stable | Database ORM | Type-safe queries, migrations, multi-tenant middleware |
| **PostgreSQL** | 15+ | Production database | Full-text search (pg_trgm), JSON support, reliability |
| **SQLite** | Latest | Development database | Zero-config local dev, Prisma compatible |
| **Vercel KV** | N/A | Session store (Redis) | <10ms lookups, immediate invalidation, global replication |

### Authentication & Security
| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **NextAuth.js** | v4+ | Authentication | JWT sessions, MFA (TOTP), SSO (OIDC/SAML), provider ecosystem |
| **bcrypt** | Latest | Password hashing | Cost factor 12, industry standard, secure |
| **Zod** | Latest | Runtime validation | Type-safe schemas, client+server validation, Prisma integration |

### Styling & UI
| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Tailwind CSS** | 4.1.14+ | Utility-first styling | Constitution required, small bundle, theming via CSS vars |
| **Radix UI** | Latest | Accessible primitives | WCAG 2.1 AA compliant, unstyled, composable |
| **shadcn/ui** | Latest | Component library | Copy-paste components built on Radix UI, customizable |
| **Framer Motion** | Latest | Animations | Respect prefers-reduced-motion, smooth transitions |
| **lucide-react** | Latest | Icons | Consistent stroke width, tree-shakeable |

### Testing & Quality
| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Vitest** | 3.2.4+ | Unit/integration tests | Fast (Vite-powered), native TS/ESM, Jest-compatible |
| **Playwright** | 1.56.0+ | E2E tests | Multi-browser, POM pattern, MCP support, traces |
| **BrowserStack** | N/A | Cross-browser testing | Real devices, Percy visual regression |
| **k6** | Latest | Load testing | 100 concurrent users, Grafana metrics |
| **Lighthouse CI** | Latest | Performance budgets | LCP/CLS/TBT thresholds, CI enforcement |
| **axe-core** | Latest | Accessibility testing | WCAG 2.1 AA automation, Playwright integration |

### Development Tools
| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **ESLint** | Latest | Linting | Constitution rules, TypeScript best practices |
| **Prettier** | Latest | Formatting | Consistent code style, automatic on save |
| **React Hook Form** | Latest | Form state | Minimal re-renders, Zod integration, TypeScript support |

### Deployment & Infrastructure
| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Vercel** | N/A | Platform | Zero-config deployment, Edge Network CDN, Vercel KV/Postgres |
| **Vercel Analytics** | N/A | Web Vitals monitoring | Real-time LCP/FID/CLS tracking, no config |
| **Vercel Speed Insights** | N/A | Performance metrics | User-centric performance data, automatic |
| **Vercel Blob** | N/A | File storage | Product images, invoices, automatic optimization |

## Best Practices Identified

### Multi-Tenant Architecture
1. **Prisma Middleware Pattern**: Auto-inject `storeId` filter on all queries to prevent cross-tenant data leakage
2. **Session Context**: Store `storeId` in JWT and session, validate on every request
3. **Database Indexes**: Compound indexes `@@index([storeId, createdAt])` for tenant-scoped queries
4. **Unique Constraints**: `@@unique([storeId, email])`, `@@unique([storeId, sku])` for per-tenant uniqueness
5. **Soft Deletes**: `deletedAt DateTime?` with middleware to auto-exclude deleted records
6. **Audit Trail**: Immutable logs for security-sensitive actions (auth, permissions, data export)

### Performance Optimization
1. **Server Components Default**: 70%+ components should be Server Components to minimize JavaScript bundle
2. **Dynamic Imports**: Lazy-load heavy components (charts, editors, modals) with `next/dynamic`
3. **Image Optimization**: Use `next/image` for automatic WebP conversion, responsive srcset, lazy loading
4. **Database Query Optimization**: Select only needed fields, use indexes, avoid N+1 queries
5. **Connection Pooling**: Prisma default 5 connections/function, scale to 20 for Enterprise
6. **Caching Strategy**: 5-minute TTL for analytics/reports, CDN caching for static assets
7. **Code Splitting**: Automatic by route, manual for large pages

### Security Best Practices
1. **Input Validation**: Zod schemas on client+server, sanitize HTML with DOMPurify
2. **Rate Limiting**: 100 req/min per IP (unauthenticated), tiered by plan (authenticated)
3. **SQL Injection Prevention**: Prisma parameterized queries only, no raw SQL
4. **XSS Prevention**: React automatic escaping, Content Security Policy headers
5. **CSRF Protection**: NextAuth.js built-in CSRF tokens, validate on mutations
6. **Session Management**: HTTP-only, Secure, SameSite=Lax cookies, 7-day idle timeout
7. **Password Policy**: Min 8 chars, complexity requirements, last 5 passwords checked
8. **MFA Enforcement**: Optional for all users (including Super Admins) in Phase 1
9. **Environment Variables**: All secrets in env vars, never commit to git

### Testing Strategy
1. **Test Coverage Targets**: 80% business logic, 100% utilities, 100% E2E critical paths, 100% API routes
2. **AAA Pattern**: Arrange, Act, Assert structure for readability and maintainability
3. **Test Data Isolation**: Fixtures for test stores/users/products, no shared state between tests
4. **POM Pattern**: Page Object Model for E2E tests to centralize selectors and actions
5. **Mock External Dependencies**: Database (in-memory SQLite), payment gateways (test mode), email (mock)
6. **Deterministic Tests**: No flaky tests, use fixtures instead of random data, mock time-dependent logic
7. **Cross-Browser Testing**: Chromium (primary), Firefox, WebKit, Mobile Safari, Mobile Chrome (BrowserStack)
8. **Visual Regression**: Percy snapshots on mobile (375px), tablet (768px), desktop (1280px)
9. **Accessibility Testing**: axe-core on all pages, manual screen reader testing quarterly
10. **Performance Testing**: k6 load testing (100 concurrent users/5min), Lighthouse CI budgets

### Code Quality Standards
1. **File Size Limits**: Max 300 lines/file, max 50 lines/function (ESLint enforced)
2. **Naming Conventions**: camelCase (vars/functions), PascalCase (components/types), UPPER_SNAKE_CASE (constants)
3. **TypeScript Strict Mode**: No `any` types except documented exceptions, explicit return types
4. **File Organization**: Group by feature, co-locate related files, barrel exports (`index.ts`)
5. **Component Structure**: Server Component default, Client Component only when needed (`'use client'`)
6. **Error Handling**: User-friendly messages, error codes for support, structured API errors
7. **Documentation**: JSDoc for complex functions, inline comments for complex logic only
8. **Git Workflow**: Feature branches, Conventional Commits, squash merge to main

## Integration Patterns

### Payment Gateway Integration
- **Strategy Pattern**: Abstract `PaymentProvider` interface with adapter per gateway (Stripe, SSLCommerz)
- **Configuration**: Per-store credentials in `paymentGateways` JSONB field (encrypted)
- **Webhook Handling**: Single endpoint `/api/webhooks/payment?gateway=stripe` with signature verification
- **Idempotency**: Use payment intent ID + order ID as key, 24-hour TTL in Redis
- **Retry Logic**: 3 attempts with exponential backoff, dead-letter queue for permanent failures
- **Testing**: Mock payment provider in tests, sandbox mode for development

### External Platform Sync (WooCommerce/Shopify)
- **Strategy Pattern**: Abstract `SyncProvider` interface with adapter per platform
- **Bidirectional Webhooks**: Inbound (external → StormCom) and outbound (StormCom → external)
- **Conflict Resolution**: Last-write-wins (timestamp), manual queue, or priority rules (configurable)
- **Retry Logic**: Exponential backoff (max 5 attempts), dead-letter queue (30-day retention)
- **Sync Dashboard**: Real-time status, last sync timestamp, failed items with error details
- **Bulk Import/Export**: Initial onboarding for large catalogs (1000+ products), progress tracking

### Email Notification System
- **Email Service**: Resend for transactional emails (order confirmations, password reset, shipping notifications)
- **Queue System**: Background job queue for email sending, retry on failure (3 attempts, exponential backoff)
- **Template Engine**: Handlebars syntax `{{variableName}}`, fallback values for missing data
- **Template Management**: Admin UI for customizing email templates per notification type
- **Preview/Test**: Send test emails to admin address before publishing template
- **Bounce Handling**: Track bounced emails, mark customer email as invalid after 3 bounces

## Migration Strategies

### From Existing E-commerce Platform
1. **Data Export**: Export products, orders, customers from existing platform (CSV/API)
2. **Data Mapping**: Map external IDs to StormCom IDs, handle category/attribute mismatches
3. **Bulk Import**: Use bulk import API with validation, error reporting, resume on failure
4. **Image Migration**: Download product images, upload to Vercel Blob, update references
5. **Customer Migration**: Import customers, send password reset links (cannot migrate passwords)
6. **Order History**: Import historical orders (read-only), mark as "imported from [platform]"
7. **Inventory Sync**: Initial inventory import, enable ongoing sync if external platform still active
8. **DNS Cutover**: Point domain to StormCom after data verification, redirect old URLs

### Database Migrations
1. **Schema Changes**: Modify `prisma/schema.prisma`, run `prisma migrate dev` (local), `prisma migrate deploy` (production)
2. **Pre-Migration Backup**: Automated backup before production migration, 30-day retention
3. **Breaking Changes**: Two-phase deployment (add new schema, deprecate old, dual-write, remove old after 2 weeks)
4. **Data Migrations**: Custom scripts in `prisma/migrations/` for data transformations
5. **Rollback Procedure**: Documented in `docs/database/rollback-procedure.md`, restore from pre-migration backup
6. **Staging Testing**: Test all migrations on staging (production database copy) before production

## Risk Mitigation

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| **Database connection pool exhaustion** | High | Monitor at 70% capacity, alert admins, suggest pool size increase, graceful degradation |
| **Payment gateway timeout** | High | 30s timeout, 3 retries, fallback to alternative payment method, user-friendly error |
| **External platform sync failure** | Medium | Retry queue with exponential backoff, dead-letter queue (30-day retention), manual retry UI |
| **Rate limit exceeded** | Medium | Tiered limits by plan, alert at 80% usage, upgrade CTA, burst allowance (2× for 10s) |
| **Session store (Vercel KV) unavailable** | High | Fallback to in-memory session validation (slower), alert admins, graceful degradation |
| **Search performance degradation (>10K products)** | Medium | PostgreSQL FTS up to 10K, auto-migrate to Algolia above 10K (Phase 2) |

### Security Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| **Cross-tenant data leakage** | Critical | Prisma middleware auto-inject `storeId`, automated E2E tests for tenant isolation |
| **SQL injection** | High | Prisma parameterized queries only, no raw SQL allowed (constitution enforced) |
| **XSS attacks** | High | React automatic escaping, DOMPurify for user HTML, Content Security Policy headers |
| **CSRF attacks** | Medium | NextAuth.js CSRF tokens, validate on all mutations, SameSite=Lax cookies |
| **Account takeover** | High | MFA optional (Phase 1), account lockout (5 attempts/15min), bcrypt cost 12, audit logs |
| **Session hijacking** | Medium | HTTP-only cookies, session ID in JWT, user agent validation, invalidate on password change |

### Operational Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| **Vercel platform downtime** | High | 99.9% SLA guarantee, multi-region deployment, automated health checks, status page |
| **Database backup failure** | Critical | Automated daily backups, 90-day retention, weekly backup restore tests, monitoring |
| **Email delivery failure** | Medium | Retry queue (3 attempts), track bounce rate, alert at >5%, fallback to backup email service |
| **CDN cache poisoning** | Medium | Signed URLs for cache invalidation, versioned assets, short TTL for dynamic content |
| **Runaway costs** | Medium | Usage alerts at 80% of monthly quota, plan limit enforcement, cost monitoring dashboard |

## Phase 2 Enhancements

### High Priority (P1)
1. **bKash Payment Gateway** (Bangladesh market demand)
2. **Algolia Search Integration** (for stores >10K products)
3. **Multi-Language Support** (16 languages, RTL for Arabic/Hebrew)
4. **Carrier API Integrations** (FedEx, UPS, USPS, DHL for real-time shipping quotes)
5. **Tax Calculation Services** (Avalara, TaxJar for automated tax determination)

### Medium Priority (P2)
1. **POS Offline Mode** (local storage + sync-back when online)
2. **Custom Report Builder** (drag-and-drop dimensions, metrics, filters)
3. **Customer Segmentation Engine** (behavioral triggers, personalized campaigns)
4. **Advanced Analytics** (predictive sales forecasting, inventory recommendations, churn prediction)

### Low Priority (P3)
1. **Product Comparison Feature** (compare up to 4 products side-by-side)
2. **Digital Products Support** (downloadable files, license key management)
3. **GraphQL API** (alongside REST API for mobile app development)
4. **White-Label SaaS** (allow resellers to rebrand platform)

## Conclusion

All technical decisions have been made with clear rationale and alternatives considered. The chosen stack (Next.js 16 + React 19 + TypeScript 5.9.3 + Prisma + PostgreSQL + NextAuth.js + Tailwind CSS + Vitest + Playwright) aligns with the constitution requirements and provides a solid foundation for building a scalable, secure, performant multi-tenant e-commerce platform.

Next steps:
1. ✅ **Phase 0 Complete**: Research.md generated with all technical decisions documented
2. 🔄 **Phase 1 In Progress**: Generate data-model.md, contracts/openapi.yaml, quickstart.md
3. ⏳ **Phase 2 Pending**: Task breakdown in tasks.md (run `/speckit.tasks` command after Phase 1)

**Research Status**: ✅ COMPLETE - All NEEDS CLARIFICATION items resolved, ready for Phase 1 Design & Contracts.
