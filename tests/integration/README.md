# Integration Tests Configuration

This directory contains integration tests for the StormCom services layer and API routes.

## Structure

```
tests/integration/
├── helpers/
│   ├── database.ts     # Database setup and cleanup utilities
│   └── test-data.ts    # Test data factories and utilities
├── products/
│   └── product-service.test.ts    # ProductService integration tests
├── categories/
│   └── category-service.test.ts   # CategoryService integration tests
├── attributes/
│   └── attribute-service.test.ts  # AttributeService integration tests
└── api/
    └── products-api.test.ts       # API routes integration tests
```

## Setup

Integration tests use a separate SQLite database for each test run to ensure isolation. The database is automatically created and cleaned up by the test helpers.

### Prerequisites

1. **Prisma Schema**: Ensure your Prisma schema is up to date
2. **Environment**: Tests run with `NODE_ENV=test`
3. **Database**: SQLite database files are created in `./prisma/test-*.db`

### Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npm run test:integration products/product-service.test.ts

# Run with coverage
npm run test:integration -- --coverage

# Run in watch mode
npm run test:integration -- --watch
```

## Test Helpers

### Database Helpers (`helpers/database.ts`)

- `setupTestDatabase()` - Creates and migrates a new test database
- `cleanupTestDatabase()` - Disconnects and removes test database
- `resetTestDatabase()` - Truncates all tables while preserving schema
- `getTestPrismaClient()` - Returns the test database client
- `executeRawQuery(query)` - Execute raw SQL in test database
- `getTestDatabaseStats()` - Get table row counts for debugging

### Test Data Factories (`helpers/test-data.ts`)

- `createTestStore(name?, customData?)` - Create test store
- `createTestUser(storeId, customData?)` - Create test user
- `createTestAdmin(storeId, customData?)` - Create test admin user
- `createTestCategory(storeId, customData?)` - Create test category
- `createTestProduct(storeId, categoryId, customData?)` - Create test product
- `createTestAttribute(storeId, customData?)` - Create test attribute
- `createTestCustomer(storeId, customData?)` - Create test customer
- `createTestOrder(customerId, storeId, customData?)` - Create test order
- `createTestSetup(options?)` - Create complete test environment
- `cleanupTestData(storeId)` - Clean up all data for a store

### Utility Functions

- `generateTestEmail(domain?)` - Generate random test email
- `generateTestSlug(prefix?)` - Generate random slug
- `generateTestSku(prefix?)` - Generate random SKU
- `waitFor(ms)` - Wait for specified time
- `assertDatesEqual(date1, date2, tolerance?)` - Assert dates are approximately equal

## Test Patterns

### Basic Service Test

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProductService } from '../../../src/services/product-service';
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database';
import { createTestStore, createTestCategory } from '../helpers/test-data';

describe('ProductService Integration Tests', () => {
  let productService: ProductService;
  let testStoreId: string;

  beforeEach(async () => {
    await setupTestDatabase();
    
    const store = await createTestStore();
    testStoreId = store.id;
    
    productService = new ProductService();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should create a product', async () => {
    const category = await createTestCategory(testStoreId);
    
    const product = await productService.create(testStoreId, {
      name: 'Test Product',
      sku: 'TEST-001',
      price: 99.99,
      categoryId: category.id,
    });

    expect(product.name).toBe('Test Product');
    expect(product.storeId).toBe(testStoreId);
  });
});
```

### API Route Test

```typescript
import { NextRequest } from 'next/server';

describe('Products API', () => {
  it('should create product via API', async () => {
    const request = new NextRequest('http://localhost/api/products', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-store-id': testStoreId,
        'x-user-id': testUserId,
      },
      body: JSON.stringify(productData),
    });

    const { POST } = await import('../../../src/app/api/products/route');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
  });
});
```

## Test Data Management

### Multi-tenant Isolation

All tests ensure proper multi-tenant isolation:

```typescript
it('should not return data from other stores', async () => {
  const store1 = await createTestStore('Store 1');
  const store2 = await createTestStore('Store 2');
  
  const product1 = await createTestProduct(store1.id, category1.id);
  const product2 = await createTestProduct(store2.id, category2.id);
  
  const store1Products = await productService.list(store1.id);
  
  expect(store1Products.products).toHaveLength(1);
  expect(store1Products.products[0].storeId).toBe(store1.id);
});
```

### Database Transactions

Use transactions for complex test scenarios:

```typescript
it('should handle complex operations', async () => {
  await withTestTransaction(async (tx) => {
    // Multiple related operations
    const category = await tx.category.create({ ... });
    const product = await tx.product.create({ ... });
    const variant = await tx.productVariant.create({ ... });
    
    // All operations succeed or fail together
  });
});
```

## Error Scenarios

Tests include comprehensive error handling:

```typescript
it('should handle validation errors', async () => {
  await expect(
    productService.create(testStoreId, {
      name: '', // Invalid empty name
      sku: 'INVALID',
      price: -100, // Invalid negative price
    })
  ).rejects.toThrow('Validation failed');
});

it('should handle duplicate constraints', async () => {
  await productService.create(testStoreId, { sku: 'DUPLICATE' });
  
  await expect(
    productService.create(testStoreId, { sku: 'DUPLICATE' })
  ).rejects.toThrow('SKU already exists');
});
```

## Performance Testing

```typescript
it('should handle large datasets efficiently', async () => {
  const startTime = Date.now();
  
  // Create 1000 products
  const promises = Array.from({ length: 1000 }, (_, i) =>
    productService.create(testStoreId, {
      name: `Product ${i}`,
      sku: `SKU-${i}`,
      price: 100 + i,
      categoryId: testCategoryId,
    })
  );
  
  await Promise.all(promises);
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
});
```

## Debugging Tests

### Database Inspection

```typescript
it('should debug database state', async () => {
  const stats = await getTestDatabaseStats();
  console.log('Database stats:', stats);
  
  const products = await executeRawQuery('SELECT * FROM products LIMIT 5');
  console.log('Sample products:', products);
});
```

### Test Data Inspection

```typescript
beforeEach(async () => {
  const setup = await createTestSetup({
    categoriesCount: 3,
    productsCount: 10,
  });
  
  console.log(`Created ${setup.categories.length} categories`);
  console.log(`Created ${setup.products.length} products`);
});
```

## Best Practices

1. **Isolation**: Each test should be independent and not affect others
2. **Cleanup**: Always clean up test data in `afterEach`
3. **Realistic Data**: Use realistic test data that mirrors production scenarios
4. **Error Cases**: Test both success and failure scenarios
5. **Performance**: Include performance assertions for critical operations
6. **Multi-tenancy**: Always test tenant isolation
7. **Transactions**: Use transactions for complex operations
8. **Mocking**: Mock external services and APIs, not internal database operations
9. **Debugging**: Include helpful debug information for failing tests
10. **Documentation**: Document complex test scenarios and edge cases

## Common Issues

### Database Connection

If tests fail with database connection errors:

```bash
# Ensure no other processes are using the test database
pkill -f "test-.*.db"

# Clear any leftover test database files
rm -f ./prisma/test-*.db
```

### Schema Drift

If tests fail due to schema issues:

```bash
# Reset and regenerate Prisma client
npx prisma generate

# Ensure test database uses latest schema
npm run test:integration -- --no-cache
```

### Memory Leaks

For long-running test suites:

```typescript
afterEach(async () => {
  await cleanupTestDatabase();
  
  // Force garbage collection in tests
  if (global.gc) {
    global.gc();
  }
});
```