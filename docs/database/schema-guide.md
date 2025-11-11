# Database Schema Guide - StormCom Multi-tenant E-commerce

**Version**: 1.0  
**Date**: January 20, 2025  
**ORM**: Prisma  
**Database**: PostgreSQL (Production) / SQLite (Development)

---

## Table of Contents

1. [Overview](#overview)
2. [Schema Architecture](#schema-architecture)
3. [Entity Relationships](#entity-relationships)
4. [Multi-tenant Isolation](#multi-tenant-isolation)
5. [Soft Delete Strategy](#soft-delete-strategy)
6. [Migration Strategy](#migration-strategy)
7. [Indexing Strategy](#indexing-strategy)
8. [Data Integrity](#data-integrity)
9. [Performance Considerations](#performance-considerations)
10. [Development Workflow](#development-workflow)

---

## Overview

The StormCom database schema is designed for a multi-tenant SaaS e-commerce platform with strict tenant isolation, comprehensive auditing, and GDPR compliance through soft deletes.

### Key Statistics
- **Total Models**: 42
- **Tenant-scoped Models**: 28 (have `storeId`)
- **Global Models**: 14 (User, Role, SubscriptionPlan, etc.)
- **Soft Delete Enabled**: 8 models (Store, Product, Customer, Order, Category, Brand, Coupon, FlashSale)
- **Compound Indexes**: 25+ for multi-tenant query optimization
- **Relationships**: 60+ foreign key relationships

### Design Principles

1. **Multi-tenant Isolation**: All tenant data is scoped by `storeId` with automatic filtering via Prisma middleware
2. **Soft Deletes**: User-facing data supports restoration for 90 days
3. **Audit Trail**: All tables have `createdAt`, `updatedAt` timestamps
4. **CUID Primary Keys**: Collision-resistant identifiers for distributed systems
5. **Zero-downtime Migrations**: Additive changes, backward-compatible schemas
6. **Type Safety**: Prisma generates TypeScript types from schema

---

## Schema Architecture

### Model Categories

#### 1. Subscription Management (Global)
- **SubscriptionPlan** - Available subscription tiers with limits
- **StoreSubscription** - Active subscription per store with usage tracking

#### 2. Identity & Access (Global)
- **User** - Platform users (admins, staff, customers)
- **UserStore** - Many-to-many relationship (users can access multiple stores)
- **Role** - RBAC roles with permissions
- **Account** - OAuth provider accounts (NextAuth.js)
- **Session** - User sessions (NextAuth.js)
- **VerificationToken** - Email verification tokens

#### 3. Store Management (Tenant-scoped)
- **Store** - Primary tenant entity
- **StoreSubscription** - One-to-one with Store
- **AuditLog** - All admin actions logged

#### 4. Product Catalog (Tenant-scoped)
- **Product** - Base product information
- **Variant** - Product SKUs with stock/pricing
- **Category** - Hierarchical product categories
- **Brand** - Product brands
- **Attribute** - Product attributes (size, color)
- **ProductAttribute** - Many-to-many product-attribute link
- **ProductCategory** - Many-to-many product-category link
- **ProductLabel** - NEW, SALE, HOT badges
- **Media** - Product images/videos

#### 5. Inventory Management (Tenant-scoped)
- **InventoryAdjustment** - Stock movements audit trail

#### 6. Customer Management (Tenant-scoped)
- **Customer** - Store customers (separate from User)
- **Address** - Customer shipping/billing addresses
- **Cart** - Shopping cart items
- **Wishlist** - Saved products

#### 7. Order Management (Tenant-scoped)
- **Order** - Customer orders
- **OrderItem** - Line items in orders
- **Payment** - Payment transactions
- **Refund** - Refunded payments
- **Shipment** - Shipping fulfillment

#### 8. Pricing & Promotions (Tenant-scoped)
- **Coupon** - Discount codes
- **FlashSale** - Time-limited sales
- **TaxRate** - Geographic tax rates
- **TaxExemption** - Customer tax exemptions
- **ShippingZone** - Geographic shipping zones
- **ShippingRate** - Shipping costs per zone

#### 9. Content Management (Tenant-scoped)
- **Page** - Static pages (About, FAQ)
- **Blog** - Blog posts
- **NewsletterCampaign** - Email campaigns

#### 10. Reviews & Ratings (Tenant-scoped)
- **ProductReview** - Customer product reviews

#### 11. POS System (Tenant-scoped)
- **PosSession** - In-store sales sessions

#### 12. Integrations (Tenant-scoped)
- **ExternalPlatformIntegration** - WooCommerce/Shopify sync
- **SyncQueue** - Webhook sync queue
- **PaymentGatewayConfig** - Payment gateway credentials

#### 13. Security & Compliance
- **PasswordHistory** - Password reuse prevention (CHK009)

---

## Entity Relationships

### Primary Relationships

```
Store (1) ←→ (0..1) StoreSubscription
  ↓ (1..*)
  ├── Product (1) → (*) Variant
  ├── Category (hierarchy with parentId)
  ├── Brand
  ├── Customer (1) → (*) Order
  ├── Order (1) → (*) OrderItem → Variant
  ├── Coupon
  ├── FlashSale
  ├── TaxRate
  ├── ShippingZone (1) → (*) ShippingRate
  ├── Page
  ├── Blog
  └── AuditLog

User (*) ←→ (*) Store (via UserStore)
User (1) ←→ (1) Role

Product (*) ←→ (*) Category (via ProductCategory)
Product (*) ←→ (*) Attribute (via ProductAttribute)
Product (1) ←→ (*) Media
Product (1) ←→ (*) ProductReview ←→ (1) Customer

Customer (1) ←→ (*) Address
Customer (1) ←→ (*) Cart
Customer (1) ←→ (*) Wishlist

Order (1) ←→ (*) Payment → (*) Refund
Order (1) ←→ (*) Shipment
```

### Relationship Types

| Type | Example | Prisma Syntax |
|------|---------|---------------|
| One-to-One | Store ↔ StoreSubscription | `StoreSubscription? / Store @relation(fields: [storeId])` |
| One-to-Many | Store → Product | `Product[]` (parent), `Store @relation(fields: [storeId])` (child) |
| Many-to-Many | Product ↔ Category | Join table `ProductCategory` with `@@unique([productId, categoryId])` |
| Self-Referencing | Category → Category (parent) | `Category? @relation("CategoryHierarchy")` |

---

## Multi-tenant Isolation

### Tenant Scoping Strategy

All tenant-scoped tables include:
```prisma
model Example {
  storeId String
  store   Store  @relation(fields: [storeId], references: [id])
  
  @@index([storeId])
  @@index([storeId, createdAt]) // Common query pattern
}
```

### Automatic Filtering

Prisma middleware automatically injects `storeId` filter:

```typescript
// src/lib/middleware/tenantIsolation.ts
prisma.$use(async (params, next) => {
  const storeId = getStoreIdFromContext();
  
  if (isTenantScopedModel(params.model)) {
    if (params.action === 'findMany' || params.action === 'findFirst') {
      params.args.where = { ...params.args.where, storeId };
    }
  }
  
  return next(params);
});
```

### Cross-tenant Prevention

- API routes validate `storeId` matches authenticated user's active store
- Direct Prisma queries outside middleware require explicit `storeId` parameter
- Tests use isolated database per tenant

---

## Soft Delete Strategy

### Soft Delete Models

Models with `deletedAt DateTime?`:
- Store
- Product
- Customer
- Order
- Category
- Brand
- Coupon
- FlashSale

### Implementation

```prisma
model Product {
  deletedAt DateTime? // NULL = active, timestamp = soft deleted
  
  // Query only active products
  @@index([storeId, deletedAt]) // WHERE storeId = ? AND deletedAt IS NULL
}
```

### Soft Delete Operations

#### Mark as Deleted
```typescript
await prisma.product.update({
  where: { id },
  data: { deletedAt: new Date() }
});
```

#### Restore from Soft Delete
```typescript
await prisma.product.update({
  where: { id },
  data: { deletedAt: null }
});
```

#### Query Active Records Only
```typescript
await prisma.product.findMany({
  where: {
    storeId,
    deletedAt: null // Explicitly filter out soft deleted
  }
});
```

#### Permanent Delete (Admin only)
```typescript
// After 90 days retention period
await prisma.product.delete({
  where: { id }
});
```

### Cascade Soft Delete Triggers

Database triggers ensure cascading soft deletes:
- When Store is soft deleted → all Products, Customers, Orders soft deleted
- Prevents orphaned records
- See `prisma/migrations/20251020004000_add_soft_delete_triggers/migration.sql`

---

## Migration Strategy

### Migration Principles

1. **Additive Only**: Never drop columns/tables in production
2. **Backward Compatible**: New migrations don't break existing code
3. **Zero Downtime**: Deploy code before running migrations
4. **Versioned**: Each migration has timestamp and descriptive name
5. **Idempotent**: Safe to run multiple times

### Migration Workflow

#### Development Environment

```bash
# 1. Modify schema.prisma
# 2. Create migration
npm run db:migrate -- --name add_column_xyz

# 3. Review generated SQL in prisma/migrations/
# 4. Apply migration
npm run db:migrate

# 5. Regenerate Prisma Client
npx prisma generate
```

#### Production Environment

```bash
# 1. Backup database
pg_dump $DATABASE_URL > backup.sql

# 2. Run migration
npx prisma migrate deploy

# 3. Verify data integrity
# 4. Monitor for errors
```

### Migration Types

#### 1. Add Column (Safe)
```prisma
model Product {
  newField String? // Nullable or with @default
}
```

#### 2. Add Index (Safe)
```prisma
model Product {
  @@index([storeId, newField])
}
```

#### 3. Add Table (Safe)
```prisma
model NewModel {
  id String @id @default(cuid())
}
```

#### 4. Remove Column (Dangerous - Multi-step)
```
Step 1: Deploy code that no longer uses column
Step 2: Wait 1 week for rollback safety
Step 3: Mark column as deprecated in schema comments
Step 4: After 1 month, drop column in new migration
```

#### 5. Rename Column (Dangerous - Multi-step)
```
Step 1: Add new column
Step 2: Deploy code that writes to both columns
Step 3: Backfill old column data to new column
Step 4: Deploy code that only uses new column
Step 5: Drop old column (after 1 month)
```

### Migration Rollback

```bash
# Rollback last migration (development only)
npx prisma migrate reset

# Production rollback (manual)
# 1. Restore from backup
pg_restore backup.sql

# 2. Mark failed migration as resolved
npx prisma migrate resolve --rolled-back <migration_name>
```

---

## Indexing Strategy

### Index Types

#### 1. Single Column Indexes
```prisma
@@index([email])
@@index([status])
@@index([createdAt])
```

#### 2. Compound Indexes (Multi-tenant Queries)
```prisma
@@index([storeId, createdAt]) // List products by store, ordered by date
@@index([storeId, status])    // Filter by store and status
@@index([storeId, slug])       // Lookup by store and slug
```

#### 3. Unique Indexes
```prisma
@@unique([storeId, slug])      // Unique slug per store
@@unique([storeId, email])     // Unique email per store
@@unique([sku])                // Globally unique SKU
```

#### 4. Partial Indexes (PostgreSQL only)
```sql
CREATE INDEX idx_active_products 
ON Product (storeId, status) 
WHERE deletedAt IS NULL;
```

### Index Maintenance

#### Check Index Usage (PostgreSQL)
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

#### Unused Indexes
```sql
-- Find indexes with 0 scans
SELECT * FROM pg_stat_user_indexes 
WHERE idx_scan = 0 AND schemaname = 'public';
```

---

## Data Integrity

### Constraints

#### 1. Foreign Key Constraints
```prisma
model Product {
  storeId String
  store   Store @relation(fields: [storeId], references: [id], onDelete: Cascade)
}
```

#### 2. Unique Constraints
```prisma
@@unique([storeId, slug])  // Composite unique
@unique                     // Single column unique
```

#### 3. Check Constraints (via migration)
```sql
ALTER TABLE "Product" ADD CONSTRAINT "check_price_positive" 
CHECK (price >= 0);
```

### Validation Layers

| Layer | Tool | Example |
|-------|------|---------|
| Database | Constraints, Triggers | `CHECK (price >= 0)` |
| ORM | Prisma | `price Decimal @db.Decimal(10, 2)` |
| Service | Zod | `z.number().min(0)` |
| UI | React Hook Form | `min: 0` |

---

## Performance Considerations

### Query Optimization

#### 1. Select Only Needed Fields
```typescript
// ❌ Bad: Fetches all fields
const product = await prisma.product.findUnique({ where: { id } });

// ✅ Good: Select specific fields
const product = await prisma.product.findUnique({
  where: { id },
  select: { id: true, name: true, price: true }
});
```

#### 2. Avoid N+1 Queries
```typescript
// ❌ Bad: N+1 query
const orders = await prisma.order.findMany();
for (const order of orders) {
  const customer = await prisma.customer.findUnique({ 
    where: { id: order.customerId } 
  });
}

// ✅ Good: Use include
const orders = await prisma.order.findMany({
  include: { customer: true }
});
```

#### 3. Pagination
```typescript
// ✅ Cursor-based pagination (efficient)
const products = await prisma.product.findMany({
  take: 20,
  skip: 1, // Skip cursor
  cursor: { id: lastProductId },
  orderBy: { createdAt: 'desc' }
});
```

#### 4. Aggregations
```typescript
// Use database-level aggregations
const stats = await prisma.order.aggregate({
  where: { storeId },
  _count: true,
  _sum: { total: true },
  _avg: { total: true }
});
```

### Connection Pooling

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings for serverless
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;
```

**Serverless Best Practices**:
- Use Prisma Data Proxy or connection pooling (PgBouncer)
- Limit connection pool size: 5 connections per function
- Close connections after each request (handled by Next.js)

---

## Development Workflow

### Daily Development

```bash
# 1. Pull latest schema changes
git pull origin main

# 2. Apply migrations
npm run db:migrate

# 3. Regenerate Prisma Client
npx prisma generate

# 4. Seed database (optional)
npm run db:seed

# 5. Start development server
npm run dev
```

### Adding a New Model

```bash
# 1. Add model to prisma/schema.prisma
model Example {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id])
  
  name      String
  
  @@index([storeId])
}

# 2. Create migration
npm run db:migrate -- --name add_example_model

# 3. Update TypeScript types
npx prisma generate

# 4. Create service at src/services/example/example-service.ts
# 5. Create API at src/app/api/example/route.ts
# 6. Write tests at src/services/example/__tests__/example-service.test.ts
```

### Database Schema Inspection

```bash
# Open Prisma Studio (GUI)
npm run db:studio

# View current schema
npx prisma db pull

# View migrations
ls prisma/migrations/
```

### Troubleshooting

#### Reset Database (Development Only)
```bash
# WARNING: Deletes all data
npm run db:reset
```

#### Fix Migration Conflicts
```bash
# Mark migration as applied without running
npx prisma migrate resolve --applied <migration_name>

# Mark migration as rolled back
npx prisma migrate resolve --rolled-back <migration_name>
```

#### Schema Drift Detection
```bash
# Compare schema with database
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource env:DATABASE_URL
```

---

## Appendix A: Schema Statistics

| Category | Count |
|----------|-------|
| Total Models | 42 |
| Tenant-scoped Models | 28 |
| Global Models | 14 |
| Enums | 12 |
| Indexes | 60+ |
| Unique Constraints | 25+ |
| Foreign Keys | 60+ |
| Soft Delete Models | 8 |

---

## Appendix B: Common Queries

### List Active Products for Store
```typescript
const products = await prisma.product.findMany({
  where: {
    storeId,
    deletedAt: null,
    status: 'ACTIVE'
  },
  include: {
    variants: {
      where: { isActive: true },
      select: { id: true, sku: true, price: true, stock: true }
    },
    categories: {
      include: { category: true }
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 20
});
```

### Get Store Statistics
```typescript
const stats = await prisma.$transaction([
  prisma.product.count({ where: { storeId, deletedAt: null } }),
  prisma.order.count({ where: { storeId } }),
  prisma.customer.count({ where: { storeId, deletedAt: null } }),
  prisma.order.aggregate({
    where: { storeId, status: 'DELIVERED' },
    _sum: { total: true }
  })
]);

const [productCount, orderCount, customerCount, revenue] = stats;
```

### Find Customers with Recent Orders
```typescript
const customers = await prisma.customer.findMany({
  where: {
    storeId,
    orders: {
      some: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    }
  },
  include: {
    orders: {
      orderBy: { createdAt: 'desc' },
      take: 5
    }
  }
});
```

---

## Appendix C: Migration Checklist

Before creating a migration:
- [ ] Schema changes are additive (no column drops)
- [ ] New columns are nullable or have defaults
- [ ] Indexes added for common query patterns
- [ ] Foreign keys have onDelete/onUpdate actions
- [ ] Multi-tenant models have `storeId` field
- [ ] Soft delete models have `deletedAt` field
- [ ] Timestamps (`createdAt`, `updatedAt`) present
- [ ] CUID primary keys used
- [ ] Migration tested in development
- [ ] Rollback plan documented

---

**Document Version**: 1.0  
**Last Updated**: January 20, 2025  
**Maintained By**: StormCom Development Team
