---
title: App Router Review
sourcePath: src/app
category: app
riskLevel: medium
---

# App Router Review

Overview:
- Next.js 16 App Router with route groups `(auth)`, `(dashboard)`, and storefront under `shop/`.
- Global files: `layout.tsx`, `page.tsx`, `error.tsx`, `loading.tsx`, `not-found.tsx`, `globals.css` present.
- API routes: Extensive coverage under `src/app/api/*` (products, categories, brands, checkout, analytics, auth/MFA, inventory, webhooks, integrations, GDPR, notifications, stores, subscriptions, docs, csrf, dev helpers).

Global Layout (src/app/layout.tsx):
- Uses Inter font, includes Vercel Analytics and Speed Insights.
- Wraps app with `SessionProvider` (client) and `ThemeProvider` (client) inside body—OK for server layout composing client providers.
- Recommendation: Verify providers are minimal in client surface and avoid heavy client dependencies at root; ensure no client-only code leaks into other server components.

Route Groups:
- (auth): login, register, forgot-password, reset-password, mfa/enroll, mfa/challenge.
  - Expectations: Client forms with server actions or API calls, Zod validation, no SSR-disabled dynamic in server components.
- (dashboard): dashboard, products (list, [id], loading/error states), orders (list, [id]), categories, brands, attributes, inventory, marketing, analytics, integrations, settings (theme, privacy), stores (list, [id], new), subscription (plans, billing).
  - Expectations: Server Components for data display; interactive tables/forms via client components. All tenant queries filtered by session.storeId; respect soft delete; use loading.tsx skeletons.
- Storefront (shop): home, products (list, [slug]), categories ([slug]), cart, checkout, orders, profile, search, wishlists.
  - Expectations: Predominantly Server Components with client components for cart/checkout interactions; caching strategy for catalog pages (consider cache tags and cacheLife profiles).

API Routes (high-level checks to apply per file):
- Must use Next.js 16 patterns: `const { id } = await params;` and async `cookies()/headers()` if used.
- Validate inputs with Zod and return standard { data | error } response shape.
- Enforce auth (NextAuth session) and tenant isolation (storeId) where applicable.
- Apply rate limiting to sensitive endpoints; add audit logs for admin mutations.

File inventory captured (partial listing; see route-list.md for full):
- Global: page.tsx, layout.tsx, error.tsx, loading.tsx, not-found.tsx, globals.css
- Storefront pages: shop/page.tsx, shop/products/page.tsx, shop/products/[slug]/page.tsx, shop/categories/[slug]/page.tsx, shop/cart/page.tsx, shop/checkout/page.tsx, shop/orders/[id]/confirmation/page.tsx, shop/orders/page.tsx, shop/profile/page.tsx, shop/search/page.tsx, shop/wishlists/page.tsx
- (auth): (auth)/login/page.tsx, register/page.tsx, forgot-password/page.tsx, reset-password/page.tsx, mfa/enroll/page.tsx, mfa/challenge/page.tsx
- (dashboard): layout.tsx, dashboard/page.tsx, products/page.tsx, products/[id]/page.tsx, products/loading.tsx, products/error.tsx, orders/page.tsx, orders/[id]/page.tsx, orders/loading.tsx, orders/error.tsx, categories/page.tsx, brands/page.tsx, attributes/page.tsx, attributes/loading.tsx, inventory/page.tsx, inventory/loading.tsx, analytics/page.tsx, analytics/sales/page.tsx, analytics/customers/page.tsx, marketing/campaigns/page.tsx, marketing/coupons/page.tsx, settings/page.tsx, settings/theme/page.tsx, settings/privacy/page.tsx, settings/privacy/privacy-settings-client.tsx, stores/page.tsx, stores/new/page.tsx, stores/[id]/page.tsx, audit-logs/page.tsx, integrations/page.tsx, subscription/plans/page.tsx, subscription/billing/page.tsx
- API routes: see below sections by domain.

Recommendations (global):
- Ensure all pages import only what they need; heavy charts and editors should be client-only and dynamically imported inside client components, not server parents.
- Confirm Next.js 16 async param usage across dynamic routes ([slug]/[id]).
- Provide loading.tsx where lists or detail pages fetch data; prefer Suspense in composite pages.
- For storefront, consider cache strategies with cache tags for products, categories, brands; invalidate on admin mutations.

Appendix: API endpoints list (from inventory)
- products: /api/products, /api/products/[id], /api/products/export, /api/products/import, /api/products/[id]/stock, /api/products/[id]/stock/check, /api/products/[id]/stock/decrease
- categories: /api/categories, /api/categories/[id], /api/categories/[id]/move, /api/categories/reorder
- brands: /api/brands, /api/brands/[id], /api/brands/[id]/products
- attributes: /api/attributes, /api/attributes/[id], /api/attributes/[id]/products
- orders: /api/orders, /api/orders/[id], /api/orders/[id]/status, /api/orders/[id]/invoice
- checkout: /api/checkout/validate, /api/checkout/payment-intent, /api/checkout/complete, /api/checkout/shipping
- auth: /api/auth/login, /api/auth/logout, /api/auth/register, /api/auth/forgot-password, /api/auth/reset-password, /api/auth/[...nextauth], /api/auth/mfa/*, /api/auth/custom-session, /api/auth/test
- analytics: /api/analytics/dashboard, /api/analytics/sales, /api/analytics/customers, /api/analytics/products, /api/analytics/revenue
- inventory: /api/inventory, /api/inventory/adjust
- notifications: /api/notifications, /api/notifications/[id]/read
- stores: /api/stores, /api/stores/[id], /api/stores/[id]/admins, /api/stores/[id]/theme
- subscriptions: /api/subscriptions, /api/subscriptions/[storeId], /api/subscriptions/[storeId]/cancel, /api/themes
- webhooks: /api/webhooks/stripe, /api/webhooks/stripe/subscription
- integrations: /api/integrations/* (shopify/mailchimp connect/export/disconnect)
- emails: /api/emails/send
- docs: /api/docs
- csrf: /api/csrf-token
- dev: /api/dev/* (session-info, create-session, echo-cookies)
- GDPR: /api/gdpr/export, /api/gdpr/delete, /api/gdpr/consent
