# Authentication Audit Report - StormCom

**Generated**: 2025-01-29  
**Project**: StormCom Multi-tenant E-commerce Platform  
**Scope**: Authentication Implementation Analysis (NextAuth vs Custom Auth)  
**Status**: 🔴 CRITICAL - Hybrid authentication system detected

---

## Executive Summary

### 🚨 CRITICAL FINDING: Dual Authentication System Detected

**StormCom currently implements BOTH NextAuth.js AND a custom authentication system in parallel.** This creates:

1. **Security Vulnerabilities**: Multiple authentication paths increase attack surface
2. **Inconsistent User Experience**: Different login flows depending on which endpoint is used
3. **Maintenance Burden**: Two authentication systems to maintain, update, and secure
4. **Testing Complexity**: Need to test both authentication paths
5. **Migration Incompleteness**: Spec indicates migration to NextAuth is incomplete (Task T022 note: "legacy custom implementation maintained for backwards compatibility")

### Authentication Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────┐    ┌───────────────────────────┐    │
│  │   NextAuth.js v4.24    │    │   Custom Auth System      │    │
│  │   (JWT Strategy)       │    │   (Session Storage)       │    │
│  └────────────────────────┘    └───────────────────────────┘    │
│           │                              │                      │
│           │                              │                      │
│  ┌────────▼────────┐          ┌─────────▼───────────┐           │
│  │ NextAuth Routes │          │ Custom Auth Routes  │           │
│  │                 │          │                     │           │
│  │ [..nextauth]    │          │ /api/auth/login     │           │
│  │                 │          │ /api/auth/register  │           │
│  │                 │          │ /api/auth/logout    │           │
│  │                 │          │ /api/auth/custom-   │           │
│  │                 │          │   session           │           │
│  └─────────────────┘          └─────────────────────┘           │
│           │                              │                      │
│           └──────────────┬───────────────┘                      │
│                          │                                      │
│                    ┌─────▼─────┐                                │
│                    │  proxy.ts │                                │
│                    │ (withAuth)│                                │
│                    └───────────┘                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Authentication Systems Comparison

### 1.1 NextAuth.js Implementation

**Status**: ✅ FULLY CONFIGURED AND OPERATIONAL

**Files**:
- `src/lib/auth.ts` - NextAuth type extensions
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth handler (332 lines)
- `proxy.ts` - Uses `withAuth` wrapper for authentication
- `src/hooks/use-session.ts` - NextAuth client hooks
- `src/contexts/auth-provider.tsx` - Wrapper around NextAuth

**Features Implemented**:
- ✅ JWT strategy with HTTP-only cookies
- ✅ HS256 signing algorithm
- ✅ 30-day session expiration
- ✅ Email/password credentials provider
- ✅ Account lockout after 5 failed attempts (30-minute lockout)
- ✅ Email verification requirement
- ✅ MFA detection (requiresMFA flag)
- ✅ Password validation with bcrypt
- ✅ Failed login attempt tracking
- ✅ Audit logging for login/logout/failed attempts
- ✅ Custom session fields (id, role, storeId)
- ✅ Custom JWT fields (id, email, name, role, storeId, requiresMFA)
- ✅ Role-based redirect (admin routes)
- ✅ Custom error pages

**JWT Payload Structure**:
```typescript
{
  id: string;           // User ID
  email: string;        // User email
  name: string | null;  // User name
  role: string;         // User role (CUSTOMER, STAFF, STORE_ADMIN, SUPER_ADMIN)
  storeId: string | null; // Tenant store ID
  requiresMFA: boolean; // MFA required flag
  iat: number;         // Issued at timestamp
  exp: number;         // Expiration timestamp
}
```

**Security Features**:
- ✅ HTTP-only cookies (XSS protection)
- ✅ SameSite=Lax (CSRF protection)
- ✅ Secure flag (HTTPS only in production)
- ✅ NEXTAUTH_SECRET validation (throws error if missing)
- ✅ Password comparison with bcrypt
- ✅ Account lockout mechanism
- ✅ Email verification enforcement

**Integration Points**:
- ✅ `proxy.ts` uses `withAuth` HOC for protected routes
- ✅ Client components use `useSession` from next-auth/react
- ✅ Custom hooks wrap NextAuth: `useAuth()`, `useRole()`, `useStoreAccess()`
- ✅ `AuthProvider` wraps NextAuth session provider

---

### 1.2 Custom Authentication Implementation

**Status**: 🔴 FULLY FUNCTIONAL PARALLEL SYSTEM (REDUNDANT)

**Files**:
- `src/services/auth-service.ts` - Custom auth functions (367 lines)
- `src/services/session-service.ts` - Custom session management (281 lines)
- `src/lib/session-storage.ts` - Session store (Vercel KV / in-memory Map) (285 lines)
- `src/app/api/auth/login/route.ts` - Custom login endpoint (109 lines)
- `src/app/api/auth/register/route.ts` - Custom register endpoint (85 lines)
- `src/app/api/auth/logout/route.ts` - Custom logout endpoint (66 lines)
- `src/app/api/auth/custom-session/route.ts` - Custom session validation (63 lines)

**Features Implemented**:
- ✅ Email/password registration with bcrypt (cost 12)
- ✅ Email verification token generation (24-hour expiration)
- ✅ Login with account lockout (5 failed attempts, 30-minute lockout)
- ✅ Session creation with sessionId (32-byte hex)
- ✅ Session storage (Vercel KV in production, in-memory Map in dev)
- ✅ Session validation with expiration check (12-hour max age)
- ✅ Session refresh on activity (7-day idle timeout)
- ✅ Password reset with token (1-hour expiration, single-use)
- ✅ Password history tracking (last 5 passwords)
- ✅ Logout with session deletion
- ✅ Logout all sessions for user
- ✅ Audit logging for all auth events
- ✅ HTTP-only cookie for sessionId
- ✅ Email notifications (verification, password reset, lockout)

