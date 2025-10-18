---
applyTo: "src/components/**/*.tsx,src/app/**/page.tsx,src/app/**/layout.tsx"
---

# React Components Instructions

## Server Components vs Client Components

**Default to Server Components**:
- All components are Server Components unless explicitly marked with `'use client'`
- Server Components can directly access database, file system, and server-side APIs
- Server Components reduce JavaScript bundle size sent to client

**Use Client Components only when you need**:
- Event handlers: `onClick`, `onChange`, `onSubmit`, etc.
- React hooks: `useState`, `useEffect`, `useContext`, `useReducer`, custom hooks
- Browser APIs: `window`, `document`, `localStorage`, `sessionStorage`
- Third-party libraries requiring client-side JavaScript

> **Note:** Tailwind CSS is required. Do **not** use CSS-in-JS libraries.

## Component Structure

### Server Component Example
```typescript
import { getProducts } from '@/services/products';

interface ProductListProps {
  storeId: string;
  categoryId?: string;
}

export default async function ProductList({ storeId, categoryId }: ProductListProps) {
  const products = await getProducts(storeId, { categoryId });
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Client Component Example
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProductFormProps {
  storeId: string;
  initialData?: Product;
}

export default function ProductForm({ storeId, initialData }: ProductFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## Styling with Tailwind CSS

- **Use Tailwind utility classes** for all styling
- **NO CSS-in-JS libraries** (styled-components, emotion, etc.)
- **NO inline styles** unless absolutely necessary
- **Use `cn()` utility** from `@/lib/utils` for conditional classes:

```typescript
import { cn } from '@/lib/utils';

<button className={cn(
  "px-4 py-2 rounded",
  isActive && "bg-blue-500 text-white",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
  Click me
</button>
```

## Component Guidelines

### Props & Types

- **Always define prop types** using TypeScript interfaces
- **Export prop interfaces** if they might be reused
- **Use descriptive names** for props
- **Document complex props** with JSDoc comments

```typescript
/**
 * ProductCard component displays a product with image, name, price, and actions
 */
interface ProductCardProps {
  product: Product;
  /** Whether to show the edit/delete actions */
  showActions?: boolean;
  /** Callback when product is added to cart */
  onAddToCart?: (productId: string) => void;
}

export default function ProductCard({ 
  product, 
  showActions = false,
  onAddToCart 
}: ProductCardProps) {
  // Component implementation
}
```

### File Organization

- **One component per file** (exception: small related components)
  - **Co-locate with related files**:
    ```
    src/components/
    ├── product/
    │   ├── ProductCard.tsx
    │   ├── ProductForm.tsx
    │   ├── ProductList.tsx
    │   └── __tests__/
    │       ├── ProductCard.test.tsx
    │       └── ProductForm.test.tsx
    ```

### Component Size

- **Maximum 300 lines** per component file
- **Maximum 50 lines** per function/method
- **Extract smaller components** when component becomes too large
- **Extract logic to custom hooks** or utility functions

## shadcn/ui Components

We use **shadcn/ui** components built on **Radix UI**:

  - **Import from `@/components/ui`**: All UI primitives (see `src/components/ui`)
- **Customize via Tailwind**: Modify classes in component files
- **Follow accessibility**: shadcn/ui components are accessible by default
- **Add new components**: Use `npx shadcn-ui@latest add [component-name]`

Common components:
```typescript
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
```

## Forms & Validation

### Use React Hook Form + Zod (see `.specify/memory/constitution.md` for validation standards)

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().min(0, 'Price must be positive'),
  description: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });
  
  const onSubmit = (data: ProductFormData) => {
    // Handle submission
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('name')} />
      {errors.name && <span className="text-red-500">{errors.name.message}</span>}
    </form>
  );
}
```

## Data Fetching

### Server Components - Direct DB Access

```typescript
import { prisma } from '@/lib/prisma';

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { category: true, variants: true },
  });
  
  if (!product) {
    notFound();
  }
  
  return <ProductDetails product={product} />;
}
```

### Client Components - Use Server Actions or API Routes

```typescript
'use client';

import { useState, useEffect } from 'react';

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data.data));
  }, []);
  
  return <div>{/* Render products */}</div>;
}
```

## Accessibility

- **Use semantic HTML**: `<button>`, `<nav>`, `<main>`, `<article>`, etc.
- **Add ARIA labels** when needed: `aria-label`, `aria-describedby`, `aria-live`
- **Keyboard navigation**: Ensure all interactive elements are keyboard accessible
- **Focus management**: Proper focus states and focus trapping in modals
- **Color contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Alt text**: Required for all `<img>` elements

```typescript
// Good accessibility example
<button 
  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-300"
  aria-label="Add product to cart"
  onClick={handleAddToCart}
>
  Add to Cart
</button>

// Image with proper alt text
<Image 
  src={product.image} 
  alt={`${product.name} - ${product.category}`}
  width={400}
  height={400}
/>
```

## Performance Best Practices

- **Use Next.js Image component**: Automatic optimization, WebP conversion, lazy loading
- **Dynamic imports**: For heavy components or code-splitting
  ```typescript
  import dynamic from 'next/dynamic';
  
  const HeavyChart = dynamic(() => import('./HeavyChart'), {
    loading: () => <div>Loading chart...</div>,
  });
  ```
- **Memoization**: Use `React.memo()`, `useMemo()`, `useCallback()` when appropriate
- **Avoid unnecessary re-renders**: Keep state minimal and localized
- **Lazy load below the fold**: Use `loading="lazy"` for images

## Error Handling & Loading States

### Loading States
```typescript
export default function ProductPage() {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent />
    </Suspense>
  );
}
```

### Error Boundaries
```typescript
// error.tsx in route segment
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Testing Components

- **Test user interactions**: Click, type, submit
- **Test edge cases**: Empty states, loading states, error states
- **Test accessibility**: Keyboard navigation, ARIA attributes
- **Use Testing Library**: `@testing-library/react`
- **Mock API calls**: Use MSW (Mock Service Worker)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import ProductForm from '../ProductForm';

describe('ProductForm', () => {
  it('should submit form with valid data', async () => {
    const onSubmit = vi.fn();
    render(<ProductForm onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Product' } });
    fireEvent.click(screen.getByText('Submit'));
    
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Test Product' });
  });
});
```

## Common Patterns

### Conditional Rendering
```typescript
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}
{data && <DataDisplay data={data} />}
```

### Lists with Keys
```typescript
{items.map(item => (
  <li key={item.id}>{item.name}</li>
))}
```

### Composition
```typescript
<Card>
  <CardHeader>
    <CardTitle>Product Details</CardTitle>
  </CardHeader>
  <CardContent>
    <ProductInfo product={product} />
  </CardContent>
</Card>
```
