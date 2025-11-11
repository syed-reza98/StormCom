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

## shadcn/ui Component Architecture

We use **shadcn/ui** as our primary component library, built on **Radix UI** primitives with **Tailwind CSS** styling.

### Installation & Setup

- **Initial Setup**: Run `npx shadcn@latest init` to create `components.json` configuration
- **Add Components**: Use `npx shadcn@latest add <component>` to install components
- **Component Location**: CLI adds components to `src/components/ui/` with full source code
- **MCP Server**: Use shadcn MCP server for AI-assisted component discovery and installation
- **Documentation**: https://ui.shadcn.com/docs/components

### Component Installation Workflow

1. **Search Components**:
   ```powershell
   # Interactive search
   npx shadcn@latest add
   
   # Or use MCP server with natural language:
   # "Show me button components from shadcn/ui"
   # "Install the dialog component"
   ```

2. **Install Component**:
   ```powershell
   npx shadcn@latest add button
   npx shadcn@latest add dialog
   npx shadcn@latest add form
   ```

3. **Import and Use**:
   ```typescript
   import { Button } from '@/components/ui/button';
   import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
   ```

4. **Customize** (edit `src/components/ui/button.tsx` for project-wide changes):
   ```typescript
   // src/components/ui/button.tsx
   import { cva } from "class-variance-authority";
   const buttonVariants = cva(
     "inline-flex items-center justify-center rounded-md text-sm font-medium",
     {
       variants: {
         variant: {
           default: "bg-primary text-primary-foreground hover:bg-primary/90",
           destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
           // Add custom variants here
         },
       },
     }
   );
   ```

### Composition Patterns

**Composition over Inheritance** - Build complex components by composing primitives:

```typescript
// ✅ GOOD: Compose primitives at usage site
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CreateProductDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Product</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input id="name" placeholder="Enter product name" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ❌ BAD: Don't create wrapper components
function CustomDialog({ children }) {
  return <Dialog>{children}</Dialog>; // Unnecessary abstraction
}
```

### Component Customization

- **Project-wide changes**: Edit components directly in `src/components/ui/`
- **One-off styling**: Use `className` prop
- **Extend variants**: Use `class-variance-authority` (cva) pattern

```typescript
// One-off customization
<Button className="w-full mt-4">Submit</Button>

// Using variants
<Button variant="destructive" size="sm">Delete</Button>

// Conditional classes with cn() utility
import { cn } from '@/lib/utils';

<Button 
  className={cn(
    "w-full",
    isPending && "opacity-50 cursor-not-allowed"
  )}
>
  Submit
</Button>
```

### Accessibility Requirements

- **WCAG 2.1 Level AA**: Radix UI primitives provide accessibility by default
- **Keyboard Navigation**: Tab, Enter, Escape work automatically
- **ARIA Labels**: Add descriptive labels for screen readers
- **Focus Management**: Visible focus indicators on all elements
- **Screen Reader Testing**: Test with NVDA, JAWS, VoiceOver quarterly

```typescript
// ✅ GOOD: Accessible button with proper labels
<Button
  aria-label={`Add ${product.name} to cart`}
  className="focus:ring-2 focus:ring-primary focus:outline-none"
>
  Add to Cart
</Button>
```

### Common shadcn/ui Components

```typescript
// Forms & Inputs
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Layout & Navigation
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

// Overlays & Dialogs
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Feedback & Status
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';

// Display & Data
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
```

## Forms & Validation

### Use shadcn/ui Form + React Hook Form + Zod

**REQUIRED**: Use shadcn/ui Form components for all forms. This provides consistent styling, accessibility, and validation.

> **Note:** For simple forms such as single-field search bars or newsletter subscription inputs that do not require complex validation, it is acceptable to use shadcn/ui Input components directly without the full Form structure.  
> Examples include:
> - Search input in a navbar or sidebar
> - Newsletter signup with only an email field and basic validation
> - Quick filter fields with no multi-field dependencies
>  
> In these cases, ensure accessibility (label, ARIA attributes) and consistent styling are maintained. For multi-field forms or forms requiring advanced validation, always use the full shadcn/ui Form pattern.
**Pattern**: `<Form><FormField><FormItem><FormLabel><FormControl><Input /></FormControl><FormMessage /></FormItem></FormField></Form>`

**Reference**: https://ui.shadcn.com/docs/components/form

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  price: z.number().positive('Price must be positive'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().max(5000, 'Description too long').optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductForm() {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      price: 0,
      sku: '',
      description: '',
    },
  });
  
  const onSubmit = (data: ProductFormData) => {
    // Handle submission
    console.log(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter product name" {...field} />
              </FormControl>
              <FormDescription>
                This is the public display name for your product.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  {...field}
                  onChange={e => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter product description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creating...' : 'Create Product'}
        </Button>
      </form>
    </Form>
  );
}
```

### Form with Server Actions

```typescript
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createProduct } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CreateProductForm() {
  const [state, formAction] = useFormState(createProduct, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">Product Name</Label>
        <Input id="name" name="name" required />
      </div>
      
      {state?.error && (
        <div className="text-sm text-destructive">
          {state.error.message}
        </div>
      )}
      
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Product'}
    </Button>
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
