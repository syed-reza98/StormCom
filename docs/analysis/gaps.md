Awesome—here’s a **single, ready-to-apply patch set** that aligns your Spec Kit files to consistent, security-first policies and your Master SRS.

## The policies I enforced (brief)

* **TLS:** enforce **TLS 1.3 only**.
* **HSTS & security headers:** add HSTS (2 years, include subdomains, preload) + CSP (nonce-based, `frame-ancestors 'none'` for dashboard), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
* **CSRF:** require anti-CSRF tokens on all state-changing browser requests; cookies `HttpOnly + Secure + SameSite=Lax`.
* **Sessions:** **30-minute idle** + **12-hour absolute** timeouts with rotation on privilege change (maps to OWASP ASVS session management).
* **MFA:** **Required for Admins & Super Admins**; optional for others. **No backup codes** anywhere.
* **Privacy & compliance:** DSAR (access/erasure/portability) endpoints & workflows, retention jobs, PCI SAQ-A scoped payments (no CHD on your systems).
* **Audit, incident, & ops:** expand **AuditLog** coverage (NIST 800-53 AU family), add incident response runbook & IP reputation controls, backups + restore drills.

---

## How to apply

```bash
# from the repo root
git checkout -b align/spec-kit-to-srs
git apply patchset_unified.diff
# review, run tests, then commit
git add .
git commit -m "Align Spec Kit to SRS: TLS1.3, CSRF, headers, sessions, MFA, DSAR, audit, ops"
```

**Download the full bundle** (contains all diffs below):
[patchset_unified.diff](sandbox:/mnt/data/patchset_unified.diff)

Or grab individual patches:

* [spec.md.patch](sandbox:/mnt/data/spec.md.patch)
* [plan.md.patch](sandbox:/mnt/data/plan.md.patch)
* [tasks.md.patch](sandbox:/mnt/data/tasks.md.patch)
* [data-model.md.patch](sandbox:/mnt/data/data-model.md.patch)
* (Optional) [Ecommerce_Master_SRS.md.patch](sandbox:/mnt/data/Ecommerce_Master_SRS.md.patch)

---

## spec.md — unified diff

