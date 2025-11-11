# Deep Dive: API Route Handlers

## Overview
This document reviews key API route handlers in the StormCom platform, focusing on authentication, products, orders, and checkout endpoints.

---

## src/app/api/auth/login/route.ts
**Method**: POST  
**Lines**: 97  
**Purpose**: User authentication with MFA support and account lockout

### Implementation Analysis

#### Next.js 16 Compliance
- ✅ **Route Handler**: Uses NextRequest/NextResponse
- ✅ **No Dynamic Params**: No async params needed
- ✅ **Error Handling**: Comprehensive try-catch blocks

#### Request/Response Contract

**Request Body**:
```typescript
{
  email: string (valid email format),
  password: string (min 1 char)
}
```

**Success Response** (200):
```typescript
{
  data: {
    sessionId: string,
    user: {
      id: string,
      email: string,
      role: string,
      storeId: string
    },
    requiresMFA: boolean
  }
}
```

**Error Responses**:
- **400 Validation Error**: Invalid input format
- **401 Invalid Credentials**: Wrong email/password
- **403 Account Locked**: Too many failed attempts (includes `lockedUntil` timestamp)
- **500 Internal Error**: Unexpected server error

### Security Implementation

#### 1. Input Validation
```typescript
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});
```
✅ Zod validation with specific error messages  
✅ Email format validation  
✅ Password presence check (no length requirement for flexibility)

#### 2. IP Address Tracking
```typescript
const ipAddress = request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown';
```
✅ Captures IP for rate limiting/audit logging  
✅ Handles proxy headers (x-forwarded-for, x-real-ip)  
⚠️ Fallback to 'unknown' could allow abuse - should reject instead

#### 3. Session Cookie Security
```typescript
response.cookies.set('sessionId', result.sessionId, {
  httpOnly: true,                               // ✅ Prevents XSS
  secure: process.env.NODE_ENV === 'production', // ✅ HTTPS only in prod
  sameSite: 'lax',                              // ✅ CSRF protection
  maxAge: 60 * 60 * 24 * 7,                     // ✅ 7 days
  path: '/',                                     // ✅ Accessible app-wide
});
```

#### 4. Account Lockout
```typescript
if (errorMessage.startsWith('ACCOUNT_LOCKED')) {
  const parts = errorMessage.split(':');
  const lockedUntil = parts.length > 1 ? parts[1] : undefined;
  
  return NextResponse.json({
    error: {
      code: 'ACCOUNT_LOCKED',
      message: 'Account temporarily locked due to too many failed login attempts',
      metadata: lockedUntil ? { lockedUntil } : undefined,
    },
  }, { status: 403 });
}
```
✅ Prevents brute force attacks  
✅ Returns lockout expiry time  
⚠️ String parsing fragile - should use structured error objects

### Error Handling Patterns

#### Service Layer Error Mapping
```typescript
try {
  const result = await login({ email, password, ipAddress });
  // ...
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  
  if (errorMessage === 'INVALID_CREDENTIALS') { /* 401 */ }
  if (errorMessage.startsWith('ACCOUNT_LOCKED')) { /* 403 */ }
  
  throw error; // Re-throw unexpected errors
}
```

⚠️ **Issue**: Error handling relies on string matching (fragile)  
**Better Approach**: Use custom error classes

```typescript
// Recommended pattern
class InvalidCredentialsError extends Error {
  code = 'INVALID_CREDENTIALS';
  statusCode = 401;
}

class AccountLockedError extends Error {
  code = 'ACCOUNT_LOCKED';
  statusCode = 403;
  constructor(public lockedUntil: string) {
    super('Account locked');
  }
}

// In handler
try {
  const result = await login({ email, password, ipAddress });
} catch (error) {
  if (error instanceof InvalidCredentialsError) {
    return NextResponse.json({ error }, { status: error.statusCode });
  }
  // ...
}
```

### Multi-Factor Authentication (MFA) Flow

```typescript
const result = await login({ email, password, ipAddress });

if (result.requiresMFA) {
  // Client redirects to /mfa/challenge
  // Session is created but not fully authenticated
}
```

