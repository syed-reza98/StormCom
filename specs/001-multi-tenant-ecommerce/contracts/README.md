# StormCom API Contracts

This directory contains the complete REST API specification for the StormCom multi-tenant e-commerce platform.

## Overview

The StormCom API follows RESTful principles with consistent patterns across all endpoints:

- **Authentication**: JWT tokens via NextAuth.js
- **Multi-tenancy**: Automatic store scoping via user context
- **Rate limiting**: Tiered limits based on subscription plan
- **Pagination**: Cursor-based pagination with `page` and `perPage` parameters
- **Error handling**: Standardized error responses with appropriate HTTP status codes

## Documentation

### OpenAPI Specification

The complete API specification is available in [`openapi.yaml`](./openapi.yaml), which follows the OpenAPI 3.1.0 standard.

**Interactive Documentation Options:**
- **Swagger UI**: Import `openapi.yaml` into [Swagger Editor](https://editor.swagger.io/)
- **Redoc**: Generate static docs with `npx redoc-cli bundle openapi.yaml`
- **Postman**: Import the spec directly into Postman for testing

## API Design Decisions

### 1. Authentication & Authorization

**JWT Tokens via NextAuth.js v5**

All API requests require authentication via JWT tokens obtained from the `/api/auth/login` endpoint:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "cm123abc",
      "email": "admin@example.com",
      "name": "Admin User"
    }
  },
  "message": "Login successful"
}
```

**Using the Token:**
```http
GET /api/products
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Claims:**
- `userId`: User ID
- `storeId`: Current active store ID (for multi-tenant scoping)
- `role`: User role (STORE_OWNER, STAFF, ADMIN)
- `permissions`: Array of granular permissions
- `exp`: Token expiration timestamp

### 2. Multi-tenant Isolation

**Automatic Store Scoping**

All API requests are automatically scoped to the authenticated user's current store context:

1. JWT token contains `storeId` claim
2. Prisma middleware auto-injects `storeId` filter on all queries
3. No manual tenant filtering required in API route handlers

**Example Prisma Middleware:**
```typescript
prisma.$use(async (params, next) => {
  const storeId = getStoreIdFromContext(); // From JWT token
  
  if (params.model && TENANT_SCOPED_MODELS.includes(params.model)) {
    if (params.action === 'findMany' || params.action === 'findFirst') {
      params.args.where = { ...params.args.where, storeId };
    }
  }
  
  return next(params);
});
```

**Non-scoped Models:**
- `User` - Global user accounts (can belong to multiple stores)
- `Role` - Global role definitions
- `Account`, `Session` - NextAuth.js auth tables
- `SubscriptionPlan` - Global subscription plan definitions

### 3. Rate Limiting Strategy

**Tiered Limits by Subscription Plan**

Rate limits are enforced per subscription tier:

| Plan       | Limit (req/min) | Burst Allowance |
|------------|-----------------|-----------------|
| Free       | 60              | 10 additional   |
| Basic      | 120             | 20 additional   |
| Pro        | 300             | 50 additional   |
| Enterprise | 1,000           | 200 additional  |

**Implementation:**
- **Library**: `@upstash/ratelimit` with Vercel KV
- **Key**: `ratelimit:${storeId}:${endpoint}` (per-store, per-endpoint)
- **Algorithm**: Sliding window with burst allowance

**Rate Limit Headers:**
```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 275
X-RateLimit-Reset: 1705420800
```

