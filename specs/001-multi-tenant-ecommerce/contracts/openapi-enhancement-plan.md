# OpenAPI Contract Enhancement Plan

## Overview

This document provides a comprehensive plan to expand the current OpenAPI 3.1 specification (`openapi.yaml`) from **17 endpoints** to the required **60+ endpoints** with **42+ schemas** matching the Prisma data model and functional requirements.

**Priority**: P0 (BLOCKING) - Must be completed before Phase 1 development begins

**Related Documents**:
- Current Contract: `specs/001-multi-tenant-ecommerce/contracts/openapi.yaml`
- Data Model: `specs/001-multi-tenant-ecommerce/data-model.md`
- Feature Spec: `specs/001-multi-tenant-ecommerce/spec.md`
- Webhook Standards: `docs/webhook-standards.md`

---

## Gap Analysis

### Current State (17 endpoints)

**Authentication (4)**:
- ✅ POST /auth/login
- ✅ POST /auth/logout
- ✅ POST /auth/register
- ✅ GET /auth/me

**Stores (3)**:
- ✅ GET /stores
- ✅ POST /stores
- ✅ GET /stores/{storeId}
- ✅ PATCH /stores/{storeId}

**Products (5)**:
- ✅ GET /products
- ✅ POST /products
- ✅ GET /products/{productId}
- ✅ PATCH /products/{productId}
- ✅ DELETE /products/{productId}

**Inventory (2)**:
- ✅ POST /inventory/adjustments
- ✅ GET /inventory/low-stock

**Orders (4)**:
- ✅ GET /orders
- ✅ POST /orders
- ✅ GET /orders/{orderId}
- ✅ PATCH /orders/{orderId}
- ✅ POST /orders/{orderId}/cancel

**Customers (4)**:
- ✅ GET /customers
- ✅ POST /customers
- ✅ GET /customers/{customerId}
- ✅ PATCH /customers/{customerId}
- ✅ DELETE /customers/{customerId}

**Payments (2)**:
- ✅ POST /payments/create-intent
- ✅ POST /payments/webhooks/stripe

---

### Missing Endpoints (43+)

#### Categories (5)
- ❌ GET /categories - List categories with hierarchy
- ❌ POST /categories - Create category
- ❌ GET /categories/{categoryId} - Get category details
- ❌ PATCH /categories/{categoryId} - Update category
- ❌ DELETE /categories/{categoryId} - Soft delete category

#### Brands (5)
- ❌ GET /brands - List brands
- ❌ POST /brands - Create brand
- ❌ GET /brands/{brandId} - Get brand details
- ❌ PATCH /brands/{brandId} - Update brand
- ❌ DELETE /brands/{brandId} - Soft delete brand

#### Product Variants (5)
- ❌ GET /products/{productId}/variants - List product variants
- ❌ POST /products/{productId}/variants - Create variant
- ❌ GET /products/{productId}/variants/{variantId} - Get variant
- ❌ PATCH /products/{productId}/variants/{variantId} - Update variant
- ❌ DELETE /products/{productId}/variants/{variantId} - Delete variant

#### Product Media (3)
- ❌ POST /products/{productId}/media - Upload product image
- ❌ PATCH /products/{productId}/media/{mediaId} - Update media
- ❌ DELETE /products/{productId}/media/{mediaId} - Delete media

#### Product Reviews (4)
- ❌ GET /products/{productId}/reviews - List reviews
- ❌ POST /products/{productId}/reviews - Create review
- ❌ PATCH /products/{productId}/reviews/{reviewId} - Update review
- ❌ DELETE /products/{productId}/reviews/{reviewId} - Delete review

#### Coupons (6)
- ❌ GET /coupons - List coupons
- ❌ POST /coupons - Create coupon
- ❌ GET /coupons/{couponId} - Get coupon details
- ❌ PATCH /coupons/{couponId} - Update coupon
- ❌ DELETE /coupons/{couponId} - Soft delete coupon
- ❌ POST /coupons/validate - Validate coupon code

