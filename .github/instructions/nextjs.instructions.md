---
applyTo: '**'
---

# Next.js Best Practices for StormCom (2025)

This document defines the authoritative Next.js best practices for StormCom, a multi-tenant e-commerce SaaS platform. It is intended for use by GitHub Copilot agents and developers to ensure code quality, maintainability, scalability, and compliance with project requirements.

**Project Context**: StormCom Multi-tenant E-commerce Platform  
**Stack**: Next.js 16.0.0+ (App Router), React 19.x, TypeScript 5.9.3+, Prisma ORM, PostgreSQL/SQLite  
**Deployment**: Vercel Platform with Edge Network CDN

---

## 0. Version Requirements & Technology Stack

**CRITICAL**: These versions are REQUIRED for StormCom and MUST be used:

### Core Framework (MANDATORY)
- **Next.js**: `16.0.0+` (App Router ONLY, Pages Router is PROHIBITED)
- **React**: `19.x` (Server Components by default)
- **TypeScript**: `5.9.3+` (strict mode REQUIRED)
- **Node.js**: `18.x or higher`

### Database & ORM (MANDATORY)
- **Prisma ORM**: Latest stable (type-safe database access)
- **PostgreSQL**: `15+` (production on Vercel Postgres)
- **SQLite**: Latest (local development only)

### Styling & UI (MANDATORY)
- **Tailwind CSS**: `4.1.14+` (utility-first, CSS-in-JS is PROHIBITED)
- **Radix UI** + **shadcn/ui**: Accessible component primitives
- **Framer Motion**: Latest (animations with reduced-motion support)
- **lucide-react**: Latest (icons)

### Forms & Validation (MANDATORY)
- **React Hook Form**: Latest (form state management)
- **Zod**: Latest (runtime validation, client + server)

### Authentication (MANDATORY)
- **NextAuth.js**: `v4+` (authentication & sessions)
- **bcrypt**: Latest (password hashing, cost factor 12)

### Testing (MANDATORY)
- **Vitest**: `3.2.4+` (unit/integration tests)
- **Playwright**: `1.56.0+` with MCP (E2E tests)
- **BrowserStack**: Cross-browser testing + Percy visual regression
- **k6** (Grafana): Load testing
- **Lighthouse CI**: Performance budgets
- **axe-core**: WCAG 2.1 AA accessibility testing

### Deployment (MANDATORY)
- **Vercel**: Serverless deployment platform
- **Vercel KV**: Redis-compatible session store (production)
- **Vercel Blob**: File storage (product images, invoices)
- **Vercel Analytics**: Web Vitals monitoring
- **Vercel Speed Insights**: Performance metrics

---

## 1. Project Structure & Organization

- **Use the `app/` directory** (App Router) for all new projects. Prefer it over the legacy `pages/` directory.
- **Top-level folders:**
  - `app/` — Routing, layouts, pages, and route handlers
  - `public/` — Static assets (images, fonts, etc.)
  - `lib/` — Shared utilities, API clients, and logic
  - `components/` — Reusable UI components
  - `contexts/` — React context providers
  - `styles/` — Global and modular stylesheets
  - `hooks/` — Custom React hooks
  - `types/` — TypeScript type definitions
- **Colocation:** Place files (components, styles, tests) near where they are used, but avoid deeply nested structures.
- **Route Groups:** Use parentheses (e.g., `(admin)`) to group routes without affecting the URL path.
- **Private Folders:** Prefix with `_` (e.g., `_internal`) to opt out of routing and signal implementation details.

- **Feature Folders:** For large apps, group by feature (e.g., `app/dashboard/`, `app/auth/`).
- **Use `src/`** (optional): Place all source code in `src/` to separate from config files.

### StormCom Route Groups Structure

**REQUIRED**: Use these route groups for StormCom multi-tenant e-commerce:

```
app/
├── (auth)/                 # Authentication routes
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   └── mfa-challenge/
├── (admin)/                # Super Admin routes (cross-store)
│   └── dashboard/
├── (dashboard)/            # Store Admin/Staff routes
│   ├── dashboard/
│   ├── products/
│   ├── orders/
│   ├── customers/
│   ├── inventory/
│   ├── marketing/
│   ├── content/
│   ├── pos/
│   ├── reports/
│   ├── settings/
│   └── layout.tsx
├── (storefront)/           # Customer-facing storefront
│   ├── page.tsx            # Homepage
│   ├── products/
│   ├── categories/
│   ├── cart/
│   ├── checkout/
│   ├── account/
│   └── layout.tsx
└── api/                    # API Route Handlers
    ├── auth/
    ├── stores/
    ├── products/
    ├── orders/
    └── webhooks/
```