**Rate Limit Exceeded Response:**
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705420800

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please retry after 60 seconds.",
    "details": {
      "limit": 300,
      "resetAt": "2025-01-16T14:00:00Z"
    }
  }
}
```

### 4. Standard Response Format

**Success Response:**
```json
{
  "data": { /* Resource or array of resources */ },
  "message": "Optional success message",
  "meta": {  /* Pagination metadata for list endpoints */
    "page": 1,
    "perPage": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error message",
    "details": {
      "field": "email",
      "constraint": "Email already exists"
    }
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR` - Request validation failed (400)
- `UNAUTHORIZED` - Not authenticated (401)
- `FORBIDDEN` - Insufficient permissions (403)
- `NOT_FOUND` - Resource not found (404)
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded (429)
- `INTERNAL_ERROR` - Server error (500)

### 5. Pagination

**Cursor-based Pagination**

List endpoints support pagination with query parameters:

```http
GET /api/products?page=2&perPage=50
```

**Default Values:**
- `page`: 1
- `perPage`: 20 (max: 100)

**Response Metadata:**
```json
{
  "data": [ /* ... */ ],
  "meta": {
    "page": 2,
    "perPage": 50,
    "total": 500,
    "totalPages": 10
  }
}
```

**Best Practices:**
- Use `perPage=100` for bulk data exports
- Cache results for 5 minutes for analytics endpoints
- Use `page=1&perPage=1` to get total count only

### 6. Filtering & Sorting

**Common Filter Patterns:**

**Text Search (Full-text):**
```http
GET /api/products?search=laptop
```
- Uses PostgreSQL Full-Text Search
- Searches across `name` and `description` fields
- Case-insensitive

**Enum Filters:**
```http
GET /api/orders?status=SHIPPED,DELIVERED
```
- Comma-separated values for multiple statuses
- Exact match

**Date Ranges:**
```http
GET /api/orders?fromDate=2025-01-01&toDate=2025-01-31
```
- Inclusive date ranges
- ISO 8601 format (YYYY-MM-DD)

**Numeric Ranges:**
```http
GET /api/products?minPrice=10&maxPrice=100
```
- Inclusive ranges

**Sorting:**
```http
GET /api/products?sortBy=price&sortOrder=desc
```
- Default: `createdAt DESC`
- Supported fields vary by endpoint

### 7. Soft Deletes

**Soft Delete Support**

User-facing entities support soft deletion for data recovery:

**Models with Soft Delete:**
- Product, Customer, Order, Category, Brand, Page, Blog, Coupon, etc.

**Delete Endpoint:**
```http
DELETE /api/products/{productId}
```

**Response:**
```http
HTTP/1.1 204 No Content
```

**Implementation:**
- Sets `deletedAt` timestamp instead of hard delete
- Default queries filter `WHERE deletedAt IS NULL`
- Admin can restore via `PATCH /api/products/{id}/restore`

**Permanent Deletion:**
- Scheduled job runs monthly
- Deletes records with `deletedAt > 90 days ago`
- Triggers `GDPR_DATA_DELETED` audit event

### 8. Webhook Events

**Webhook System**

StormCom supports webhook subscriptions for real-time event notifications:

**Supported Events:**
- `order.created` - New order placed
- `order.updated` - Order status changed
- `order.canceled` - Order canceled
- `payment.succeeded` - Payment completed
- `payment.failed` - Payment failed
- `product.created` - New product created
- `product.updated` - Product updated
- `inventory.low_stock` - Inventory below threshold

**Webhook Payload:**
```json
{
  "event": "order.created",
  "timestamp": "2025-01-16T12:00:00Z",
  "data": {
    "orderId": "cm123abc",
    "orderNumber": "SO-1001",
    "total": 149.99
  },
  "storeId": "cm456def"
}
```

**Security:**
- **HMAC Signature**: `X-Webhook-Signature` header with SHA256 HMAC
- **Timestamp**: `X-Webhook-Timestamp` to prevent replay attacks
- **Retry Logic**: 3 attempts with exponential backoff (5s, 25s, 125s)

**Verification Example:**
```typescript
import crypto from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string) {
  const hmac = crypto.createHmac('sha256', secret);
  const expectedSignature = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### 9. API Versioning

**URL-based Versioning**

API version is included in the URL path:

```
Production:  https://api.stormcom.io/v1/products
Staging:     https://staging-api.stormcom.io/v1/products
Development: http://localhost:3000/api/products (no version prefix)
```

**Version Policy:**
- **v1**: Current stable version
- **v2**: Next major version (breaking changes only)
- **Deprecation**: 6-month notice before version sunset
- **Backward compatibility**: Maintained within major versions

### 10. HTTP Status Code Usage

**Success Codes:**
- `200 OK` - Successful GET, PUT, PATCH requests
- `201 Created` - Successful POST request (resource created)
- `204 No Content` - Successful DELETE request

**Client Error Codes:**
- `400 Bad Request` - Validation error, malformed request
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions for action
- `404 Not Found` - Resource does not exist
- `422 Unprocessable Entity` - Business logic validation error

**Server Error Codes:**
- `500 Internal Server Error` - Unhandled exception (logged to Sentry)
- `503 Service Unavailable` - Database unavailable, maintenance mode

### 11. Field Validation

**Validation Library: Zod**

All request bodies are validated using Zod schemas:

**Example Schema:**
```typescript
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  brandId: z.string().cuid().optional(),
  categoryIds: z.array(z.string().cuid()).min(1),
  variants: z.array(z.object({
    sku: z.string().min(1).max(100),
    price: z.number().positive(),
    stockQuantity: z.number().int().min(0),
    attributes: z.record(z.string())
  })).min(1)
});
```

**Validation Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "name": "String must contain at least 3 character(s)",
      "variants.0.price": "Number must be greater than 0"
    }
  }
}
```

### 12. Idempotency

**Idempotent Operations**

POST requests support idempotency keys to prevent duplicate operations:

```http
POST /api/orders
Idempotency-Key: uuid-or-client-generated-key
Content-Type: application/json

