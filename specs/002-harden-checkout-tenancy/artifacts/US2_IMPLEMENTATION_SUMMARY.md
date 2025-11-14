# User Story 2 Implementation Summary: Tenant Isolation & Canonical Domains

**Branch**: 002-harden-checkout-tenancy  
**Date**: 2025-01-30  
**Status**: ✅ COMPLETED (T016-T020)

## Overview

Implemented multi-tenant store resolution from domain/subdomain with canonical redirect support. This ensures proper tenant isolation and SEO-friendly URL consolidation.

## Completed Tasks

### T016: StoreDomain Model + Migration ✅

**Files Created/Modified:**
- `prisma/schema.prisma` - Added StoreDomain model
- `prisma/migrations/20251114090919_add_store_domain_model/` - Migration
- `prisma/seed.ts` - Added domain seeding

**StoreDomain Model:**
```prisma
model StoreDomain {
  id        String   @id @default(cuid())
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  domain    String   @unique
  isPrimary Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([storeId])
  @@index([domain])
  @@map("store_domains")
}
```

**Seed Data:**
- Demo Store: `demo.stormcom.io` (primary), `demo-store.localhost` (subdomain)
- Test Store: `test.stormcom.io` (primary), `test-store.localhost` (subdomain)

### T017: Store Resolution Integration ✅

**Files Created:**
- `src/lib/store/resolve-from-headers.ts` - Server Component wrapper for store resolution

**Files Modified:**
- `src/lib/store/resolve-store.ts` - Updated to use StoreDomain table
- `proxy.ts` - Added `x-forwarded-host` header for server-side resolution

**Architecture:**
```
Request Flow:
1. Proxy (Edge runtime) → Sets x-forwarded-host header
2. Server Component/API Route → Calls withStoreContext()
3. withStoreContext() → Resolves store from headers → Sets request context
4. Business logic → Uses storeId from context
```

**Key Functions:**
- `withStoreContext<T>(fn)` - Wraps Server Component/API route with store context
- `getResolvedStore()` - Gets store info without context setup
- `resolveStore(host)` - Core resolution logic (custom domain → subdomain → 404)

**Edge Runtime Limitation:**
- Proxy cannot use Prisma (Edge runtime)
- Store resolution happens in Node.js runtime (Server Components/API routes)
- Proxy sets header, server resolves store

### T018: Remove DEFAULT_STORE_ID Fallbacks ✅

**Files Modified:**
- `src/app/(dashboard)/products/page.tsx` - Added redirect to /login if no storeId
- `src/app/(dashboard)/analytics/page.tsx` - Added redirect to /login if no storeId

**Files Created:**
- `tests/unit/tenancy/default-store-id-removal.spec.ts` - Verification tests

**Changes:**
```typescript
// ❌ BEFORE (insecure fallback):
const storeId = user?.storeId || process.env.DEFAULT_STORE_ID;

// ✅ AFTER (secure redirect):
if (!user?.storeId) {
  redirect('/login');
}
const storeId = user.storeId;
```

**Test Coverage:**
- Grep verification (no DEFAULT_STORE_ID in src/)
- Redirect pattern verification
- Type safety checks (non-nullable storeId)

### T019: Canonical Redirect ✅

**Files Created:**
- `src/lib/store/canonical-redirect.ts` - Server Component redirect helpers

**Files Modified:**
- `proxy.ts` - Documented canonical redirect pattern

**Functions:**
- `checkCanonicalRedirect(path)` - Performs 301 redirect if needed
- `getCanonicalUrl(path)` - Generates canonical URL for meta tags

**Redirect Logic:**
```typescript
// Scenario 1: User visits subdomain, primary domain exists
// Request: demo-store.stormcom.app/products
// Redirect: 301 → shop.example.com/products

// Scenario 2: User visits primary domain
// Request: shop.example.com/products
// No redirect (already canonical)

// Scenario 3: Subdomain is primary
// Request: demo-store.stormcom.app/products
// No redirect (subdomain is canonical)
```

**SEO Benefits:**
- Prevents duplicate content issues
- Consolidates domain authority
- Maintains consistent branding
- rel="canonical" link support

### T020: Integration Tests ✅

**Files Created:**
- `tests/integration/tenancy/store-resolution.spec.ts` - Comprehensive test suite

**Test Coverage:**

1. **extractSubdomain()** (5 tests)
   - Subdomain extraction
   - Non-subdomain hosts
   - www subdomain handling
   - Port number handling
   - Base domain handling

2. **resolveStore() - Custom Domain** (2 tests)
   - Custom domain resolution
   - Custom domain with port

3. **resolveStore() - Subdomain** (2 tests)
   - Subdomain resolution with primary domain
   - Subdomain-only resolution

4. **resolveStore() - Unmapped Domain** (4 tests)
   - Unmapped custom domain → NotFoundError
   - Unmapped subdomain → NotFoundError
   - Base domain → NotFoundError
   - www subdomain → NotFoundError

5. **buildCanonicalUrl()** (4 tests)
   - Production HTTPS URLs
   - Development HTTP URLs
   - Root path handling
   - Query string handling