#### Shipping Zones & Rates (6)
- ❌ GET /shipping/zones - List shipping zones
- ❌ POST /shipping/zones - Create shipping zone
- ❌ GET /shipping/zones/{zoneId} - Get zone details
- ❌ PATCH /shipping/zones/{zoneId} - Update zone
- ❌ DELETE /shipping/zones/{zoneId} - Delete zone
- ❌ GET /shipping/zones/{zoneId}/rates - List rates for zone
- ❌ POST /shipping/zones/{zoneId}/rates - Create rate

#### Tax Rates (5)
- ❌ GET /tax-rates - List tax rates
- ❌ POST /tax-rates - Create tax rate
- ❌ GET /tax-rates/{taxRateId} - Get tax rate
- ❌ PATCH /tax-rates/{taxRateId} - Update tax rate
- ❌ DELETE /tax-rates/{taxRateId} - Delete tax rate

#### Marketing (3)
- ❌ GET /marketing/campaigns - List campaigns
- ❌ POST /marketing/campaigns - Create campaign
- ❌ GET /marketing/flash-sales - List flash sales

#### Content (6)
- ❌ GET /pages - List CMS pages
- ❌ POST /pages - Create page
- ❌ GET /pages/{pageId} - Get page details
- ❌ PATCH /pages/{pageId} - Update page
- ❌ DELETE /pages/{pageId} - Delete page
- ❌ GET /blog - List blog posts

#### Settings (9)
- ❌ GET /settings - Get all store settings
- ❌ PATCH /settings - Update settings (bulk)
- ❌ GET /settings/theme - Get theme settings
- ❌ PATCH /settings/theme - Update theme
- ❌ GET /settings/email - Get email templates
- ❌ PATCH /settings/email - Update email templates
- ❌ GET /settings/notifications - Get notification preferences
- ❌ PATCH /settings/notifications - Update notifications
- ❌ GET /settings/webhooks - Get webhook configuration
- ❌ PATCH /settings/webhooks - Configure webhooks

#### Reports & Analytics (6)
- ❌ GET /reports/sales - Sales analytics
- ❌ GET /reports/products - Product performance
- ❌ GET /reports/customers - Customer analytics
- ❌ GET /reports/inventory - Inventory reports
- ❌ GET /reports/revenue - Revenue breakdown
- ❌ GET /dashboard/summary - Dashboard KPIs

#### Audit Logs (2)
- ❌ GET /audit-logs - List audit logs (admin only)
- ❌ GET /audit-logs/{logId} - Get audit log details

#### Webhooks (3) - **CRITICAL for FR-10X/FR-10Y/FR-10Z**
- ❌ POST /webhooks - Register webhook endpoint
- ❌ GET /webhooks - List registered webhooks
- ❌ DELETE /webhooks/{webhookId} - Delete webhook

---

## Critical Enhancements

### 1. Rate Limit Headers (All Responses)

Currently, rate limit headers are only included in the `RateLimitExceeded` response. They MUST be added to ALL responses (success and error).

**Add to components/headers**:

```yaml
components:
  headers:
    X-RateLimit-Limit:
      description: Maximum requests allowed in rate limit window
      schema:
        type: integer
        example: 300
    
    X-RateLimit-Remaining:
      description: Requests remaining in current window
      schema:
        type: integer
        example: 287
    
    X-RateLimit-Reset:
      description: Unix timestamp (seconds) when rate limit resets
      schema:
        type: integer
        example: 1698876420
    
    Retry-After:
      description: Seconds to wait before retrying (rate limit only)
      schema:
        type: integer
        example: 60
```

**Update all 200/201 responses** to include:

```yaml
responses:
  '200':
    description: Success
    headers:
      X-RateLimit-Limit:
        $ref: '#/components/headers/X-RateLimit-Limit'
      X-RateLimit-Remaining:
        $ref: '#/components/headers/X-RateLimit-Remaining'
      X-RateLimit-Reset:
        $ref: '#/components/headers/X-RateLimit-Reset'
    content:
      application/json:
        schema:
          # ... response schema
```