✅ MFA challenge triggered before full authentication  
✅ Session created for MFA verification step  
⚠️ Should return mfaToken instead of sessionId before MFA complete

### Audit Logging

✅ IP address captured for audit  
⚠️ No explicit audit log call visible  
⚠️ Should log: login attempts, failures, lockouts, success

**Recommended Addition**:
```typescript
await auditLog.create({
  action: 'USER_LOGIN_SUCCESS',
  userId: result.user.id,
  ipAddress,
  userAgent: request.headers.get('user-agent'),
  metadata: { requiresMFA: result.requiresMFA },
});
```

### Code Quality

**Strengths**:
- ✅ Comprehensive error handling
- ✅ Clear documentation in comments
- ✅ Type-safe with Zod
- ✅ Secure cookie configuration
- ✅ Multi-layered security (validation, rate limiting, lockout)

**Weaknesses**:
- ⚠️ String-based error matching (fragile)
- ⚠️ No explicit audit logging
- ⚠️ IP fallback to 'unknown' should reject
- ⚠️ No rate limiting visible at API level
- ⚠️ No CAPTCHA for repeated failures

### Recommendations

1. **High Priority**:
   - Replace string error matching with custom error classes
   - Add explicit audit logging
   - Reject requests without valid IP address
   - Add rate limiting middleware (10 attempts per IP per hour)

2. **Medium Priority**:
   - Add CAPTCHA after 3 failed attempts
   - Return mfaToken separately from sessionId
   - Add device fingerprinting
   - Add "remember me" option

3. **Low Priority**:
   - Add login history tracking
   - Add suspicious activity detection
   - Add geolocation-based alerts

---

## src/app/api/products/route.ts
**Methods**: GET, POST  
**Lines**: 137  
**Purpose**: List products with filtering/pagination, create new products

### GET /api/products Implementation

#### Multi-Tenant Isolation
```typescript
const session = await getServerSession(authOptions);
if (!session?.user?.storeId) {
  return NextResponse.json(
    { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
    { status: 401 }
  );
}
```
✅ Requires authenticated session  
✅ Extracts storeId from session  
✅ Enforces tenant isolation

#### Filter Parameters
```typescript
const filters = {
  search: searchParams.get('search') || undefined,
  categoryId: searchParams.get('categoryId') || undefined,
  brandId: searchParams.get('brandId') || undefined,
  isPublished: searchParams.get('isPublished') === 'true' ? true 
              : searchParams.get('isPublished') === 'false' ? false 
              : true, // ✅ Default to published only
  isFeatured: searchParams.get('isFeatured') === 'true' ? true 
             : searchParams.get('isFeatured') === 'false' ? false 
             : undefined,
  minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
  maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
  inventoryStatus: searchParams.get('inventoryStatus') as any || undefined,
};
```

✅ Comprehensive filtering options  
✅ Smart default (published products only)  
⚠️ No validation on numeric inputs (minPrice/maxPrice)  
⚠️ Type assertion `as any` on inventoryStatus (unsafe)

#### Pagination
```typescript
const page = parseInt(searchParams.get('page') || '1');
const perPage = Math.min(parseInt(searchParams.get('perPage') || '10'), 100);
```
✅ Pagination parameters  
✅ Maximum page size limit (100)  
⚠️ No validation on page number (could be negative)

#### Data Normalization Bug
```typescript
const normalizedProducts = result.products.map((p: any) => {
  const prod = { ...p };
  try {
    if (typeof prod.images === 'string') {
      const parsed = JSON.parse(prod.images);
      prod.images = Array.isArray(parsed) ? parsed : (prod.images ? [prod.images] : []);
    } else if (!Array.isArray(prod.images)) {
      prod.images = [];
    }
  } catch (e) {
    prod.images = prod.images ? [String(prod.images)] : [];
  }
  // ... similar for metaKeywords
  return prod;
});
```

⚠️ **CRITICAL ISSUE**: API handler compensating for inconsistent data types  
**Root Cause**: Prisma schema has images as String, but service layer expects arrays  

