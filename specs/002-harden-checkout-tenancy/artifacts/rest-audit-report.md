# REST API Audit Report (T042)

**Date**: 2025-01-25  
**Status**: 🔴 5 HIGH severity violations found  
**Total Routes Scanned**: 72  
**Routes with Violations**: 67

---

## Executive Summary

Comprehensive audit of all API routes in `src/app/api/**/route.ts` revealed **77 violations** across **67 routes**:

### Violations by Severity:
- **🔴 HIGH (5)**: PUT methods without idempotency handling
- **🟡 MEDIUM (5)**: Stray `success: true` flags
- **🔵 LOW (67)**: Missing OPTIONS handlers

### Critical Findings:

#### 1. PUT without Idempotency (5 HIGH severity)
**Impact**: Duplicate request execution risk (network retries, client errors)

**Affected Routes**:
1. `src/app/api/notifications/[id]/read/route.ts` (Line 42)
2. `src/app/api/orders/[id]/status/route.ts` (Line 28)
3. `src/app/api/products/[id]/route.ts` (Line 48)
4. `src/app/api/stores/[id]/route.ts` (Line 226)
5. `src/app/api/stores/[id]/theme/route.ts` (Line 41)

**Remediation**: Add idempotency key handling to all PUT handlers

#### 2. Stray Success Flags (5 MEDIUM severity)
**Impact**: Inconsistent API response format

**Affected Routes**:
1. `src/app/api/auth/test/route.ts` (Line 11)
2. `src/app/api/emails/send/route.ts` (Line 268)
3. `src/app/api/integrations/shopify/export/route.ts` (Line 113)
4. `src/app/api/products/[id]/stock/check/route.ts` (Line 43)
5. `src/app/api/products/[id]/stock/decrease/route.ts` (Line 34)

**Remediation**: Use standardized `{ data, error, meta }` response format

#### 3. Missing OPTIONS Handlers (67 LOW severity)
**Impact**: Limited CORS support for public APIs

**Remediation**: Add OPTIONS handlers to routes requiring CORS (external integrations, webhooks)

---

## Detailed Findings

### HIGH Severity: PUT without Idempotency

#### 1. Notifications Read Endpoint

**File**: `src/app/api/notifications/[id]/read/route.ts` (Line 42)

**Current Code**:
```typescript
export async function PUT(
  request: NextRequest,
  context: Context
): Promise<NextResponse> {
  const { id } = await context.params;
  
  // Mark notification as read
  await db.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });
  
  return NextResponse.json({ data: { success: true } });
}
```

**Issue**: If client retries due to network timeout, notification may be marked read multiple times (harmless but wasteful).

**Remediation**:
```typescript
export async function PUT(
  request: NextRequest,
  context: Context
): Promise<NextResponse> {
  const { id } = await context.params;
  
  // Check idempotency key
  const idempotencyKey = request.headers.get('idempotency-key');
  
  if (idempotencyKey) {
    // Check cache for previous execution
    const cached = await getCachedIdempotentResult(idempotencyKey);
    if (cached) {
      return NextResponse.json(cached);
    }
  }
  
  // Mark notification as read (idempotent operation)
  const notification = await db.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });
  
  const response = { data: notification };
  
  // Cache result if idempotency key provided
  if (idempotencyKey) {
    await cacheIdempotentResult(idempotencyKey, response);
  }
  
  return NextResponse.json(response);
}
```

**Deadline**: 2025-02-01 (Priority: HIGH - affects user experience)

---

#### 2. Order Status Update

**File**: `src/app/api/orders/[id]/status/route.ts` (Line 28)

**Current Code**:
```typescript
export async function PUT(
  request: NextRequest,
  context: Context
): Promise<NextResponse> {
  const { id } = await context.params;
  const { status } = await request.json();
  
  // Update order status
  const order = await db.order.update({
    where: { id },
    data: { status },
  });
  
  return NextResponse.json({ data: order });
}
```

**Issue**: Duplicate status update could trigger double notifications, inventory changes, payment captures.

