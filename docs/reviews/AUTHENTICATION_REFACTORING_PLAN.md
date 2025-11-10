# Authentication Refactoring Plan - Action Items

**Generated**: 2025-01-29  
**Project**: StormCom Multi-tenant E-commerce Platform  
**Priority**: 🔴 CRITICAL  
**Timeline**: 4 weeks (1 developer full-time)

---

## 🎯 Goal

**Remove all custom authentication code and migrate to NextAuth.js exclusively.**

---

## 📊 Migration Impact Summary

| Metric | Current | After Migration | Change |
|--------|---------|-----------------|--------|
| **Authentication Systems** | 2 (NextAuth + Custom) | 1 (NextAuth only) | -50% |
| **Lines of Auth Code** | ~1,500 | ~350 | -77% |
| **API Auth Endpoints** | 9 | 6 | -33% |
| **Session Storage** | Vercel KV ($20-100/mo) | JWT (stateless) | $240-1,200/year saved |
| **Maintenance Hours** | ~20 hrs/month | ~5 hrs/month | -75% |
| **Test Coverage** | Dual mocks required | Single NextAuth mocks | -50% complexity |

---

## 📋 Phase 1: Extract Reusable Utilities (Week 1)

### ✅ Task 1.1: Create Password Reset Utility

**Priority**: 🔴 HIGH

**File to Create**: `src/lib/password-reset.ts` (new file, ~150 lines)

**Purpose**: Extract password reset functionality from `auth-service.ts` as standalone utility compatible with NextAuth

**Functions to Implement**:
```typescript
// src/lib/password-reset.ts

/**
 * Request password reset email with token
 * @param email - User email address
 * @param ipAddress - Request IP for audit log
 * @returns Success status (always true to prevent enumeration)
 */
export async function requestPasswordReset(
  email: string,
  ipAddress?: string
): Promise<{ success: boolean }>;

/**
 * Reset password with valid token
 * @param token - Reset token from email
 * @param newPassword - New password (validated before hashing)
 * @param ipAddress - Request IP for audit log
 * @param userAgent - Browser user agent for audit log
 * @throws INVALID_OR_EXPIRED_TOKEN, PASSWORD_RECENTLY_USED
 * @returns Success status
 */
export async function resetPassword(data: {
  token: string;
  newPassword: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ success: boolean }>;
```

**Source Code**: Copy from `auth-service.ts` lines 188-267 (requestPasswordReset, resetPassword)

**Dependencies**:
- `src/lib/db.ts` (Prisma client)
- `src/lib/password.ts` (hashPassword, isPasswordInHistory)
- `src/services/email-service.ts` (sendPasswordReset)
- `src/lib/audit.ts` (createAuditLog)
- `crypto` (randomBytes for token generation)

**Testing**:
```typescript
// tests/unit/lib/password-reset.test.ts
describe('password-reset', () => {
  describe('requestPasswordReset', () => {
    it('should generate reset token and send email', async () => { ... });
    it('should return success for non-existent email (prevent enumeration)', async () => { ... });
    it('should create audit log', async () => { ... });
  });

  describe('resetPassword', () => {
    it('should update password with valid token', async () => { ... });
    it('should throw INVALID_OR_EXPIRED_TOKEN for invalid token', async () => { ... });
    it('should throw PASSWORD_RECENTLY_USED if password in history', async () => { ... });
    it('should clear reset token after successful reset', async () => { ... });
    it('should create audit log', async () => { ... });
  });
});
```

**Estimated Time**: 2-3 hours

---

### ✅ Task 1.2: Create Email Verification Utility

**Priority**: 🔴 HIGH

**File to Create**: `src/lib/email-verification.ts` (new file, ~80 lines)

**Purpose**: Extract email verification functionality from `auth-service.ts` as standalone utility

**Functions to Implement**:
```typescript
// src/lib/email-verification.ts

/**
 * Verify user email with token
 * @param token - Verification token from email
 * @throws INVALID_OR_EXPIRED_TOKEN
 * @returns Success status
 */
export async function verifyEmail(token: string): Promise<{ success: boolean }>;

/**
 * Resend verification email
 * @param email - User email address
 * @returns Success status (always true to prevent enumeration)
 */
export async function resendVerificationEmail(email: string): Promise<{ success: boolean }>;
```

**Source Code**: Copy from `auth-service.ts` lines 298-326 (verifyEmail)

