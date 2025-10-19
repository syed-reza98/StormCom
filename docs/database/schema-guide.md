# Database Schema Guide - StormCom

## Overview

This document describes the database schema relationships, migration strategy, and best practices for the StormCom multi-tenant e-commerce platform.

## Database Technology

- **Development**: SQLite (file: `prisma/dev.db`)
- **Production**: PostgreSQL (via Vercel Postgres or similar)
- **ORM**: Prisma Client v6+

## Schema Overview

The database consists of **40+ models** organized into the following domains:

### 1. Core Tenant & Subscription (5 models)
- `Store` - Tenant entity (each store is a separate tenant)
- `SubscriptionPlan` - Available subscription tiers
- `StoreSubscription` - Active subscription for each store

### 2. User & Authentication (7 models)
- `User` - User accounts with authentication
- `UserStore` - Many-to-many relationship between users and stores
- `Role` - RBAC roles with permissions
- `PasswordHistory` - Password history for security policies
- `Session` - User sessions for authentication

### 3. Product Catalog (9 models)
- `Product` - Products with pricing and inventory
- `Variant` - Product variants (size, color, etc.)
- `Category` - Hierarchical product categories
- `Brand` - Product brands
- `Attribute` - Product attributes (e.g., "Material: Cotton")
- `ProductCategory` - Many-to-many join table
- `ProductAttribute` - Many-to-many join table
- `ProductReview` - Customer reviews and ratings

### 4. Customer & Orders (11 models)
- `Customer` - Store customers
- `Address` - Customer shipping/billing addresses
- `Order` - Customer orders
- `OrderItem` - Items within an order
- `Payment` - Payment transactions
- `Shipment` - Shipping information
- `Refund` - Order refunds
- `Cart` - Shopping carts
- `CartItem` - Items in cart
- `Wishlist` - Customer wishlists
- `WishlistItem` - Items in wishlist

### 5. Inventory & Operations (1 model)
- `InventoryAdjustment` - Inventory change tracking

### 6. Shipping & Tax (4 models)
- `ShippingZone` - Geographic shipping zones
- `ShippingRate` - Shipping costs per zone
- `TaxRate` - Tax rates by location
- `TaxExemption` - Customer tax exemptions

### 7. Marketing & Content (3 models)
- `Coupon` - Discount coupons
- `Page` - Static content pages
- `Blog` - Blog posts

### 8. System (2 models)
- `PaymentGatewayConfig` - Payment gateway settings per store
- `AuditLog` - Audit trail for all actions

## Multi-Tenant Architecture

### Tenant Isolation

All tenant-scoped data includes a `storeId` field that references the `Store` table:

```prisma
model Product {
  id      String @id @default(cuid())
  storeId String
  store   Store  @relation(fields: [storeId], references: [id])
  // ... other fields
  
  @@index([storeId])
  @@index([storeId, createdAt])
}
```

### Isolation Strategy

**Helper Functions** (see `src/lib/middleware/tenantIsolation.ts`):
- `setTenantContext({ storeId })` - Set current tenant
- `withTenantFilter(where)` - Add storeId to query
- `withoutDeleted(where)` - Filter out soft-deleted records
- `withTenantAndNotDeleted(where)` - Combined filter

**Usage Example**:
```typescript
import { withTenantAndNotDeleted } from '@/lib/middleware/tenantIsolation';

const products = await prisma.product.findMany({
  where: withTenantAndNotDeleted({ status: 'PUBLISHED' }),
});
```

### Tenant-Scoped vs Global Models

**Tenant-Scoped** (include storeId):
- All product, order, customer, inventory data
- Marketing content (coupons, pages, blogs)
- Configuration (shipping, tax, payment gateways)

**Global** (no storeId):
- `User` - Users can belong to multiple stores
- `Role` - Roles are reusable across stores
- `SubscriptionPlan` - Plans are platform-wide
- `Session` - Sessions are user-specific

## Soft Deletes

Models with user data support soft deletes using `deletedAt`:

```prisma
model Product {
  id        String    @id @default(cuid())
  deletedAt DateTime? // Soft delete
  // ... other fields
}
```

**Models with Soft Deletes**:
- Store, Product, Variant, Category, Brand
- Customer, Order
- ShippingZone, TaxRate, TaxExemption
- Coupon, Page, Blog

**Usage**:
```typescript
// Soft delete (updates deletedAt)
await prisma.product.update({
  where: { id: productId },
  data: { deletedAt: new Date() },
});

// Filter out deleted (automatic with helper)
const products = await prisma.product.findMany({
  where: withoutDeleted({ storeId }),
});
```

## Indexes

### Performance Indexes

All tenant-scoped tables include compound indexes:

```prisma
model Product {
  // ...
  @@index([storeId])              // Tenant filter
  @@index([storeId, status])       // Common queries
  @@index([storeId, createdAt])    // Sorting, pagination
  @@unique([storeId, slug])        // Unique per tenant
}
```

### Index Strategy

1. **Single Field**: Foreign keys, status fields, frequently filtered columns
2. **Compound**: Tenant + frequently queried field (e.g., `storeId + createdAt`)
3. **Unique Constraints**: Scoped to tenant (e.g., `storeId + slug`)

## Relationships

### One-to-Many