**Session Data Structure**:
```typescript
{
  userId: string;
  email: string;
  role: string;
  storeId: string | null;
  createdAt: number;
  lastAccessedAt: number;
  expiresAt: number;
  mfaVerified?: boolean;
}
```

**Security Features**:
- ✅ bcrypt password hashing (cost factor 12)
- ✅ HTTP-only sessionId cookie
- ✅ Secure flag (HTTPS only in production)
- ✅ SameSite=Lax
- ✅ Account lockout (5 attempts, 30 minutes)
- ✅ Password reset token expiration (1 hour)
- ✅ Email verification token expiration (24 hours)
- ✅ Password history (last 5 passwords)
- ✅ Single-use reset tokens
- ✅ Session expiration (12 hours absolute, 7 days idle)

**Custom API Endpoints**:
```
POST /api/auth/register       - User registration (custom)
POST /api/auth/login          - User login (custom)
POST /api/auth/logout         - User logout (custom)
GET  /api/auth/custom-session - Session validation (custom)
POST /api/auth/forgot-password - Password reset request (custom)
POST /api/auth/reset-password  - Password reset completion (custom)
```

---

## 2. Detailed Comparison Matrix

| Feature | NextAuth.js | Custom Auth | Status |
|---------|-------------|-------------|--------|
| **Registration** | ❌ Not implemented | ✅ `/api/auth/register` | 🔴 DUPLICATE |
| **Login** | ✅ Credentials provider | ✅ `/api/auth/login` | 🔴 DUPLICATE |
| **Logout** | ✅ `signOut()` | ✅ `/api/auth/logout` | 🔴 DUPLICATE |
| **Session Management** | ✅ JWT in HTTP-only cookie | ✅ sessionId in HTTP-only cookie | 🔴 DUPLICATE |
| **Session Storage** | ✅ Stateless JWT | ✅ Vercel KV / in-memory Map | 🔴 DUPLICATE |
| **Session Validation** | ✅ JWT signature verification | ✅ Session store lookup | 🔴 DUPLICATE |
| **Password Hashing** | ✅ bcrypt (in authorize callback) | ✅ bcrypt (cost 12) | ✅ COMPATIBLE |
| **Account Lockout** | ✅ 5 attempts, 30 min | ✅ 5 attempts, 30 min | ✅ COMPATIBLE |
| **Email Verification** | ✅ Enforced in authorize | ✅ Enforced in login | ✅ COMPATIBLE |
| **MFA Support** | ✅ requiresMFA flag | ✅ mfaVerified field | ✅ COMPATIBLE |
| **Password Reset** | ❌ Not implemented | ✅ Forgot/reset password flow | 🔴 CUSTOM ONLY |
| **Password History** | ❌ Not implemented | ✅ Last 5 passwords | 🔴 CUSTOM ONLY |
| **Audit Logging** | ✅ signIn/signOut events | ✅ All auth events | ✅ COMPATIBLE |
| **Role-Based Access** | ✅ JWT role field | ✅ Session role field | ✅ COMPATIBLE |
| **Multi-Tenant Context** | ✅ JWT storeId field | ✅ Session storeId field | ✅ COMPATIBLE |
| **Client Hooks** | ✅ `useSession`, `signIn`, `signOut` | ❌ Not implemented | ✅ NEXTAUTH ONLY |
| **Middleware Integration** | ✅ `withAuth` HOC | ❌ Not used in proxy | ✅ NEXTAUTH ONLY |
| **Session Refresh** | ✅ Automatic JWT refresh | ✅ Manual refresh on activity | ✅ COMPATIBLE |
| **Cross-Origin Support** | ✅ NEXTAUTH_URL | ❌ Not applicable | ✅ NEXTAUTH ONLY |

**Legend**:
- ✅ COMPATIBLE: Both systems implement the same feature
- 🔴 DUPLICATE: Both systems implement the feature, creating redundancy
- ✅ NEXTAUTH ONLY: Only NextAuth implements this feature
- 🔴 CUSTOM ONLY: Only custom auth implements this feature

---

## 3. Authentication Flow Analysis

### 3.1 Current State: Dual Authentication Paths

#### Path 1: NextAuth Flow (Recommended)

```
┌──────────────┐
│ User submits │
│ login form   │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────┐
│ Client calls signIn()          │
│ from next-auth/react           │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────┐
│ POST /api/auth/callback/credentials            │
│ (handled by NextAuth [..nextauth]/route.ts)    │
└──────┬─────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────┐
│ authorize() callback executes:                 │
│ 1. Find user by email                          │
│ 2. Check account lockout                       │
│ 3. Verify password with bcrypt                 │
│ 4. Check email verification                    │
│ 5. Check MFA requirement                       │
│ 6. Reset failed attempts                       │
│ 7. Update lastLoginAt, lastLoginIP             │
│ 8. Create audit log                            │
│ 9. Return user object                          │
└──────┬─────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────┐
│ NextAuth JWT callback:                         │
│ - Add custom fields to token                   │
│   (id, role, storeId, requiresMFA)             │
└──────┬─────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────┐
│ NextAuth Session callback:                     │
│ - Add custom fields to session                 │
└──────┬─────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────┐
│ JWT signed and set in HTTP-only cookie:        │
│ - Cookie name: next-auth.session-token         │
│ - HTTP-only: true                              │
│ - Secure: true (production)                    │
│ - SameSite: Lax                                │
│ - Max-Age: 30 days                             │
└──────┬─────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────┐
│ Client receives session via useSession()       │
│ - session.user.id                              │
│ - session.user.email                           │
│ - session.user.role                            │
│ - session.user.storeId                         │
└────────────────────────────────────────────────┘
```

