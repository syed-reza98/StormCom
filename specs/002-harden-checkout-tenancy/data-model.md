# Data Model — Harden Checkout, Tenancy, Newsletter

Date: 2025-11-13  
Branch: 002-harden-checkout-tenancy

## Entities

### Store
- id (PK)
- name
- domains: string[] (primary custom domain + aliases; includes subdomain)
- createdAt, updatedAt, deletedAt?
- Relationships: hasMany Products, Orders, Subscribers, Consents, AuditLogs

### Product (tenant-scoped)
- id (PK), storeId (FK)
- name, description, price, currency, sku, images: string[]
- inventoryQty, status (active/draft), deletedAt?
- Indexes: @@index([storeId, createdAt])
- Cache Tags: product:<id>, products:list:store:<storeId>

### Order (tenant-scoped)
- id (PK), storeId (FK)
- userId (nullable for guest prevention under this spec: checkout requires auth)
- totals: subtotal, discountTotal, taxTotal, shippingTotal, grandTotal (all server-calculated)
- currency, status (pending, paid, failed, refunded), paymentIntentRef
- createdAt, updatedAt
- Relationships: hasMany OrderItems, hasOne PaymentRecord
- Transactional boundary: created with items, inventory decrement, discount usage mark, and payment record

### OrderItem
- id (PK), orderId (FK), productId (FK), storeId (FK)
- quantity, unitPrice, discountApplied
- snapshot fields: productName, sku, image

### PaymentRecord
- id (PK), orderId (FK), storeId (FK)
- provider (enum/string), intentRef, status (validated, captured, failed), rawDetails (JSON?)
- createdAt, updatedAt

### NewsletterSubscriber (tenant-scoped)
- id (PK), storeId (FK)
- email, status (active, unsubscribed)
- UNIQUE: @@unique([storeId, email])
- createdAt, updatedAt, deletedAt?

### ConsentRecord (tenant-scoped)
- id (PK), storeId (FK)
- subjectRef (email or userId), type (newsletter, cookies), scope, dnt: boolean
- userAgent, ipHash
- createdAt

### AuditLog (tenant-scoped)
- id (PK), storeId (FK)
- action (order.created, newsletter.subscribed, export.requested, cache.invalidated)
- actor (userId/email/IP), correlationId (X-Request-Id)
- details (JSON), createdAt
- Indexes: @@index([storeId, createdAt])

### CacheTag (conceptual)
- Not persisted; registry of semantic tags used for invalidation
- Examples: product:<id>, products:list:store:<storeId>, category:<id>, pages:list:store:<storeId>

### RequestContext (conceptual)
- requestId (correlation), storeId (resolved), user (session)

## Validation Rules
- NewsletterSubscriber: email must be valid; deduped per (storeId,email)
- Orders: prices, discounts, taxes recalculated server-side; currency consistent per order
- PaymentRecord: must follow successful validation prior to order creation
- Tenant filtering: all tenant entities must include storeId scope and soft deletes where applicable

## State Transitions
- Order: pending → paid | failed; paid → refunded (separate flow)
- PaymentRecord: validated → captured | failed
- NewsletterSubscriber: active → unsubscribed

## Indexes & Uniqueness
- All tenant-scoped tables: @@index([storeId, createdAt])
- Subscriber uniqueness: @@unique([storeId, email])
- Product slugs/titles may add unique per store if used for routes