**Route Group Usage**:
- `(auth)`: Public authentication pages, no tenant context required
- `(admin)`: Cross-store administration (requires SuperAdmin role)
- `(dashboard)`: Tenant-scoped admin interface (requires storeId in session)
- `(storefront)`: Public customer-facing interface (storeId from subdomain/domain)

### File Size & Organization Limits

**CRITICAL**: Enforce these limits to maintain code quality:

- **Maximum file size**: 300 lines per file (enforced by ESLint)
- **Maximum function size**: 50 lines per function (enforced by ESLint)
- **Maximum folder depth**: 4 levels
- **Refactoring trigger**: When approaching 80% of limit (240 lines/40 lines)

**How to handle limit violations**:
```typescript
// ❌ BAD: 400-line component file
export default function ProductPage() {
  // 400 lines of mixed logic...
}

// ✅ GOOD: Split into smaller files
// ProductPage.tsx (< 100 lines)
export default function ProductPage() {
  return (
    <>
      <ProductHeader />
      <ProductGallery />
      <ProductDetails />
      <ProductReviews />
    </>
  );
}

// components/ProductHeader.tsx (< 50 lines)
// components/ProductGallery.tsx (< 50 lines)
// components/ProductDetails.tsx (< 50 lines)
// components/ProductReviews.tsx (< 50 lines)
```

## 2.1. Server and Client Component Integration (App Router)

**Never use `next/dynamic` with `{ ssr: false }` inside a Server Component.** This is not supported and will cause a build/runtime error.

**Correct Approach:**
- If you need to use a Client Component (e.g., a component that uses hooks, browser APIs, or client-only libraries) inside a Server Component, you must:
  1. Move all client-only logic/UI into a dedicated Client Component (with `'use client'` at the top).
  2. Import and use that Client Component directly in the Server Component (no need for `next/dynamic`).
  3. If you need to compose multiple client-only elements (e.g., a navbar with a profile dropdown), create a single Client Component that contains all of them.

**Example:**

```tsx
// Server Component
import DashboardNavbar from '@/components/DashboardNavbar';

export default async function DashboardPage() {
  // ...server logic...
  return (
    <>
      <DashboardNavbar /> {/* This is a Client Component */}
      {/* ...rest of server-rendered page... */}
    </>
  );
}
```

**Why:**
- Server Components cannot use client-only features or dynamic imports with SSR disabled.
- Client Components can be rendered inside Server Components, but not the other way around.

**Summary:**
Always move client-only UI into a Client Component and import it directly in your Server Component. Never use `next/dynamic` with `{ ssr: false }` in a Server Component.

---

## 2. Component Best Practices

- **Component Types:**
  - **Server Components** (default): For data fetching, heavy logic, and non-interactive UI.
  - **Client Components:** Add `'use client'` at the top. Use for interactivity, state, or browser APIs.
- **When to Create a Component:**
  - If a UI pattern is reused more than once.
  - If a section of a page is complex or self-contained.
  - If it improves readability or testability.
- **Naming Conventions:**
  - Use `PascalCase` for component files and exports (e.g., `UserCard.tsx`).
  - Use `camelCase` for hooks (e.g., `useUser.ts`).
  - Use `snake_case` or `kebab-case` for static assets (e.g., `logo_dark.svg`).
  - Name context providers as `XyzProvider` (e.g., `ThemeProvider`).
- **File Naming:**
  - Match the component name to the file name.
  - For single-export files, default export the component.
  - For multiple related components, use an `index.ts` barrel file.
- **Component Location:**
  - Place shared components in `components/`.
  - Place route-specific components inside the relevant route folder.
- **Props:**
  - Use TypeScript interfaces for props.
  - Prefer explicit prop types and default values.
- **Testing:**
  - Co-locate tests with components (e.g., `UserCard.test.tsx`).

### Server Components vs Client Components (CRITICAL)

**Default to Server Components** - StormCom requires 70%+ of components to be Server Components:

```typescript
// ✅ Server Component (default - no directive needed)
// Use for: Data fetching, database queries, static content
export default async function ProductList({ storeId }: Props) {
  const products = await db.product.findMany({
    where: { storeId, deletedAt: null },
    select: { id: true, name: true, price: true, images: true },
  });
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// ✅ Client Component (explicit 'use client' directive)
// Use for: Event handlers, hooks, browser APIs, state
'use client';

import { useState } from 'react';

export default function AddToCartButton({ productId }: Props) {
  const [loading, setLoading] = useState(false);
  
  const handleClick = async () => {
    setLoading(true);
    await addToCart(productId);
    setLoading(false);
  };
  
  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}
```

**When to use Client Components**:
- Event handlers (onClick, onChange, onSubmit)
- React hooks (useState, useEffect, useContext, useReducer)
- Browser APIs (window, document, localStorage, navigator)
- Third-party libraries requiring client-side JS (charts, maps)

**Composition Pattern** (Server + Client):
```typescript
// Server Component (parent)
export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.id);
  
  return (
    <>
      {/* Server Component for static content */}
      <ProductInfo product={product} />
      
      {/* Client Component for interactivity */}
      <AddToCartButton productId={product.id} />
      <ProductReviews productId={product.id} />
    </>
  );
}

// Client Component (child)
'use client';

export function ProductReviews({ productId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  
  useEffect(() => {
    fetchReviews(productId).then(setReviews);
  }, [productId]);
  
  return <ReviewsList reviews={reviews} />;
}
```

### Component Size & Complexity Limits

**CRITICAL**: Enforce component complexity limits:

- **Single Responsibility Principle**: Each component does ONE thing
- **Props limit**: Maximum 5 props per component (use composition or config objects)
- **JSX depth**: Maximum 3 levels of nesting (extract sub-components)
- **Conditional rendering**: Maximum 2 conditions per render (use strategy pattern)

```typescript
// ❌ BAD: Too many props, too complex
function ProductCard({ 
  id, name, price, image, category, brand, rating, stock, 
  onAddToCart, onWishlist, onQuickView, onCompare, isNew, isSale 
}: Props) {
  return (
    <div>
      {isNew && <Badge>New</Badge>}
      {isSale && <Badge>Sale</Badge>}
      {/* ... 100+ lines of complex JSX ... */}
    </div>
  );
}

// ✅ GOOD: Composition pattern, single responsibility
function ProductCard({ product, actions }: Props) {
  return (
    <div>
      <ProductBadges product={product} />
      <ProductImage src={product.image} alt={product.name} />
      <ProductInfo product={product} />
      <ProductActions actions={actions} />
    </div>
  );
}
```

## 2.1. Server and Client Component Integration (App Router)

**Never use `next/dynamic` with `{ ssr: false }` inside a Server Component.** This is not supported and will cause a build/runtime error.

**Correct Approach:**
- If you need to use a Client Component (e.g., a component that uses hooks, browser APIs, or client-only libraries) inside a Server Component, you must:
  1. Move all client-only logic/UI into a dedicated Client Component (with `'use client'` at the top).
  2. Import and use that Client Component directly in the Server Component (no need for `next/dynamic`).
  3. If you need to compose multiple client-only elements (e.g., a navbar with a profile dropdown), create a single Client Component that contains all of them.

**Example:**

```tsx
// Server Component
import DashboardNavbar from '@/components/DashboardNavbar';

export default async function DashboardPage() {
  // ...server logic...
  return (
    <>
      <DashboardNavbar /> {/* This is a Client Component */}
      {/* ...rest of server-rendered page... */}
    </>
  );
}
```

**Why:**
- Server Components cannot use client-only features or dynamic imports with SSR disabled.
- Client Components can be rendered inside Server Components, but not the other way around.

**Summary:**
Always move client-only UI into a Client Component and import it directly in your Server Component. Never use `next/dynamic` with `{ ssr: false }` in a Server Component.

---

## 3. Naming Conventions (General)

- **Folders:** `kebab-case` (e.g., `user-profile/`)
- **Files:** `PascalCase` for components, `camelCase` for utilities/hooks, `kebab-case` for static assets
- **Variables/Functions:** `camelCase`
- **Types/Interfaces:** `PascalCase`
- **Constants:** `UPPER_SNAKE_CASE`

## 4. API Routes (Route Handlers)

