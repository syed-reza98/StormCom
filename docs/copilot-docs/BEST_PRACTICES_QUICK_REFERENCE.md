# Best Practices Quick Reference
## StormCom Development Team

Last Updated: November 3, 2025

---

## 🚀 Quick Start Checklist

Before writing any code, verify:
- [ ] Dev server running (`npm run dev`)
- [ ] TypeScript strict mode enabled
- [ ] Read relevant `.github/instructions/*.md` file
- [ ] Check project constitution (`.specify/memory/constitution.md`)

---

## 📋 Code Standards (Must Follow)

### File Size Limits
```typescript
✅ Maximum 300 lines per file
✅ Maximum 50 lines per function
⚠️ Refactor when approaching 240 lines (80% threshold)
```

### Naming Conventions
```typescript
// Variables, functions
const userId = '123';
const getUserById = () => {};

// Components, types, classes
const ProductCard = () => {};
interface UserProfile {}
class OrderService {}

// Constants
const MAX_FILE_SIZE = 5000000;
const API_ENDPOINT = '/api/v1';

// Files
ProductCard.tsx        // Component
use-cart.ts           // Hook
product-service.ts    // Service
```

---

## 🎯 Next.js 15+ Patterns (Required)

### 1. Async SearchParams (CRITICAL)
```typescript
// ✅ CORRECT
export default async function Page({ 
  searchParams 
}: { 
  searchParams: Promise<{ query?: string }> 
}) {
  const params = await searchParams;
  return <div>{params.query}</div>;
}

// ❌ WRONG
export default function Page({ searchParams }) {
  // Won't work in Next.js 15+
}
```

### 2. Server Components (Default)
```typescript
// ✅ Server Component (no directive needed)
export default async function ProductList() {
  const products = await getProducts();
  return <div>...</div>;
}

// ✅ Client Component (explicit)
'use client';
export default function AddToCart() {
  const [loading, setLoading] = useState(false);
  return <button>...</button>;
}
```

**When to use Client Components**:
- Event handlers (onClick, onChange)
- React hooks (useState, useEffect, useContext)
- Browser APIs (window, localStorage)
- Third-party libraries requiring client-side JS

---

## ⚡ Performance Patterns (Reusable)

### Pattern 1: Module-Level Caching
```typescript
// ✅ Calculate once at module load
const mockData = [/* ... */];
const statsCache = {
  total: mockData.length,
  lowStock: mockData.filter(/* ... */).length,
};

export default async function Page() {
  // Use cached data (0ms)
  const stats = statsCache;
}
```

**Use for**: Mock data, static calculations, config objects

### Pattern 2: useMemo for Expensive Objects
```typescript
// ✅ Create once per component lifecycle
const currencyFormatter = useMemo(
  () => new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD' 
  }),
  []
);

const formatPrice = (price: number) => {
  return currencyFormatter.format(price);
};
```

**Use for**: Intl formatters, RegExp, computed values

### Pattern 3: React.memo
```typescript
// ✅ Prevent unnecessary re-renders
const TableComponent = ({ data, filters }) => {
  // ... expensive render logic
};

export const Table = memo(TableComponent, (prev, next) => {
  return (
    prev.filters.search === next.filters.search &&
    prev.data.length === next.data.length
  );
});
```

**Use for**: Complex components, tables, lists, dashboards

---

## 🔒 Security Checklist

### Input Validation (Required)
```typescript
import { z } from 'zod';

// ✅ Define schema
const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().positive(),
  sku: z.string().regex(/^[A-Z0-9-]+$/),
});

// ✅ Validate in API route
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = createProductSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', details: validation.error } },
      { status: 400 }
    );
  }
  
  // Use validation.data (type-safe)
}
```

### Multi-Tenant Isolation (Required)
```typescript
// ✅ Always filter by storeId
const products = await prisma.product.findMany({
  where: { 
    storeId: session.user.storeId,  // Required
    deletedAt: null,                // Soft delete
  },
});

// ❌ Never query without storeId
const products = await prisma.product.findMany(); // SECURITY BUG
```

### Authentication Check (Required)
```typescript
// ✅ Middleware for protected routes
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

---

## 🗄️ Database Best Practices

### Query Optimization
```typescript
// ✅ GOOD: Select only needed fields
const products = await prisma.product.findMany({
  select: {
    id: true,
    name: true,
    price: true,
    // Don't select heavy fields unless needed
  },
  take: 20,  // Paginate
  orderBy: { createdAt: 'desc' },
});

// ❌ BAD: Select all fields
const products = await prisma.product.findMany();
```

### Indexes (Required)
```prisma
model Product {
  id        String   @id @default(cuid())
  storeId   String
  name      String
  createdAt DateTime @default(now())
  
  // Required indexes
  @@index([storeId, createdAt])
  @@index([storeId, name])
}
```

---

## ♿ Accessibility (WCAG 2.1 AA)

### Keyboard Navigation (Required)
```typescript
// ✅ GOOD
<button
  onClick={handleClick}
  className="focus:ring-2 focus:ring-primary focus:outline-none"
  aria-label="Add to cart"
>
  Add to Cart
</button>

// ❌ BAD: No focus indicator
<div onClick={handleClick}>Click me</div>
```

### Color Contrast (Required)
```typescript
// ✅ GOOD: Contrast ratio ≥ 4.5:1
const colors = {
  primary: '#0066CC',    // 4.54:1 on white
  error: '#CC0000',      // 5.89:1 on white
  success: '#008000',    // 4.51:1 on white
};