#### Path 2: Custom Auth Flow (Legacy)

```
┌──────────────┐
│ User submits │
│ login form   │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────┐
│ Client calls fetch()           │
│ POST /api/auth/login           │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────┐
│ /api/auth/login route handler:                 │
│ 1. Validate input with Zod                     │
│ 2. Call auth-service.login()                   │
└──────┬─────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────┐
│ auth-service.login():                          │
│ 1. Find user by email                          │
│ 2. Check account lockout                       │
│ 3. Verify password with bcrypt                 │
│ 4. Check email verification                    │
│ 5. Reset failed attempts                       │
│ 6. Update lastLoginAt, lastLoginIP             │
│ 7. Generate sessionId (32-byte hex)            │
│ 8. Store session in session-storage            │
│ 9. Create audit log                            │
│ 10. Return sessionId + user object             │
└──────┬─────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────┐
│ Route handler sets sessionId cookie:           │
│ - Cookie name: sessionId                       │
│ - HTTP-only: true                              │
│ - Secure: true (production)                    │
│ - SameSite: Lax                                │
│ - Max-Age: 7 days                              │
└──────┬─────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────┐
│ Client receives response:                      │
│ - sessionId (in cookie)                        │
│ - user object (id, email, role, storeId)       │
│ - requiresMFA flag                             │
└────────────────────────────────────────────────┘
```

---

## 4. Proxy (Middleware) Analysis

**File**: `proxy.ts` (246 lines)

### Current Implementation

```typescript
export default withAuth(
  async function proxy(req) {
    const token = req.nextauth.token as JWT;
    
    // Role-based access control
    if (pathname.startsWith('/admin') && token.role !== 'SuperAdmin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    // MFA enforcement
    if (token.requiresMFA && !pathname.startsWith('/auth/mfa')) {
      return NextResponse.redirect(new URL('/auth/mfa/challenge', req.url));
    }
    
    // Apply security protections (rate limiting, CSRF, headers)
    return applySecurityProtections(req as NextRequest);
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
      error: '/login',
    },
  }
);
```

**Finding**: ✅ **Proxy ONLY uses NextAuth** (no custom auth integration)

**Analysis**:
- Uses NextAuth's `withAuth` HOC for authentication
- Accesses JWT token via `req.nextauth.token`
- No integration with custom `session-storage.ts`
- No reading of custom `sessionId` cookie
- All protected routes (dashboard, admin, API) use NextAuth

**Implication**: Custom auth endpoints (`/api/auth/login`, `/api/auth/register`, `/api/auth/logout`) are NOT protected by proxy, which means:
1. They can be called without NextAuth authentication
2. They create sessions that proxy.ts does NOT recognize
3. Users authenticated via custom auth CANNOT access protected routes

---

## 5. Critical Issues & Security Implications

### 🔴 Issue 1: Conflicting Session Mechanisms

**Severity**: CRITICAL

**Description**:
- NextAuth uses JWT tokens stored in `next-auth.session-token` cookie
- Custom auth uses session IDs stored in `sessionId` cookie
- proxy.ts ONLY validates NextAuth JWT tokens

**Impact**:
1. Users logging in via `/api/auth/login` receive a `sessionId` cookie
2. proxy.ts does NOT recognize `sessionId` cookies
3. Users authenticated via custom auth CANNOT access `/dashboard` or `/admin` routes
4. Users MUST use NextAuth signIn() to access protected routes

**Evidence**:
```typescript
// proxy.ts line 202
export default withAuth(
  async function proxy(req) {
    const token = req.nextauth.token as JWT; // Only checks NextAuth token
    // ...
  }
);

// Custom login sets different cookie
// /api/auth/login/route.ts line 73
response.cookies.set('sessionId', result.sessionId, { ... });
```

**Recommendation**: Remove custom auth endpoints to eliminate confusion

---

### 🔴 Issue 2: Duplicate Password Reset Flow

**Severity**: HIGH

**Description**:
- Custom auth implements full password reset flow:
  - `requestPasswordReset()` in auth-service.ts
  - `resetPassword()` in auth-service.ts
  - `/api/auth/forgot-password` endpoint
  - `/api/auth/reset-password` endpoint
- NextAuth does NOT provide password reset functionality
- Password reset uses custom `resetToken` stored in User model

**Impact**:
1. Password reset flow is ONLY available through custom auth
2. If custom auth is removed, password reset functionality is lost
3. Need to implement password reset as a NextAuth extension or separate flow

**Recommendation**: Migrate password reset to standalone utility that works with NextAuth

---

### 🔴 Issue 3: Registration Only in Custom Auth

**Severity**: HIGH

**Description**:
- User registration is ONLY implemented in custom auth:
  - `register()` in auth-service.ts
  - `/api/auth/register` endpoint
- NextAuth does NOT handle registration (only authentication)
- Registration creates users with hashed passwords in database

**Impact**:
1. New users can ONLY register via custom endpoint
2. After registration, users MUST use NextAuth signIn() to login
3. Registration uses bcrypt cost factor 12 (compatible with NextAuth)

