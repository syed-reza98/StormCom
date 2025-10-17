---
applyTo: "prisma/schema.prisma,prisma/migrations/**,prisma/seed.ts"
---

# Prisma Database Instructions

## Schema Conventions

### Primary Keys

**Always use CUID** for primary keys:

```prisma
model Product {
  id String @id @default(cuid())
  // other fields
}
```

### Timestamps

**All tables must include** `createdAt` and `updatedAt`:

```prisma
model Product {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  // other fields
}
```

### Soft Deletes

**Use soft deletes** for all user-facing data:

```prisma
model Product {
  id        String    @id @default(cuid())
  deletedAt DateTime?
  // other fields
}
```

**Always filter out soft-deleted records** in queries:

```typescript
// Good
const products = await prisma.product.findMany({
  where: { deletedAt: null },
});

// Bad - includes deleted records
const products = await prisma.product.findMany();
```

### Multi-Tenant Isolation

**All tenant-scoped tables must include** `storeId`:

```prisma
model Product {
  id      String @id @default(cuid())
  storeId String
  store   Store  @relation(fields: [storeId], references: [id])
  
  @@index([storeId])
  @@index([storeId, createdAt])
}
```

**Prisma middleware** automatically injects `storeId` filter (configured in `src/lib/prisma.ts`).

### Naming Conventions

- **Database columns**: `snake_case` (mapped to camelCase in TypeScript)
- **Model names**: `PascalCase` (singular, e.g., `Product` not `Products`)
- **Relation names**: Descriptive, e.g., `store`, `category`, `orderItems`

```prisma
model Product {
  id           String   @id @default(cuid())
  product_name String   @map("product_name") // maps to productName in TS
  price        Decimal  @db.Decimal(10, 2)
  categoryId   String   @map("category_id")
  category     Category @relation(fields: [categoryId], references: [id])
}
```

### Indexes

**Add indexes** for:
- Foreign keys (automatic in some databases, explicit in others)
- Frequently queried columns
- Compound indexes for common query patterns

```prisma
model Product {
  id         String   @id @default(cuid())
  storeId    String
  categoryId String
  name       String
  sku        String
  createdAt  DateTime @default(now())
  
  @@index([storeId])
  @@index([storeId, categoryId])
  @@index([storeId, createdAt])
  @@unique([storeId, sku])
}
```

### Unique Constraints

**Use unique constraints** to prevent duplicates, scoped by tenant:

```prisma
model Product {
  id      String @id @default(cuid())
  storeId String
  sku     String
  slug    String
  
  @@unique([storeId, sku])  // SKU unique per store
  @@unique([storeId, slug]) // Slug unique per store
}
```

## Data Types

### Common Types

```prisma
model Product {
  // Text
  id          String  @id @default(cuid())
  name        String  // VARCHAR(255) equivalent
  description String? @db.Text // Nullable long text
  
  // Numbers
  price       Decimal @db.Decimal(10, 2) // Currency (10 digits, 2 decimal)
  quantity    Int     @default(0)
  views       BigInt  @default(0)
  
  // Dates
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
  publishedAt DateTime?
  
  // Boolean
  isActive    Boolean   @default(true)
  isFeatured  Boolean   @default(false)
  
  // JSON
  metadata    Json?
  tags        String[]  // Array of strings (PostgreSQL only)
  
  // Enums
  status      ProductStatus @default(DRAFT)
}

enum ProductStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

### Currency & Decimals

**Always use Decimal type** for money/currency:

```prisma
model Product {
  price        Decimal @db.Decimal(10, 2)  // Max: 99,999,999.99
  cost         Decimal @db.Decimal(10, 2)
  comparePrice Decimal? @db.Decimal(10, 2)
}
```

In TypeScript:
```typescript
import { Decimal } from '@prisma/client/runtime/library';

// Convert to number for calculations
const priceNum = product.price.toNumber();

// Create Decimal from number
const newPrice = new Decimal(19.99);
```

## Relations

### One-to-Many

```prisma
model Store {
  id       String    @id @default(cuid())
  products Product[]
}

model Product {
  id      String @id @default(cuid())
  storeId String
  store   Store  @relation(fields: [storeId], references: [id])
  
  @@index([storeId])
}
```

### Many-to-Many

**Use explicit join table** for flexibility:

```prisma
model Product {
  id         String           @id @default(cuid())
  tags       ProductTag[]
}

model Tag {
  id       String       @id @default(cuid())
  products ProductTag[]
}

model ProductTag {
  productId String
  tagId     String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  tag       Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([productId, tagId])
  @@index([productId])
  @@index([tagId])
}
```

### Self-Relations

```prisma
model Category {
  id         String     @id @default(cuid())
  parentId   String?
  parent     Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children   Category[] @relation("CategoryHierarchy")
  
  @@index([parentId])
}
```

## Migrations

### Creating Migrations

```bash
# Create migration in development
npx prisma migrate dev --name add_product_variants

