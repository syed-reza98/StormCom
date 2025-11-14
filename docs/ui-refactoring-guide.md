# UI Refactoring Guide - StormCom shadcn/ui Integration

**Version**: 1.0.0  
**Date**: 2025-11-13  
**Author**: StormCom Development Team

## Overview

This guide provides step-by-step instructions for migrating existing StormCom UI components to use shadcn/ui primitives, following the constitution v1.3.0 requirements.

## Prerequisites

Before refactoring components, ensure you understand:

1. **shadcn/ui Component Architecture**
   - Components in `src/components/ui/` are source code (not npm packages)
   - Edit directly for project-wide changes
   - Compose primitives instead of creating wrappers

2. **React Hook Form + Zod Pattern**
   - All forms MUST use this pattern
   - Provides type-safe validation
   - Integrates with shadcn/ui Form component

3. **Toast Notifications**
   - Use `useToast` hook for user feedback
   - Replace all custom toast implementations
   - Success, error, info, warning variants

4. **Accessibility Requirements**
   - WCAG 2.1 Level AA compliance
   - Keyboard navigation (Tab, Enter, Escape)
   - ARIA labels on all interactive elements
   - Focus indicators (2px solid ring)

## Refactoring Patterns

### Pattern 1: Form Components

#### Before (Old Pattern)
```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export function OldForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input {...register('name')} id="name" />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

#### After (New Pattern with shadcn/ui Form)
```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export function NewForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

**Benefits**:
- Automatic ARIA labels and error messages
- Consistent error styling
- Type-safe field rendering
- Better accessibility out of the box

### Pattern 2: Toast Notifications

#### Before (Custom Toast)
```tsx
import { useState } from 'react';

export function OldComponent() {
  const [toast, setToast] = useState<string | null>(null);

  const handleSuccess = () => {
    setToast('Success!');
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <>
      <Button onClick={handleSuccess}>Save</Button>
      {toast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded">
          {toast}
        </div>
      )}
    </>
  );
}
```

#### After (useToast Hook)
```tsx
import { useToast } from '@/components/ui/use-toast';

export function NewComponent() {
  const { toast } = useToast();

  const handleSuccess = () => {
    toast({
      title: 'Success',
      description: 'Product created successfully',
    });
  };

  const handleError = () => {
    toast({
      title: 'Error',
      description: 'Failed to create product',
      variant: 'destructive',
    });
  };

  return <Button onClick={handleSuccess}>Save</Button>;
}
```

**Benefits**:
- Global toast management (no local state)
- Consistent styling across app
- Accessible with ARIA live regions
- Automatic dismissal and animations

### Pattern 3: Delete Confirmations

#### Before (Custom Modal)
```tsx
import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function OldDeleteButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="destructive" onClick={() => setIsOpen(true)}>
        Delete
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div className="p-6">
          <h2>Are you sure?</h2>
          <p>This action cannot be undone.</p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
```

#### After (AlertDialog)
```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export function NewDeleteButton() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

**Benefits**:
- Focus management (auto-focus on open/close)
- Keyboard navigation (Escape closes, Tab cycles)
- Accessible with proper ARIA attributes
- Consistent styling

### Pattern 4: Side Panels (Filters, Notifications, Mobile Menu)

#### Before (Custom Drawer)
```tsx
import { useState } from 'react';

