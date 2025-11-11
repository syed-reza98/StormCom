---
title: Libraries (lib) Review
sourcePath: src/lib
category: lib
riskLevel: medium
---

# Libraries Review

Key modules (selection):
- auth.ts, auth-helpers.ts, get-current-user.ts, get-session.ts
- prisma.ts, prisma-middleware.ts, db.ts
- validation.ts, sanitize.ts, rate-limit.ts, simple-rate-limit.ts, csrf.ts
- encryption.ts, password.ts, mfa.ts
- analytics-utils.ts, performance-utils.ts, format.ts, utils.ts, date-utils.ts, image-optimization.ts, theme-utils.ts
- logger.ts, audit.ts, audit-middleware.ts
- email.ts, stripe-subscription.ts, storage.ts, session-storage.ts, webhook-idempotency.ts

Review themes:
- Next.js 16: cookies/headers/draftMode must be awaited when used within server contexts.
- Prisma middleware for multi-tenancy: ensure it injects storeId appropriately and avoids bypasses (Super Admin exceptions documented and guarded).
- Validation & sanitation: centralize Zod schemas; sanitize external inputs; enforce CSRF where appropriate.
- Rate limiting: Upstash/Redis or simple in-memory fallback for dev; ensure per-IP and per-session scoping; return 429 with headers.
- Crypto: Use modern algorithms and rotate secrets; avoid exposing encryption keys in code; leverage env variables.
- Logging: Use structured logs; scrub PII; ensure correlation IDs for request tracing.
- Performance: Memoize expensive pure utilities; prefer incremental computation; avoid large bundle impact by keeping client-only utils separate.

Actionable checks:
- Verify prisma-middleware enforces deletedAt null filters for tenant-scoped tables.
- Ensure error-handler normalizes errors to the standard API shape.
- Confirm theme/image utilities leverage Next.js Image optimizations and respect cache TTLs.