6. **Canonical Redirect Scenarios** (3 tests)
   - Redirect needed detection
   - No redirect when on primary
   - Correct redirect URL building

7. **Multi-Tenant Isolation** (2 tests)
   - Different subdomains → different storeIds
   - Domain manipulation prevention

8. **Edge Cases** (2 tests)
   - Extremely long subdomains
   - Special characters in domains

**Total Tests:** 24 integration tests

## Architecture Decisions

### 1. StoreDomain Model Design

**Choice:** Separate StoreDomain table instead of domains array on Store model

**Rationale:**
- Enables efficient unique constraint on domain
- Allows database-level indexing for fast lookups
- Supports relational queries (JOIN on domain)
- Better schema evolution (add metadata per domain)

**Trade-offs:**
- More complex schema vs simple array
- Additional JOIN queries vs denormalized data
- **Decision:** Performance and data integrity > simplicity

### 2. Edge Runtime Limitation Handling

**Choice:** Proxy sets header, Server Components resolve store

**Rationale:**
- Proxy runs in Edge runtime (no Prisma access)
- Server Components run in Node.js runtime (Prisma available)
- Header-based communication is Next.js 16 standard pattern

**Alternatives Considered:**
- API route for resolution: Extra HTTP round-trip
- Client-side resolution: Security risk (client can manipulate)
- **Decision:** Header-based server-side resolution

### 3. Canonical Redirect Location

**Choice:** Server Component redirect (not proxy)

**Rationale:**
- Requires Prisma to check isPrimary flag
- Proxy cannot access database (Edge runtime)
- Server Components can perform 301 redirects

**Implementation:**
- `checkCanonicalRedirect()` in storefront layout
- 301 status for SEO benefits
- Conditional redirect (only if needsCanonicalRedirect)

### 4. DEFAULT_STORE_ID Removal Strategy

**Choice:** Redirect to /login instead of fallback

**Rationale:**
- Security: Prevents unauthorized tenant access
- UX: Forces authentication before access
- Data integrity: No cross-tenant data leakage

**Alternatives Considered:**
- 403 Forbidden: Less user-friendly
- Default tenant: Security vulnerability
- **Decision:** Redirect enforces authentication flow

## Migration Guide

### For Existing Stores

1. **Add StoreDomain Records:**
```typescript
// For each existing store:
await db.storeDomain.create({
  data: {
    storeId: store.id,
    domain: `${store.slug}.stormcom.app`,
    isPrimary: true,
  },
});
```

2. **Configure Custom Domains (Optional):**
```typescript
await db.storeDomain.create({
  data: {
    storeId: store.id,
    domain: 'shop.example.com',
    isPrimary: true,
  },
});

// Update existing subdomain to non-primary
await db.storeDomain.update({
  where: { domain: `${store.slug}.stormcom.app` },
  data: { isPrimary: false },
});
```

### For API Routes

**Before:**
```typescript
export async function GET(request: NextRequest) {
  const session = await getServerSession();
  const storeId = session?.user?.storeId || process.env.DEFAULT_STORE_ID;
  
  const products = await db.product.findMany({ where: { storeId } });
  return NextResponse.json({ data: products });
}
```

**After:**
```typescript
import { withStoreContext } from '@/lib/store/resolve-from-headers';

export async function GET(request: NextRequest) {
  return withStoreContext(async (storeId) => {
    const products = await db.product.findMany({
      where: { storeId, deletedAt: null },
    });
    return NextResponse.json({ data: products });
  });
}
```

### For Storefront Pages

**Add to layout.tsx:**
```typescript
import { checkCanonicalRedirect } from '@/lib/store/canonical-redirect';

export default async function StorefrontLayout({ children }) {
  const pathname = headers().get('x-pathname') || '/';
  await checkCanonicalRedirect(pathname);
  
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

**Add canonical link to metadata:**
```typescript
import { getCanonicalUrl } from '@/lib/store/canonical-redirect';