```diff
--- a/spec.md
+++ b/spec.md
@@ -21,8 +21,8 @@
 
 - Q: How should the Role/Permission system be modeled in the da...efined roles with fixed permissions (no custom roles in Phase 1)
 - Q: How should user sessions be stored to support fast invalid...ction for <10ms lookups and immediate invalidation; in-memory Ma
@@
- - Q: How should MFA backup codes be stored to balance securit...henticator app only (TOTP required for MFA-enabled accounts).
- - Q: Should Super Admins be required to use MFA, or should it... consistency but may reduce security for privileged accounts.
+ - Q: How should MFA be handled?
+   A: TOTP authenticator app only. **No backup codes** are issued or stored. **MFA is required for Admin and Super Admin**; optional for other roles.
@@
- - **Session Management**: JWT tokens with 30-day absolute exp.... Session ID embedded in JWT; validated on every API request.
+ - **Session Management**: 30-minute idle timeout and 12-hour absolute timeout; rotate on privilege change; single-sign-out. Cookies are HttpOnly, Secure, SameSite=Lax.
@@
-### Transport Security
-Require TLS 1.2+ across all endpoints.
+### Transport Security
+Require **TLS 1.3** across all endpoints.
@@
-### Authentication and MFA
-Super Admin MFA is optional to avoid lockouts.
+### Authentication and MFA
+**MFA is required for Admin and Super Admin.** No backup codes are provided or stored.
+
+### CSRF (Cross-Site Request Forgery)
+All state-changing requests **MUST** include a CSRF token bound to the user session. Idempotent GET/HEAD are exempt.
+
+### Security Headers
+Set HSTS, CSP (nonce-based, `frame-ancestors 'none'` for dashboard), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`; optionally `X-Frame-Options: DENY` for legacy.
```

## plan.md — unified diff

```diff
--- a/plan.md
+++ b/plan.md
@@ -14,9 +14,9 @@
-**Authentication**: NextAuth.js v5 with JWT sessions, bcrypt ... MFA is optional for all users, including Super Admins, for consistency.
+**Authentication**: NextAuth.js v5 with JWT sessions, bcrypt ... **MFA is required for Admin and Super Admin**; optional for other roles.
@@
-**Session Management**: JWT + server-side session store. Session...ding window), stored in HTTP-only, Secure, SameSite=Lax cookies.
+**Session Management**: 30-minute idle timeout + 12-hour absolute; rotate on privilege change; revoke on logout. Cookies: HttpOnly, Secure, SameSite=Lax; **per-request CSRF token** on POST/PUT/PATCH/DELETE.
@@
+### CSRF Protection (NEW)
+- All state-changing requests from browsers require a double-submit anti-CSRF token and SameSite=Lax cookies.
+- Exempt idempotent GET/HEAD; enforce token on POST/PUT/PATCH/DELETE.
+- Provide CSRF token via secure cookie + meta tag; include nonce binding for forms.
+
+### Security Headers (NEW)
+Set the following headers at the edge (middleware):
+- Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
+- Content-Security-Policy: nonce-based strict CSP with `frame-ancestors 'none'` for dashboard
+- X-Content-Type-Options: nosniff
+- Referrer-Policy: strict-origin-when-cross-origin
+- (Legacy) X-Frame-Options: DENY
+
+### Incident Response & IP Reputation (NEW)
+- Implement anomaly detection and IP reputation checks on auth-critical routes.
+- Create an on-call runbook with triage, comms templates, evidence preservation, and postmortem steps.
+
+### Backups & Restore Drills (NEW)
+- Nightly database snapshots (retain 30 days) and weekly restore drills.
+- Weekly object storage backup verification.
+- RPO: 24h, RTO: 4h for production.
```

## tasks.md — unified diff

```diff
--- a/tasks.md
+++ b/tasks.md
@@ -292,7 +292,7 @@
- - Enforce password policy; MFA flow (TOTP only, no backup cod... failed attempts; audit capture; Super Admin MFA is optional.
+ - Enforce password policy; MFA flow (TOTP only, no backup codes); lockouts after failed attempts; audit capture; **Super Admin MFA is required.**
@@
+## New Security Hardening Tasks (NEW)
+
+- [ ] T190 [SEC] Implement CSRF middleware (double-submit token) and add e2e tests for all POST/PUT/PATCH/DELETE routes.
+- [ ] T191 [SEC] Set security headers at edge (HSTS, CSP with nonce, X-Content-Type-Options, Referrer-Policy, X-Frame-Options) and add automated checks.
+- [ ] T192 [SEC] Add login-specific rate limiting and account lockout (progressive backoff) with unit tests.
+- [ ] T193 [SEC] Expand AuditLog coverage to include auth events, role changes, sensitive configuration changes; verify immutability.
+- [ ] T194 [PRIV] Implement DSAR endpoints: export (portable format), erasure, and verification workflow; admin UI to track requests.
+- [ ] T195 [PRIV] PII retention jobs per data category; configurable retention policies; deletion logs with AuditLog references.
+- [ ] T196 [OPS] Incident response runbook; on-call rotation; tabletop exercise task.
+- [ ] T197 [OPS] Integrate IP reputation/threat intel checks on auth routes; instrument anomaly detection metrics.
+- [ ] T198 [OPS] Nightly DB snapshots (retain 30d) + weekly restore drills; blob backup verification; document RPO/RTO in runbook.
+- [ ] T199 [ANALYTICS] Normalize analytics endpoints (`/analytics/track`), implement OpenAPI spec, and add tests & auth.
```

## data-model.md — unified diff

````diff
--- a/data-model.md
+++ b/data-model.md
@@ -268,10 +268,9 @@
   // MFA settings
   mfaEnabled    Boolean  @default(false)
   mfaSecret     String?  // TOTP secret (encrypted)
-  mfaBackupCodes String? // Comma-separated (encrypted)
 
@@
+### 41. DSARRequest
+
+Data Subject Access Request / Erasure workflow records.
+
+```prisma
+model DSARRequest {
+  id          String   @id @default(cuid())
+  createdAt   DateTime @default(now())
+  updatedAt   DateTime @updatedAt
+
+  storeId     String
+  store       Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
+
+  userId      String?
+  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
+
+  type        DSARType
+  status      DSARStatus @default(PENDING)
+
+  requestedByEmail String
+  processedAt DateTime?
+  notes       String?
+
+  @@index([storeId])
+  @@index([type, status])
+}
+
+enum DSARType { ACCESS; ERASURE; PORTABILITY }
+enum DSARStatus { PENDING; IN_PROGRESS; COMPLETED; REJECTED }
+```
````

## (Optional) Ecommerce_Master_SRS.md — unified diff

```diff
--- a/Ecommerce_Master_SRS.md
+++ b/Ecommerce_Master_SRS.md
@@
-Require TLS 1.2+ across all endpoints.
+Require **TLS 1.3** across all endpoints.
@@
-30-minute idle session timeout
+30-minute idle session timeout (**absolute 12 hours**)
```

---

## Why these changes (primary sources)

* **Session management** (idle + absolute timeouts, rotation): OWASP ASVS Session Management.
* **CSRF tokens** for browser state changes: OWASP CSRF Prevention Cheat Sheet.
* **TLS 1.3** as current standard: RFC 8446.
* **HSTS & headers**: RFC 6797 HSTS; OWASP Security Headers; Next.js header configuration.
* **CSP** (nonce/strict, `frame-ancestors`): OWASP CSP Cheat Sheet.
* **GDPR DSAR** (access, erasure, portability): GDPR Articles 15, 17, 20.
* **PCI SAQ-A** scope (no CHD stored/processed/transmitted on your systems): PCI SSC FAQ + SAQ guidance.
* **Audit logging scope**: NIST SP 800-53 AU-2.

If you want, I can **apply these patches** to your repo structure (or split into PRs per file), and add **Next.js middleware** snippets to set headers/CSP with nonces out-of-the-box.