**Better Fix**: Normalize in Prisma schema or service layer, not at API edge

**Recommended Schema Change**:
```prisma
model Product {
  images String[] @default([])  // Use array type
  metaKeywords String[] @default([])
}
```

### POST /api/products Implementation

#### Validation
```typescript
const validatedData = createProductSchema.parse(body);
```
✅ Zod schema validation  
✅ Type-safe input

#### Error Handling
```typescript
if (error instanceof z.ZodError) {
  return NextResponse.json(
    { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors } },
    { status: 400 }
  );
}

if ((error as any).code === 'P2002') {
  return NextResponse.json(
    { error: { code: 'DUPLICATE_SKU', message: 'SKU already exists' } },
    { status: 409 }
  );
}
```

✅ Handles validation errors  
✅ Handles Prisma unique constraint violations  
✅ Proper HTTP status codes (400 validation, 409 conflict)  
⚠️ String matching for duplicate SKU (fragile)

### Response Format
```typescript
return NextResponse.json({
  data: normalizedProducts,
  meta: {
    total: result.pagination.total,
    page: result.pagination.page,
    perPage: result.pagination.perPage,
    totalPages: Math.ceil(result.pagination.total / result.pagination.perPage),
  },
});
```
✅ Consistent response structure  
✅ Pagination metadata  
✅ Data/meta separation

### Code Quality Issues

1. **Data Type Inconsistency**: Images stored as JSON string but API normalizes to array
2. **Type Safety**: Multiple `as any` assertions
3. **Validation**: Missing input validation on numeric parameters
4. **Error Handling**: String matching instead of error classes
5. **Comments**: Note about removed sortBy/sortOrder suggests incomplete refactoring

### Recommendations

1. **CRITICAL**: Fix images/metaKeywords schema inconsistency
2. **High**: Add Zod validation for query parameters
3. **High**: Remove type assertions, use proper types
4. **Medium**: Extract normalization logic to service layer
5. **Low**: Add response caching for GET endpoint

---

## src/app/api/products/[id]/route.ts
**Methods**: GET, PUT, PATCH, DELETE  
**Lines**: 176  
**Purpose**: Individual product CRUD operations

### Next.js 16 Compliance
```typescript
interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params; // ✅ Awaits params (Next.js 16 pattern)
}
```

### GET Implementation
```typescript
const product = await productService.getProductById(id, session.user.storeId);

if (!product) {
  return NextResponse.json(
    { error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' } },
    { status: 404 }
  );
}
```
✅ Multi-tenant isolation  
✅ 404 for not found  
✅ Simple and clean

### PUT vs PATCH Implementation

**Issue**: Both use `.partial()` schema (allow partial updates)

```typescript
// PUT /api/products/[id] - Should require full object
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const updateSchema = createProductSchema.partial(); // ⚠️ Should be full schema
  const validatedData = updateSchema.parse(body);
}

// PATCH /api/products/[id] - Correctly allows partial
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const updateSchema = createProductSchema.partial(); // ✅ Correct
  const validatedData = updateSchema.parse(body);
}
```

**REST Convention**:
- **PUT**: Replace entire resource (should require all fields)
- **PATCH**: Update specific fields (allows partial)

**Recommended Fix**:
```typescript
// PUT - require full schema
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const validatedData = createProductSchema.parse(body); // Full schema
  // ...
}

// PATCH - allow partial
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const updateSchema = createProductSchema.partial(); // Partial schema
  // ...
}
```

### DELETE Implementation
```typescript
await productService.deleteProduct(id, session.user.storeId);

return new NextResponse(null, { status: 204 }); // ✅ REST best practice
```
✅ Returns 204 No Content (correct REST pattern)  
✅ Soft delete (assumed from service layer)

### Error Handling Inconsistencies

**PUT/PATCH Error Responses**:
```typescript
return NextResponse.json(
  { success: false, error: { ... } }, // ⚠️ Includes 'success: false'
  { status: 400 }
);
```

**GET/DELETE Error Responses**:
```typescript
return NextResponse.json(
  { error: { ... } }, // ✅ No 'success' field
  { status: 404 }
);
```