- **Prefer API Routes over Edge Functions** unless you need ultra-low latency or geographic distribution.
- **Location:** Place API routes in `app/api/` (e.g., `app/api/users/route.ts`).
- **HTTP Methods:** Export async functions named after HTTP verbs (`GET`, `POST`, etc.).
- **Request/Response:** Use the Web `Request` and `Response` APIs. Use `NextRequest`/`NextResponse` for advanced features.
- **Dynamic Segments:** Use `[param]` for dynamic API routes (e.g., `app/api/users/[id]/route.ts`).
- **Validation:** Always validate and sanitize input. Use libraries like `zod` or `yup`.
- **Error Handling:** Return appropriate HTTP status codes and error messages.
- **Authentication:** Protect sensitive routes using middleware or server-side session checks.

### StormCom API Standards (CRITICAL)

**REST Conventions** (REQUIRED):
```typescript
// ✅ GOOD: Standard REST pattern
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';

// GET /api/products - List products (with pagination)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(searchParams.get('perPage') || '10'), 100);
    
    const [products, total] = await Promise.all([
      db.product.findMany({
        where: { storeId: session.user.storeId, deletedAt: null },
        select: { id: true, name: true, price: true, stock: true },
        skip: (page - 1) * perPage,
        take: perPage,
        orderBy: { createdAt: 'desc' },
      }),
      db.product.count({
        where: { storeId: session.user.storeId, deletedAt: null },
      }),
    ]);

    return NextResponse.json({
      data: products,
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    });
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch products' } },
      { status: 500 }
    );
  }
}

// POST /api/products - Create product
const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().positive(),
  sku: z.string().min(1),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createProductSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid input',
            details: validation.error.errors,
          } 
        },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        ...validation.data,
        storeId: session.user.storeId,
      },
    });

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    console.error('POST /api/products error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create product' } },
      { status: 500 }
    );
  }
}
```

**Response Format** (REQUIRED):
```typescript
// Success response
{
  "data": T,                    // The actual data
  "message"?: string,           // Optional success message
  "meta"?: {                    // Pagination metadata
    "page": number,
    "perPage": number,
    "total": number,
    "totalPages": number
  }
}

// Error response
{
  "error": {
    "code": string,             // VALIDATION_ERROR, NOT_FOUND, UNAUTHORIZED, etc.
    "message": string,          // Human-readable error message
    "details"?: any             // Validation errors or additional context (dev only)
  }
}
```

**HTTP Status Codes** (REQUIRED):
- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (authenticated but no permission)
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Semantic error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Server Actions for Form Mutations

**REQUIRED**: Use Server Actions for form submissions (instead of API routes):

```typescript
// app/products/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { createProductSchema } from '@/lib/validation';

export async function createProduct(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.storeId) {
    return { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };
  }

  const validation = createProductSchema.safeParse({
    name: formData.get('name'),
    price: parseFloat(formData.get('price') as string),
    sku: formData.get('sku'),
    description: formData.get('description'),
  });

  if (!validation.success) {
    return { 
      error: { 
        code: 'VALIDATION_ERROR', 
        message: 'Invalid input',
        details: validation.error.flatten().fieldErrors,
      } 
    };
  }

  try {
    const product = await db.product.create({
      data: {
        ...validation.data,
        storeId: session.user.storeId,
      },
    });

    revalidatePath('/dashboard/products');
    return { data: product };
  } catch (error) {
    console.error('createProduct error:', error);
    return { error: { code: 'INTERNAL_ERROR', message: 'Failed to create product' } };
  }
}

// Client component using the action
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createProduct } from './actions';

export function CreateProductForm() {
  const [state, formAction] = useFormState(createProduct, null);

  return (
    <form action={formAction}>
      <input name="name" type="text" required />
      <input name="price" type="number" step="0.01" required />
      <input name="sku" type="text" required />
      <textarea name="description" />
      
      {state?.error && (
        <div className="error">
          {state.error.message}
          {state.error.details && (
            <ul>
              {Object.entries(state.error.details).map(([field, errors]) => (
                <li key={field}>{field}: {errors.join(', ')}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Product'}
    </button>
  );
}
```

### Multi-Tenant Data Isolation (CRITICAL)

**REQUIRED**: All database queries MUST filter by storeId:

```typescript
// ❌ BAD: No tenant filtering (SECURITY VULNERABILITY)
const products = await db.product.findMany();

// ✅ GOOD: Explicit storeId filtering
const products = await db.product.findMany({
  where: { storeId: session.user.storeId, deletedAt: null },
});

// ✅ BEST: Use Prisma middleware for automatic filtering
// lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Auto-inject storeId for tenant-scoped tables
db.$use(async (params, next) => {
  const tenantTables = ['product', 'order', 'customer', 'category', 'brand', 'review'];
  
  if (tenantTables.includes(params.model || '')) {
    const session = await getServerSession();
    const storeId = session?.user?.storeId;
    
    if (!storeId) {
      throw new Error('No storeId in session - tenant isolation failed');
    }

    // Inject storeId into all queries
    if (params.action === 'findMany' || params.action === 'findFirst') {
      params.args.where = { ...params.args.where, storeId };
    } else if (params.action === 'create') {
      params.args.data = { ...params.args.data, storeId };
    } else if (params.action === 'update' || params.action === 'delete') {
      params.args.where = { ...params.args.where, storeId };
    }
  }

  return next(params);
});
```

## 5. General Best Practices

- **TypeScript:** Use TypeScript for all code. Enable `strict` mode in `tsconfig.json`.
- **ESLint & Prettier:** Enforce code style and linting. Use the official Next.js ESLint config.
- **Environment Variables:** Store secrets in `.env.local`. Never commit secrets to version control.
- **Testing:** Use Jest, React Testing Library, or Playwright. Write tests for all critical logic and components.
- **Accessibility:** Use semantic HTML and ARIA attributes. Test with screen readers.
- **Performance:**
  - Use built-in Image and Font optimization.
  - Use Suspense and loading states for async data.
  - Avoid large client bundles; keep most logic in Server Components.
- **Security:**
  - Sanitize all user input.
  - Use HTTPS in production.
  - Set secure HTTP headers.
- **Documentation:**
  - Write clear README and code comments.
  - Document public APIs and components.

### Performance Requirements (CRITICAL)

**Performance Budgets** (REQUIRED - deployment blocked if exceeded):

- **Page Load (LCP)**: < 2.0 seconds (desktop), < 2.5 seconds (mobile)
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 3.0 seconds
- **API Response (p95)**: < 500ms
- **Database Query (p95)**: < 100ms
- **JavaScript Bundle**: < 200KB initial load (gzipped)

**Optimization Techniques** (REQUIRED):

```typescript
// ✅ 1. Use Next.js Image component (automatic WebP, lazy loading)
import Image from 'next/image';

export function ProductImage({ src, alt }: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      width={600}
      height={600}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      priority={false}  // Only true for above-fold images
      quality={85}      // 85% quality is optimal (default: 75)
    />
  );
}

// ✅ 2. Use dynamic imports for heavy components
import dynamic from 'next/dynamic';

const ProductReviewChart = dynamic(() => import('./ProductReviewChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,  // Disable SSR if component uses browser-only APIs
});

// ✅ 3. Use Suspense for async data
import { Suspense } from 'react';

export default function ProductPage() {
  return (
    <div>
      <Suspense fallback={<ProductDetailsSkeleton />}>
        <ProductDetails />
      </Suspense>
      <Suspense fallback={<ReviewsSkeleton />}>
        <ProductReviews />
      </Suspense>
    </div>
  );
}

// ✅ 4. Optimize database queries (select only needed fields)
const products = await db.product.findMany({
  where: { storeId, deletedAt: null },
  select: {
    id: true,
    name: true,
    price: true,
    images: true,
    // Don't select: description, variants, reviews (heavy fields)
  },
  take: 20,  // Paginate
});

// ✅ 5. Use loading.tsx for instant loading states
// app/(dashboard)/products/loading.tsx
export default function ProductsLoading() {
  return <ProductListSkeleton count={20} />;
}
```

### Accessibility Standards (WCAG 2.1 Level AA - REQUIRED)

**Keyboard Navigation** (REQUIRED):
```typescript
// ✅ GOOD: All interactive elements keyboard accessible
export function ProductCard({ product }: Props) {
  return (
    <div className="group">
      <a 
        href={`/products/${product.id}`}
        className="focus:ring-2 focus:ring-primary focus:outline-none"
        aria-label={`View details for ${product.name}`}
      >
        <Image src={product.image} alt={product.name} />
        <h3>{product.name}</h3>
      </a>
      <button
        onClick={handleAddToCart}
        className="focus:ring-2 focus:ring-primary focus:outline-none"
        aria-label={`Add ${product.name} to cart`}
      >
        Add to Cart
      </button>
    </div>
  );
}
```

