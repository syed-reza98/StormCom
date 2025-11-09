# StormCom Code Review Index

Date: 2025-11-10
Branch: copilot/sub-pr-50

This index links to categorized review summaries generated for the Next.js 16 multi-tenant e‑commerce application. Each document contains per-file notes using a consistent rubric (architecture, Next.js 16 compliance, multi-tenancy, security, performance, accessibility, testing, size limits).

- Architecture Overview: ./architecture-overview.md
- Database Schema: ./database/prisma-schema.md
- App Router: ./app.md
- Components
  - Analytics: ./components/analytics.md
  - Attributes: ./components/attributes.md
  - Audit Logs: ./components/audit-logs.md
  - Auth: ./components/auth.md
  - Brands: ./components/brands.md
  - Bulk Import: ./components/bulk-import.md
  - Categories: ./components/categories.md
  - Checkout: ./components/checkout.md
  - GDPR: ./components/gdpr.md
  - Integrations: ./components/integrations.md
  - Layout: ./components/layout.md
  - Orders: ./components/orders.md
  - Products: ./components/products.md
  - Storefront: ./components/storefront.md
  - Stores: ./components/stores.md
  - Theme: ./components/theme.md
  - UI: ./components/ui.md
  - Root (theme-provider): ./components/root.md
- Libraries (lib): ./lib.md
- Services: ./services.md
- Hooks: ./hooks.md
- Contexts: ./contexts.md
- Providers: ./providers.md
- Emails: ./emails.md
- Types: ./types.md

Review Rubric (applies to every file):
- Next.js 16 compliance (async params/searchParams; cookies/headers/draftMode as async; Proxy usage)
- Server vs Client boundaries (no client-only APIs in server components; 'use client' where needed)
- Multi-tenancy (storeId filtering, soft delete awareness)
- Validation & security (Zod, auth checks, CSRF, rate limiting, secrets handling)
- Performance (select fields, Suspense/loading, caching, bundle size, N+1 avoidance)
- Accessibility (WCAG AA, ARIA, focus rings, contrast, keyboard support)
- Testing (unit/integration coverage hints, E2E critical paths)
- Size limits (file < 300 lines, function < 50 lines)
