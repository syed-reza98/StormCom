# Vitest Testing Standards for StormCom

Guidelines for unit and integration testing in StormCom using Vitest 3.2.4 and Testing Library.

## Test File Organization

```
src/
├── components/
│   ├── ProductCard.tsx
│   └── __tests__/
│       └── ProductCard.test.tsx
├── services/
│   ├── products.ts
│   └── __tests__/
│       └── products.test.ts
└── lib/
    ├── utils.ts
    └── __tests__/
        └── utils.test.ts
```

## Test Structure (AAA Pattern)

Use **Arrange, Act, Assert** pattern:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ProductService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return products for a store', async () => {
      // Arrange
      const mockProducts = [
        { id: '1', name: 'Product 1', storeId: 'store-1' },
        { id: '2', name: 'Product 2', storeId: 'store-1' },
      ];
      prismaMock.product.findMany.mockResolvedValue(mockProducts);

      // Act
      const result = await getProducts('store-1');

      // Assert
      expect(result).toEqual(mockProducts);
      expect(prismaMock.product.findMany).toHaveBeenCalledWith({
        where: { storeId: 'store-1', deletedAt: null },
      });
    });
  });
});
```

## Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProductCard from '../ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 29.99,
    image: '/images/test.jpg',
  };

  it('should render product information', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('should call onAddToCart when button clicked', () => {
    const onAddToCart = vi.fn();
    render(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />);
    
    const addButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addButton);
    
    expect(onAddToCart).toHaveBeenCalledWith(mockProduct.id);
    expect(onAddToCart).toHaveBeenCalledTimes(1);
  });

  it('should show out of stock message when quantity is 0', () => {
    const outOfStockProduct = { ...mockProduct, quantity: 0 };
    render(<ProductCard product={outOfStockProduct} />);
    
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add to cart/i })).not.toBeInTheDocument();
  });
});
```

## Service/Logic Testing

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from '@/tests/mocks/prisma';
import { getProducts, createProduct } from '../products';

describe('Product Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProducts', () => {
    it('should return products for a store', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', storeId: 'store-1' },
      ];
      prismaMock.product.findMany.mockResolvedValue(mockProducts);

      const result = await getProducts('store-1');

      expect(result).toEqual(mockProducts);
      expect(prismaMock.product.findMany).toHaveBeenCalledWith({
        where: { storeId: 'store-1', deletedAt: null },
      });
    });

    it('should filter deleted products', async () => {
      await getProducts('store-1');

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        })
      );
    });
  });

  describe('createProduct', () => {
    it('should create product with valid data', async () => {
      const productData = {
        name: 'New Product',
        price: 49.99,
        storeId: 'store-1',
      };
      const createdProduct = { id: '1', ...productData };
      
      prismaMock.product.create.mockResolvedValue(createdProduct);

      const result = await createProduct(productData);

      expect(result).toEqual(createdProduct);
    });

    it('should throw error for invalid price', async () => {
      const invalidData = { name: 'Product', price: -10, storeId: 'store-1' };

      await expect(createProduct(invalidData)).rejects.toThrow(
        'Price must be positive'
      );
    });
  });
});
```

## Utility Function Testing

```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency, calculateDiscount, cn } from '../utils';

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('should format number as USD currency', () => {
      expect(formatCurrency(29.99)).toBe('$29.99');
      expect(formatCurrency(1000)).toBe('$1,000.00');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should round to 2 decimal places', () => {
      expect(formatCurrency(29.999)).toBe('$30.00');
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate percentage discount correctly', () => {
      expect(calculateDiscount(100, 20)).toBe(80);
      expect(calculateDiscount(50, 10)).toBe(45);
    });

    it('should return original price for 0% discount', () => {
      expect(calculateDiscount(100, 0)).toBe(100);
    });

    it('should return 0 for 100% discount', () => {
      expect(calculateDiscount(100, 100)).toBe(0);
    });
  });

  describe('cn (className merger)', () => {
    it('should merge class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'active', false && 'inactive')).toBe('base active');
    });
  });
});
```

## Mocking Setup

### Prisma Mock
```typescript
// tests/mocks/prisma.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';

export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

beforeEach(() => {
  mockReset(prismaMock);
});
```

### Auth Mock
```typescript
// tests/mocks/auth.ts
import { Session } from 'next-auth';

export function mockSession(session: Session | null) {
  vi.mock('next-auth', () => ({
    getServerSession: vi.fn(() => Promise.resolve(session)),
  }));
}
```

## API Route Testing

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/products/route';
import { prismaMock } from '@/tests/mocks/prisma';
import { mockSession } from '@/tests/mocks/auth';

describe('Products API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return products with pagination', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1' },
        { id: '2', name: 'Product 2' },
      ];

      prismaMock.product.findMany.mockResolvedValue(mockProducts);
      prismaMock.product.count.mockResolvedValue(2);
      mockSession({ user: { storeId: 'store-1' } });

      const request = new Request('http://localhost:3000/api/products?page=1&perPage=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockProducts);
      expect(data.meta).toEqual({
        page: 1,
        perPage: 10,
        total: 2,
        totalPages: 1,
      });
    });

    it('should return 401 if not authenticated', async () => {
      mockSession(null);

      const request = new Request('http://localhost:3000/api/products');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });
});
```

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- src/services/__tests__/products.test.ts

# Run tests matching pattern
npm run test -- --grep "Product"
```

## Coverage Goals

- **Business logic** (`src/services/`, `src/lib/`): Minimum 80% coverage
- **Utility functions**: 100% coverage
- **Critical paths**: 100% coverage (auth, checkout, orders, payments)
- **API routes**: 100% integration test coverage

## Best Practices

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Use descriptive test names**: `it('should...')`
3. **Test one thing per test**: Each test verifies one behavior
4. **Mock external dependencies**: Database, APIs, third-party services
5. **Clean up after tests**: Reset mocks, close connections
6. **Test edge cases**: Empty arrays, null values, errors
7. **Test accessibility**: Keyboard navigation, ARIA attributes
8. **Avoid implementation details**: Test behavior, not implementation
9. **Keep tests fast**: Use mocks, avoid real database calls
10. **Maintain tests**: Update tests when behavior changes

## References

- Project Constitution: `.specify/memory/constitution.md`
- Testing Documentation: `docs/testing/`
- Vitest Documentation: https://vitest.dev/