**ARIA Labels & Semantic HTML** (REQUIRED):
```typescript
// ✅ GOOD: Proper ARIA labels and semantic HTML
export function ProductFilters({ onFilter }: Props) {
  return (
    <aside aria-label="Product filters">
      <h2>Filters</h2>
      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>Price Range</legend>
          <label htmlFor="min-price">Minimum Price</label>
          <input 
            id="min-price" 
            type="number" 
            name="minPrice"
            aria-describedby="price-help"
          />
          <span id="price-help" className="sr-only">
            Enter minimum price in dollars
          </span>
        </fieldset>
      </form>
    </aside>
  );
}
```

**Color Contrast** (REQUIRED - ≥ 4.5:1 ratio):
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // ✅ GOOD: All colors tested for WCAG AA contrast
        primary: {
          DEFAULT: '#0066CC',  // 4.54:1 on white
          dark: '#004C99',     // 7.14:1 on white
        },
        error: '#CC0000',      // 5.89:1 on white
        success: '#008000',    // 4.51:1 on white
      },
    },
  },
};
```

**Focus Indicators** (REQUIRED - visible 2px ring):
```css
/* globals.css */
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* For Tailwind users */
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2;
}
```

### Responsive Design (Mobile-First - REQUIRED)

**Breakpoints** (REQUIRED):
```typescript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      sm: '640px',   // Mobile landscape
      md: '768px',   // Tablet portrait
      lg: '1024px',  // Tablet landscape / Small desktop
      xl: '1280px',  // Desktop
      '2xl': '1536px',  // Large desktop
    },
  },
};

// Usage (mobile-first approach)
<div className="
  grid grid-cols-1      /* Mobile: 1 column */
  sm:grid-cols-2        /* Tablet: 2 columns */
  lg:grid-cols-3        /* Desktop: 3 columns */
  xl:grid-cols-4        /* Large: 4 columns */
  gap-4
">
  {products.map(product => <ProductCard key={product.id} product={product} />)}
</div>
```

**Touch Targets** (REQUIRED - ≥ 44×44px):
```typescript
// ✅ GOOD: Large enough touch targets
<button className="min-w-[44px] min-h-[44px] p-2">
  <Icon size={20} />
</button>

// ❌ BAD: Touch target too small
<button className="p-1">
  <Icon size={16} />
</button>
```

### Testing Requirements (CRITICAL)

**Test Coverage** (REQUIRED):
- **Business Logic** (`src/services/`, `src/lib/`): ≥ 80% coverage
- **Utility Functions** (`src/lib/utils.ts`): 100% coverage
- **Critical E2E Paths**: 100% coverage (auth, checkout, orders, payments)
- **API Routes**: 100% integration test coverage

**Testing Tools** (MANDATORY):
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});

// Unit test example
// lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatPrice } from './utils';

describe('formatPrice', () => {
  it('should format price with 2 decimals', () => {
    expect(formatPrice(1999)).toBe('$19.99');
  });

  it('should handle zero', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });
});

// E2E test example (Playwright)
// tests/e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('should complete checkout successfully', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="product-card"]');
    await page.click('[data-testid="add-to-cart"]');
    await page.click('[data-testid="cart-icon"]');
    await page.click('[data-testid="checkout-button"]');
    
    // Fill shipping form
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="firstName"]', 'John');
    await page.fill('[name="lastName"]', 'Doe');
    
    // Submit and verify
    await page.click('[data-testid="submit-order"]');
    await expect(page).toHaveURL(/\/orders\/\w+/);
    await expect(page.locator('[data-testid="order-success"]')).toBeVisible();
  });
});
```

### Security Best Practices (CRITICAL)

**Input Validation with Zod** (REQUIRED):
```typescript
// lib/validation.ts
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  price: z.number().positive('Price must be positive'),
  sku: z.string().min(1, 'SKU is required').regex(/^[A-Z0-9-]+$/, 'Invalid SKU format'),
  description: z.string().max(5000).optional(),
  categoryId: z.string().cuid('Invalid category ID'),
  images: z.array(z.string().url()).min(1, 'At least one image required'),
});

// Use in API route
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = createProductSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', details: validation.error.flatten() } },
      { status: 400 }
    );
  }
  
  // Use validation.data (type-safe, validated)
  const product = await db.product.create({ data: validation.data });
}
```

**CSRF Protection** (REQUIRED - built-in via NextAuth):
```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
```

**Rate Limiting** (REQUIRED - 100 req/min per IP):
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'),
});