**Estimated Time**: 1-2 hours

---

### ✅ Task 1.3: Update Registration Endpoint

**Priority**: 🟡 MEDIUM

**File to Update**: `src/app/api/auth/register/route.ts`

**Changes**:
1. Update response message: "Registration successful. Please log in with your credentials."
2. Add note in JSDoc: "Registration creates user account. Use NextAuth signIn() to authenticate."
3. Verify bcrypt cost factor 12 (NextAuth compatible)
4. Ensure password validation matches NextAuth authorize callback

**Code Changes**:
```typescript
// Before
return NextResponse.json({
  data: {
    userId: result.userId,
    email: validation.data.email,
    message: 'Registration successful. Please check your email to verify your account.',
  },
}, { status: 201 });

// After
return NextResponse.json({
  data: {
    userId: result.userId,
    email: validation.data.email,
    message: 'Registration successful. Please check your email to verify your account, then log in.',
  },
}, { status: 201 });
```

**Estimated Time**: 30 minutes

---

## 📋 Phase 2: Remove Custom Auth Endpoints (Week 1-2)

### ✅ Task 2.1: Delete Custom Login Endpoint

**Priority**: 🔴 CRITICAL

**File to DELETE**: `src/app/api/auth/login/route.ts` (109 lines)

**Replacement**: NextAuth credentials provider in `src/app/api/auth/[...nextauth]/route.ts`

**Steps**:
1. Search for all references to `/api/auth/login` in codebase
2. Update client code to use `signIn('credentials', { email, password })`
3. Update documentation
4. Delete file
5. Verify protected routes still work (proxy.ts uses NextAuth)

**Code Migration Example**:
```typescript
// Before (client code calling custom endpoint)
async function handleLogin(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  if (response.ok) {
    const data = await response.json();
    // sessionId cookie set automatically
    router.push('/dashboard');
  }
}

// After (using NextAuth)
import { signIn } from 'next-auth/react';

async function handleLogin(email: string, password: string) {
  const result = await signIn('credentials', {
    email,
    password,
    redirect: false,
  });
  
  if (result?.ok && !result.error) {
    router.push('/dashboard');
  } else {
    // Handle error: INVALID_CREDENTIALS, ACCOUNT_LOCKED, etc.
    setError(result?.error || 'Login failed');
  }
}
```

**Testing**:
- [ ] Verify login form uses `signIn('credentials')`
- [ ] Verify login form handles NextAuth errors
- [ ] Verify session is created (useSession returns user)
- [ ] Verify protected routes accessible after login
- [ ] Verify account lockout still works
- [ ] Verify email verification still enforced

**Estimated Time**: 2-3 hours

---

### ✅ Task 2.2: Delete Custom Logout Endpoint

**Priority**: 🔴 CRITICAL

**File to DELETE**: `src/app/api/auth/logout/route.ts` (66 lines)

**Replacement**: NextAuth `signOut()` function

**Steps**:
1. Search for all references to `/api/auth/logout` in codebase
2. Update client code to use `signOut({ callbackUrl: '/login' })`
3. Update server code (if any) to use NextAuth session invalidation
4. Delete file

**Code Migration Example**:
```typescript
// Before (client code calling custom endpoint)
async function handleLogout() {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
  });
  
  if (response.ok) {
    router.push('/login');
  }
}

// After (using NextAuth)
import { signOut } from 'next-auth/react';

async function handleLogout() {
  await signOut({ callbackUrl: '/login' });
}
```

**Testing**:
- [ ] Verify logout button uses `signOut()`
- [ ] Verify user redirected to /login after logout
- [ ] Verify session cleared (useSession returns null)
- [ ] Verify protected routes redirect to login after logout
- [ ] Verify JWT cookie deleted

**Estimated Time**: 1-2 hours

---

### ✅ Task 2.3: Delete Custom Session Endpoint

**Priority**: 🔴 CRITICAL

**File to DELETE**: `src/app/api/auth/custom-session/route.ts` (63 lines)

**Replacement**: NextAuth `getServerSession()` and `useSession()`

**Steps**:
1. Search for all references to `/api/auth/custom-session` in codebase
2. Update client code to use `useSession()` from next-auth/react
3. Update server code to use `getServerSession(authOptions)` from next-auth
4. Delete file