**Remediation**:
```typescript
export async function PUT(
  request: NextRequest,
  context: Context
): Promise<NextResponse> {
  const { id } = await context.params;
  const idempotencyKey = request.headers.get('idempotency-key');
  
  if (!idempotencyKey) {
    return NextResponse.json(
      { error: { code: 'MISSING_IDEMPOTENCY_KEY', message: 'Idempotency-Key header required for PUT' } },
      { status: 400 }
    );
  }
  
  // Check cache
  const cached = await getCachedIdempotentResult(idempotencyKey);
  if (cached) {
    return NextResponse.json(cached);
  }
  
  const { status } = await request.json();
  
  // Update order status in transaction
  const order = await db.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id },
      data: { status },
    });
    
    // Trigger side effects (notifications, inventory) with idempotency
    await handleOrderStatusChange(updated, idempotencyKey);
    
    return updated;
  });
  
  const response = { data: order };
  await cacheIdempotentResult(idempotencyKey, response);
  
  return NextResponse.json(response);
}
```

**Deadline**: 2025-02-01 (Priority: CRITICAL - affects order fulfillment)

---

#### 3. Product Update

**File**: `src/app/api/products/[id]/route.ts` (Line 48)

**Current Code**:
```typescript
export async function PUT(
  request: NextRequest,
  context: Context
): Promise<NextResponse> {
  const { id } = await context.params;
  const body = await request.json();
  
  const product = await db.product.update({
    where: { id },
    data: body,
  });
  
  return NextResponse.json({ data: product });
}
```

**Issue**: Duplicate product update could invalidate cache multiple times, trigger webhooks twice.

**Remediation**:
```typescript
export async function PUT(
  request: NextRequest,
  context: Context
): Promise<NextResponse> {
  const { id } = await context.params;
  const idempotencyKey = request.headers.get('idempotency-key');
  
  if (!idempotencyKey) {
    return NextResponse.json(
      { error: { code: 'MISSING_IDEMPOTENCY_KEY', message: 'Idempotency-Key header required' } },
      { status: 400 }
    );
  }
  
  const cached = await getCachedIdempotentResult(idempotencyKey);
  if (cached) return NextResponse.json(cached);
  
  const body = await request.json();
  const validation = updateProductSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', details: validation.error.flatten() } },
      { status: 400 }
    );
  }
  
  const product = await db.product.update({
    where: { id },
    data: validation.data,
  });
  
  // Invalidate cache
  revalidateTag(`products`, 'max');
  revalidateTag(`product:${id}`, 'max');
  
  const response = { data: product };
  await cacheIdempotentResult(idempotencyKey, response);
  
  return NextResponse.json(response);
}
```

**Deadline**: 2025-02-08 (Priority: HIGH - affects product catalog)

---

#### 4. Store Update

**File**: `src/app/api/stores/[id]/route.ts` (Line 226)

**Current Code**:
```typescript
export async function PUT(
  request: NextRequest,
  context: Context
): Promise<NextResponse> {
  const { id } = await context.params;
  const body = await request.json();
  
  const store = await db.store.update({
    where: { id },
    data: body,
  });
  
  return NextResponse.json({ data: store });
}
```

**Issue**: Duplicate store settings update (theme, currency, timezone) could break storefront.

**Remediation**: Same pattern as Product Update

**Deadline**: 2025-02-08 (Priority: HIGH - affects store configuration)

---

#### 5. Theme Update

**File**: `src/app/api/stores/[id]/theme/route.ts` (Line 41)

**Current Code**:
```typescript
export async function PUT(
  request: NextRequest,
  context: Context
): Promise<NextResponse> {
  const { id } = await context.params;
  const { themeId } = await request.json();
  
  const store = await db.store.update({
    where: { id },
    data: { themeId },
  });
  
  return NextResponse.json({ data: store });
}
```

**Issue**: Duplicate theme activation could invalidate CDN cache multiple times.

**Remediation**: Same pattern as Product Update

**Deadline**: 2025-02-08 (Priority: HIGH - affects storefront appearance)

---

### MEDIUM Severity: Stray Success Flags

#### 1. Auth Test Route

**File**: `src/app/api/auth/test/route.ts` (Line 11)

**Current Code**:
```typescript
return NextResponse.json({ success: true, user: session.user });
```

**Remediation**:
```typescript
return NextResponse.json({ data: { user: session.user } });
```

**Deadline**: 2025-02-15

---

#### 2. Email Send Route

**File**: `src/app/api/emails/send/route.ts` (Line 268)

**Current Code**:
```typescript
return NextResponse.json({ success: true, messageId: result.messageId });
```

**Remediation**:
```typescript
return NextResponse.json({ data: { messageId: result.messageId } });
```

**Deadline**: 2025-02-15

---

#### 3. Shopify Export