**Recommendation**: Keep registration as separate endpoint (not authentication), update to generate NextAuth-compatible passwords

---

### 🔴 Issue 4: Session Storage Unused by Proxy

**Severity**: MEDIUM

**Description**:
- `session-storage.ts` implements full session management:
  - Vercel KV integration for production
  - In-memory Map for development
  - Session creation, validation, refresh, deletion
- SessionService has 281 lines of code
- proxy.ts does NOT use session-storage.ts (uses NextAuth JWT only)

**Impact**:
1. session-storage.ts is DEAD CODE for protected routes
2. Maintaining two session systems increases complexity
3. Vercel KV costs for unused session storage

**Recommendation**: Remove session-storage.ts and SessionService after migrating password reset

---

### 🔴 Issue 5: Multiple Authentication Cookies

**Severity**: MEDIUM

**Description**:
- NextAuth sets: `next-auth.session-token` (JWT)
- Custom auth sets: `sessionId` (session lookup key)
- Users may have BOTH cookies if they've used both systems

**Impact**:
1. Cookie bloat (unnecessary data sent with every request)
2. User confusion (which cookie is valid?)
3. Potential security issue if one cookie is compromised

**Recommendation**: Clear `sessionId` cookie on NextAuth login, remove custom auth endpoints

---

### ⚠️ Issue 6: Test Mocks Use NextAuth

**Severity**: LOW

**Description**:
- All test files mock NextAuth (`jest.mock('next-auth')`)
- Tests do NOT mock custom auth service
- MockAuthService in `tests/integration/auth.test.ts` is for testing custom auth

**Impact**:
1. Tests validate NextAuth integration (good)
2. Tests do NOT validate custom auth integration (expected, since custom auth should be removed)
3. MockAuthService can be deleted once custom auth is removed

**Recommendation**: Keep NextAuth mocks, remove MockAuthService after migration

---

## 6. Migration Status & Spec Compliance

### Spec Reference: Task T022

**From `specs/001-multi-tenant-ecommerce/spec.md`**:

```
T022 - Configure NextAuth.js v4.24.13 in `src/app/api/auth/[...nextauth]/route.ts` 
with JWT strategy and credentials provider (FR-035 to FR-046)

REQUIRED PROPERTIES:
- providers: CredentialsProvider with email + password
- session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }
- callbacks: jwt (add custom claims), session (expose user fields)
- pages: { signIn: '/login', error: '/login' }

NOTES: Migrate custom auth utilities to NextAuth hooks/providers; 
legacy custom implementation maintained for backwards compatibility 
until migration tasks are complete.
```

**Analysis**:
- ✅ NextAuth.js v4.24.13 is configured
- ✅ JWT strategy is implemented
- ✅ Credentials provider with email + password
- ✅ Session max age: 30 days
- ✅ Custom JWT and Session callbacks
- ✅ Custom pages configured
- 🔴 **Migration NOT complete**: Custom auth still exists and is fully functional
- 🔴 **"Backwards compatibility" clause**: Custom auth should be temporary, but it's still active

**Conclusion**: Migration from custom auth to NextAuth is INCOMPLETE

---

## 7. Refactoring Recommendations

### Strategy 1: Complete Migration to NextAuth (RECOMMENDED)

**Goal**: Remove all custom authentication code, use NextAuth.js exclusively

**Priority**: 🔴 CRITICAL

**Benefits**:
- ✅ Single authentication system (NextAuth)
- ✅ Reduced maintenance burden
- ✅ Industry-standard authentication library
- ✅ Better security (JWT, HTTP-only cookies, CSRF protection)
- ✅ Built-in client hooks (useSession, signIn, signOut)
- ✅ Middleware integration (withAuth HOC)
- ✅ Better testing support

**Detailed Migration Plan**:

#### Phase 1: Preserve Essential Custom Functionality (Week 1)

**1.1 Extract Password Reset to Standalone Utility**

**File to Create**: `src/lib/password-reset.ts` (new file)

**Actions**:
```typescript
// src/lib/password-reset.ts
// Password reset functionality (compatible with NextAuth)

import { db } from '@/lib/db';
import { hashPassword, isPasswordInHistory } from '@/lib/password';
import { sendPasswordReset } from '@/services/email-service';
import { createAuditLog, AuditAction, AuditResource } from '@/lib/audit';
import crypto from 'crypto';

const RESET_TOKEN_CONFIG = {
  expiresIn: 60 * 60 * 1000, // 1 hour
};

export async function requestPasswordReset(
  email: string,
  ipAddress?: string
): Promise<{ success: boolean }> {
  // Find user
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Always return success to prevent email enumeration
  if (!user) return { success: true };

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + RESET_TOKEN_CONFIG.expiresIn);

  // Store reset token
  await db.user.update({
    where: { id: user.id },
    data: { resetToken, resetExpires },
  });

  // Send reset email
  await sendPasswordReset({
    user: { id: user.id, email: user.email, name: user.name } as any,
    resetToken,
    expiresAt: resetExpires,
    ipAddress,
  });

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: AuditAction.PASSWORD_RESET_REQUESTED,
    resource: AuditResource.USER,
    resourceId: user.id,
    metadata: { email: user.email },
    ipAddress,
  });

  return { success: true };
}

export async function resetPassword(data: {
  token: string;
  newPassword: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ success: boolean }> {
  // Find user by reset token
  const user = await db.user.findFirst({
    where: {
      resetToken: data.token,
      resetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new Error('INVALID_OR_EXPIRED_TOKEN');
  }

  // Check password history
  const inHistory = await isPasswordInHistory(user.id, data.newPassword);
  if (inHistory) {
    throw new Error('PASSWORD_RECENTLY_USED');
  }

  // Hash new password
  const password = await hashPassword(data.newPassword);

  // Update password and clear reset token
  await db.user.update({
    where: { id: user.id },
    data: {
      password,
      resetToken: null,
      resetExpires: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      passwordChangedAt: new Date(),
    },
  });

  // Add to password history
  await db.passwordHistory.create({
    data: { userId: user.id, hashedPassword: password },
  });

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: AuditAction.PASSWORD_RESET_COMPLETED,
    resource: AuditResource.USER,
    resourceId: user.id,
    metadata: { email: user.email },
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  });

  return { success: true };
}
```

