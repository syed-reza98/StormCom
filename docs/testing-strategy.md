# StormCom Testing Strategy

**Version**: 1.0.0  
**Last Updated**: October 22, 2025  
**Status**: Phase 1 Implementation  

## Overview

This document defines the comprehensive testing strategy for StormCom, covering unit testing, integration testing, end-to-end (E2E) testing, performance testing, accessibility testing, and visual regression testing. The strategy ensures 80% minimum code coverage, WCAG 2.1 AA compliance, and performance targets defined in success criteria.

## Table of Contents

1. [Testing Pyramid](#testing-pyramid)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [Performance Testing](#performance-testing)
6. [Accessibility Testing](#accessibility-testing)
7. [Visual Regression Testing](#visual-regression-testing)
8. [API Contract Testing](#api-contract-testing)
9. [Test Data and Fixtures](#test-data-and-fixtures)
10. [CI/CD Integration](#cicd-integration)

---

## Testing Pyramid

StormCom follows the testing pyramid approach with appropriate distribution:

```
           /\
          /  \         E2E Tests (10%)
         /    \        - Critical user journeys
        /------\       - Cross-browser validation
       /        \      - Visual regression
      /          \     
     /------------\    Integration Tests (30%)
    /              \   - API endpoints
   /                \  - Database operations
  /------------------\ - External service mocks
 /                    \
/______________________\ Unit Tests (60%)
                        - Business logic
                        - Utility functions
                        - Component behavior
```

**Target Coverage**:
- **Overall**: 80% minimum (FR-139)
- **Business Logic** (`src/services/`, `src/lib/`): 80% minimum
- **Utility Functions**: 100% coverage
- **Critical Paths**: 100% E2E coverage

---

## Unit Testing

### Technology Stack

- **Framework**: Vitest 3.2.4
- **UI Testing**: Testing Library (React)
- **Mocking**: Vitest mocks + MSW (Mock Service Worker)
- **Coverage**: v8 coverage provider

### Configuration

**File**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
        '**/types/',
        '**/__tests__/',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Stricter thresholds for critical paths
        './src/services/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        './src/lib/utils/**': {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
    },
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**File**: `tests/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './mocks/server';

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Clean up after all tests
afterAll(() => server.close());

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.DATABASE_URL = 'file:./test.db';
```

### Unit Test Organization

Tests are co-located with source files in `__tests__/` subdirectories:

```
src/
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   └── __tests__/
│   │       └── button.test.tsx
│   └── admin/
│       ├── product-form.tsx
│       └── __tests__/
│           └── product-form.test.tsx
├── lib/
│   ├── utils/
│   │   ├── format.ts
│   │   └── __tests__/
│   │       └── format.test.ts
│   └── auth/
│       ├── password.ts
│       └── __tests__/
│           └── password.test.ts
└── services/
    ├── product-service.ts
    └── __tests__/
        └── product-service.test.ts
```

### Unit Test Examples

**Example 1: Utility Function Test**

**File**: `src/lib/utils/__tests__/format.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, slugify } from '../format';

describe('formatCurrency', () => {
  it('formats USD currency correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
  });

  it('formats EUR currency correctly', () => {
    expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
  });

  it('handles zero amount', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });

  it('handles negative amounts', () => {
    expect(formatCurrency(-50.25, 'USD')).toBe('-$50.25');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(10.999, 'USD')).toBe('$11.00');
  });
});

describe('slugify', () => {
  it('converts string to lowercase slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify('Test @ Product #1!')).toBe('test-product-1');
  });

  it('handles multiple spaces', () => {
    expect(slugify('Too   Many    Spaces')).toBe('too-many-spaces');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('preserves existing hyphens', () => {
    expect(slugify('Pre-Existing-Slug')).toBe('pre-existing-slug');
  });
});
```

**Example 2: Service Layer Test**

**File**: `src/services/__tests__/product-service.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProductService } from '../product-service';
import { prismaMock } from '../../tests/mocks/prisma';

describe('ProductService', () => {
  let productService: ProductService;

  beforeEach(() => {
    productService = new ProductService();
    vi.clearAllMocks();
  });

  describe('createProduct', () => {
    it('creates product with variants successfully', async () => {
      const mockProduct = {
        id: '1',
        name: 'Test Product',
        slug: 'test-product',
        storeId: 'store-1',
        variants: [
          { id: 'v1', sku: 'TEST-001', price: 19.99, stock: 100 },
        ],
      };

      prismaMock.product.create.mockResolvedValue(mockProduct);

      const result = await productService.createProduct({
        name: 'Test Product',
        storeId: 'store-1',
        variants: [{ sku: 'TEST-001', price: 19.99, stock: 100 }],
      });

      expect(result).toEqual(mockProduct);
      expect(prismaMock.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Product',
          slug: 'test-product',
          storeId: 'store-1',
        }),
      });
    });

    it('enforces SKU uniqueness per store (SC-002)', async () => {
      prismaMock.variant.findFirst.mockResolvedValue({
        id: 'existing-variant',
        sku: 'TEST-001',
      });

      await expect(
        productService.createProduct({
          name: 'Duplicate SKU Product',
          storeId: 'store-1',
          variants: [{ sku: 'TEST-001', price: 29.99, stock: 50 }],
        })
      ).rejects.toThrow('SKU "TEST-001" already exists in this store');
    });

    it('auto-generates slug from product name', async () => {
      const mockProduct = {
        id: '1',
        name: 'Amazing Product @ 2025!',
        slug: 'amazing-product-2025',
        storeId: 'store-1',
      };

      prismaMock.product.create.mockResolvedValue(mockProduct);

      const result = await productService.createProduct({
        name: 'Amazing Product @ 2025!',
        storeId: 'store-1',
      });

      expect(result.slug).toBe('amazing-product-2025');
    });
  });

  describe('updateInventory', () => {
    it('deducts stock on order confirmation (FR-020)', async () => {
      const mockVariant = { id: 'v1', stock: 100 };
      prismaMock.variant.findUnique.mockResolvedValue(mockVariant);
      prismaMock.variant.update.mockResolvedValue({ ...mockVariant, stock: 95 });

      await productService.updateInventory('v1', -5, {
        reason: 'ORDER_PLACED',
        orderId: 'order-123',
      });

      expect(prismaMock.variant.update).toHaveBeenCalledWith({
        where: { id: 'v1' },
        data: { stock: 95 },
      });

      expect(prismaMock.inventoryAdjustment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          variantId: 'v1',
          delta: -5,
          reason: 'ORDER_PLACED',
          orderId: 'order-123',
        }),
      });
    });

    it('prevents negative stock (SC-004)', async () => {
      prismaMock.variant.findUnique.mockResolvedValue({ id: 'v1', stock: 2 });

      await expect(
        productService.updateInventory('v1', -5, { reason: 'ORDER_PLACED' })
      ).rejects.toThrow('Insufficient stock available');
    });

    it('handles concurrent stock updates with transactions', async () => {
      // Test implementation would use database transactions
      // and row-level locking to prevent race conditions
    });
  });
});
```

**Example 3: React Component Test**

**File**: `src/components/ui/__tests__/button.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('renders with default variant', () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary');
  });

  it('renders with destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button', { name: /delete/i });
    expect(button).toHaveClass('bg-destructive');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('does not fire click when disabled', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with icon', () => {
    render(
      <Button>
        <svg data-testid="icon" />
        With Icon
      </Button>
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
```

### Running Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm run test -- product-service.test.ts

# Run tests matching pattern
npm run test -- --grep "inventory"

# Update snapshots
npm run test -- -u
```

---

## Integration Testing

### Technology Stack

- **Framework**: Vitest 3.2.4
- **Database**: SQLite (in-memory for tests), PostgreSQL (CI)
- **HTTP Mocking**: MSW (Mock Service Worker)
- **Test Containers**: PostgreSQL container for CI

### Integration Test Setup

**File**: `tests/integration/setup.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { execSync } from 'child_process';

// Use in-memory SQLite for fast tests
const DATABASE_URL = 'file:./test-integration.db';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

beforeAll(async () => {
  // Push schema to test database
  process.env.DATABASE_URL = DATABASE_URL;
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
});

beforeEach(async () => {
  // Clean database between tests
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF;');
  
  const tables = await prisma.$queryRaw<Array<{ name: string }>>`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%';
  `;
  
  for (const { name } of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${name}";`);
  }
  
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

### Integration Test Structure

```
tests/
├── integration/
│   ├── setup.ts
│   ├── api/
│   │   ├── products.test.ts
│   │   ├── orders.test.ts
│   │   └── auth.test.ts
│   ├── services/
│   │   ├── email-service.test.ts
│   │   └── payment-service.test.ts
│   └── database/
│       ├── migrations.test.ts
│       └── queries.test.ts
└── fixtures/
    ├── stores.ts
    ├── users.ts
    └── products.ts
```

### Integration Test Examples

**Example 1: API Route Integration Test**

**File**: `tests/integration/api/products.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/products/route';
import { prisma } from '../setup';
import { seedStore, seedUser } from '../../fixtures';

describe('Products API Integration', () => {
  let storeId: string;
  let adminUserId: string;

  beforeEach(async () => {
    const store = await seedStore({ name: 'Test Store' });
    storeId = store.id;

    const admin = await seedUser({
      email: 'admin@test.com',
      role: 'STORE_ADMIN',
      storeId,
    });
    adminUserId = admin.id;
  });

  describe('GET /api/products', () => {
    it('returns paginated products for store', async () => {
      // Seed products
      await prisma.product.createMany({
        data: [
          { name: 'Product 1', slug: 'product-1', storeId },
          { name: 'Product 2', slug: 'product-2', storeId },
          { name: 'Product 3', slug: 'product-3', storeId },
        ],
      });

      const { req } = createMocks({
        method: 'GET',
        url: `/api/products?storeId=${storeId}&page=1&perPage=2`,
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(2);
      expect(data.meta).toEqual({
        page: 1,
        perPage: 2,
        total: 3,
        totalPages: 2,
      });
    });

    it('filters products by category', async () => {
      const category = await prisma.category.create({
        data: { name: 'Electronics', slug: 'electronics', storeId },
      });

      await prisma.product.create({
        data: {
          name: 'Laptop',
          slug: 'laptop',
          storeId,
          categories: { connect: { id: category.id } },
        },
      });

      await prisma.product.create({
        data: {
          name: 'Shirt',
          slug: 'shirt',
          storeId,
        },
      });

      const { req } = createMocks({
        method: 'GET',
        url: `/api/products?storeId=${storeId}&categoryId=${category.id}`,
      });

      const response = await GET(req);
      const data = await response.json();

      expect(data.data).toHaveLength(1);
      expect(data.data[0].name).toBe('Laptop');
    });

    it('returns products in under 2 seconds (SC-007)', async () => {
      // Seed 10,000 products for performance test
      const products = Array.from({ length: 10000 }, (_, i) => ({
        name: `Product ${i}`,
        slug: `product-${i}`,
        storeId,
      }));

      await prisma.product.createMany({ data: products });

      const { req } = createMocks({
        method: 'GET',
        url: `/api/products?storeId=${storeId}`,
      });

      const startTime = Date.now();
      const response = await GET(req);
      await response.json();
      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(2000); // SC-007
    });
  });

  describe('POST /api/products', () => {
    it('creates product with variants successfully', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          name: 'T-Shirt',
          description: 'Comfortable cotton t-shirt',
          storeId,
          variants: [
            { sku: 'TS-S-RED', size: 'S', color: 'Red', price: 19.99, stock: 50 },
            { sku: 'TS-M-RED', size: 'M', color: 'Red', price: 19.99, stock: 75 },
          ],
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.name).toBe('T-Shirt');
      expect(data.data.slug).toBe('t-shirt');
      expect(data.data.variants).toHaveLength(2);

      // Verify in database
      const product = await prisma.product.findUnique({
        where: { id: data.data.id },
        include: { variants: true },
      });

      expect(product).toBeTruthy();
      expect(product!.variants).toHaveLength(2);
    });

    it('enforces SKU uniqueness (SC-002)', async () => {
      // Create existing product with SKU
      await prisma.product.create({
        data: {
          name: 'Existing Product',
          slug: 'existing',
          storeId,
          variants: {
            create: { sku: 'DUPLICATE-SKU', price: 10, stock: 10 },
          },
        },
      });

      const { req } = createMocks({
        method: 'POST',
        body: {
          name: 'New Product',
          storeId,
          variants: [{ sku: 'DUPLICATE-SKU', price: 20, stock: 20 }],
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('SKU "DUPLICATE-SKU" already exists');
    });
  });
});
```

**Example 2: Database Query Performance Test**

**File**: `tests/integration/database/queries.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../setup';
import { seedStore, seedProducts } from '../../fixtures';

describe('Database Query Performance', () => {
  let storeId: string;

  beforeEach(async () => {
    const store = await seedStore({ name: 'Performance Test Store' });
    storeId = store.id;
  });

  it('product search query executes in under 1 second (SC-023)', async () => {
    // Seed 10,000 products
    await seedProducts(storeId, 10000);

    const startTime = Date.now();

    const results = await prisma.product.findMany({
      where: {
        storeId,
        name: { contains: 'test', mode: 'insensitive' },
      },
      take: 24,
      orderBy: { createdAt: 'desc' },
    });

    const duration = Date.now() - startTime;

    expect(results.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(1000); // SC-023
  });

  it('order status update executes in under 10 seconds (SC-003)', async () => {
    const order = await prisma.order.create({
      data: {
        orderNumber: 'ORD-001',
        storeId,
        status: 'PENDING',
        total: 100,
      },
    });

    const startTime = Date.now();

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CONFIRMED' },
    });

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(10000); // SC-003
  });
});
```

### Running Integration Tests

```bash
# Run integration tests only
npm run test:integration

# Run with PostgreSQL test container (CI)
npm run test:integration:pg

# Run specific integration test
npm run test:integration -- products.test.ts
```

---

## Migration Testing

### Overview

Database migrations are critical infrastructure that must be validated for integrity, idempotency, and rollback safety. StormCom uses Prisma ORM for schema management and includes comprehensive migration testing.

### Technology Stack

- **ORM**: Prisma 6.x
- **Migration Tool**: Prisma Migrate
- **Test Harness**: Shell scripts + Vitest integration tests
- **Database**: SQLite (dev), PostgreSQL (prod)

### Migration Test Harness

**Scripts**:
- `scripts/migration-test.sh` (Linux/Mac)
- `scripts/migration-test.ps1` (Windows)

**Test Coverage**:
1. Fresh migration (apply all migrations to empty database)
2. Idempotency (re-run migrations without errors)
3. Schema validation (`prisma validate`)
4. Prisma Client generation
5. Database introspection (verify structure matches schema)
6. Seed data application
7. Backup/restore workflow
8. Migration history consistency
9. Foreign key constraint validation
10. Index existence validation

**Usage**:
```bash
# Windows
.\scripts\migration-test.ps1

# Linux/Mac
./scripts/migration-test.sh

# Cleanup test database
.\scripts\migration-test.ps1 -Cleanup
./scripts/migration-test.sh --cleanup
```

**Integration Tests**: `tests/integration/migrations/migration.spec.ts`

```typescript
describe('Prisma Migration Tests', () => {
  it('should apply all migrations to a fresh database', () => {
    // Validates migration deployment
  });

  it('should be idempotent (safe to run multiple times)', () => {
    // Ensures re-running migrations doesn't cause errors
  });

  it('should create all expected tables', async () => {
    // Verifies schema structure
  });

  it('should create indexes on critical columns', async () => {
    // Ensures performance indexes exist
  });

  it('should enforce foreign key constraints', async () => {
    // Validates referential integrity
  });

  it('should preserve data after re-running migrations', async () => {
    // Tests data persistence
  });

  it('should handle reset without errors', () => {
    // Validates rollback safety
  });
});
```

**Migration Best Practices**:
- Always test migrations before deploying to production
- Use `prisma migrate deploy` in production (never `db push`)
- Run migration tests in CI/CD pipeline
- Validate foreign keys and indexes after each migration
- Test rollback scenarios with `prisma migrate reset`
- Seed data should be idempotent and versioned

---

## Audit Logging Testing

### Overview

Audit logging is critical for compliance, security, and debugging. All audit log functionality must be thoroughly tested to ensure accurate tracking of critical events.

### Audit Service Coverage

**File**: `src/services/audit-service.ts`

**Required Coverage**: 80% minimum (business logic standard)

**Functions to Test**:
- `createAuditLog()` - Core logging function with context capture
- `createAuditLogBatch()` - Transactional batch operations
- `getAuditLogsForEntity()` - Entity history queries
- `getAuditLogsForStore()` - Store-scoped audit trails
- `auditCheckoutCompleted()` - Checkout event helper
- `auditPaymentValidated()` - Payment validation helper
- `auditOrderCreated()` - Order creation helper

**Test Coverage Areas**:

1. **Context Integration**:
   ```typescript
   it('should capture storeId from request context', async () => {
     mockRequestContext({ storeId: 'test-store-123', userId: 'user-456' });
     await createAuditLog({
       action: 'order.created',
       entityType: 'Order',
       entityId: 'order-789',
     });
     expect(db.auditLog.create).toHaveBeenCalledWith({
       data: expect.objectContaining({
         storeId: 'test-store-123',
         userId: 'user-456',
       }),
     });
   });
   ```

2. **Override Behavior**:
   ```typescript
   it('should allow explicit storeId override', async () => {
     mockRequestContext({ storeId: 'context-store' });
     await createAuditLog({
       action: 'test.action',
       storeId: 'override-store', // Explicit override
     });
     expect(db.auditLog.create).toHaveBeenCalledWith({
       data: expect.objectContaining({ storeId: 'override-store' }),
     });
   });
   ```

3. **JSON Serialization**:
   ```typescript
   it('should serialize changes object to JSON', async () => {
     await createAuditLog({
       action: 'product.updated',
       changes: {
         before: { price: 1000 },
         after: { price: 1200 },
         requestId: 'req-123',
       },
     });
     expect(db.auditLog.create).toHaveBeenCalledWith({
       data: expect.objectContaining({
         changes: JSON.stringify({
           before: { price: 1000 },
           after: { price: 1200 },
           requestId: 'req-123',
         }),
       }),
     });
   });
   ```

4. **Batch Operations**:
   ```typescript
   it('should create multiple audit logs in transaction', async () => {
     await createAuditLogBatch([
       { action: 'order.created', entityId: 'order-1' },
       { action: 'payment.validated', entityId: 'payment-1' },
     ]);
     expect(db.$transaction).toHaveBeenCalled();
   });
   ```

5. **Query Helpers**:
   ```typescript
   it('should filter audit logs by entity', async () => {
     await getAuditLogsForEntity('Order', 'order-123');
     expect(db.auditLog.findMany).toHaveBeenCalledWith({
       where: { entityType: 'Order', entityId: 'order-123' },
       orderBy: { createdAt: 'desc' },
     });
   });

   it('should filter audit logs by store with pagination', async () => {
     await getAuditLogsForStore('store-123', { limit: 50, offset: 100 });
     expect(db.auditLog.findMany).toHaveBeenCalledWith({
       where: { storeId: 'store-123' },
       skip: 100,
       take: 50,
     });
   });
   ```

**Integration Testing**:

Test audit logging in real scenarios:

```typescript
describe('Checkout Audit Trail', () => {
  it('should create audit logs for complete checkout flow', async () => {
    // Create order
    const order = await createOrder(checkoutInput);

    // Verify audit logs
    const logs = await getAuditLogsForEntity('Order', order.id);
    
    expect(logs).toHaveLength(3);
    expect(logs[0].action).toBe('checkout.completed');
    expect(logs[1].action).toBe('order.created');
    expect(logs[2].action).toBe('payment.validated');
  });
});
```

**E2E Audit Verification**:

```typescript
test('checkout flow creates complete audit trail', async ({ page }) => {
  // Complete checkout
  await page.goto('/checkout');
  await fillCheckoutForm(page);
  await page.click('[data-testid="submit-order"]');
  
  // Verify audit logs in database
  const orderId = await getOrderIdFromPage(page);
  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: 'Order', entityId: orderId },
  });
  
  expect(auditLogs).toHaveLength(3);
  expect(auditLogs.some(log => log.action === 'payment.validated')).toBe(true);
});
```

**Audit Log Schema Validation**:

All audit logs must include:
- `id` (CUID)
- `storeId` (tenant isolation)
- `userId` (who performed the action)
- `action` (semantic action name, e.g., 'order.created')
- `entityType` (e.g., 'Order', 'Product', 'Payment')
- `entityId` (resource identifier)
- `changes` (JSON with before/after state, requestId)
- `ipAddress` (client IP for security)
- `userAgent` (client info for debugging)
- `createdAt` (timestamp)

---

## End-to-End Testing

### Technology Stack

- **Framework**: Playwright 1.56.0
- **Architecture**: Page Object Model (POM)
- **Browsers**: Chromium, Firefox, WebKit (via BrowserStack)
- **Visual Regression**: BrowserStack Percy
- **Accessibility**: axe-core/playwright

### E2E Test Configuration

**File**: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### Page Object Model Structure

See `spec.md` E2E Test Scenarios section for complete POM structure and test examples.

**Example Page Object**: `tests/e2e/pages/auth/LoginPage.ts`

```typescript
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.submitButton = page.locator('[data-testid="login-button"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.forgotPasswordLink = page.locator('[data-testid="forgot-password-link"]');
  }

  async goto() {
    await this.page.goto('/auth/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific browser
npm run test:e2e -- --project=chromium

# Run specific test file
npm run test:e2e -- auth.spec.ts

# Run in UI mode (interactive)
npx playwright test --ui

# Debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

---

## Performance Testing

### Technology Stack

- **Load Testing**: k6 (Grafana)
- **Frontend Performance**: Lighthouse CI
- **Real User Monitoring**: Vercel Analytics

### k6 Load Testing

**File**: `tests/performance/load-test.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 100 },  // Ramp up to 100 users (SC-028)
    { duration: '2m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate under 1%
    errors: ['rate<0.05'],             // Custom error rate under 5%
  },
};

export default function () {
  // Homepage load test (SC-021)
  const homeRes = http.get('http://localhost:3000');
  check(homeRes, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads in < 2s': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);

  sleep(1);

  // Product listing load test (SC-022)
  const productsRes = http.get('http://localhost:3000/products');
  check(productsRes, {
    'products status is 200': (r) => r.status === 200,
    'products load in < 2.5s': (r) => r.timings.duration < 2500,
  }) || errorRate.add(1);

  sleep(1);

  // API load test
  const apiRes = http.get('http://localhost:3000/api/products?page=1&perPage=24', {
    headers: { 'Content-Type': 'application/json' },
  });
  check(apiRes, {
    'API status is 200': (r) => r.status === 200,
    'API responds in < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(2);
}
```

**Running k6 Tests**:

```bash
# Run load test
k6 run tests/performance/load-test.js

# Run with cloud results
k6 cloud tests/performance/load-test.js

# Run stress test (1000 concurrent users)
k6 run --vus 1000 --duration 5m tests/performance/stress-test.js
```

### Lighthouse CI Configuration

**File**: `lighthouserc.json`

```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/products",
        "http://localhost:3000/products/test-product",
        "http://localhost:3000/cart",
        "http://localhost:3000/checkout"
      ],
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop",
        "throttling": {
          "rttMs": 40,
          "throughputKbps": 10240,
          "cpuSlowdownMultiplier": 1
        }
      }
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }],
        "categories:seo": ["warn", { "minScore": 0.9 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["error", { "maxNumericValue": 300 }],
        "speed-index": ["error", { "maxNumericValue": 3000 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

**Running Lighthouse CI**:

```bash
# Run Lighthouse CI locally
npm run lighthouse

# Run in CI (see ci-cd-configuration.md)
lhci autorun
```

### CI Performance Gating (T044)

**STATUS**: ✅ **ENABLED** - Performance budgets enforced in CI/CD pipeline

#### Overview

StormCom enforces strict performance budgets in CI to prevent performance regressions from being merged. Both k6 (load testing) and Lighthouse CI (frontend performance) will **block PRs** from merging if thresholds are breached.

#### Gating Triggers

Performance tests run automatically when PRs touch **critical paths**:

**k6 Load Tests** (`.github/workflows/k6-load-tests.yml`):
- `src/app/api/checkout/**`
- `src/app/api/orders/**`
- `src/services/checkout-service.ts`
- `src/services/pricing-service.ts`
- `src/services/export-service.ts`
- `src/services/payment-service.ts`
- `tests/performance/**`

**Lighthouse CI** (`.github/workflows/lighthouse.yml`):
- `src/app/(storefront)/**`
- `src/app/(dashboard)/**`
- `src/app/api/**`
- `src/components/**`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `public/**`

#### k6 Thresholds (Constitution §118-120)

| Metric | Threshold | Applies To | Severity |
|--------|-----------|------------|----------|
| API Response (p95) | < 500ms | All API endpoints | ❌ BLOCKING |
| Checkout Complete (p95) | < 650ms | Checkout flow | ❌ BLOCKING |
| Error Rate | < 1% | Checkout flow | ❌ BLOCKING |
| Success Rate | > 99% | Checkout flow | ❌ BLOCKING |
| Streaming Export (p95) | < 5s | Orders export (≤10k) | ❌ BLOCKING |
| Async Enqueue (p95) | < 500ms | Orders export (>10k) | ❌ BLOCKING |
| Error Rate | < 2% | Export flow | ❌ BLOCKING |
| Success Rate | > 98% | Export flow | ❌ BLOCKING |

**Test Scenarios**:
- **Checkout Load Test**: 50 VUs for 2 minutes
- **Export Load Test**: 20 VUs for 1.5 minutes

**Failure Behavior**:
```bash
❌ k6 load test FAILED - Thresholds breached
Thresholds: API p95 < 500ms, Checkout p95 < 650ms
Error rate < 1%, Success rate > 99%
```

#### Lighthouse CI Budgets (Constitution §128-134)

| Metric | Desktop | Mobile | Severity |
|--------|---------|--------|----------|
| LCP (Largest Contentful Paint) | < 2.0s | < 2.5s | ❌ BLOCKING |
| FID (First Input Delay) | < 100ms | < 100ms | ❌ BLOCKING |
| CLS (Cumulative Layout Shift) | < 0.1 | < 0.1 | ❌ BLOCKING |
| TTI (Time to Interactive) | < 3.0s | < 3.0s | ❌ BLOCKING |
| TBT (Total Blocking Time) | < 300ms | < 300ms | ❌ BLOCKING |
| JavaScript Bundle (gzipped) | < 200KB | < 200KB | ❌ BLOCKING |
| Performance Score | ≥ 90 | ≥ 90 | ❌ BLOCKING |
| Accessibility Score | ≥ 90 | ≥ 90 | ❌ BLOCKING |

**Test Pages**:
- Homepage (`/`)
- Product list (`/products`)
- Checkout page (`/checkout`)
- Dashboard (`/dashboard`)
- Product management (`/dashboard/products`)

**Failure Behavior**:
```bash
❌ Lighthouse CI FAILED (Desktop) - Performance budgets breached
Constitution budgets: LCP < 2.0s, CLS < 0.1, FID < 100ms, TTI < 3.0s
Performance score ≥ 90, Accessibility ≥ 90, Bundle < 200KB
```

#### Bypass Procedures

**🚨 Emergency Bypass** (Requires approval from Tech Lead + Product Owner):

If performance issues are blocking a **critical hotfix** or **time-sensitive security patch**:

1. **Create bypass issue**:
   ```bash
   gh issue create --title "Performance Bypass Request: [PR #XXX]" \
     --label "performance,bypass-request" \
     --body "Reason: [Critical hotfix/Security patch]
     PR: #XXX
     Threshold breached: [k6 checkout p95 / Lighthouse LCP / etc.]
     Remediation plan: [Link to remediation issue]
     Approvals: @tech-lead @product-owner"
   ```

2. **Skip workflow** (temporarily):
   ```yaml
   # Add to PR description
   [skip k6] - Bypass approved in issue #XXX
   [skip lighthouse] - Bypass approved in issue #XXX
   ```

3. **Create remediation issue**:
   - **Due date**: Within 2 sprints (4 weeks max)
   - **Label**: `performance-debt`, `priority-p1`
   - **Link**: Reference original bypass issue

4. **Post-merge tracking**:
   - Add to technical debt backlog
   - Track in weekly performance review
   - Re-run tests after remediation

**⚠️ Standard Override** (Requires Tech Lead approval):

For **known performance trade-offs** (new feature with acceptable temporary regression):

1. **Update thresholds** (temporary):
   ```javascript
   // lighthouserc.js (add comment with expiration)
   // TEMPORARY OVERRIDE: Expires 2025-12-31 (Issue #XXX)
   'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }], // Was: 2000
   ```

2. **Document in PR**:
   - Reason for regression
   - Optimization plan
   - Expected timeline
   - Approved by: @tech-lead

3. **Revert after optimization**:
   ```bash
   git revert <commit> # Revert threshold change
   ```

#### Best Practices

**Before Opening PR**:
```bash
# Run k6 locally
npm run build
npm run start &
k6 run tests/performance/checkout-load-test.js
k6 run tests/performance/orders-export-load-test.js

# Run Lighthouse locally
npm run lighthouse
```

**Fixing Failures**:

1. **k6 failures**:
   - Review server logs for slow queries (DB query p95 < 100ms)
   - Check API response sizes (gzip large payloads)
   - Optimize database indexes
   - Add caching for expensive computations
   - Profile with Chrome DevTools Network tab

2. **Lighthouse failures**:
   - Reduce JavaScript bundle size (code splitting, tree shaking)
   - Optimize images (WebP, responsive sizing, lazy loading)
   - Minimize render-blocking resources
   - Remove unused CSS/JS
   - Use Next.js Image component with priority
   - Defer non-critical scripts

3. **Common issues**:
   - **LCP slow**: Large images above fold → use Next.js Image with `priority`
   - **CLS high**: Missing width/height on images → add dimensions
   - **TBT high**: Heavy client-side JS → move to Server Components
   - **Bundle bloat**: Large dependencies → use dynamic imports

#### Monitoring

**Daily Automated Runs**:
- k6 tests run at 2 AM UTC (cron: `0 2 * * *`)
- Results stored in GitHub Actions artifacts (30 days)

**PR Comments**:
Both workflows post detailed results to PRs:
- ✅ Pass/fail status with emoji indicators
- 📊 Detailed threshold breakdown
- 🔗 Links to artifacts for deep dive
- 📚 Constitution reference sections

**Slack Notifications** (optional):
```yaml
# .github/workflows/k6-load-tests.yml
- name: Notify Slack
  uses: slackapi/slack-github-action@v1
  if: failure()
  with:
    payload: |
      {
        "text": "❌ k6 load test FAILED on ${{ github.ref }}"
      }
```

#### References

- **Constitution**: Performance requirements §118-134, §177-195
- **k6 workflow**: `.github/workflows/k6-load-tests.yml`
- **Lighthouse workflow**: `.github/workflows/lighthouse.yml`
- **k6 tests**: `tests/performance/checkout-load-test.js`, `tests/performance/orders-export-load-test.js`
- **Lighthouse configs**: `lighthouserc.js` (desktop), `lighthouserc.mobile.js` (mobile)

---

## Accessibility Testing

### Technology Stack

- **Framework**: axe-core + @axe-core/playwright
- **Standard**: WCAG 2.1 Level AA compliance
- **Manual Testing**: Keyboard navigation, screen readers (NVDA, JAWS, VoiceOver)
- **CI Integration**: Automated axe assertions in E2E tests

### Automated Accessibility Testing

**Installation**:
```bash
npm install -D @axe-core/playwright
```

**Integration with Playwright**:

```typescript
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Checkout Flow Accessibility', () => {
  test('checkout page should have no accessibility violations', async ({ page }) => {
    await page.goto('/checkout');
    
    // Inject axe-core into the page
    await injectAxe(page);
    
    // Run accessibility checks
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('checkout form should be keyboard navigable', async ({ page }) => {
    await page.goto('/checkout');
    await injectAxe(page);
    
    // Tab through form fields
    await page.keyboard.press('Tab');
    await expect(page.locator('[name="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[name="firstName"]')).toBeFocused();
    
    // Verify no violations after keyboard navigation
    await checkA11y(page);
  });

  test('newsletter signup should meet WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/newsletter');
    await injectAxe(page);
    
    // Check with specific WCAG 2.1 AA rules
    await checkA11y(page, null, {
      axeOptions: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
        }
      }
    });
  });
});
```

**Common Accessibility Patterns**:

1. **Form Labels**:
   ```tsx
   <label htmlFor="email">Email Address</label>
   <input id="email" name="email" type="email" required />
   ```

2. **ARIA Labels**:
   ```tsx
   <button aria-label="Add to cart">
     <ShoppingCartIcon />
   </button>
   ```

3. **Live Regions**:
   ```tsx
   <div role="status" aria-live="polite" aria-atomic="true">
     {loading ? 'Loading...' : `${products.length} products found`}
   </div>
   ```

4. **Keyboard Navigation**:
   ```tsx
   <div 
     role="button" 
     tabIndex={0}
     onClick={handleClick}
     onKeyDown={(e) => {
       if (e.key === 'Enter' || e.key === ' ') {
         handleClick();
       }
     }}
   >
     Click me
   </div>
   ```

### Accessibility Checklist

**Required for all components**:
- [ ] Color contrast ratio ≥ 4.5:1 for normal text (WCAG AA)
- [ ] Color contrast ratio ≥ 3:1 for large text (WCAG AA)
- [ ] All interactive elements keyboard accessible (Tab, Enter, Escape)
- [ ] Focus indicators visible (2px ring with offset)
- [ ] Touch targets ≥ 44×44px (mobile)
- [ ] Semantic HTML (headings, landmarks, lists)
- [ ] Form labels for all inputs
- [ ] ARIA labels for icon-only buttons
- [ ] Error messages associated with form fields
- [ ] Loading states announced to screen readers (aria-live)

**Testing Workflow**:
1. Run automated axe checks in E2E tests
2. Manual keyboard navigation testing
3. Screen reader testing (NVDA on Windows, VoiceOver on Mac)
4. BrowserStack Accessibility Testing for cross-browser validation
5. Review axe results in CI/CD pipeline

See `design-system.md` for complete accessibility guidelines and component library patterns.

---

## Visual Regression Testing

See `design-system.md` for complete Percy setup and visual regression testing strategy.

**Percy Threshold**: 0.1% (1 pixel difference in 1000 pixels)

---

## API Contract Testing

### Technology Stack

- **Framework**: Dredd or Schemathesis
- **Contract Source**: OpenAPI 3.1 spec (`specs/001-multi-tenant-ecommerce/contracts/openapi.yaml`)

### Dredd Configuration

**File**: `dredd.yml`

```yaml
reporter: []
dry-run: false
hookfiles: ./tests/api-contract/hooks.ts
language: nodejs
require: ts-node/register
server: npm start
server-wait: 3
init: false
names: false
only: []
output: []
header: []
sorted: false
user: null
inline-errors: false
details: false
method: []
color: true
level: info
timestamp: false
silent: false
path: []
hooks-worker-timeout: 5000
hooks-worker-connect-timeout: 1500
hooks-worker-connect-retry: 500
hooks-worker-after-connect-wait: 100
hooks-worker-term-timeout: 5000
hooks-worker-term-retry: 500
hooks-worker-handler-host: 127.0.0.1
hooks-worker-handler-port: 61321
config: ./dredd.yml
blueprint: specs/001-multi-tenant-ecommerce/contracts/openapi.yaml
endpoint: http://localhost:3000
```

**Running Contract Tests**:

```bash
# Run API contract tests
npm run test:api-contract

# Run with specific endpoint
dredd specs/001-multi-tenant-ecommerce/contracts/openapi.yaml http://localhost:3000
```

---

## Test Data and Fixtures

### Fixture Strategy

**Centralized Fixtures**: `tests/fixtures/`

```
tests/fixtures/
├── index.ts
├── stores.ts
├── users.ts
├── products.ts
├── orders.ts
└── customers.ts
```

**File**: `tests/fixtures/stores.ts`

```typescript
import { prisma } from '../integration/setup';

export async function seedStore(data?: Partial<{
  name: string;
  subdomain: string;
  plan: string;
}>) {
  return await prisma.store.create({
    data: {
      name: data?.name || 'Test Store',
      subdomain: data?.subdomain || `test-${Date.now()}`,
      status: 'ACTIVE',
      subscription: {
        create: {
          planId: data?.plan || 'basic',
          status: 'ACTIVE',
          startDate: new Date(),
        },
      },
    },
  });
}

export async function seedStoreWithProducts(productCount: number = 10) {
  const store = await seedStore();
  const products = await seedProducts(store.id, productCount);
  return { store, products };
}
```

**File**: `tests/fixtures/users.ts`

```typescript
import { prisma } from '../integration/setup';
import bcrypt from 'bcryptjs';

export async function seedUser(data: {
  email: string;
  password?: string;
  role: 'SUPER_ADMIN' | 'STORE_ADMIN' | 'STAFF' | 'CUSTOMER';
  storeId?: string;
}) {
  const hashedPassword = await bcrypt.hash(data.password || 'password123', 12);

  return await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      role: data.role,
      storeId: data.storeId,
      emailVerified: new Date(),
    },
  });
}
```

### Database Seeding

**File**: `prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { seedStore, seedUser, seedProducts } from '../tests/fixtures';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed Super Admin
  const superAdmin = await seedUser({
    email: 'superadmin@stormcom.com',
    password: 'SuperAdmin123!',
    role: 'SUPER_ADMIN',
  });
  console.log('✅ Super Admin created');

  // Seed Test Store
  const testStore = await seedStore({
    name: 'Demo Store',
    subdomain: 'demo',
    plan: 'pro',
  });
  console.log('✅ Test Store created');

  // Seed Store Admin
  await seedUser({
    email: 'admin@demo.com',
    password: 'Admin123!',
    role: 'STORE_ADMIN',
    storeId: testStore.id,
  });
  console.log('✅ Store Admin created');

  // Seed Products
  await seedProducts(testStore.id, 50);
  console.log('✅ 50 Products seeded');

  console.log('🎉 Seeding complete!');
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

**Running Seeds**:

```bash
# Seed development database
npm run db:seed

# Seed test database
NODE_ENV=test npm run db:seed
```

---

## CI/CD Integration

See `ci-cd-configuration.md` for complete GitHub Actions workflows.

**Test Commands in package.json**:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:visual": "playwright test tests/e2e/visual-regression",
    "test:a11y": "playwright test tests/e2e/accessibility",
    "test:api-contract": "dredd",
    "test:performance": "k6 run tests/performance/load-test.js",
    "lighthouse": "lhci autorun"
  }
}
```

---

## Coverage Reports

### Viewing Coverage Reports

After running `npm run test:coverage`, open `coverage/index.html` in browser.

**Coverage Thresholds** (enforced in CI):

- **Global**: 80% branches, functions, lines, statements
- **Services** (`src/services/`): 90%
- **Utils** (`src/lib/utils/`): 100%

### Coverage Badges

Add to README.md:

```markdown
[![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen.svg)](./coverage)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](./test-results)
```

---

## Test Maintenance

### Test Review Schedule

- **Daily**: Review failing tests in CI
- **Weekly**: Review flaky tests and update snapshots
- **Monthly**: Audit test coverage gaps
- **Quarterly**: Major test suite refactoring and optimization

### Flaky Test Policy

1. **Identify**: Tests that fail intermittently
2. **Label**: Tag with `@flaky` in test description
3. **Isolate**: Increase retry count temporarily
4. **Fix**: Address root cause (timing issues, race conditions)
5. **Remove**: Delete if unfixable after 2 weeks

### Test Performance Optimization

- **Parallel execution**: Run independent tests concurrently
- **Selective testing**: Use `--changed` flag to run only affected tests
- **Database optimization**: Use in-memory SQLite for fast integration tests
- **Mock external services**: Avoid real API calls in unit/integration tests

---

**Document Owner**: QA Team  
**Last Review**: October 22, 2025  
**Next Review**: January 22, 2026