**File**: `src/app/api/integrations/shopify/export/route.ts` (Line 113)

**Current Code**:
```typescript
return NextResponse.json({ success: true, count: products.length });
```

**Remediation**:
```typescript
return NextResponse.json({ data: { count: products.length } });
```

**Deadline**: 2025-02-15

---

#### 4. Stock Check

**File**: `src/app/api/products/[id]/stock/check/route.ts` (Line 43)

**Current Code**:
```typescript
return NextResponse.json({ success: true, available: stock >= quantity });
```

**Remediation**:
```typescript
return NextResponse.json({ data: { available: stock >= quantity, stock } });
```

**Deadline**: 2025-02-15

---

#### 5. Stock Decrease

**File**: `src/app/api/products/[id]/stock/decrease/route.ts` (Line 34)

**Current Code**:
```typescript
return NextResponse.json({ success: true, newStock: product.stock });
```

**Remediation**:
```typescript
return NextResponse.json({ data: { stock: product.stock } });
```

**Deadline**: 2025-02-15

---

### LOW Severity: Missing OPTIONS Handlers

**Affected**: 67 routes (all routes except those with existing OPTIONS)

**Recommendation**: Add OPTIONS handlers only for routes requiring CORS:

**Priority Routes for OPTIONS** (external API access):
1. Webhook routes (`/api/webhooks/*`)
2. Integration routes (`/api/integrations/*`)
3. Subscription API (`/api/subscriptions/*`)
4. Public analytics (`/api/analytics/*`)

**Example OPTIONS Handler**:
```typescript
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}
```

**Deadline**: 2025-02-22 (Priority: LOW - only for public APIs)

---

## Implementation Plan

### Phase 1: Critical Fixes (Week 1 - Due 2025-02-01)

**Tasks**:
1. Add idempotency handling to order status update (`/api/orders/[id]/status`)
2. Add idempotency handling to notification read (`/api/notifications/[id]/read`)

**Deliverables**:
- ✅ Updated routes with idempotency key checking
- ✅ Cache implementation (Redis/Vercel KV)
- ✅ Integration tests for idempotency

### Phase 2: High Priority Fixes (Week 2 - Due 2025-02-08)

**Tasks**:
1. Add idempotency handling to product update (`/api/products/[id]`)
2. Add idempotency handling to store update (`/api/stores/[id]`)
3. Add idempotency handling to theme update (`/api/stores/[id]/theme`)

**Deliverables**:
- ✅ Updated routes with idempotency key checking
- ✅ Integration tests

### Phase 3: Medium Priority Fixes (Week 3 - Due 2025-02-15)

**Tasks**:
1. Replace `success: true` flags with standardized response format
2. Update client code to expect new response format

**Affected Files**:
- `src/app/api/auth/test/route.ts`
- `src/app/api/emails/send/route.ts`
- `src/app/api/integrations/shopify/export/route.ts`
- `src/app/api/products/[id]/stock/check/route.ts`
- `src/app/api/products/[id]/stock/decrease/route.ts`

**Deliverables**:
- ✅ Standardized responses
- ✅ Updated client code
- ✅ Integration tests

### Phase 4: Optional Enhancements (Week 4 - Due 2025-02-22)

**Tasks**:
1. Add OPTIONS handlers to public API routes
2. Configure CORS policies per route

**Priority Routes**:
- `/api/webhooks/*`
- `/api/integrations/*`
- `/api/subscriptions/*`

**Deliverables**:
- ✅ OPTIONS handlers
- ✅ CORS configuration
- ✅ Documentation

---

## CI Gating

### Pre-Merge Checks

**Add to `.github/workflows/ci.yml`**:
```yaml
- name: REST API Audit
  run: |
    npx tsx scripts/audit-rest-api.ts
  continue-on-error: false  # Fail PR if HIGH violations found
```

**Thresholds**:
- ❌ BLOCK: Any HIGH severity violations
- ⚠️ WARN: > 10 MEDIUM severity violations
- ✅ PASS: All violations resolved or < 10 MEDIUM

### Automated Checks

**Create** `scripts/check-rest-standards.ts`:
```typescript
// Scan for:
// 1. PUT without idempotency key check
// 2. Success flags in responses
// 3. Non-standard response format

// Exit 1 if violations found
```

---

## Testing Requirements

### Unit Tests