---

### 2. Webhook Signature Verification (FR-10X)

All webhook-related endpoints MUST include the `X-Webhook-Signature` header for HMAC-SHA256 signature verification.

**Add to components/headers**:

```yaml
components:
  headers:
    X-Webhook-Signature:
      description: HMAC-SHA256 signature for webhook payload verification
      required: true
      schema:
        type: string
        pattern: '^[a-f0-9]{64}$'
        example: '5a2f8b3c9d1e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'
    
    X-Webhook-Event-Id:
      description: Unique event ID for idempotency (FR-10Y)
      required: true
      schema:
        type: string
        format: uuid
        example: '550e8400-e29b-41d4-a716-446655440000'
    
    X-Webhook-Sequence:
      description: Monotonic sequence number for event ordering (FR-10Z)
      required: true
      schema:
        type: integer
        minimum: 1
        example: 42
```

**Webhook Endpoint Examples**:

```yaml
paths:
  /webhooks:
    post:
      tags: [Settings]
      summary: Register webhook endpoint
      description: Register a webhook URL to receive event notifications
      operationId: registerWebhook
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [url, events]
              properties:
                url:
                  type: string
                  format: uri
                  description: HTTPS webhook endpoint URL
                  example: 'https://example.com/webhooks/stormcom'
                events:
                  type: array
                  items:
                    type: string
                    enum: [
                      'order.created', 'order.paid', 'order.shipped', 'order.delivered',
                      'product.created', 'product.updated', 'product.deleted',
                      'customer.created', 'customer.updated'
                    ]
                  example: ['order.created', 'order.paid']
                secret:
                  type: string
                  minLength: 32
                  description: Webhook secret for HMAC-SHA256 signature
                  example: 'whsec_abc123xyz789'
      responses:
        '201':
          description: Webhook registered successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/Webhook'
                  message:
                    type: string
                    example: 'Webhook registered successfully'
    
    get:
      tags: [Settings]
      summary: List registered webhooks
      description: List all webhook configurations for current store
      operationId: listWebhooks
      responses:
        '200':
          description: List of webhooks
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Webhook'

  /webhooks/{webhookId}:
    delete:
      tags: [Settings]
      summary: Delete webhook
      description: Remove webhook registration
      operationId: deleteWebhook
      parameters:
        - name: webhookId
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Webhook deleted successfully

  /webhooks/order:
    post:
      tags: [Webhooks]
      summary: Receive order webhook event
      description: |
        Webhook endpoint for receiving order events from StormCom.
        MUST verify signature using X-Webhook-Signature header (FR-10X).
        MUST implement idempotency using X-Webhook-Event-Id (FR-10Y).
        MUST validate sequence using X-Webhook-Sequence (FR-10Z).
      operationId: receiveOrderWebhook
      security: []  # No Bearer auth, signature-based auth only
      parameters:
        - name: X-Webhook-Signature
          in: header
          required: true
          description: HMAC-SHA256 signature of request body
          schema:
            type: string
            pattern: '^[a-f0-9]{64}$'
        - name: X-Webhook-Event-Id
          in: header
          required: true
          description: Unique event ID for idempotency
          schema:
            type: string
            format: uuid
        - name: X-Webhook-Sequence
          in: header
          required: true
          description: Monotonic sequence number
          schema:
            type: integer
            minimum: 1
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/OrderWebhookPayload'
      responses:
        '200':
          description: Webhook processed successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: true
        '401':
          description: Invalid signature
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error:
                  code: 'INVALID_SIGNATURE'
                  message: 'Webhook signature verification failed'
```

**Add Webhook Schemas**:

```yaml
components:
  schemas:
    Webhook:
      type: object
      required: [id, url, events, status, createdAt]
      properties:
        id:
          type: string
          example: 'wh_abc123'
        url:
          type: string
          format: uri
          example: 'https://example.com/webhooks/stormcom'
        events:
          type: array
          items:
            type: string
          example: ['order.created', 'order.paid']
        status:
          type: string
          enum: [active, disabled, failed]
          example: 'active'
        secret:
          type: string
          example: 'whsec_***' # Masked in responses
        lastTriggeredAt:
          type: string
          format: date-time
          nullable: true
        failureCount:
          type: integer
          example: 0
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
    
    OrderWebhookPayload:
      type: object
      required: [eventId, eventType, sequence, timestamp, storeId, data]
      properties:
        eventId:
          type: string
          format: uuid
          description: Unique event ID for idempotency (FR-10Y)
          example: '550e8400-e29b-41d4-a716-446655440000'
        eventType:
          type: string
          enum: ['order.created', 'order.paid', 'order.shipped', 'order.delivered', 'order.cancelled']
          example: 'order.paid'
        sequence:
          type: integer
          minimum: 1
          description: Monotonic sequence number (FR-10Z)
          example: 42
        timestamp:
          type: string
          format: date-time
          example: '2025-01-20T14:30:00.000Z'
        storeId:
          type: string
          example: 'store_abc123'
        data:
          type: object
          required: [entityType, entityId]
          properties:
            entityType:
              type: string
              enum: [order]
              example: 'order'
            entityId:
              type: string
              example: 'order_xyz789'
            oldStatus:
              type: string
              example: 'pending'
            newStatus:
              type: string
              example: 'paid'
            payment:
              type: object
              properties:
                method:
                  type: string
                  example: 'stripe'
                transactionId:
                  type: string
                  example: 'pi_1234567890'
                amount:
                  type: integer
                  description: Amount in cents
                  example: 12999
                currency:
                  type: string
                  example: 'USD'
```

---

### 3. Categories Resource