export function OldSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Filters</Button>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-80 bg-background p-6">
            <h2>Filters</h2>
            {/* Filter content */}
          </div>
        </div>
      )}
    </>
  );
}
```

#### After (Sheet Component)
```tsx
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function NewSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Filters</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Refine your search with filters below
          </SheetDescription>
        </SheetHeader>
        {/* Filter content */}
      </SheetContent>
    </Sheet>
  );
}
```

**Benefits**:
- Focus trapping (can't tab outside sheet)
- Keyboard navigation (Escape closes)
- Accessible with ARIA dialog role
- Four side options (left, right, top, bottom)

## Refactoring Checklist

Use this checklist when refactoring a component:

### 1. Analyze Current Component
- [ ] Identify all user interactions (forms, buttons, modals)
- [ ] Note any custom toast/notification logic
- [ ] Check for accessibility issues (missing ARIA labels, keyboard navigation)
- [ ] Identify Server vs Client component needs

### 2. Plan Refactoring
- [ ] Determine which shadcn/ui components to use
- [ ] Identify forms that need Form component
- [ ] Plan toast notification replacements
- [ ] Check for delete confirmations → AlertDialog

### 3. Implement Changes
- [ ] Add 'use client' directive if needed
- [ ] Replace custom forms with shadcn/ui Form
- [ ] Replace custom toasts with useToast hook
- [ ] Replace custom modals with Dialog/AlertDialog/Sheet
- [ ] Update button variants (default, destructive, outline, ghost, link)
- [ ] Add ARIA labels where missing

### 4. Test Changes
- [ ] Visual regression (compare before/after screenshots)
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Screen reader testing (NVDA/JAWS)
- [ ] Mobile responsive testing
- [ ] Dark mode testing
- [ ] Form validation testing
- [ ] Error state testing

### 5. Documentation
- [ ] Update component comments
- [ ] Add usage examples if complex
- [ ] Document any breaking changes
- [ ] Update storybook/showcase if exists

## Common Refactoring Scenarios

### Scenario 1: Refactor Product Form

**File**: `src/app/(dashboard)/products/[id]/page.tsx`

**Changes**:
1. Add shadcn/ui Form components
2. Use FormField for each input
3. Add toast notifications for success/error
4. Add AlertDialog for delete confirmation
5. Add loading skeletons

**Estimated Time**: 4-6 hours

### Scenario 2: Refactor Orders List

**File**: `src/app/(dashboard)/orders/page.tsx`

**Changes**:
1. Add data table template
2. Add Sheet for filters
3. Add toast for status updates
4. Add breadcrumbs for navigation
5. Add loading skeletons

**Estimated Time**: 3-4 hours

### Scenario 3: Refactor Checkout Flow

**File**: `src/app/shop/checkout/page.tsx`

**Changes**:
1. Use Form component for address/payment
2. Add toast for errors
3. Add progress indicators
4. Add validation feedback
5. Test keyboard navigation

**Estimated Time**: 6-8 hours

## Accessibility Testing

After refactoring, test accessibility:

### Keyboard Navigation
```bash
# Manual testing checklist
1. Tab through all interactive elements
2. Enter submits forms
3. Escape closes modals/sheets
4. Arrow keys navigate dropdowns/selects
5. Space toggles checkboxes/switches
```

### Screen Reader Testing
```bash
# Test with NVDA (Windows) or VoiceOver (Mac)
1. All buttons have labels
2. Form inputs have labels
3. Error messages announced
4. Loading states announced
5. Modal title announced on open
```

### Color Contrast
```bash
# Run automated checks
npx @axe-core/cli src/app/(dashboard)/**/*.tsx --tags wcag2aa
```

## Performance Considerations

### Bundle Size
- Use dynamic imports for heavy components
- Lazy load images with next/image
- Code split by route (automatic in Next.js)

### Server Components
- Default to Server Components (70%+ target)
- Only use 'use client' when necessary:
  - Event handlers (onClick, onChange)
  - React hooks (useState, useEffect, useContext)
  - Browser APIs (window, localStorage)

### Example: Product List
```tsx
// Server Component (parent)
export default async function ProductsPage() {
  const products = await getProducts(); // Server-side data fetch

  return (
    <>
      <ProductsHeader /> {/* Server Component */}
      <ProductsFilters /> {/* Client Component (uses hooks) */}
      <ProductsGrid products={products} /> {/* Server Component */}
    </>
  );
}
```

## Migration Timeline

### Phase 1: Critical Forms (Week 1)
- [ ] Login/Register forms
- [ ] Product create/edit form
- [ ] Category form
- [ ] Order form

### Phase 2: Data Display (Week 2)
- [ ] Product list table
- [ ] Orders list table
- [ ] Customer list table
- [ ] Analytics dashboards

### Phase 3: User Interactions (Week 3)
- [ ] Delete confirmations
- [ ] Status updates
- [ ] Notifications dropdown
- [ ] Mobile menu

### Phase 4: Polish (Week 4)
- [ ] Loading skeletons
- [ ] Error boundaries
- [ ] Toast notifications
- [ ] Breadcrumbs

## Troubleshooting

### Issue: Form validation not working
**Solution**: Ensure you're using `zodResolver` and the schema is correct.

```tsx
// ❌ Bad
const form = useForm({ defaultValues: { name: '' } });

// ✅ Good
const schema = z.object({ name: z.string().min(1) });
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { name: '' },
});
```

### Issue: Toast not showing
**Solution**: Ensure Toaster is in root layout.

```tsx
// src/app/layout.tsx
import { Toaster } from '@/components/ui/toaster';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster /> {/* Must be here */}
      </body>
    </html>
  );
}
```

### Issue: Modal focus trap not working
**Solution**: Ensure you're using AlertDialog/Dialog/Sheet from shadcn/ui, not custom implementations.

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)

## Support

For questions or issues during refactoring:
1. Check this guide first
2. Review existing refactored examples in `src/app/(auth)/login/page-refactored-example.tsx`
3. Consult API→UI mapping document (`docs/ui-component-mapping.md`)
4. Review design tokens (`src/styles/design-tokens.md`)

---

**Last Updated**: 2025-11-13  
**Version**: 1.0.0  
**Maintained By**: StormCom Development Team