**Issue**: Inconsistent response structure  
**Fix**: Remove `success: false` from PUT/PATCH responses

### Recommendations

1. **High**: Fix PUT/PATCH semantic difference (PUT should require full schema)
2. **High**: Make error response structure consistent across all methods
3. **Medium**: Add optimistic locking (version field) to prevent concurrent updates
4. **Low**: Add ETAG support for caching

---

## src/app/api/orders/route.ts
**Method**: GET  
**Lines**: 102  
**Purpose**: List orders with filtering, pagination, and CSV export

### Dynamic Rendering Enforcement
```typescript
export const dynamic = 'force-dynamic';
```
✅ **Critical**: Ensures route is always dynamic (authentication requires runtime headers)  
✅ Prevents build-time prerendering errors

### Authentication & Authorization
```typescript
const session = await getServerSession(authOptions);
if (!session?.user) {
  return apiResponse.unauthorized();
}

// Role-based access control
if (!['SUPER_ADMIN', 'STORE_ADMIN', 'STAFF'].includes(session.user.role)) {
  return apiResponse.forbidden('Insufficient permissions');
}

// Multi-tenant isolation
const storeId = session.user.storeId;
if (!storeId && session.user.role !== 'SUPER_ADMIN') {
  return apiResponse.forbidden('No store assigned');
}
```

✅ Three-layer security:
1. Authentication (session exists)
2. Role-based access control (admin/staff only)
3. Multi-tenant isolation (storeId required, except SUPER_ADMIN)

### Query Parameter Validation
```typescript
const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(OrderStatus).optional(),
  search: z.string().max(200).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'totalAmount', 'orderNumber']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  export: z.enum(['csv']).optional(),
});

const params = querySchema.parse(Object.fromEntries(searchParams));
```

✅ **Excellent**: Comprehensive Zod validation  
✅ Type coercion (string → number)  
✅ Range validation (max perPage 100)  
✅ Default values  
✅ Enum validation for status, sortBy, sortOrder

### CSV Export Feature
```typescript
if (params.export === 'csv') {
  const csv = await exportOrdersToCSV(queryParams);
  
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
```

✅ Inline export (no separate endpoint needed)  
✅ Proper Content-Type and Content-Disposition headers  
✅ Filename includes date  
⚠️ No size limit (could timeout for large datasets)  
⚠️ No streaming (entire CSV in memory)

**Recommended Improvements**:
```typescript
// Add streaming for large exports
if (params.export === 'csv') {
  const { readable, writable } = new TransformStream();
  
  // Start async export
  exportOrdersToCSVStream(queryParams, writable);
  
  return new NextResponse(readable, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="orders-export.csv"`,
      'Transfer-Encoding': 'chunked',
    },
  });
}
```

### API Response Helper Usage
```typescript
return apiResponse.success(result.orders, {
  message: 'Orders retrieved successfully',
  meta: result.pagination,
});
```

✅ Consistent response formatting  
✅ Centralized response utilities  
✅ Includes pagination metadata

### Error Handling
```typescript
if (error instanceof z.ZodError) {
  return apiResponse.validationError('Validation error', {
    errors: error.errors,
  });
}