export async function checkRateLimit(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    );
  }
  
  return null;
}
```

### Middleware Best Practices

**Authentication & Tenant Isolation** (REQUIRED):
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const rateLimitResponse = await checkRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;
  }
  
  // 2. Authentication check
  const token = await getToken({ req: request });
  
  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // 3. Tenant isolation check
  if (pathname.startsWith('/dashboard') && token) {
    const storeId = token.storeId;
    if (!storeId) {
      return NextResponse.redirect(new URL('/select-store', request.url));
    }
  }
  
  // 4. Role-based access control
  if (pathname.startsWith('/admin') && token?.role !== 'SuperAdmin') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/:path*',
  ],
};
```

# Avoid Unnecessary Example Files

Do not create example/demo files (like ModalExample.tsx) in the main codebase unless the user specifically requests a live example, Storybook story, or explicit documentation component. Keep the repository clean and production-focused by default.

# Always use the latest documentation and guides
- For every nextjs related request, begin by searching for the most current nextjs documentation, guides, and examples.
- Use the following tools to fetch and search documentation if they are available:
  - `resolve_library_id` to resolve the package/library name in the docs.
  - `get_library_docs` for up to date documentation.

---

## Summary: StormCom Next.js Checklist

When building features for StormCom, ensure:

### ✅ Architecture
- [ ] Next.js 16.0.0+ App Router (NO Pages Router)
- [ ] React 19.x Server Components (70%+ of components)
- [ ] TypeScript 5.9.3+ strict mode
- [ ] Route groups: `(auth)`, `(admin)`, `(dashboard)`, `(storefront)`

### ✅ Multi-Tenancy
- [ ] All database queries filter by `storeId`
- [ ] Prisma middleware auto-injects `storeId`
- [ ] Session includes `storeId` for tenant context
- [ ] Middleware validates tenant access

### ✅ Database (Prisma)
- [ ] Use Prisma Client (NO raw SQL)
- [ ] Select only needed fields
- [ ] Soft deletes via `deletedAt` field
- [ ] Indexes on `storeId` + frequently queried columns
- [ ] Transactions for multi-step operations

### ✅ API Standards
- [ ] REST conventions (GET/POST/PUT/PATCH/DELETE)
- [ ] Response format: `{data, error, meta}`
- [ ] HTTP status codes (200, 201, 400, 401, 404, 500)
- [ ] Zod validation on all inputs
- [ ] Server Actions for form mutations

### ✅ Security
- [ ] NextAuth.js authentication
- [ ] Zod validation client + server
- [ ] CSRF protection enabled
- [ ] Rate limiting (100 req/min per IP)
- [ ] Environment variables for secrets

### ✅ Performance
- [ ] LCP < 2.0s desktop, < 2.5s mobile
- [ ] JavaScript bundle < 200KB gzipped
- [ ] Next.js Image for all images
- [ ] Dynamic imports for heavy components
- [ ] Database query < 100ms (p95)

### ✅ Accessibility (WCAG 2.1 AA)
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] ARIA labels on all interactive elements
- [ ] Color contrast ≥ 4.5:1
- [ ] Focus indicators (2px ring)
- [ ] Touch targets ≥ 44×44px

### ✅ Testing
- [ ] 80% coverage for business logic
- [ ] 100% coverage for utilities
- [ ] 100% E2E for critical paths
- [ ] Vitest + Playwright configured
- [ ] Tests co-located with code

### ✅ Code Quality
- [ ] Files < 300 lines
- [ ] Functions < 50 lines
- [ ] Components < 5 props
- [ ] JSX nesting < 3 levels
- [ ] ESLint + Prettier passing

---

## Next.js MCP Server Integration (REQUIRED)

**CRITICAL**: Next.js 16.0.0+ includes built-in Model Context Protocol (MCP) server support for AI-assisted development. StormCom REQUIRES both MCP servers for optimal Copilot agent experience.

### 1. Built-in Next.js MCP Server (Automatic in Next.js 16+)

The Next.js MCP server is **automatically enabled** in development and provides:

- **Real-time Application State**: Access live runtime information and internal state
- **Error Diagnostics**: Retrieve build errors, runtime errors, and type errors from dev server
- **Development Logs**: Access console output and server logs
- **Page Metadata**: Query page metadata, routes, and rendering details
- **Server Actions**: Inspect Server Actions by ID for debugging
- **Component Hierarchies**: Understand component structure and relationships

**Available Tools**:
- `get_errors`: Retrieve current build/runtime/type errors
- `get_logs`: Access development server logs
- `get_page_metadata`: Get page routes, components, rendering info
- `get_project_metadata`: Retrieve project structure and configuration
- `get_server_action_by_id`: Look up Server Actions for debugging