**Code Migration Example**:
```typescript
// Before (client code calling custom endpoint)
async function fetchCurrentUser() {
  const response = await fetch('/api/auth/custom-session');
  if (response.ok) {
    const data = await response.json();
    return data.user;
  }
  return null;
}

// After (using NextAuth)
import { useSession } from 'next-auth/react';

function useCurrentUser() {
  const { data: session } = useSession();
  return session?.user ?? null;
}
```

**Testing**:
- [ ] Verify all client components use `useSession()`
- [ ] Verify all API routes use `getServerSession()`
- [ ] Verify session data accessible (user.id, user.email, user.role, user.storeId)

**Estimated Time**: 2-3 hours

---

## 📋 Phase 3: Remove Custom Auth Service Layer (Week 2)

### ✅ Task 3.1: Move Reusable Functions

**Priority**: 🔴 HIGH

**Source File**: `src/services/auth-service.ts` (367 lines)

**Functions to MOVE**:
- `register()` → Keep in place (registration is not authentication)
- `requestPasswordReset()` → Already moved to `src/lib/password-reset.ts` (Task 1.1)
- `resetPassword()` → Already moved to `src/lib/password-reset.ts` (Task 1.1)
- `verifyEmail()` → Already moved to `src/lib/email-verification.ts` (Task 1.2)

**Functions to DELETE** (replaced by NextAuth):
- ❌ `login()` → Replaced by NextAuth credentials provider authorize callback
- ❌ `logout()` → Replaced by NextAuth signOut()

**Steps**:
1. Verify all reusable functions moved to standalone utilities
2. Search for all imports of `auth-service.ts`
3. Update imports to use new utility files
4. Delete `auth-service.ts`

**Import Migration Example**:
```typescript
// Before
import { register, login, logout, requestPasswordReset, resetPassword, verifyEmail } from '@/services/auth-service';

// After
import { register } from '@/services/auth-service'; // Keep registration
import { requestPasswordReset, resetPassword } from '@/lib/password-reset';
import { verifyEmail } from '@/lib/email-verification';
// login, logout replaced by NextAuth signIn/signOut
```

**Estimated Time**: 2-3 hours

---

### ✅ Task 3.2: Delete Session Service

**Priority**: 🔴 CRITICAL

**File to DELETE**: `src/services/session-service.ts` (281 lines)

**Replacement**: NextAuth JWT (stateless)

**Steps**:
1. Search for all imports of `session-service.ts` or `SessionService`
2. Update code to use NextAuth session access methods
3. Delete file

**Code Migration Example**:
```typescript
// Before (using SessionService)
import { SessionService } from '@/services/session-service';

export async function GET(request: NextRequest) {
  const sessionId = request.cookies.get('sessionId')?.value;
  const session = await SessionService.getSession(sessionId);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.userId;
  const storeId = session.storeId;
  // ...
}

// After (using NextAuth)
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = session.user.id;
  const storeId = session.user.storeId;
  // ...
}
```

**Estimated Time**: 3-4 hours

---

### ✅ Task 3.3: Delete Session Storage

**Priority**: 🔴 CRITICAL

**File to DELETE**: `src/lib/session-storage.ts` (285 lines)

**Replacement**: NextAuth JWT (stateless, no storage needed)

**Cost Savings**: $240-1,200/year (Vercel KV no longer needed for sessions)

**Steps**:
1. Search for all imports of `session-storage.ts`
2. Verify SessionService deletion (Task 3.2) removed all usages
3. Delete file
4. Remove Vercel KV environment variables (optional, keep if used for other features):
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

**Estimated Time**: 1 hour

---

## 📋 Phase 4: Update Client Code (Week 2-3)

### ✅ Task 4.1: Update Login Page

**Priority**: 🔴 CRITICAL

**File to UPDATE**: `src/app/login/page.tsx` (assumed)

**Changes**:
1. Import `signIn` from next-auth/react
2. Replace custom fetch to `/api/auth/login` with `signIn('credentials')`
3. Handle NextAuth errors (INVALID_CREDENTIALS, ACCOUNT_LOCKED, EMAIL_NOT_VERIFIED)
4. Update form submission handler

**Code Example**: See Task 2.1

**Estimated Time**: 1-2 hours

---

### ✅ Task 4.2: Search and Update All Auth Hook Usages

**Priority**: 🔴 HIGH