```yaml
paths:
  /categories:
    get:
      tags: [Categories]
      summary: List categories
      description: List all categories with optional hierarchy and filtering
      operationId: listCategories
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/PerPageParam'
        - name: parentId
          in: query
          description: Filter by parent category (null for root categories)
          schema:
            type: string
            nullable: true
        - name: includeChildren
          in: query
          description: Include child categories in response
          schema:
            type: boolean
            default: false
      responses:
        '200':
          description: List of categories
          headers:
            X-RateLimit-Limit:
              $ref: '#/components/headers/X-RateLimit-Limit'
            X-RateLimit-Remaining:
              $ref: '#/components/headers/X-RateLimit-Remaining'
            X-RateLimit-Reset:
              $ref: '#/components/headers/X-RateLimit-Reset'
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/PaginatedResponse'
                  - type: object
                    properties:
                      data:
                        type: array
                        items:
                          $ref: '#/components/schemas/Category'
    
    post:
      tags: [Categories]
      summary: Create category
      description: Create a new product category
      operationId: createCategory
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateCategoryRequest'
      responses:
        '201':
          description: Category created successfully
          headers:
            X-RateLimit-Limit:
              $ref: '#/components/headers/X-RateLimit-Limit'
            X-RateLimit-Remaining:
              $ref: '#/components/headers/X-RateLimit-Remaining'
            X-RateLimit-Reset:
              $ref: '#/components/headers/X-RateLimit-Reset'
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/Category'
                  message:
                    type: string

  /categories/{categoryId}:
    get:
      tags: [Categories]
      summary: Get category details
      operationId: getCategory
      parameters:
        - name: categoryId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Category details
          headers:
            X-RateLimit-Limit:
              $ref: '#/components/headers/X-RateLimit-Limit'
            X-RateLimit-Remaining:
              $ref: '#/components/headers/X-RateLimit-Remaining'
            X-RateLimit-Reset:
              $ref: '#/components/headers/X-RateLimit-Reset'
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/Category'
    
    patch:
      tags: [Categories]
      summary: Update category
      operationId: updateCategory
      parameters:
        - name: categoryId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateCategoryRequest'
      responses:
        '200':
          description: Category updated successfully
          headers:
            X-RateLimit-Limit:
              $ref: '#/components/headers/X-RateLimit-Limit'
            X-RateLimit-Remaining:
              $ref: '#/components/headers/X-RateLimit-Remaining'
            X-RateLimit-Reset:
              $ref: '#/components/headers/X-RateLimit-Reset'
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: '#/components/schemas/Category'
    
    delete:
      tags: [Categories]
      summary: Delete category
      description: Soft delete category (sets deletedAt)
      operationId: deleteCategory
      parameters:
        - name: categoryId
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Category deleted successfully
          headers:
            X-RateLimit-Limit:
              $ref: '#/components/headers/X-RateLimit-Limit'
            X-RateLimit-Remaining:
              $ref: '#/components/headers/X-RateLimit-Remaining'
            X-RateLimit-Reset:
              $ref: '#/components/headers/X-RateLimit-Reset'

components:
  schemas:
    Category:
      type: object
      required: [id, storeId, name, slug, createdAt, updatedAt]
      properties:
        id:
          type: string
          example: 'cat_abc123'
        storeId:
          type: string
          example: 'store_xyz789'
        name:
          type: string
          example: 'Electronics'
        slug:
          type: string
          example: 'electronics'
        description:
          type: string
          nullable: true
          example: 'All electronic devices and accessories'
        parentId:
          type: string
          nullable: true
          example: null
        sortOrder:
          type: integer
          example: 0
        isVisible:
          type: boolean
          example: true
        metaTitle:
          type: string
          nullable: true
        metaDescription:
          type: string
          nullable: true
        children:
          type: array
          items:
            $ref: '#/components/schemas/Category'
          description: Child categories (only included if includeChildren=true)
        productCount:
          type: integer
          example: 42
          description: Number of products in category
        imageUrl:
          type: string
          format: uri
          nullable: true
          example: 'https://cdn.stormcom.io/categories/electronics.jpg'
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
        deletedAt:
          type: string
          format: date-time
          nullable: true
    
    CreateCategoryRequest:
      type: object
      required: [name, slug]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
        slug:
          type: string
          pattern: '^[a-z0-9-]+$'
          example: 'electronics'
        description:
          type: string
          maxLength: 500
        parentId:
          type: string
          nullable: true
        sortOrder:
          type: integer
          default: 0
        isVisible:
          type: boolean
          default: true
        metaTitle:
          type: string
          maxLength: 60
        metaDescription:
          type: string
          maxLength: 160
    
    UpdateCategoryRequest:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
        slug:
          type: string
          pattern: '^[a-z0-9-]+$'
        description:
          type: string
          maxLength: 500
        parentId:
          type: string
          nullable: true
        sortOrder:
          type: integer
        isVisible:
          type: boolean
        metaTitle:
          type: string
          maxLength: 60
        metaDescription:
          type: string
          maxLength: 160
```

---

## Implementation Roadmap

### Phase 1: Critical Additions (Week 1-2) - **P0 BLOCKING**

1. ✅ Add rate limit headers to all response definitions
2. ✅ Add webhook signature headers (FR-10X)
3. ✅ Add webhook endpoints (/webhooks, /webhooks/{id}, /webhooks/order)
4. ✅ Add webhook schemas (Webhook, OrderWebhookPayload, etc.)
5. ✅ Add Categories resource (5 endpoints + 3 schemas)
6. ✅ Add Coupons resource (6 endpoints + 3 schemas)

### Phase 2: Core E-commerce (Week 2-3) - **P1**

7. ⏳ Add Brands resource (5 endpoints + 3 schemas)
8. ⏳ Add Product Variants nested resource (5 endpoints + 2 schemas)
9. ⏳ Add Product Media nested resource (3 endpoints + 1 schema)
10. ⏳ Add Shipping Zones & Rates (7 endpoints + 4 schemas)
11. ⏳ Add Tax Rates (5 endpoints + 3 schemas)