**Verification**:
```bash
# Start dev server (MCP enabled automatically in Next.js 16+)
npm run dev

# MCP server runs within Next.js dev server
# No additional configuration needed
```

### 2. Next DevTools MCP (External Package - REQUIRED)

**Installation**:
```bash
# Create .mcp.json at project root
# f:\StormCom\.mcp.json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

**Features**:
- **Next.js Knowledge Base**: Query comprehensive Next.js 16 documentation and best practices
- **Migration Tools**: Automated codemods for upgrading to Next.js 16
- **Cache Components Guide**: Setup assistance for Cache Components and PPR
- **Browser Testing**: Playwright MCP integration for E2E testing
- **Dev Server Discovery**: Automatically connects to running Next.js dev servers

**Available Tools**:
- `nextjs_docs`: Search Next.js documentation with natural language queries
- `upgrade_nextjs_16`: Run automated codemods for Next.js 16 migration
- `enable_cache_components`: Setup Cache Components configuration
- `browser_eval`: Execute Playwright commands for browser testing
- `nextjs_runtime`: Query running dev server for routes, errors, diagnostics

**Available Prompts**:
- "Help me upgrade my Next.js app to version 16"
- "When should I use 'use client' in App Router?"
- "What's the structure of my Next.js routes?"
- "Explain Cache Components and how to use them"
- "How do I optimize performance in Next.js 16?"

### 3. MCP Workflow for Copilot Agents

**Development Workflow**:
```bash
# 1. Start Next.js dev server (MCP enabled automatically)
npm run dev

# 2. Copilot agent connects to MCP servers automatically via .mcp.json

# 3. Agent can now query live application state
# Example prompts:
# - "What errors are currently in my application?"
# - "Show me the structure of my dashboard routes"
# - "Help me debug this Server Action error"
# - "Optimize this page for performance"
```

**Example Agent Interaction**:
```typescript
// User: "What errors are currently in my application?"

// Agent Action:
// 1. Calls get_errors tool from Next.js MCP server
// 2. Retrieves build errors, runtime errors, type errors
// 3. Analyzes errors and provides actionable fixes

// Agent Response:
// "Found 2 errors in your application:
// 
// 1. Type Error in app/dashboard/products/page.tsx:42
//    Property 'storeId' is missing in type 'Product'
//    Fix: Add storeId to Product type definition
//
// 2. Runtime Error in app/api/orders/route.ts:28
//    Cannot read property 'id' of undefined
//    Fix: Add null check before accessing order.id"
```

**Benefits for StormCom Development**:
- **Context-Aware Suggestions**: Agent recommends features based on existing structure
- **Live Application State**: Query current routes, middleware, errors during development
- **Multi-Tenant Awareness**: Agent understands route groups and tenant isolation patterns
- **Performance Insights**: Get recommendations based on actual performance metrics
- **Accurate Implementations**: Generate code following StormCom patterns and conventions

### 4. Configuration for StormCom

**Required Files**:
```bash
# f:\StormCom\.mcp.json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}

# No configuration needed for built-in Next.js MCP server
# Automatically enabled in Next.js 16+ development mode
```

**Verification Checklist**:
- [ ] Next.js 16.0.0+ installed
- [ ] `.mcp.json` created at project root
- [ ] `npm run dev` starts without errors
- [ ] Copilot agent can query MCP servers
- [ ] Test prompt: "What's the structure of my Next.js routes?"

### 5. Troubleshooting MCP Connection

**Common Issues**:
```bash
# Issue: MCP server not connecting
# Solution 1: Verify Next.js version
npm list next
# Should be 16.0.0 or higher

# Solution 2: Restart dev server
npm run dev

# Solution 3: Check .mcp.json syntax
cat .mcp.json
# Ensure valid JSON format

# Solution 4: Verify Copilot agent MCP configuration
# Check agent settings for .mcp.json path
```

**Resources**:
- [Next.js MCP Documentation](https://nextjs.org/docs/app/guides/mcp)
- [Next DevTools MCP Package](https://www.npmjs.com/package/next-devtools-mcp)
- [Vercel MCP Template](https://vercel.com/templates/next.js/model-context-protocol-mcp-with-next-js)
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16)

---

**Version**: 2.1 | **Last Updated**: 2025-01-25 | **Project**: StormCom Multi-tenant E-commerce