**Create**: `tests/unit/api/idempotency.test.ts`
```typescript
describe('Idempotency Handling', () => {
  it('should cache PUT responses', async () => {
    const key = 'test-key-123';
    const response1 = await PUT(request, { headers: { 'idempotency-key': key } });
    const response2 = await PUT(request, { headers: { 'idempotency-key': key } });
    
    expect(response1).toEqual(response2);
  });

  it('should reject PUT without idempotency key', async () => {
    const response = await PUT(request, {});
    expect(response.status).toBe(400);
  });
});
```

### Integration Tests

**Create**: `tests/integration/api/put-idempotency.test.ts`
```typescript
describe('PUT Idempotency (Integration)', () => {
  it('should handle duplicate order status updates', async () => {
    const orderId = 'order_123';
    const key = 'status-update-456';
    
    // First request
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'idempotency-key': key },
      body: JSON.stringify({ status: 'SHIPPED' }),
    });
    
    // Duplicate request (simulate network retry)
    const response2 = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'idempotency-key': key },
      body: JSON.stringify({ status: 'SHIPPED' }),
    });
    
    // Should return cached response (no double notifications)
    expect(response2.status).toBe(200);
    
    // Verify only 1 notification sent
    const notifications = await db.notification.findMany({
      where: { orderId },
    });
    expect(notifications).toHaveLength(1);
  });
});
```

---

## Migration Strategy

### Idempotency Key Infrastructure

**Create**: `src/lib/idempotency.ts`
```typescript
import { kv } from '@vercel/kv';

const CACHE_PREFIX = 'idempotency:';
const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours

export async function getCachedIdempotentResult<T>(
  key: string
): Promise<T | null> {
  return await kv.get<T>(`${CACHE_PREFIX}${key}`);
}

export async function cacheIdempotentResult<T>(
  key: string,
  result: T
): Promise<void> {
  await kv.set(`${CACHE_PREFIX}${key}`, result, { ex: CACHE_TTL_SECONDS });
}

export function requireIdempotencyKey(request: Request): string {
  const key = request.headers.get('idempotency-key');
  
  if (!key) {
    throw new Error('Idempotency-Key header required for PUT/PATCH');
  }
  
  return key;
}
```

**Usage**:
```typescript
import { getCachedIdempotentResult, cacheIdempotentResult, requireIdempotencyKey } from '@/lib/idempotency';

export async function PUT(request: NextRequest, context: Context) {
  const idempotencyKey = requireIdempotencyKey(request);
  
  const cached = await getCachedIdempotentResult(idempotencyKey);
  if (cached) return NextResponse.json(cached);
  
  // ... perform operation ...
  
  await cacheIdempotentResult(idempotencyKey, response);
  return NextResponse.json(response);
}
```

---

## Documentation Updates

### API Documentation

**Update**: `docs/api/rest-standards.md`

**Add sections**:
1. **Idempotency Keys**: All PUT/PATCH requests require `Idempotency-Key` header
2. **Response Format**: Standardized `{ data, error, meta }` format
3. **CORS Configuration**: OPTIONS handlers for public APIs
4. **Error Codes**: Standardized error code list

### Developer Guide

**Update**: `docs/developer-guide.md`

**Add**:
- Idempotency key generation best practices
- Client retry logic with idempotency
- Response format examples

---

## Metrics & Monitoring

### Dashboards

**Add to Vercel Analytics**:
1. Idempotency cache hit rate
2. Duplicate request rate (same idempotency key)
3. PUT/PATCH without idempotency key (400 errors)

### Alerts

**Configure**:
- Alert if idempotency cache hit rate < 50% (indicates clients not reusing keys)
- Alert if duplicate request rate > 10% (network issues)

---

## References

- **T012**: Payment intent validation (idempotency implementation)
- **T041**: Payment pre-validation robustness (retry/backoff reference)
- **REST Standards**: https://restfulapi.net/idempotency/
- **Stripe Idempotency**: https://stripe.com/docs/api/idempotent_requests

---

## Changelog

### 2025-01-25 (T042 Audit)

**Findings**:
- 5 HIGH severity violations (PUT without idempotency)
- 5 MEDIUM severity violations (stray success flags)
- 67 LOW severity violations (missing OPTIONS)

**Recommendations**:
- Phase 1: Fix HIGH violations by 2025-02-01
- Phase 2: Fix MEDIUM violations by 2025-02-15
- Phase 3: Add OPTIONS to public APIs by 2025-02-22
- Add CI gating to prevent new violations

**Status**: 🔴 Remediation in progress
