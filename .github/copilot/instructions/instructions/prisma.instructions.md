# Prisma ORM Best Practices for StormCom

Guidelines for working with Prisma in the StormCom multi-tenant e-commerce SaaS platform.

## Schema Conventions

### Primary Keys
- **Always use CUID** for primary keys: `id String @id @default(cuid())`
- Never use auto-incrementing integers for distributed multi-tenant systems

### Timestamps
- **All tables must include** `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`
- Use `deletedAt DateTime?` for soft deletes on all user-facing data

### Multi-Tenant Isolation
- **All tenant-scoped tables must include** `storeId String` with proper foreign key
- Add compound indexes: `@@index([storeId, createdAt])`
- Add unique constraints scoped by tenant: `@@unique([storeId, sku])`

### Naming Conventions
- Use `PascalCase` for model names (singular): `Product`, `Order`, `Customer`
- Database columns use `snake_case`, mapped to `camelCase` in TypeScript via `@map()`
- Relation names should be descriptive: `store`, `category`, `orderItems`

## Example Schema

```prisma
model Product {
  id          String    @id @default(cuid())
  storeId     String
  store       Store     @relation(fields: [storeId], references: [id])
  
  name        String
  slug        String
  sku         String
  description String?   @db.Text
  price       Decimal   @db.Decimal(10, 2)
  
  categoryId  String?
  category    Category? @relation(fields: [categoryId], references: [id])
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  
  @@index([storeId])
  @@index([storeId, categoryId])
  @@index([storeId, createdAt])
  @@unique([storeId, sku])
  @@unique([storeId, slug])
}
```

## Query Best Practices

### Always Filter by Tenant
```typescript
// Good
const products = await prisma.product.findMany({
  where: { 
    storeId: session.user.storeId,
    deletedAt: null 
  },
});

// Bad - security vulnerability
const products = await prisma.product.findMany();
```

### Select Only Needed Fields
```typescript
// Good
const products = await prisma.product.findMany({
  select: {
    id: true,
    name: true,
    price: true,
  },
});

// Avoid fetching all fields when not needed
```

### Use Pagination
```typescript
const page = 1;
const perPage = 10;

const [products, total] = await Promise.all([
  prisma.product.findMany({
    where: { storeId, deletedAt: null },
    take: perPage,
    skip: (page - 1) * perPage,
    orderBy: { createdAt: 'desc' },
  }),
  prisma.product.count({
    where: { storeId, deletedAt: null },
  }),
]);
```

### Use Transactions for Multi-Step Operations
```typescript
const result = await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.orderItem.createMany({ data: items });
  
  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { quantity: { decrement: item.quantity } },
    });
  }
  
  return order;
});
```

## Migrations

### Development Workflow
```bash
# Make schema changes in prisma/schema.prisma
# Create migration with descriptive name
npx prisma migrate dev --name add_product_variants

# Never edit migration files manually
```

### Production Workflow
```bash
# Test migration on staging first
npx prisma migrate deploy

# Always backup database before production migrations
```

## Connection Management

- Use the singleton Prisma Client pattern (see `src/lib/prisma.ts`)
- Default connection pool: 5 connections per serverless function
- Always disconnect in long-running scripts:

```typescript
async function main() {
  // operations
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## Security & Validation

### Prevent SQL Injection
- Prisma automatically prevents SQL injection
- Avoid raw queries: `prisma.$queryRaw` unless absolutely necessary

### Input Validation
- Use Zod schemas for all user inputs before Prisma operations
- Validate business logic constraints before database writes

### Multi-Tenant Middleware
Set up in `src/lib/prisma.ts`:

```typescript
prisma.$use(async (params, next) => {
  if (params.model && params.action.includes('find')) {
    params.args = params.args || {};
    params.args.where = params.args.where || {};
    params.args.where.storeId = currentStoreId;
  }
  return next(params);
});
```

## Data Types

### Currency
```prisma
price Decimal @db.Decimal(10, 2)  // Max: 99,999,999.99
```

### Long Text
```prisma
description String? @db.Text
```

### JSON
```prisma
metadata Json?
```

### Arrays (PostgreSQL)
```prisma
tags String[]
```

### Enums
```prisma
enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}
```

## Performance Tips

1. Add indexes on foreign keys and frequently queried columns
2. Use `include` carefully to avoid N+1 queries
3. Select only needed fields to reduce data transfer
4. Use cursor-based pagination for large datasets
5. Cache frequently accessed data (5-minute TTL for analytics)

## References

- Project Constitution: `.specify/memory/constitution.md`
- Database Schema: `specs/001-multi-tenant-ecommerce/data-model.md`
- Prisma Documentation: https://www.prisma.io/docs/