**Search Query**: `useCustomAuth|getSession|SessionService|/api/auth/login|/api/auth/logout|/api/auth/custom-session`

**Files to UPDATE**: All client components calling custom auth

**Changes**:
1. Replace custom auth hooks with NextAuth hooks
2. Replace direct API calls with NextAuth functions
3. Update session access patterns

**Verification Script**:
```powershell
# Search for custom auth patterns
grep -r "fetch.*\/api\/auth\/login" src/
grep -r "fetch.*\/api\/auth\/logout" src/
grep -r "fetch.*\/api\/auth\/custom-session" src/
grep -r "SessionService" src/
grep -r "getSession.*sessionId" src/
```

**Estimated Time**: 4-6 hours

---

### ✅ Task 4.3: Update Navigation Components

**Priority**: 🟡 MEDIUM

**Files to UPDATE**:
- `src/components/DashboardNavbar.tsx` (if exists)
- `src/components/Navbar.tsx` (if exists)
- Any components with login/logout buttons

**Changes**:
1. Import `useSession` from next-auth/react
2. Import `signOut` from next-auth/react
3. Replace custom auth state with NextAuth session

**Code Example**:
```typescript
// Before
const [user, setUser] = useState(null);

useEffect(() => {
  fetch('/api/auth/custom-session')
    .then(res => res.json())
    .then(data => setUser(data.user));
}, []);

// After
import { useSession, signOut } from 'next-auth/react';

const { data: session, status } = useSession();
const user = session?.user;
const isLoading = status === 'loading';
```

**Estimated Time**: 2-3 hours

---

## 📋 Phase 5: Update Server Code (Week 3)

### ✅ Task 5.1: Update All API Routes

**Priority**: 🔴 CRITICAL

**Search Query**: `getSession|SessionService|session-storage`

**Files to UPDATE**: All API routes using custom session

**Changes**:
1. Replace `getSession(sessionId)` with `getServerSession(authOptions)`
2. Replace `SessionService.getSession()` with `getServerSession(authOptions)`
3. Update session access (session.userId → session.user.id)

**Verification Script**:
```powershell
# Find API routes using custom session
grep -r "getSession.*sessionId" src/app/api/
grep -r "SessionService" src/app/api/
grep -r "session-storage" src/app/api/
```

**Code Example**: See Task 3.2

**Estimated Time**: 6-8 hours (depends on number of API routes)

---

### ✅ Task 5.2: Update All Server Components

**Priority**: 🔴 HIGH

**Search Query**: `getSessionFromCookies|session-storage`

**Files to UPDATE**: All server components using custom session

**Changes**:
1. Replace `getSessionFromCookies()` with `getServerSession(authOptions)`
2. Update session access patterns
3. Update redirect logic for unauthenticated users

**Code Example**:
```typescript
// Before
import { getSessionFromCookies } from '@/lib/session-storage';

export default async function DashboardPage() {
  const session = await getSessionFromCookies();
  
  if (!session) {
    redirect('/login');
  }
  
  const userId = session.userId;
  const storeId = session.storeId;
  // ...
}

// After
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }
  
  const userId = session.user.id;
  const storeId = session.user.storeId;
  // ...
}
```

**Estimated Time**: 4-6 hours

---

### ✅ Task 5.3: Update Forgot Password / Reset Password Routes

**Priority**: 🟡 MEDIUM

**Files to UPDATE**:
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`

**Changes**:
1. Import from `src/lib/password-reset.ts` instead of `src/services/auth-service.ts`
2. Verify functionality unchanged

**Code Example**:
```typescript
// Before
import { requestPasswordReset, resetPassword } from '@/services/auth-service';

// After
import { requestPasswordReset, resetPassword } from '@/lib/password-reset';
```

**Estimated Time**: 30 minutes

---

## 📋 Phase 6: Update Tests (Week 3-4)

### ✅ Task 6.1: Remove Custom Auth Test Mocks

**Priority**: 🟡 MEDIUM

**File to UPDATE**: `tests/integration/auth.test.ts`

**Changes**:
1. Remove MockAuthService class
2. Replace with NextAuth mocks

**Estimated Time**: 1-2 hours

---

### ✅ Task 6.2: Update Test Setup

**Priority**: 🔴 HIGH

**File to UPDATE**: `tests/setup.ts`

**Changes**:
1. Add NextAuth mocks (getServerSession, useSession, signIn, signOut)
2. Remove custom auth mocks (if any)

**Code Example**:
```typescript
// tests/setup.ts
import { jest } from '@jest/globals';