# Create migration for production
npx prisma migrate deploy
```

### Migration Best Practices

1. **Descriptive names**: Use clear, descriptive migration names
   - Good: `add_product_variants`, `add_customer_email_index`
   - Bad: `migration1`, `update_schema`

2. **Small, focused changes**: One logical change per migration

3. **Test migrations**:
   - Test on local database first
   - Test on staging before production
   - Have rollback plan ready

4. **Never edit migration files** after creation

5. **Backup before production migrations**

### Handling Schema Changes

**Adding a new column**:
```prisma
model Product {
  id          String @id @default(cuid())
  name        String
  description String? // New optional column - safe
}
```

**Adding a required column** (requires default or migration script):
```prisma
model Product {
  id     String  @id @default(cuid())
  name   String
  status Status  @default(DRAFT) // New required column with default
}
```

**Renaming a column** (use `@map`):
```prisma
model Product {
  id   String @id @default(cuid())
  // Old: product_name
  name String @map("product_name") // Maps to existing column
}
```

## Seeding Database

### Seed File Structure

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data (development only)
  if (process.env.NODE_ENV === 'development') {
    await prisma.product.deleteMany();
    await prisma.store.deleteMany();
    await prisma.user.deleteMany();
  }

  // Create test store
  const store = await prisma.store.create({
    data: {
      name: 'Demo Store',
      domain: 'demo-store.com',
      email: 'admin@demo-store.com',
    },
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      storeId: store.id,
    },
  });

  // Create sample products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Sample Product 1',
        description: 'This is a sample product',
        price: 29.99,
        sku: 'SAMPLE-001',
        storeId: store.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sample Product 2',
        description: 'Another sample product',
        price: 49.99,
        sku: 'SAMPLE-002',
        storeId: store.id,
      },
    }),
  ]);

  console.log('Database seeded successfully!');
  console.log('Store:', store);
  console.log('Admin User:', adminUser.email);
  console.log('Products:', products.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Running Seeds

```bash
# Run seed file
npm run db:seed

# Or directly
npx prisma db seed
```

## Query Optimization

### Select Only Needed Fields

```typescript
// Good - Select specific fields
const products = await prisma.product.findMany({
  select: {
    id: true,
    name: true,
    price: true,
  },
});

// Bad - Fetches all fields
const products = await prisma.product.findMany();
```

### Avoid N+1 Queries

```typescript
// Good - Use include to fetch related data
const products = await prisma.product.findMany({
  include: {
    category: true,
    variants: true,
  },
});

// Bad - N+1 query problem
const products = await prisma.product.findMany();
for (const product of products) {
  const category = await prisma.category.findUnique({
    where: { id: product.categoryId },
  });
}
```

### Pagination

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

const totalPages = Math.ceil(total / perPage);
```

### Use Transactions

**For operations that must succeed or fail together**:

```typescript
const result = await prisma.$transaction(async (tx) => {
  // Create order
  const order = await tx.order.create({
    data: {
      storeId,
      customerId,
      total: orderTotal,
    },
  });

  // Create order items
  await tx.orderItem.createMany({
    data: items.map(item => ({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    })),
  });

  // Update inventory
  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: {
        quantity: { decrement: item.quantity },
      },
    });
  }

  return order;
});
```

## Connection Management

### Connection Pooling

Prisma automatically manages connection pooling. Default configuration:
- **Connection limit**: 5 per serverless function
- **Connection timeout**: 10 seconds
- **Pool timeout**: 10 seconds

### Best Practices

1. **Reuse Prisma Client** instance (singleton pattern):

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

2. **Always disconnect** in long-running scripts:

```typescript
async function main() {
  // Your database operations
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## Security

### Prevent SQL Injection

Prisma automatically prevents SQL injection through parameterized queries. **Never use raw SQL** unless absolutely necessary.

```typescript
// Safe - Parameterized query
const products = await prisma.product.findMany({
  where: { name: { contains: searchTerm } },
});

// Unsafe - Raw query (avoid if possible)
const products = await prisma.$queryRaw`
  SELECT * FROM products WHERE name LIKE ${searchTerm}
`;
```

### Multi-Tenant Isolation

**Always filter by `storeId`** in all queries:

```typescript
// Setup middleware in src/lib/prisma.ts
prisma.$use(async (params, next) => {
  // Add storeId filter for tenant isolation
  if (params.model && params.action === 'findMany') {
    params.args = params.args || {};
    params.args.where = params.args.where || {};
    params.args.where.storeId = currentStoreId;
  }
  return next(params);
});
```