**1.2 Keep Registration as Separate Endpoint (Not Auth)**

**File to Update**: `src/app/api/auth/register/route.ts`

**Actions**:
- Keep registration endpoint (NOT authentication)
- Ensure passwords are bcrypt-hashed (compatible with NextAuth)
- After registration, redirect to login page
- Update response message: "Registration successful. Please log in."

**Rationale**: Registration is NOT authentication, it's user creation. NextAuth doesn't handle registration, so this is appropriate.

---

#### Phase 2: Remove Custom Auth Endpoints (Week 1-2)

**2.1 Delete Custom Login Endpoint**

**Files to DELETE**:
- ❌ `src/app/api/auth/login/route.ts` (109 lines)

**Rationale**: NextAuth credentials provider handles login

**Migration**:
- Update all client code to use `signIn('credentials', { email, password })`
- Update tests to mock NextAuth instead of custom login endpoint

**2.2 Delete Custom Logout Endpoint**

**Files to DELETE**:
- ❌ `src/app/api/auth/logout/route.ts` (66 lines)

**Rationale**: NextAuth `signOut()` handles logout

**Migration**:
- Update all client code to use `signOut({ callbackUrl: '/login' })`
- Update tests to mock NextAuth instead of custom logout endpoint

**2.3 Delete Custom Session Endpoint**

**Files to DELETE**:
- ❌ `src/app/api/auth/custom-session/route.ts` (63 lines)

**Rationale**: NextAuth `useSession()` and `getServerSession()` handle session access

**Migration**:
- Update all client code to use `useSession()` from next-auth/react
- Update all server code to use `getServerSession(authOptions)` from next-auth

---

#### Phase 3: Remove Custom Auth Service Layer (Week 2)

**3.1 Extract Reusable Functions from auth-service.ts**

**Files to UPDATE**:
- `src/services/auth-service.ts` → Extract to `src/lib/password-reset.ts` (done in Phase 1)

**Functions to KEEP** (move to appropriate files):
- `register()` → Keep in place (registration is not auth)
- `requestPasswordReset()` → Move to `src/lib/password-reset.ts`
- `resetPassword()` → Move to `src/lib/password-reset.ts`
- `verifyEmail()` → Move to `src/lib/email-verification.ts`

**Functions to DELETE** (replaced by NextAuth):
- ❌ `login()` → Replaced by NextAuth credentials provider
- ❌ `logout()` → Replaced by NextAuth signOut()

**Files to DELETE**:
- ❌ `src/services/auth-service.ts` (after extracting reusable functions)

**3.2 Remove Custom Session Management**

**Files to DELETE**:
- ❌ `src/services/session-service.ts` (281 lines)
- ❌ `src/lib/session-storage.ts` (285 lines)

**Rationale**: NextAuth JWT strategy eliminates need for session storage

**Impact**:
- Remove Vercel KV dependency for sessions (cost savings)
- Remove in-memory Map for development
- Simplify session management (stateless JWT)

**Migration**:
- Update all `getSession(sessionId)` calls → `getServerSession(authOptions)`
- Update all `SessionService.getSession()` calls → `getServerSession(authOptions)`
- Remove `sessionId` cookie clearing in logout flows

---

#### Phase 4: Update Client Code (Week 2-3)

**4.1 Update Login Page**

**File to UPDATE**: `src/app/login/page.tsx`

**Current** (assumed based on audit findings):
```typescript
// Current (using custom auth)
async function handleSubmit(data: FormData) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (response.ok) {
    router.push('/dashboard');
  }
}
```

**Updated** (using NextAuth):
```typescript
// Updated (using NextAuth)
'use client';

import { signIn } from 'next-auth/react';

async function handleSubmit(data: { email: string; password: string }) {
  const result = await signIn('credentials', {
    email: data.email,
    password: data.password,
    redirect: false, // Handle redirect manually
  });
  
  if (result?.error) {
    // Handle error (INVALID_CREDENTIALS, ACCOUNT_LOCKED, etc.)
    setError(result.error);
  } else {
    // Redirect to dashboard
    router.push('/dashboard');
  }
}
```

**4.2 Update All useAuth Calls**

**Files to SEARCH**: All client components using custom auth hooks

**Current** (if any custom hooks exist):
```typescript
// Current (custom hook)
const { user, isLoading } = useCustomAuth();
```

**Updated** (using NextAuth):
```typescript
// Updated (using NextAuth)
import { useAuth } from '@/hooks/use-session';

const { user, isLoading, isAuthenticated } = useAuth();
```

**Note**: `src/hooks/use-session.ts` already wraps NextAuth, so this may be a no-op

---

#### Phase 5: Update Server Code (Week 3)

**5.1 Update API Routes Using Custom Session**