jest.mock('next-auth', () => ({
  default: jest.fn(),
  getServerSession: jest.fn(() => Promise.resolve({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'STORE_ADMIN',
      storeId: 'test-store-id',
    },
  })),
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
  signIn: jest.fn(() => Promise.resolve({ ok: true, error: null })),
  signOut: jest.fn(() => Promise.resolve()),
  SessionProvider: ({ children }: any) => children,
}));
```

**Estimated Time**: 2-3 hours

---

### ✅ Task 6.3: Update All Test Files

**Priority**: 🟡 MEDIUM

**Search Query**: `MockAuthService|auth-service|session-service|/api/auth/login`

**Files to UPDATE**: All test files using custom auth

**Changes**:
1. Replace custom auth mocks with NextAuth mocks
2. Update test expectations
3. Verify all tests pass

**Estimated Time**: 4-6 hours

---

## 📋 Phase 7: Documentation Updates (Week 4)

### ✅ Task 7.1: Update Spec Documentation

**Priority**: 🟡 MEDIUM

**File to UPDATE**: `specs/001-multi-tenant-ecommerce/spec.md`

**Changes**:
1. Mark Task T022 as COMPLETE
2. Remove note about "legacy custom implementation"
3. Document migration completion date

**Estimated Time**: 30 minutes

---

### ✅ Task 7.2: Update README

**Priority**: 🟡 MEDIUM

**File to UPDATE**: `README.md`

**Changes**:
1. Update authentication section to mention NextAuth only
2. Remove references to custom auth endpoints
3. Update environment variables (remove KV if unused)

**Estimated Time**: 30 minutes

---

### ✅ Task 7.3: Update Developer Guide

**Priority**: 🟡 MEDIUM

**File to UPDATE**: `docs/developer-guide.md`

**Changes**:
1. Update authentication guide with NextAuth examples
2. Remove custom auth examples
3. Add password reset utility documentation

**Estimated Time**: 1-2 hours

---

### ✅ Task 7.4: Update Copilot Instructions

**Priority**: 🔴 HIGH

**File to UPDATE**: `.github/copilot-instructions.md`

**Changes**:
1. Update authentication section (see Appendix 8.2 in audit report)
2. Add DO NOT rules for custom auth
3. Add DO rules for NextAuth

**Estimated Time**: 1 hour

---

## 📋 Phase 8: Deployment & Verification (Week 4)

### ✅ Task 8.1: Deploy to Development

**Priority**: 🔴 CRITICAL

**Steps**:
1. Merge migration branch to development
2. Deploy to development environment
3. Run E2E tests
4. Manual testing checklist

**Testing Checklist**:
- [ ] Login with email/password
- [ ] Logout
- [ ] Access dashboard (protected route)
- [ ] Access admin (role-based access)
- [ ] Password reset flow
- [ ] Registration flow
- [ ] MFA flow (if applicable)
- [ ] Account lockout (5 failed attempts)
- [ ] Email verification enforcement

**Estimated Time**: 2-3 hours

---

### ✅ Task 8.2: Deploy to Staging

**Priority**: 🔴 CRITICAL

**Steps**:
1. Merge development to staging
2. Deploy to staging environment
3. Run full E2E test suite
4. Load testing
5. Security audit

**Testing Checklist**:
- [ ] All development tests pass
- [ ] Load test: 100 concurrent logins
- [ ] Security scan: OWASP ZAP
- [ ] Performance test: Login < 2 seconds
- [ ] JWT validation performance

**Estimated Time**: 4-6 hours

---

### ✅ Task 8.3: Deploy to Production

**Priority**: 🔴 CRITICAL

**Steps**:
1. Schedule deployment during low-traffic window
2. Send user communication: "We've upgraded our authentication system. Please log in again."
3. Deploy to production
4. Monitor error rates
5. Monitor authentication metrics

**Rollback Plan**:
- Keep custom auth code in separate branch for 2 weeks
- If critical issues, rollback to previous version
- Fix issues and redeploy

**Monitoring**:
- [ ] Login success rate > 95%
- [ ] JWT validation latency < 50ms
- [ ] Error rate < 1%
- [ ] User session creation rate normal
- [ ] No reports of authentication failures

**Estimated Time**: 3-4 hours + monitoring

---

## 📋 Summary Checklist

### Week 1: Foundation

- [ ] Task 1.1: Create password-reset.ts utility (2-3 hrs)
- [ ] Task 1.2: Create email-verification.ts utility (1-2 hrs)
- [ ] Task 1.3: Update registration endpoint (30 min)
- [ ] Task 2.1: Delete custom login endpoint (2-3 hrs)
- [ ] Task 2.2: Delete custom logout endpoint (1-2 hrs)
- [ ] Task 2.3: Delete custom session endpoint (2-3 hrs)

**Total Week 1**: 9-14 hours

---

### Week 2: Core Migration

- [ ] Task 3.1: Move reusable functions from auth-service (2-3 hrs)
- [ ] Task 3.2: Delete session-service.ts (3-4 hrs)
- [ ] Task 3.3: Delete session-storage.ts (1 hr)
- [ ] Task 4.1: Update login page (1-2 hrs)
- [ ] Task 4.2: Update all auth hook usages (4-6 hrs)
- [ ] Task 4.3: Update navigation components (2-3 hrs)

**Total Week 2**: 13-19 hours

---

### Week 3: Server Code

- [ ] Task 5.1: Update all API routes (6-8 hrs)
- [ ] Task 5.2: Update all server components (4-6 hrs)
- [ ] Task 5.3: Update forgot/reset password routes (30 min)
- [ ] Task 6.1: Remove custom auth test mocks (1-2 hrs)
- [ ] Task 6.2: Update test setup (2-3 hrs)
- [ ] Task 6.3: Update all test files (4-6 hrs)

**Total Week 3**: 17-25 hours

---

### Week 4: Documentation & Deployment

- [ ] Task 7.1: Update spec documentation (30 min)
- [ ] Task 7.2: Update README (30 min)
- [ ] Task 7.3: Update developer guide (1-2 hrs)
- [ ] Task 7.4: Update copilot instructions (1 hr)
- [ ] Task 8.1: Deploy to development (2-3 hrs)
- [ ] Task 8.2: Deploy to staging (4-6 hrs)
- [ ] Task 8.3: Deploy to production (3-4 hrs)

**Total Week 4**: 12-17 hours

---

## 📊 Total Effort Estimate

| Phase | Hours | Days (8hr) |
|-------|-------|------------|
| Week 1 | 9-14 | 1-2 |
| Week 2 | 13-19 | 2-3 |
| Week 3 | 17-25 | 2-3 |
| Week 4 | 12-17 | 2-3 |
| **Total** | **51-75** | **7-11** |

**Recommended Timeline**: 4 weeks (1 developer, part-time ~15-20 hrs/week)

---

## 🎯 Success Criteria

### Functional Requirements

- [ ] All users can log in using NextAuth signIn()
- [ ] All users can log out using NextAuth signOut()
- [ ] All protected routes accessible after NextAuth login
- [ ] Registration creates NextAuth-compatible accounts
- [ ] Password reset works with new utility
- [ ] Email verification works
- [ ] MFA works with NextAuth
- [ ] Account lockout works (5 attempts, 30 min)
- [ ] Role-based access control works (SuperAdmin, STORE_ADMIN, STAFF, CUSTOMER)
- [ ] Multi-tenant isolation works (storeId in session)

### Non-Functional Requirements

- [ ] Login performance: < 2 seconds (p95)
- [ ] JWT validation: < 50ms (p95)
- [ ] Error rate: < 1%
- [ ] Test coverage: > 80%
- [ ] Zero critical security vulnerabilities
- [ ] Zero authentication-related production incidents

### Code Quality

- [ ] Zero references to custom auth endpoints
- [ ] Zero references to session-storage.ts
- [ ] Zero references to auth-service.ts (except registration)
- [ ] All tests pass
- [ ] ESLint passes
- [ ] TypeScript strict mode passes

---

## 📞 Support & Escalation

**Questions or blockers during migration?**

1. Review AUTHENTICATION_AUDIT_REPORT.md for detailed context
2. Check NextAuth.js v4 documentation: https://next-auth.js.org/
3. Review existing NextAuth implementation in `src/app/api/auth/[...nextauth]/route.ts`
4. Escalate to tech lead if blocked > 4 hours

---

**END OF REFACTORING PLAN**
