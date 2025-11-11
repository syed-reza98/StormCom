# StormCom Next.js Codebase Review — 2025-01-29

## Step 0 – Scope & Method
- Reviewed the entire `src/` tree, `specs/001-multi-tenant-ecommerce` documents, and critical configuration at the repository root.
- Focused on authentication/session flows, API contracts, dashboard UI, and UX alignment with the multi-tenant SaaS requirements described in the feature specification. 【F:specs/001-multi-tenant-ecommerce/spec.md†L134-L207】

## Step 1 – Platform & Specification Alignment
1. **Session handling deviates from the spec’s durable-session requirement.** The spec mandates HttpOnly cookies with a consistent name; however the storage layer is hard-coded to `session-id` while the login route issues `sessionId`, preventing any server components from recovering the session cookie. 【F:specs/001-multi-tenant-ecommerce/spec.md†L136-L138】【F:src/lib/session-storage.ts†L29-L105】【F:src/app/api/auth/login/route.ts†L58-L75】
   - *Improve by* aligning all cookie reads/writes with `SESSION_CONFIG.cookieName` and rotating IDs on login/logout so authenticated RSCs work as expected.
2. **Next.js 16 patterns are partially adopted.** Several server components type `searchParams` as `Promise<…>` and call `await` on it, which no longer matches the stable App Router signature and complicates migration to streaming caching. 【F:src/app/(dashboard)/products/page.tsx†L31-L101】【F:src/app/(dashboard)/analytics/page.tsx†L26-L126】
   - *Improve by* destructuring `searchParams` directly and relying on `useSearchParams` or URL builders for client components.

## Step 2 – Authentication & Security Flow
1. **Validation payloads use a non-standard `changes` field.** Multiple auth endpoints return `error.changes` rather than the documented `error.details`, so the client never receives field-level errors. 【F:src/app/api/auth/login/route.ts†L34-L44】【F:src/app/api/auth/forgot-password/route.ts†L31-L41】【F:src/app/api/auth/mfa/verify/route.ts†L64-L74】
   - *Improve by* renaming `changes` to `details` (or better yet, returning a consistent `Record<string, string[]>`) and updating tests.
2. **MFA path never yields a durable session.** The login service returns an empty `sessionId` when MFA is required, and the verify endpoint simply replies with `{ mfaVerified: true }` without minting a session cookie. Users who pass MFA are still unauthenticated. 【F:src/services/auth-service.ts†L217-L259】【F:src/app/api/auth/mfa/verify/route.ts†L98-L111】
   - *Improve by* creating a pending-session token during password verification and issuing/rotating the real session cookie inside the MFA verification handler.
3. **Super-admin redirect points to a missing dashboard.** After password login the client checks for `role === 'SuperAdmin'` and pushes `/admin/dashboard`, which isn’t implemented. 【F:src/app/(auth)/login/page.tsx†L99-L108】
   - *Improve by* either adding an admin route or redirecting all authenticated users to an existing page (e.g., `/dashboard`).

## Step 3 – Products API & Dashboard Contract
1. **Dashboard fetches cannot satisfy the API contract.** `GET /api/products` requires an `x-store-id` header and responds with `{ data: { products, total, … } }`, but the table component fetches without headers and expects `data.data` to be an array with a separate `meta`, leaving the UI empty. 【F:src/app/api/products/route.ts†L11-L107】【F:src/components/products/products-table.tsx†L53-L99】
   - *Improve by* sourcing the active store from session/context, attaching it as a header, and unpacking the nested response shape.
2. **Client-side pagination triggers an infinite loop.** The `useEffect` that loads products depends on `pagination`, yet the effect also mutates `pagination`, causing repeated re-renders and redundant API calls. 【F:src/components/products/products-table.tsx†L53-L99】
   - *Improve by* removing `pagination` from the dependency list and updating state via functional setters.
3. **Primary CTAs land on 404 routes.** The products page links to `/dashboard/products/new` and `/dashboard/products/import`, but the route group only exposes the index and detail views, so those paths 404; filters also reset to `/dashboard/products`. 【F:src/app/(dashboard)/products/page.tsx†L67-L101】【F:src/app/(dashboard)/products/[id]/page.tsx†L1-L40】【F:src/components/products/products-filters.tsx†L94-L127】
   - *Improve by* creating the missing routes or pointing to existing flows (e.g., `/bulk-import` or `/products/create`).

## Step 4 – Dashboard UX & Navigation
1. **Analytics guard redirects to the wrong login route.** Server-side analytics pages redirect unauthenticated users to `/auth/signin`, but the only login screen lives at `/login`, causing a permanent loop. 【F:src/app/(dashboard)/analytics/page.tsx†L93-L126】【F:src/app/(auth)/login/page.tsx†L49-L148】
   - *Improve by* reusing the same auth middleware or redirect target as the rest of the app.
2. **Filters and table empty states still reference legacy URLs.** Empty states and “clear filters” actions use `/dashboard/products`, which doesn’t exist because the `(dashboard)` route group is hidden from the URL. 【F:src/components/products/products-table.tsx†L186-L199】【F:src/components/products/products-filters.tsx†L94-L127】
   - *Improve by* updating to `/products` so users reach the correct list.

## Step 5 – Legal & Compliance Touchpoints
1. **Registration references non-existent policy pages.** The sign-up form links to `/terms` and `/privacy`, but no such routes exist today, leaving compliance requirements unmet. 【F:src/app/(auth)/register/page.tsx†L295-L309】
   - *Improve by* adding the legal pages under `src/app` or updating the links to point at real documents.

## Step 6 – Additional UX & Observability Notes
- The specification calls for Storybook coverage and monitoring hooks for every dashboard component, but the current repo lacks those guardrails (no Storybook stories alongside the Radix-based components). 【F:specs/001-multi-tenant-ecommerce/spec.md†L168-L205】
- Landing page CTAs such as “Read Documentation” still have no `href`, creating dead ends for first-time users (observed in `src/app/page.tsx`). 【F:src/app/page.tsx†L64-L87】

---
**Next Actions:** Prioritize session-cookie alignment and MFA session issuance (P0 blockers), then address the products dashboard contract so tenants can manage inventory without API errors. Follow with redirect fixes and legal page scaffolding to improve UX completeness.