**Files to SEARCH**: All API routes calling `getSession()` or `SessionService.getSession()`

**Current**:
```typescript
// Current (custom session)
import { getSession } from '@/lib/session-storage';

export async function GET(request: NextRequest) {
  const sessionId = request.cookies.get('sessionId')?.value;
  const session = await getSession(sessionId);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Use session.userId, session.storeId, etc.
}
```

**Updated**:
```typescript
// Updated (NextAuth)
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Use session.user.id, session.user.storeId, etc.
}
```

**5.2 Update Server Components**

**Files to SEARCH**: All server components using custom session

**Current**:
```typescript
// Current (custom session)
import { getSessionFromCookies } from '@/lib/session-storage';

export default async function DashboardPage() {
  const session = await getSessionFromCookies();
  
  if (!session) {
    redirect('/login');
  }
  
  // Use session.userId, session.email, etc.
}
```

**Updated**:
```typescript
// Updated (NextAuth)
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }
  
  // Use session.user.id, session.user.email, etc.
}
```

---

#### Phase 6: Update Tests (Week 3-4)

**6.1 Remove Custom Auth Test Mocks**

**Files to DELETE**:
- ❌ `tests/integration/auth.test.ts` → Remove MockAuthService
- ❌ Any custom auth service mocks in `tests/__mocks__/`

**6.2 Update Test Setup**

**File to UPDATE**: `tests/setup.ts`

**Add NextAuth Mock**:
```typescript
// tests/setup.ts
import { jest } from '@jest/globals';

// Mock NextAuth
jest.mock('next-auth', () => ({
  default: jest.fn(),
  getServerSession: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'STORE_ADMIN',
        storeId: 'test-store-id',
      },
    },
    status: 'authenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }: any) => children,
}));
```

---

#### Phase 7: Database Cleanup (Week 4)

**7.1 Remove Unused Session Fields (Optional)**

**File to UPDATE**: `prisma/schema.prisma`

**Current User Model**:
```prisma
model User {
  id                   String    @id @default(cuid())
  email                String    @unique
  password             String
  name                 String?
  // ... other fields ...
  resetToken           String?   // Used by password reset
  resetExpires         DateTime? // Used by password reset
  verificationToken    String?   // Used by email verification
  verificationExpires  DateTime? // Used by email verification
}
```

**Analysis**: Keep resetToken, resetExpires, verificationToken, verificationExpires (used by password reset and email verification, which are standalone utilities)

**No changes needed** to schema.

---

#### Phase 8: Documentation Updates (Week 4)

**8.1 Update API Documentation**

**Files to UPDATE**:
- `specs/001-multi-tenant-ecommerce/spec.md` → Update T022 to mark migration as complete
- `README.md` → Update authentication section
- `docs/developer-guide.md` → Update authentication guide

**8.2 Update Copilot Instructions**

**File to UPDATE**: `.github/copilot-instructions.md`

**Update Authentication Section**:
```markdown
## Authentication (NextAuth.js v4.24.13)

**REQUIRED**: StormCom uses NextAuth.js EXCLUSIVELY for authentication.

**DO NOT**:
- ❌ Create custom login/logout/session endpoints
- ❌ Use custom session storage
- ❌ Implement custom authentication logic

**DO**:
- ✅ Use NextAuth credentials provider for login
- ✅ Use `signIn('credentials', { email, password })` for client-side login
- ✅ Use `signOut()` for logout
- ✅ Use `getServerSession(authOptions)` for server-side auth
- ✅ Use `useSession()` for client-side auth
- ✅ Use `withAuth` HOC in proxy.ts for protected routes

**Password Reset**:
- Use `requestPasswordReset()` and `resetPassword()` from `src/lib/password-reset.ts`
- These are standalone utilities compatible with NextAuth

**Registration**:
- Use `POST /api/auth/register` endpoint
- Generates bcrypt-hashed passwords compatible with NextAuth
```

---

### Migration Summary Table

| Phase | Duration | Files to Delete | Files to Create | Files to Update | Risk |
|-------|----------|-----------------|-----------------|-----------------|------|
| **Phase 1** | Week 1 | 0 | 1 (password-reset.ts) | 1 (register/route.ts) | LOW |
| **Phase 2** | Week 1-2 | 3 (login, logout, custom-session) | 0 | All client code | MEDIUM |
| **Phase 3** | Week 2 | 3 (auth-service, session-service, session-storage) | 1 (email-verification.ts) | N/A | HIGH |
| **Phase 4** | Week 2-3 | 0 | 0 | All client components | MEDIUM |
| **Phase 5** | Week 3 | 0 | 0 | All API routes + server components | HIGH |
| **Phase 6** | Week 3-4 | 1 (auth.test.ts) | 0 | tests/setup.ts + all tests | MEDIUM |
| **Phase 7** | Week 4 | 0 | 0 | 0 (no schema changes needed) | LOW |
| **Phase 8** | Week 4 | 0 | 0 | 4 (docs) | LOW |

**Total Duration**: 4 weeks

**Total Files to Delete**: 7 files (876 lines of code)

**Total Files to Create**: 2 files (password-reset.ts, email-verification.ts)

**Total Files to Update**: ~50-100 files (all auth-related code)

---

## 8. File Removal Candidates

### 🔴 CRITICAL: Files to Delete Immediately

