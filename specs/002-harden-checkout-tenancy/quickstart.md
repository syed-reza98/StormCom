# Quickstart — Harden Checkout, Tenancy, Newsletter

Date: 2025-11-13  
Branch: 002-harden-checkout-tenancy

## Prerequisites
- Node.js ≥ 20.0.0, npm ≥ 10.0.0
- Run `npm install`
- Configure `.env` from `.env.example` (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)

## Database
- Dev (SQLite):
  - `npm run db:push` (or `npx prisma db push`)
  - Optional: `npm run db:seed`
- Prod (PostgreSQL):
  - `npm run db:migrate`

## Development
- Start dev server:
  - `npm run dev`
- Type check:
  - `npm run type-check`
- Lint:
  - `npx eslint .`

## Testing
- Unit/Integration:
  - `npx vitest run`
- E2E (Playwright):
  - `npx playwright install` (first time)
  - `npx playwright test`

## What to Verify (This Feature)
- Checkout: authentication required, server-side price recalculation, payment validation, atomic transaction.
- Multi-tenancy: domain/subdomain → storeId, subdomain → custom domain redirect, no hardcoded storeId.
- Newsletter: single opt-in, consent record, rate limiting, deduplication (email+store).
- API responses: standardized error shape, X-Request-Id header.
- Caching: tag invalidation on product/category/page changes.
- CSV export: ≤10k streamed; >10k async job with email + in-app notification.
- Accessibility: WCAG 2.1 AA on forms and analytics (<figure>/<figcaption>, aria-live).