// ❌ BAD: Low contrast
const colors = {
  lightGray: '#CCCCCC',  // 1.5:1 on white (fails)
};
```

### Touch Targets (Required)
```typescript
// ✅ GOOD: ≥ 44×44px
<button className="min-w-[44px] min-h-[44px] p-2">
  <Icon size={20} />
</button>

// ❌ BAD: Too small
<button className="p-1">
  <Icon size={12} />
</button>
```

---

## 🧪 Testing Standards

### Unit Tests (80%+ coverage required)
```typescript
// ✅ AAA Pattern
describe('formatPrice', () => {
  it('should format USD currency correctly', () => {
    // Arrange
    const price = 1999;
    
    // Act
    const result = formatPrice(price);
    
    // Assert
    expect(result).toBe('$19.99');
  });
});
```

### E2E Tests (Critical paths required)
```typescript
// ✅ Playwright
test('should complete checkout', async ({ page }) => {
  await page.goto('/products');
  await page.click('[data-testid="add-to-cart"]');
  await page.goto('/checkout');
  await page.fill('[name="email"]', 'test@example.com');
  await page.click('[data-testid="submit-order"]');
  await expect(page).toHaveURL(/\/orders\/\w+/);
});
```

---

## 📦 API Standards

### REST Conventions (Required)
```typescript
// ✅ Standard routes
GET    /api/products       // List (paginated)
GET    /api/products/[id]  // Get single
POST   /api/products       // Create
PUT    /api/products/[id]  // Update (full)
PATCH  /api/products/[id]  // Update (partial)
DELETE /api/products/[id]  // Soft delete
```

### Response Format (Required)
```typescript
// ✅ Success
{
  "data": T,
  "meta": { "page": 1, "total": 100 }
}

// ✅ Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { "name": ["Required"] }
  }
}
```

### HTTP Status Codes (Required)
```typescript
200 OK           // Successful GET/PUT/PATCH
201 Created      // Successful POST
204 No Content   // Successful DELETE
400 Bad Request  // Validation error
401 Unauthorized // Not authenticated
403 Forbidden    // Not authorized
404 Not Found    // Resource not found
500 Server Error // Internal error
```

---

## 🚨 Common Pitfalls (Avoid)

### ❌ Don't Do This
```typescript
// ❌ Creating formatters in render
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US').format(price);
};

// ❌ Direct searchParams access (Next.js 15+)
export default function Page({ searchParams }) {
  return <div>{searchParams.query}</div>;
}

// ❌ No multi-tenant filtering
const products = await prisma.product.findMany();

// ❌ Using 'any' type
function process(data: any) {}

// ❌ No error handling
export async function POST(request) {
  const body = await request.json();
  const result = await createProduct(body);
  return NextResponse.json(result);
}
```

### ✅ Do This Instead
```typescript
// ✅ Memoize formatters
const formatter = useMemo(
  () => new Intl.NumberFormat('en-US'),
  []
);

// ✅ Await searchParams
export default async function Page({ searchParams }) {
  const params = await searchParams;
  return <div>{params.query}</div>;
}

// ✅ Always filter by storeId
const products = await prisma.product.findMany({
  where: { storeId, deletedAt: null },
});

// ✅ Proper types
function process(data: ProductInput): ProductOutput {}

// ✅ Comprehensive error handling
export async function POST(request) {
  try {
    const body = await request.json();
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', details: validation.error } },
        { status: 400 }
      );
    }
    const result = await createProduct(validation.data);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed' } },
      { status: 500 }
    );
  }
}
```

---

## 📚 Documentation References

| Topic | File |
|-------|------|
| Project Standards | `.specify/memory/constitution.md` |
| Next.js Best Practices | `.github/instructions/nextjs.instructions.md` |
| Component Guidelines | `.github/instructions/components.instructions.md` |
| API Standards | `.github/instructions/api-routes.instructions.md` |
| Database Schema | `.github/instructions/database.instructions.md` |
| Testing Strategy | `.github/instructions/testing.instructions.md` |
| Performance Patterns | `PERFORMANCE_OPTIMIZATION_REPORT_2.md` |
| Best Practices Report | `BEST_PRACTICES_COMPLIANCE_REPORT.md` |

---

## 🆘 Getting Help

### Before Asking for Help
1. Check error messages (TypeScript, ESLint)
2. Read relevant instruction files
3. Search existing documentation
4. Review similar code in codebase

### Common Commands
```bash
# Start development server
npm run dev

# Run tests
npm run test              # All tests
npm run test:watch        # Watch mode
npm run test:e2e          # Playwright E2E

# Build and validate
npm run build             # Production build
npm run lint              # ESLint
npm run type-check        # TypeScript

# Database
npm run db:push           # Sync schema (dev)
npm run db:migrate        # Create migration (prod)
npm run db:studio         # Prisma Studio GUI
npm run db:seed           # Seed data
```

---

## ✅ Pre-Commit Checklist

Before committing code:
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Tests pass (`npm run test`)
- [ ] File size < 300 lines
- [ ] Functions < 50 lines
- [ ] No `console.log` statements (use proper logging)
- [ ] No `any` types (unless documented)
- [ ] Multi-tenant filtering applied
- [ ] Input validation with Zod
- [ ] Error handling implemented
- [ ] Accessibility checked (keyboard nav, contrast)

---

**Version**: 1.0  
**Last Updated**: November 3, 2025  
**Maintained By**: Development Team