| File | Lines | Purpose | Replacement | Risk |
|------|-------|---------|-------------|------|
| `src/app/api/auth/login/route.ts` | 109 | Custom login endpoint | NextAuth credentials provider | MEDIUM |
| `src/app/api/auth/logout/route.ts` | 66 | Custom logout endpoint | NextAuth signOut() | LOW |
| `src/app/api/auth/custom-session/route.ts` | 63 | Custom session validation | NextAuth getServerSession() | MEDIUM |
| `src/services/auth-service.ts` | 367 | Custom auth functions | NextAuth + password-reset.ts | HIGH |
| `src/services/session-service.ts` | 281 | Custom session management | NextAuth JWT | HIGH |
| `src/lib/session-storage.ts` | 285 | Session storage (KV/Map) | NextAuth JWT (stateless) | HIGH |
| `tests/integration/auth.test.ts` | ? | MockAuthService tests | NextAuth test mocks | LOW |

**Total**: 7 files, ~1,171+ lines of code to delete

**Estimated effort**: 2-3 weeks to safely migrate and delete

---

### ⚠️ MEDIUM: Files to Update

| File | Lines | Changes Needed | Risk |
|------|-------|----------------|------|
| `src/app/api/auth/register/route.ts` | 85 | Update response message, ensure NextAuth compatibility | LOW |
| `src/app/api/auth/forgot-password/route.ts` | ? | Migrate to use password-reset.ts utility | MEDIUM |
| `src/app/api/auth/reset-password/route.ts` | ? | Migrate to use password-reset.ts utility | MEDIUM |
| `src/contexts/auth-provider.tsx` | 95 | Already wraps NextAuth (no changes needed) | LOW |
| `src/hooks/use-session.ts` | 125 | Already uses NextAuth (no changes needed) | LOW |
| `proxy.ts` | 246 | Already uses NextAuth (no changes needed) | LOW |

---

### ✅ LOW: Files to Keep (No Changes)

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `src/lib/auth.ts` | 52 | NextAuth type extensions | ✅ KEEP |
| `src/app/api/auth/[...nextauth]/route.ts` | 332 | NextAuth handler | ✅ KEEP |
| `src/lib/password.ts` | ? | Password hashing utilities | ✅ KEEP |
| `src/lib/audit.ts` | ? | Audit logging | ✅ KEEP |
| `src/services/email-service.ts` | ? | Email sending | ✅ KEEP |
| `src/services/mfa-service.ts` | ? | MFA (TOTP) management | ✅ KEEP |

---

## 9. Risk Assessment

### High-Risk Areas

1. **Session Migration** (Risk: HIGH)
   - Existing users with custom `sessionId` cookies will be logged out
   - Need clear communication about forced logout
   - Consider adding banner: "We've upgraded our authentication system. Please log in again."

2. **Password Reset Downtime** (Risk: MEDIUM)
   - While migrating password reset to standalone utility, existing reset tokens may be invalidated
   - Consider migration window during low-traffic hours
   - Add error handling for expired tokens

3. **API Client Updates** (Risk: HIGH)
   - All client code calling custom auth endpoints must be updated
   - Mobile apps (if any) must be updated
   - Third-party integrations (if any) must be notified

4. **Test Coverage** (Risk: MEDIUM)
   - Need to update all tests to mock NextAuth instead of custom auth
   - Risk of missing edge cases during migration
   - Recommend comprehensive E2E testing before deployment

### Mitigation Strategies

1. **Feature Flags**: Deploy migration behind feature flag
2. **A/B Testing**: Test NextAuth with small percentage of users
3. **Rollback Plan**: Keep custom auth code in separate branch for emergency rollback
4. **Monitoring**: Add logging to track auth method usage (NextAuth vs custom)
5. **Communication**: Email users about upcoming authentication upgrade
6. **Staged Rollout**: Deploy to development → staging → production over 2-week period

---

## 10. Testing Checklist

### ✅ Pre-Migration Testing

- [ ] Verify NextAuth login works in development
- [ ] Verify NextAuth logout works in development
- [ ] Verify NextAuth session persistence (refresh page)
- [ ] Verify NextAuth JWT expiration (30 days)
- [ ] Verify proxy.ts authentication (dashboard, admin routes)
- [ ] Verify role-based access control (SuperAdmin vs STORE_ADMIN)
- [ ] Verify MFA flow with NextAuth
- [ ] Verify account lockout (5 failed attempts)
- [ ] Verify email verification enforcement

### ✅ Post-Migration Testing

- [ ] Verify custom auth endpoints return 404 (deleted)
- [ ] Verify password reset works with new utility
- [ ] Verify registration creates NextAuth-compatible passwords
- [ ] Verify all protected routes use NextAuth
- [ ] Verify all API routes use `getServerSession()`
- [ ] Verify all client components use `useSession()`
- [ ] Verify tests pass with NextAuth mocks
- [ ] Verify E2E tests pass (login, logout, registration, password reset)
- [ ] Verify performance (JWT validation vs session lookup)
- [ ] Verify Vercel KV session storage is no longer used (cost savings)

---

## 11. Cost-Benefit Analysis

### Current State (Dual Auth System)

**Costs**:
- 🔴 Maintenance: 1,171+ lines of custom auth code
- 🔴 Vercel KV: Session storage costs ($20-100/month depending on usage)
- 🔴 Testing: Need to test both auth systems
- 🔴 Security: Larger attack surface (two auth paths)
- 🔴 Developer confusion: Which auth method to use?
- 🔴 User confusion: Different login endpoints
- 🔴 Technical debt: Migration incomplete since unknown date

**Benefits**:
- ✅ Password reset functionality (not in NextAuth)
- ✅ Custom session management (more control)

### Proposed State (NextAuth Only)

