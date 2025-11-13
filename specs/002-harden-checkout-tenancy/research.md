# Research and Decisions — Harden Checkout, Tenancy, Newsletter

Date: 2025-11-13  
Branch: 002-harden-checkout-tenancy

## Decisions

### 1) Newsletter opt-in model
- Decision: Single opt‑in with audit trail
- Rationale: Minimizes friction; acceptable compliance posture with clear consent + record; enables faster list growth.
- Alternatives considered:
  - Double opt‑in: Higher list quality/compliance; slower activation; more plumbing.
  - Hybrid by locale: Optimized compliance; higher complexity and configuration overhead.

### 2) Canonical domain policy for multi-tenancy
- Decision: Redirect subdomain → custom domain (canonical)
- Rationale: Stronger brand/SEO, consistent canonical URLs, simpler content strategy.
- Alternatives considered:
  - Custom → subdomain: Easier infra; weakens brand presence.
  - Serve both; set <link rel="canonical">: Simpler but risks SEO dilution.

### 3) Large CSV export delivery channel
- Decision: Deliver via both email and in‑app notification
- Rationale: Best UX; ensures delivery even if one channel is missed; aligns with operational workflows.
- Alternatives considered:
  - Email only: Simpler; no in‑app visibility.
  - In‑app only: Keeps users in product; depends on active session.

### 4) Payment intent validation timing
- Decision: Validate payment intent/token before creating order; proceed only on success
- Rationale: Prevents orphaned orders and partial writes; reduces reconciliation.
- Alternatives considered:
  - Validate after order creation: Risk of orphan/rollback complexity.
  - Authorize-only, capture later: Adds state complexity; acceptable later if needed.

### 5) Transaction boundary for checkout
- Decision: Single atomic transaction including order, items, inventory decrement, discount usage mark, and payment record
- Rationale: Guarantees consistency; simplifies failure handling.
- Alternatives considered:
  - Multi-step with compensating actions: Higher complexity; eventual consistency risk under failure.

### 6) Cache tag strategy
- Decision: Use entity and list tags with explicit invalidation
  - product:<id>, products:list:store:<storeId>
  - category:<id>, categories:list:store:<storeId>
  - page:<id>, pages:list:store:<storeId>
  - analytics:<scope>, settings:store:<storeId>
  - Invalidate on create/update/delete with revalidateTag(tag, "max")
- Alternatives considered:
  - Time-based revalidation only: Simpler but stale risk and wider cache churn.

### 7) Error handling strategy
- Decision: Typed error class hierarchy mapped to standardized `{ error: { code, message, details? } }`
- Rationale: Predictable error contracts; testable mapping; eliminates string matching.
- Alternatives considered:
  - Ad hoc strings or thrown literals: Brittle, untyped.

### 8) Multi-tenant Prisma middleware
- Decision: Auto-inject storeId for tenant-scoped models; audit for gaps and add soft deletes where missing
- Rationale: Defense-in-depth against cross-tenant access.
- Alternatives considered:
  - Explicit where clauses only: Prone to omissions.

### 9) Schema alignment and migrations
- Decision: Convert CSV string fields to string[] where semantically plural; add `deletedAt` fields; enforce unique constraints e.g., `@@unique([storeId, email])`
- Rationale: Consistency, data integrity, soft deletes for compliance.
- Alternatives considered:
  - Retain CSV strings: Parsing complexity; data consistency risks.

### 10) API middleware pipeline
- Decision: Proxy + route middleware for auth, rate limit (100 rpm/IP baseline), request validation (Zod), structured logging and X-Request-Id header propagation
- Rationale: Uniform enforcement; eliminates per-route drift.
- Alternatives considered:
  - Ad hoc per-route checks: Inconsistent, error-prone.

### 11) Server Actions for forms
- Decision: Use Server Actions for newsletter and admin form mutations; REST endpoints for public APIs and integrations
- Rationale: Security and DX; aligns with Next.js 16 guidance.
- Alternatives considered:
  - API-only mutations: More client plumbing; weaker UX.

### 12) Cache Components adoption plan
- Decision: Start disabled; document phased enablement for stable fetches and heavy aggregations.
- Rationale: Reduce risk; adopt once tests pass and error budget is low.
- Alternatives considered:
  - Immediate enablement: Higher short-term risk.

## References
- Next.js 16 App Router patterns (Server Actions, caching, revalidateTag)
- StormCom Constitution (testing, performance, accessibility, shadcn/ui)
- Spec: specs/002-harden-checkout-tenancy/spec.md