return apiResponse.internalServerError(
  error instanceof Error ? error.message : 'Failed to fetch orders'
);
```

✅ Specific validation error responses  
✅ Generic internal error fallback  
✅ Logs errors for debugging

### Recommendations

1. **High**: Add streaming support for CSV export
2. **High**: Add export size limits (max 10,000 orders)
3. **Medium**: Add export to Excel format
4. **Medium**: Add background job for large exports (email download link)
5. **Low**: Add export progress tracking

---

## src/app/api/checkout/complete/route.ts
**Method**: POST  
**Lines**: 114  
**Purpose**: Complete checkout process and create order

### Request Validation Schema
```typescript
const CompleteCheckoutSchema = z.object({
  storeId: z.string().min(1),
  customerId: z.string().min(1),
  items: z.array(z.object({
    productId: z.string().min(1),
    variantId: z.string().optional(),
    quantity: z.number().int().min(1),
    price: z.number().min(0),
  })),
  shippingAddress: z.object({
    fullName: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().min(1),
    country: z.string().min(2),
    state: z.string().optional(),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    address1: z.string().min(1),
    address2: z.string().optional(),
  }),
  billingAddress: z.object({ ... }).optional(), // Same schema as shippingAddress
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0),
  shippingCost: z.number().min(0),
  discountAmount: z.number().default(0),
  shippingMethod: z.string().min(1),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER']),
  notes: z.string().optional(),
});
```

✅ **Comprehensive validation**:
- Customer and store identification
- Line items with variant support
- Shipping and billing addresses
- Financial calculations
- Payment method enumeration
- Optional order notes

⚠️ **Security Issues**:
1. No authentication check (anyone can create orders)
2. No price verification (client sends prices - could be manipulated)
3. No stock verification visible
4. No payment verification before order creation

### Critical Security Flaw

**Current Flow** (INSECURE):
```
Client → POST /api/checkout/complete (with prices from client) → Create Order
```

**Secure Flow** (REQUIRED):
```
1. Client → POST /api/checkout/validate → Server validates items, calculates totals
2. Client → POST /api/checkout/payment-intent → Create payment intent with verified amount
3. Payment Gateway → Confirm payment
4. Client → POST /api/checkout/complete (with payment verification) → Create Order
```

**Required Fixes**:
```typescript
export async function POST(request: NextRequest) {
  // 1. Authentication check
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const input = CompleteCheckoutSchema.parse(body);

  // 2. Verify prices against database (don't trust client)
  const verifiedItems = await verifyItemPrices(input.items);
  const calculatedTotals = calculateTotals(verifiedItems, input.shippingMethod);
  
  if (calculatedTotals.subtotal !== input.subtotal) {
    return NextResponse.json({ error: 'Price mismatch' }, { status: 400 });
  }

  // 3. Verify payment before creating order
  const paymentVerified = await verifyPaymentIntent(request);
  if (!paymentVerified) {
    return NextResponse.json({ error: 'Payment not verified' }, { status: 402 });
  }

  // 4. Check stock availability
  await checkStockAvailability(verifiedItems);

  // 5. Create order in transaction
  const order = await db.$transaction(async (tx) => {
    const newOrder = await createOrder(input, tx);
    await updateInventory(verifiedItems, tx);
    await createPaymentRecord(newOrder.id, paymentIntent, tx);
    return newOrder;
  });

  return NextResponse.json({ data: order }, { status: 201 });
}
```

### Error Handling
```typescript
if (error instanceof z.ZodError) {
  return NextResponse.json({ error: { code: 'VALIDATION_ERROR', ... } }, { status: 400 });
}