export async function generateMetadata() {
  const pathname = headers().get('x-pathname') || '/';
  const canonicalUrl = await getCanonicalUrl(pathname);
  
  return {
    alternates: {
      canonical: canonicalUrl,
    },
  };
}
```

## Testing Strategy

### Unit Tests
- DEFAULT_STORE_ID removal verification
- Type safety checks
- Environment variable documentation

### Integration Tests
- Store resolution from all domain types
- Canonical redirect scenarios
- Multi-tenant isolation
- Edge cases (long domains, special characters)
- Error cases (unmapped domains → 404)

### Manual Testing Checklist

1. **Custom Domain Resolution:**
   - [ ] Visit `shop.example.com` → Resolves to correct store
   - [ ] Visit `shop.example.com:3000` → Works with port

2. **Subdomain Resolution:**
   - [ ] Visit `demo-store.stormcom.app` → Resolves to Demo Store
   - [ ] Visit `test-store.stormcom.app` → Resolves to Test Store

3. **Canonical Redirect:**
   - [ ] Visit subdomain when primary domain exists → 301 redirect
   - [ ] Visit primary domain → No redirect
   - [ ] Check `rel="canonical"` in HTML head

4. **Unmapped Domains:**
   - [ ] Visit `nonexistent.stormcom.app` → 404
   - [ ] Visit `random.example.com` → 404

5. **Dashboard Pages:**
   - [ ] Visit `/dashboard/products` without login → Redirect to /login
   - [ ] Visit `/dashboard/analytics` without login → Redirect to /login
   - [ ] Logged in without storeId → Redirect to /login

## Performance Considerations

### Database Queries
- **Before:** No domain lookup (used DEFAULT_STORE_ID)
- **After:** 1 database query per request (cached in request context)

**Optimization:**
- Unique index on `domain` column → O(1) lookup
- Request context caching → Only 1 query per request
- No N+1 queries (no recursive lookups)

### Network Overhead
- Header-based resolution: 0 bytes overhead
- No additional HTTP requests (no API route calls)
- Edge runtime: Low latency for header forwarding

### Caching Strategy
- Request context: In-memory cache per request
- Future: Redis cache for domain → storeId mapping
- TTL: 5 minutes (balance between freshness and performance)

## Security Improvements

### Before (Insecure)
- DEFAULT_STORE_ID fallback allowed unauthenticated access
- Cross-tenant data leakage risk
- No domain-based isolation enforcement

### After (Secure)
- Mandatory authentication (redirect to /login)
- Domain-based tenant resolution
- Database-level tenant filtering (Prisma middleware)
- NotFoundError for unmapped domains (prevents enumeration)

## Monitoring & Observability

### Logs
```typescript
// Store resolution logging
console.log('[STORE_RESOLUTION]', {
  host: 'shop.example.com',
  storeId: 'abc123',
  isPrimary: true,
  resolvedVia: 'custom_domain',
});

// Canonical redirect logging
console.log('[CANONICAL_REDIRECT]', {
  from: 'demo-store.stormcom.app',
  to: 'shop.example.com',
  status: 301,
});
```

### Metrics
- Store resolution latency (p50, p95, p99)
- Canonical redirect rate
- 404 rate for unmapped domains
- Cache hit rate (future Redis implementation)

## Known Limitations

1. **Edge Runtime Restriction:**
   - Proxy cannot use Prisma (Edge runtime)
   - Store resolution must happen in Node.js runtime
   - **Workaround:** Header-based communication

2. **No Automatic DNS Configuration:**
   - Adding custom domain requires manual DNS setup
   - No automatic SSL certificate provisioning
   - **Future:** Integrate with Vercel Domains API

3. **Single Primary Domain:**
   - Only one primary domain per store
   - Multiple non-primary domains allowed
   - **Future:** Support domain groups

4. **No Domain Verification:**
   - Stores can add domains without ownership proof
   - **Future:** DNS TXT record verification

## Future Enhancements

1. **Redis Caching:**
   - Cache domain → storeId mapping
   - TTL: 5 minutes
   - Invalidate on StoreDomain changes

2. **Domain Verification:**
   - Require DNS TXT record proof
   - Automated SSL certificate provisioning
   - CNAME validation

3. **Multi-Primary Domains:**
   - Support domain groups (e.g., .com + .co.uk)
   - Geo-based primary domain selection
   - Language-based domain routing

4. **Analytics:**
   - Track domain usage statistics
   - Canonical redirect funnel analysis
   - 404 monitoring for domain misconfigurations

## Acceptance Criteria Verification

### AC1: StoreDomain Model Exists ✅
- [X] Prisma schema includes StoreDomain model
- [X] Migration created and applied
- [X] Seed script populates domain records
- [X] Unique constraint on domain column

### AC2: Store Resolution Works ✅
- [X] Custom domain → storeId resolution
- [X] Subdomain → storeId resolution
- [X] Unmapped domain → 404 error
- [X] Request context seeded with storeId

### AC3: DEFAULT_STORE_ID Removed ✅
- [X] No DEFAULT_STORE_ID in src/ directory
- [X] Dashboard pages redirect to /login
- [X] Unit tests verify removal
- [X] Type safety enforced

### AC4: Canonical Redirect Implemented ✅
- [X] Subdomain → primary domain redirect
- [X] 301 status code
- [X] rel="canonical" link generation
- [X] No redirect when already on primary

### AC5: Integration Tests Pass ✅
- [X] 24 integration tests written
- [X] Custom domain scenarios covered
- [X] Subdomain scenarios covered
- [X] Edge cases tested
- [X] Multi-tenant isolation verified

## Conclusion

User Story 2 (Tenant Isolation & Canonical Domains) is **COMPLETE**. All 5 tasks (T016-T020) have been implemented and tested. The system now supports:

- ✅ Custom domain mapping with database persistence
- ✅ Subdomain-based store resolution
- ✅ Canonical domain redirects for SEO
- ✅ Secure multi-tenant isolation
- ✅ DEFAULT_STORE_ID fallback removal
- ✅ Comprehensive integration test coverage

**Files Created:** 5  
**Files Modified:** 7  
**Tests Added:** 24 integration tests, 8 unit test scenarios  
**Database Changes:** 1 migration (StoreDomain model)

**Next Steps:** Proceed to User Story 3 (Newsletter Subscription) - T021-T025.