### Phase 3: Content & Marketing (Week 3-4) - **P2**

12. ⏳ Add Pages/CMS (5 endpoints + 2 schemas)
13. ⏳ Add Blog (3 endpoints + 1 schema)
14. ⏳ Add Product Reviews (4 endpoints + 2 schemas)
15. ⏳ Add Marketing Campaigns (3 endpoints + 2 schemas)

### Phase 4: Settings & Admin (Week 4-5) - **P2**

16. ⏳ Add Settings endpoints (9 endpoints + 5 schemas)
17. ⏳ Add Reports & Analytics (6 endpoints + 6 schemas)
18. ⏳ Add Audit Logs (2 endpoints + 1 schema)

### Phase 5: Validation & Testing (Week 5)

19. ⏳ Run OpenAPI Linter (Spectral) to validate spec
20. ⏳ Generate TypeScript types with openapi-typescript
21. ⏳ Set up Dredd for contract testing (per testing-strategy.md)
22. ⏳ Validate all endpoints against Prisma schema

---

## Validation Checklist

### Schema Alignment with Prisma

- [ ] All Prisma models have corresponding schemas
- [ ] Field types match (String → string, Int → integer, DateTime → date-time)
- [ ] Required fields match `@required` in Prisma
- [ ] Enum values match Prisma enum definitions
- [ ] Foreign key relationships represented correctly
- [ ] Soft delete pattern (deletedAt) included where applicable

### Endpoint Completeness

- [ ] All CRUD operations defined for each resource
- [ ] Nested resource endpoints for one-to-many relationships
- [ ] Bulk operation endpoints where needed (e.g., bulk product import)
- [ ] Special action endpoints (e.g., /orders/{id}/cancel, /coupons/validate)
- [ ] Filter, sort, and pagination parameters on list endpoints

### HTTP Methods

- [ ] GET for read operations
- [ ] POST for create operations
- [ ] PATCH for partial updates
- [ ] PUT for full replacements (if needed)
- [ ] DELETE for soft/hard deletes

### Response Standards

- [ ] All success responses include rate limit headers
- [ ] All error responses use standardized ErrorResponse schema
- [ ] Paginated responses use PaginatedResponse schema
- [ ] 201 Created for POST operations
- [ ] 204 No Content for DELETE operations

### Security

- [ ] All endpoints require authentication (except auth, webhooks)
- [ ] Webhook endpoints use signature-based authentication
- [ ] Sensitive data masked in responses (passwords, secrets)
- [ ] RBAC documented in operation descriptions

---

## Tools & Commands

### OpenAPI Validation

```bash
# Install Spectral linter
npm install -g @stoplight/spectral-cli

# Validate OpenAPI spec
spectral lint specs/001-multi-tenant-ecommerce/contracts/openapi.yaml
```

### TypeScript Type Generation

```bash
# Install openapi-typescript
npm install -D openapi-typescript

# Generate types
npx openapi-typescript specs/001-multi-tenant-ecommerce/contracts/openapi.yaml -o src/types/api.d.ts
```

### Contract Testing Setup

```bash
# Install Dredd
npm install -g dredd

# Run contract tests
dredd specs/001-multi-tenant-ecommerce/contracts/openapi.yaml http://localhost:3000
```

---

## References

- **FR-10X**: Webhook signature verification (HMAC-SHA256)
- **FR-10Y**: Idempotency with Redis (24h TTL)
- **FR-10Z**: Event ordering with sequence numbers
- **SC-001**: Unique SKU enforcement (per store)
- **SC-007**: Pagination support (max 100 items/page)
- **Webhook Standards**: `docs/webhook-standards.md`
- **Testing Strategy**: `docs/testing-strategy.md` (API Contract Testing section)

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-20  
**Owner**: StormCom API Team