if (error instanceof Error) {
  if (error.message.includes('not found') || error.message.includes('stock')) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', ... } }, { status: 400 });
  }
}
```

✅ Validation error handling  
⚠️ Generic string matching (fragile)  
⚠️ Both "not found" and "stock" errors return 400 (should differentiate)

### Recommendations

1. **CRITICAL**: Add authentication check
2. **CRITICAL**: Server-side price verification (never trust client)
3. **CRITICAL**: Verify payment before order creation
4. **CRITICAL**: Check stock availability in transaction
5. **High**: Use database transaction for order creation + inventory update
6. **High**: Add idempotency key support (prevent duplicate orders on retry)
7. **Medium**: Add webhook for order confirmation email
8. **Medium**: Add fraud detection checks
9. **Low**: Add order number generation

---

## API Routes Summary Statistics

| Endpoint | Lines | Auth | Multi-Tenant | Validation | Errors | Security Score |
|----------|-------|------|--------------|------------|--------|----------------|
| POST /api/auth/login | 97 | N/A | N/A | ✅ Zod | ✅ Good | 7/10 |
| GET /api/products | 137 | ✅ Session | ✅ StoreId | ⚠️ Partial | ✅ Good | 7/10 |
| POST /api/products | - | ✅ Session | ✅ StoreId | ✅ Zod | ✅ Good | 8/10 |
| GET /api/products/[id] | 176 | ✅ Session | ✅ StoreId | ❌ None | ✅ Good | 8/10 |
| PUT /api/products/[id] | - | ✅ Session | ✅ StoreId | ✅ Zod | ✅ Good | 7/10 |
| PATCH /api/products/[id] | - | ✅ Session | ✅ StoreId | ✅ Zod | ✅ Good | 7/10 |
| DELETE /api/products/[id] | - | ✅ Session | ✅ StoreId | ❌ None | ✅ Good | 8/10 |
| GET /api/orders | 102 | ✅ Session + Role | ✅ StoreId | ✅ Zod | ✅ Excellent | 9/10 |
| POST /api/checkout/complete | 114 | ❌ Missing | ❌ Client-provided | ✅ Zod | ⚠️ Weak | 3/10 |

## Critical Findings Across All Routes

### Security Issues
1. ❌ **CRITICAL**: Checkout endpoint missing authentication
2. ❌ **CRITICAL**: Checkout trusts client-provided prices
3. ⚠️ **High**: PUT/PATCH semantic mismatch
4. ⚠️ **High**: Data normalization at API layer (should be in schema/service)
5. ⚠️ **Medium**: String-based error matching (fragile)

### Best Practices Violations
1. Response structure inconsistency (some with `success: false`, some without)
2. Error handling via string matching instead of error classes
3. Type assertions (`as any`) reducing type safety
4. Missing rate limiting at API level
5. No explicit audit logging

### Performance Issues
1. CSV export loads entire dataset in memory
2. No response caching on public endpoints
3. No streaming for large responses

### Missing Features
1. No API versioning (/api/v1/)
2. No request/response logging middleware
3. No OpenAPI/Swagger documentation
4. No request ID tracking for debugging

## Architecture Recommendations

### 1. Standardize Error Handling
```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Not authenticated') {
    super('UNAUTHORIZED', message, 401);
  }
}

// Use in routes
throw new UnauthorizedError();
// Instead of: return NextResponse.json({ error: ... }, { status: 401 });
```

### 2. Create API Middleware Pipeline
```typescript
// lib/api-middleware.ts
export function withMiddleware(...handlers: Handler[]) {
  return async (request: NextRequest) => {
    for (const handler of handlers) {
      const result = await handler(request);
      if (result) return result; // Early return for errors
    }
    return null; // Continue to route
  };
}

// Use in routes
export async function GET(request: NextRequest) {
  const error = await withMiddleware(
    authenticate,
    rateLimit,
    logRequest
  )(request);
  
  if (error) return error;
  
  // Route logic...
}
```

### 3. Standardize Response Format
```typescript
// lib/api-response.ts
export const apiResponse = {
  success: (data: any, options?: { message?: string; meta?: any }) =>
    NextResponse.json({
      data,
      message: options?.message,
      meta: options?.meta,
    }),
  
  error: (code: string, message: string, statusCode: number, details?: any) =>
    NextResponse.json({
      error: { code, message, details },
    }, { status: statusCode }),
  
  // ... other helpers
};
```

### 4. Add Request Validation Middleware
```typescript
// lib/validate-request.ts
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (request: NextRequest): Promise<T> => {
    const body = await request.json();
    return schema.parse(body); // Throws on validation error
  };
}

// Use in routes
export async function POST(request: NextRequest) {
  const data = await validateRequest(createProductSchema)(request);
  // data is type-safe
}
```

## Next Steps for API Routes

1. **Immediate** (Security):
   - Fix checkout authentication and price verification
   - Add rate limiting middleware
   - Add CSRF protection

2. **High Priority** (Code Quality):
   - Implement custom error classes
   - Standardize response format
   - Remove type assertions

3. **Medium Priority** (Features):
   - Add API versioning
   - Add request logging middleware
   - Generate OpenAPI documentation
   - Add response caching

4. **Low Priority** (Optimization):
   - Implement streaming for exports
   - Add GraphQL alternative
   - Add API analytics dashboard
