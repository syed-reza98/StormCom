# NextAuth CLIENT_FETCH_ERROR Fix

**Date**: 2025-11-09  
**Error**: `[next-auth][error][CLIENT_FETCH_ERROR] "No session token provided"`  
**Next.js Version**: 16.0.1 (Turbopack)  
**NextAuth Version**: 4.24.13

## Problem Description

The application was experiencing a `CLIENT_FETCH_ERROR` from NextAuth with the message "No session token provided". This error occurred because:

1. **Route Conflict**: There was a custom `/api/auth/session` route that conflicted with NextAuth's built-in session endpoint
2. **Missing basePath**: The `SessionProvider` wasn't configured with an explicit `basePath`
3. **Missing Environment Validation**: No validation that `NEXTAUTH_SECRET` was loaded

## Root Cause

NextAuth expects to own the `/api/auth/*` routes, including `/api/auth/session`. The application had a custom session management system (SessionService) that created its own `/api/auth/session` endpoint, which returned:

```json
{ "error": { "code": "UNAUTHORIZED", "message": "No session token provided" } }
```

When NextAuth's client tried to fetch the session, it received this error response instead of the expected NextAuth session data.

## Changes Made

### 1. Moved Custom Session Route

**Before**: `src/app/api/auth/session/route.ts`  
**After**: `src/app/api/auth/custom-session/route.ts`

This allows NextAuth to handle `/api/auth/session` while preserving the custom SessionService functionality under a different endpoint.

### 2. Updated SessionProvider Configuration

**File**: `src/providers/session-provider.tsx`

```typescript
export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider 
      session={session} 
      basePath="/api/auth"           // ✅ Explicit basePath
      refetchInterval={5 * 60}
      refetchOnWindowFocus={true}     // ✅ Auto-refetch on focus
    >
      {children}
    </NextAuthSessionProvider>
  );
}
```

**Changes**:
- Added explicit `basePath="/api/auth"` to ensure NextAuth knows where to find its API routes
- Added `refetchOnWindowFocus={true}` for better session synchronization

### 3. Added Environment Variable Validation

**File**: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required');
}

if (!process.env.NEXTAUTH_URL) {
  console.warn('NEXTAUTH_URL environment variable is not set. Using default: http://localhost:3000');
}
```

This ensures the application fails fast with a clear error if critical environment variables are missing.

### 4. Enhanced NextAuth Configuration

**File**: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
export const authOptions: NextAuthOptions = {
  // Secret for JWT encryption and CSRF protection
  secret: process.env.NEXTAUTH_SECRET,  // ✅ Explicit secret
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60,
  },
  // ... rest of configuration
};
```

**Changes**:
- Added explicit `secret` property to `authOptions` (recommended for Next.js 16)

### 5. Created Test Endpoint

**File**: `src/app/api/auth/test/route.ts`

A diagnostic endpoint to verify NextAuth configuration:

```bash
# Test endpoint
curl http://localhost:3000/api/auth/test
```

Returns:
```json
{
  "success": true,
  "hasSession": false,
  "session": null,
  "env": {
    "hasSecret": true,
    "hasUrl": true,
    "nodeEnv": "development"
  }
}
```

## Verification Steps

1. **Stop the dev server** if running:
   ```bash
   # Press Ctrl+C in terminal
   ```

2. **Restart the dev server**:
   ```bash
   npm run dev
   ```

3. **Verify environment variables**:
   ```bash
   # Check .env file contains:
   # NEXTAUTH_SECRET="d0100e34088ba2052854abf0ee63d4942e7c42d9c35d708858f3eaae137c3553"
   # NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Test NextAuth session endpoint**:
   ```bash
   # Should return NextAuth session data (not custom session error)
   curl http://localhost:3000/api/auth/session
   ```

5. **Test the application**:
   - Navigate to `http://localhost:3000/login`
   - Login with test credentials
   - Verify no console errors
   - Verify session is established

## Architecture Notes

### Two Session Systems

The application now has TWO distinct session systems:

1. **NextAuth Sessions** (`/api/auth/*`)
   - JWT-based
   - Used by `useSession()` hook
   - Managed by NextAuth.js
   - Routes: `/api/auth/session`, `/api/auth/signin`, `/api/auth/signout`, etc.

2. **Custom Sessions** (`/api/auth/custom-session`)
   - Database-backed
   - Uses `session_token` cookie
   - Managed by `SessionService`
   - Route: `/api/auth/custom-session`

### Migration Path

For future cleanup, consider:

1. **Option A**: Migrate fully to NextAuth
   - Remove `SessionService`
   - Use NextAuth's built-in session management
   - Simplify authentication flow

2. **Option B**: Keep both systems
   - Use NextAuth for authentication
   - Use custom SessionService for extended session data
   - Keep endpoints separate

## Expected Behavior After Fix

✅ **No more `CLIENT_FETCH_ERROR`** in console  
✅ **NextAuth session endpoint returns proper data**  
✅ **Login flow works correctly**  
✅ **useSession hook works throughout app**  
✅ **Session persists across page refreshes**

## Related Files

- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth configuration
- `src/providers/session-provider.tsx` - SessionProvider wrapper
- `src/app/api/auth/custom-session/route.ts` - Custom session endpoint (renamed)
- `src/services/session-service.ts` - Custom session service
- `.env` - Environment variables

## References

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Next.js 16 App Router](https://nextjs.org/docs/app)
- [NextAuth with Next.js 16](https://next-auth.js.org/configuration/initialization#route-handlers-app)