```prisma
model Store {
  products Product[]
}

model Product {
  storeId String
  store   Store  @relation(fields: [storeId], references: [id])
}
```

### Many-to-Many

Using explicit join tables:

```prisma
model Product {
  categories ProductCategory[]
}

model Category {
  products ProductCategory[]
}

model ProductCategory {
  productId  String
  product    Product  @relation(fields: [productId], references: [id])
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id])
  
  @@id([productId, categoryId])
}
```

### Self-Referencing

```prisma
model Category {
  id       String     @id @default(cuid())
  parentId String?
  parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children Category[] @relation("CategoryHierarchy")
}
```

## Migration Strategy

### Development

Use `prisma db push` for rapid iteration:

```bash
npx prisma db push
```

This syncs schema changes to the database without creating migration files.

### Production

Use migrations for version control and safe deployments:

```bash
# Create migration
npx prisma migrate dev --name add_product_variants

# Deploy to production
npx prisma migrate deploy
```

### Migration Best Practices

1. **Test migrations** on a copy of production data before deploying
2. **Backup database** before running migrations in production
3. **Use descriptive names** for migrations (e.g., `add_tax_exemption_model`)
4. **Keep migrations small** - one logical change per migration
5. **Never edit** migration files after they're created

### Adding a New Model

1. Add model to `prisma/schema.prisma`
2. Add indexes and relationships
3. Create migration: `npx prisma migrate dev --name add_new_model`
4. Update seed file if default data needed
5. Generate client: `npx prisma generate`

### Schema Change Example

```bash
# 1. Edit schema
vim prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name add_product_reviews

# 3. Test migration
npx prisma db seed

# 4. Commit migration files
git add prisma/migrations
git commit -m "Add product reviews model"
```

## Data Types

### SQLite Considerations

SQLite doesn't natively support `Decimal` type. We use `String` and convert in application:

```prisma
model Product {
  price String @default("0.00") // Store as string in SQLite
}
```

```typescript
// Application layer conversion
const price = parseFloat(product.price);
const priceDecimal = new Decimal(product.price);
```

### PostgreSQL (Production)

When migrating to PostgreSQL, update schema:

```prisma
model Product {
  price Decimal @db.Decimal(10, 2) // Native decimal in PostgreSQL
}
```

### JSON Fields

Store flexible data as JSON strings:

```prisma
model Store {
  settings String @default("{}") // JSON as string
}
```

```typescript
// Application usage
const settings = JSON.parse(store.settings);
const updatedSettings = JSON.stringify({ ...settings, newKey: value });
```

## Seeding

### Initial Data

Run seed to populate default data:

```bash
npx prisma db seed
```

Seeds:
- 5 default roles (OWNER, ADMIN, MANAGER, STAFF, VIEWER)
- 4 subscription plans (FREE, BASIC, PRO, ENTERPRISE)
- 1 super admin user (admin@stormcom.io)

### Custom Seeding

Add custom seed data in `prisma/seed.ts`:

```typescript
// Example: Seed demo store
const demoStore = await prisma.store.create({
  data: {
    name: 'Demo Store',
    slug: 'demo',
    email: 'demo@example.com',
  },
});
```

## Query Patterns

### Common Patterns

**List with Pagination**:
```typescript
const products = await prisma.product.findMany({
  where: withTenantAndNotDeleted({ status: 'PUBLISHED' }),
  take: 10,
  skip: (page - 1) * 10,
  orderBy: { createdAt: 'desc' },
});
```

**With Related Data**:
```typescript
const order = await prisma.order.findUnique({
  where: { id: orderId },
  include: {
    items: true,
    customer: true,
    payments: true,
  },
});
```

**Count Records**:
```typescript
const total = await prisma.product.count({
  where: withTenantAndNotDeleted({ status: 'PUBLISHED' }),
});
```

**Transactions**:
```typescript
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.orderItem.createMany({ data: itemsData });
  await tx.inventoryAdjustment.createMany({ data: adjustments });
});
```

## Performance Tips

1. **Select only needed fields**: Use `select` instead of fetching all
2. **Avoid N+1 queries**: Use `include` or separate queries with `Promise.all`
3. **Use pagination**: Always limit results with `take` and `skip`
4. **Add indexes**: On frequently queried columns
5. **Use transactions**: For multi-step operations
6. **Connection pooling**: Configured in `src/lib/prisma.ts`

## Security Considerations

1. **Always filter by storeId** for tenant isolation
2. **Use soft deletes** for user data (GDPR compliance)
3. **Validate input** before database queries
4. **Audit logging**: Track all changes via `AuditLog`
5. **Password security**: Always hash with bcrypt (cost factor 12)
6. **Session management**: Expire sessions, clean up regularly

## Troubleshooting

### Common Issues

**Schema out of sync**:
```bash
npx prisma generate
npx prisma db push
```

**Migration conflicts**:
```bash
npx prisma migrate reset  # Development only!
```

**Connection issues**:
- Check `DATABASE_URL` in `.env`
- Verify database file exists (SQLite)
- Check connection limits (PostgreSQL)

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [Schema Reference](../specs/001-multi-tenant-ecommerce/data-model.md)
- [Multi-tenant Guide](https://www.prisma.io/docs/guides/database/multi-tenancy)