{
  "customerId": "cm123abc",
  "items": [ /* ... */ ]
}
```

**Implementation:**
- Store idempotency key with operation result in cache (24-hour TTL)
- If duplicate request with same key: return cached response (200 OK, not 201)
- Only applies to POST endpoints (order creation, payment processing)

## API Endpoint Categories

### Authentication (`/api/auth/*`)
- Login, logout, registration
- MFA verification
- Password reset
- Session management

### Store Management (`/api/stores/*`)
- Store CRUD operations
- Store settings and configuration
- Subscription management

### Product Catalog (`/api/products/*`)
- Product CRUD with variants
- Category and brand management
- Product attributes and labels
- Media upload and management

### Inventory (`/api/inventory/*`)
- Stock adjustments
- Low stock alerts
- Inventory history

### Orders (`/api/orders/*`)
- Order creation (checkout)
- Order status updates
- Order cancellation
- Order search and filtering

### Customers (`/api/customers/*`)
- Customer CRUD operations
- Address management
- Customer segmentation

### Payments (`/api/payments/*`)
- Payment intent creation (SSLCommerz, Stripe)
- Payment status tracking
- Refund processing
- Webhook handlers

### Shipping (`/api/shipping/*`)
- Shipping zone management
- Shipping rate calculation
- Carrier integration

### Marketing (`/api/marketing/*`)
- Coupon/promotion management
- Flash sale scheduling
- Newsletter campaigns
- Abandoned cart recovery

### Content (`/api/content/*`)
- CMS page management
- Blog post CRUD
- Menu and FAQ management

### Reports (`/api/reports/*`)
- Sales analytics
- Product performance
- Customer insights
- Inventory reports

## Testing the API

### Local Development

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Get authentication token:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"SecurePass123!"}'
   ```

3. **Make authenticated request:**
   ```bash
   curl http://localhost:3000/api/products \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

### Postman Collection

Import the OpenAPI spec into Postman:
1. Open Postman
2. Click **Import** → **Upload Files**
3. Select `openapi.yaml`
4. Configure environment variables:
   - `BASE_URL`: `http://localhost:3000/api`
   - `TOKEN`: Your JWT token from login

### Example Requests

**Create Product:**
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Laptop",
    "description": "High-performance laptop for developers",
    "brandId": "cm123abc",
    "categoryIds": ["cm456def"],
    "variants": [{
      "sku": "LAPTOP-001",
      "price": 1299.99,
      "stockQuantity": 50
    }]
  }'
```

**List Orders:**
```bash
curl http://localhost:3000/api/orders?status=SHIPPED&page=1&perPage=20 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Search Products:**
```bash
curl "http://localhost:3000/api/products?search=laptop&minPrice=500&maxPrice=2000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Security Best Practices

### 1. Token Security
- Store JWT tokens in HTTP-only cookies (not localStorage)
- Implement token refresh mechanism (30-minute expiry)
- Use secure, httpOnly, sameSite flags on cookies

### 2. Input Sanitization
- All inputs validated with Zod schemas
- HTML content sanitized with DOMPurify
- SQL injection prevented via Prisma ORM

### 3. Rate Limiting
- Aggressive limits on authentication endpoints (5 req/min)
- Standard limits on other endpoints (60-1000 req/min)
- IP-based blocking for repeated violations

### 4. CORS Configuration
- Whitelist allowed origins (store domains)
- Credentials allowed for authenticated requests
- No wildcard origins in production

### 5. Webhook Security
- HMAC signature verification required
- Timestamp validation (reject requests >5 minutes old)
- Retry logic with exponential backoff

## Error Debugging

### Common Issues

**401 Unauthorized:**
- Check token validity (not expired)
- Verify `Authorization: Bearer TOKEN` header format
- Ensure user has active session

**403 Forbidden:**
- Check user role and permissions
- Verify resource belongs to user's store (multi-tenant isolation)

**404 Not Found:**
- Verify resource ID is correct
- Check if resource was soft-deleted (query `deletedAt IS NULL`)

**422 Validation Error:**
- Review `error.details` for specific field errors
- Check Zod schema constraints in API route

**429 Rate Limit Exceeded:**
- Wait for rate limit window to reset (check `X-RateLimit-Reset` header)
- Consider upgrading subscription plan
- Implement client-side rate limiting

## Performance Optimization

### Client-side Caching
- Cache GET responses for 5 minutes (analytics, reports)
- Use ETags for conditional requests
- Implement optimistic UI updates

### Database Optimization
- All foreign keys indexed
- Compound indexes on common query patterns
- Query result caching for expensive aggregations

### Connection Pooling
- Prisma connection pool: 5 connections per serverless function
- Database connection reuse across invocations
- Auto-scaling based on traffic

## Support & Resources

- **OpenAPI Spec**: `./openapi.yaml`
- **Interactive Docs**: Import into [Swagger Editor](https://editor.swagger.io/)
- **Postman Collection**: Import `openapi.yaml` directly
- **API Support**: api@stormcom.io
- **Status Page**: https://status.stormcom.io