**Costs**:
- 🟡 Migration effort: 4 weeks (1 developer)
- 🟡 Risk of bugs during migration (mitigated by testing)
- 🟡 Need to implement password reset as standalone utility

**Benefits**:
- ✅ Single authentication system (NextAuth)
- ✅ -1,171 lines of code to maintain
- ✅ -$20-100/month Vercel KV costs
- ✅ Industry-standard authentication library
- ✅ Better security (JWT, CSRF, HTTP-only cookies)
- ✅ Better developer experience (NextAuth hooks)
- ✅ Better testing (NextAuth mocks)
- ✅ Proxy already uses NextAuth (seamless integration)

**ROI**:
- **Time saved**: ~10-20 hours/month (maintenance + debugging)
- **Cost saved**: ~$240-1,200/year (Vercel KV)
- **Security improvement**: Reduced attack surface
- **Developer velocity**: Faster feature development (no auth confusion)

**Recommendation**: **MIGRATE to NextAuth immediately**. The benefits far outweigh the costs.

---

## 12. Conclusion

### Current State: 🔴 CRITICAL - Hybrid Authentication System

**StormCom implements TWO authentication systems**:
1. ✅ **NextAuth.js v4.24.13** (fully configured, used by proxy.ts)
2. 🔴 **Custom authentication** (fully functional, NOT used by proxy.ts)

**Critical Issues**:
- Users authenticated via custom auth CANNOT access protected routes
- proxy.ts ONLY recognizes NextAuth JWT tokens
- 1,171+ lines of redundant custom auth code
- Vercel KV session storage costs for unused sessions
- Technical debt from incomplete migration

### Recommended Action: Complete Migration to NextAuth

**Timeline**: 4 weeks

**Priority**: 🔴 CRITICAL

**Effort**: 1 developer full-time

**Files to Delete**: 7 files (1,171+ lines)

**Files to Create**: 2 files (password-reset.ts, email-verification.ts)

**Files to Update**: ~50-100 files (all auth-related code)

**Cost Savings**: $240-1,200/year (Vercel KV) + 10-20 hours/month (maintenance)

**Security Improvement**: Reduced attack surface, single auth path, industry-standard library

**Developer Experience**: Better hooks, better testing, better documentation

### Next Steps

1. **Immediate** (Week 1):
   - [ ] Review this report with team
   - [ ] Approve migration plan
   - [ ] Create migration branch
   - [ ] Extract password reset to standalone utility

2. **Short-term** (Weeks 2-3):
   - [ ] Delete custom auth endpoints
   - [ ] Update all client code to use NextAuth
   - [ ] Update all server code to use NextAuth

3. **Medium-term** (Week 4):
   - [ ] Update tests
   - [ ] Update documentation
   - [ ] Deploy to staging
   - [ ] Deploy to production

---

## Appendix A: Quick Reference

### NextAuth Cheat Sheet

```typescript
// Client-side login
import { signIn } from 'next-auth/react';
await signIn('credentials', { email, password, redirect: false });

// Client-side logout
import { signOut } from 'next-auth/react';
await signOut({ callbackUrl: '/login' });

// Client-side session
import { useSession } from 'next-auth/react';
const { data: session, status } = useSession();

// Server-side session (API routes)
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
const session = await getServerSession(authOptions);

// Server-side session (Server Components)
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
const session = await getServerSession(authOptions);

// Middleware authentication
import { withAuth } from 'next-auth/middleware';
export default withAuth(function proxy(req) { ... });
```

---

## Appendix B: File Structure After Migration

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/
│   │       │   └── route.ts              ✅ KEEP (NextAuth handler)
│   │       ├── register/
│   │       │   └── route.ts              ✅ KEEP (user creation)
│   │       ├── forgot-password/
│   │       │   └── route.ts              ✅ UPDATE (use password-reset.ts)
│   │       ├── reset-password/
│   │       │   └── route.ts              ✅ UPDATE (use password-reset.ts)
│   │       ├── mfa/                      ✅ KEEP (MFA flows)
│   │       ├── session/                  ✅ KEEP (NextAuth session endpoint)
│   │       ├── test/                     ✅ KEEP (test utilities)
│   │       ├── login/                    ❌ DELETE (replaced by NextAuth)
│   │       ├── logout/                   ❌ DELETE (replaced by NextAuth)
│   │       └── custom-session/           ❌ DELETE (replaced by NextAuth)
│   └── ...
├── lib/
│   ├── auth.ts                           ✅ KEEP (NextAuth config)
│   ├── password.ts                       ✅ KEEP (bcrypt utilities)
│   ├── password-reset.ts                 ✅ CREATE (extracted from auth-service)
│   ├── email-verification.ts             ✅ CREATE (extracted from auth-service)
│   ├── session-storage.ts                ❌ DELETE (replaced by NextAuth JWT)
│   └── ...
├── services/
│   ├── auth-service.ts                   ❌ DELETE (replaced by NextAuth + utils)
│   ├── session-service.ts                ❌ DELETE (replaced by NextAuth JWT)
│   ├── mfa-service.ts                    ✅ KEEP (MFA logic)
│   ├── email-service.ts                  ✅ KEEP (email sending)
│   └── ...
├── hooks/
│   └── use-session.ts                    ✅ KEEP (wraps NextAuth)
├── contexts/
│   └── auth-provider.tsx                 ✅ KEEP (wraps NextAuth)
└── ...

proxy.ts                                  ✅ KEEP (uses NextAuth withAuth)
```

---

**END OF REPORT**
