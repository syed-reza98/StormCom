# Phase B: Component Refactoring Implementation Plan

**Status**: In Progress  
**Started**: 2025-11-14  
**Target Completion**: 2 weeks (Weeks 3-4)

## Overview

Phase B focuses on refactoring all UI components to use shadcn/ui patterns established in Phase A. This includes forms, tables, cards, dialogs, and implementing missing UI surfaces identified in the API→UI mapping.

## Component Refactoring Strategy

### 1. Required Pattern (MANDATORY for all components)
All refactored components MUST follow these patterns:

#### Forms Pattern
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

const schema = z.object({
  field: z.string().min(1, 'Required'),
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { field: '' },
});

<Form {...form}>
  <FormField
    control={form.control}
    name="field"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Field</FormLabel>
        <FormControl><Input {...field} /></FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

#### Toast Pattern
```tsx
import { useToast } from '@/components/ui/use-toast';

const { toast } = useToast();
toast({ title: 'Success', description: 'Action completed' });
```

#### Delete Confirmation Pattern
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
```

## Phase B.1: Critical Forms (Days 1-2) ✅ IN PROGRESS

### Priority 1: Core Forms
| Component | File | Status | Lines | Notes |
|-----------|------|--------|-------|-------|
| ProductForm | `product-form-refactored.tsx` | ✅ Complete | 280 | Form + RHF + Zod |
| CategoryForm | `category-form-refactored.tsx` | 🔄 Next | ~200 | Hierarchical selector |
| BrandForm | `brand-form-refactored.tsx` | ⏳ Pending | ~150 | Simple form |
| AttributeForm | `attribute-form-refactored.tsx` | ⏳ Pending | ~180 | Dynamic value fields |

### Refactoring Checklist Per Form
- [ ] Replace custom validation with Zod schema
- [ ] Use shadcn Form + React Hook Form
- [ ] Add automatic ARIA labels via FormField
- [ ] Add FormDescription for help text
- [ ] Add FormMessage for errors
- [ ] Implement loading states (disabled inputs)
- [ ] Add success/error toasts
- [ ] Split into Card sections if > 200 lines
- [ ] Keep file < 300 lines, functions < 50 lines
- [ ] Type-check passing

## Phase B.2: Data Tables (Days 3-4)

### Priority 2: List Views
| Component | File | Status | Lines | Features |
|-----------|------|--------|-------|----------|
| ProductsTable | `products-table-refactored.tsx` | ⏳ Pending | ~250 | Pagination, sorting, filters |
| OrdersTable | `orders-table-refactored.tsx` | ⏳ Pending | ~200 | Status badges, actions |
| CustomersTable | `customers-table-refactored.tsx` | ⏳ Pending | ~180 | Search, filters |
| CategoriesTable | `categories-table-refactored.tsx` | ⏳ Pending | ~150 | Tree view option |

### Table Requirements
- Use shadcn Table component
- Add DataTable wrapper with:
  - Pagination (10, 25, 50, 100 per page)
  - Sorting (ascending/descending)
  - Column filters
  - Search input
  - Bulk selection (checkbox)
  - Bulk actions dropdown
  - Row actions menu
- Keyboard accessible (Tab, Enter, Space)
- ARIA attributes (role="table", aria-label)
- Loading skeleton states

## Phase B.3: Feature Components (Day 5)

### Priority 3: Composite Components
| Component | File | Status | Complexity | Notes |
|-----------|------|--------|------------|-------|
| ProductCard | `product-card-refactored.tsx` | ⏳ Pending | Medium | Image, price, actions |
| OrderCard | `order-card-refactored.tsx` | ⏳ Pending | Medium | Status, items, total |
| CheckoutForm | `checkout-form-refactored.tsx` | ⏳ Pending | High | Multi-step wizard |
| ShippingAddressForm | `shipping-address-form-refactored.tsx` | ⏳ Pending | Medium | Address autocomplete |
| PaymentMethodSelector | `payment-method-selector-refactored.tsx` | ⏳ Pending | Medium | Radio group |

## Phase B.4: Dialogs & Modals (Week 4, Days 1-2)

### Priority 4: Overlays
| Component | Usage Count | Pattern | Status |
|-----------|-------------|---------|--------|
| Delete Confirmations | 15+ | AlertDialog | ⏳ Pending |
| Edit Dialogs | 10+ | Dialog + Form | ⏳ Pending |
| Image Upload | 5+ | Dialog + Dropzone | ⏳ Pending |
| Filters Panel | 8+ | Sheet (side) | ⏳ Pending |
| Search Palette | 1 | Command | ⏳ Pending |

### Implementation Strategy
1. Create reusable DeleteConfirmationDialog component
2. Create reusable FormDialog wrapper
3. Replace all custom modals with Dialog
4. Replace all sidebars with Sheet
5. Add Command for global search

## Phase B.5: Missing UI Surfaces (Week 4, Days 3-5)

### From API→UI Mapping (40+ identified)

#### Analytics (5 surfaces)
- [ ] Revenue Chart Widget
- [ ] Product Performance Table
- [ ] Customer Analytics Widget
- [ ] Sales Funnel Chart
- [ ] Date Range Picker

#### Products (10 surfaces)
- [ ] Stock Management Dialog
- [ ] Quick Actions Menu
- [ ] Variant Manager Component
- [ ] Bulk Edit Dialog
- [ ] Image Gallery Component
- [ ] SEO Preview Card
- [ ] Price History Chart
- [ ] Related Products Selector
- [ ] Product Quick View Dialog
- [ ] Print Labels Button

#### Orders (8 surfaces)
- [ ] Status Update Dropdown
- [ ] Order Timeline Component
- [ ] Invoice Download Button
- [ ] Print Packing Slip Button
- [ ] Shipping Label Generator
- [ ] Refund Dialog
- [ ] Order Notes Section
- [ ] Tracking Info Card

#### Categories (5 surfaces)
- [ ] Category Tree View (hierarchical)
- [ ] Drag-and-Drop Reorder
- [ ] Category Move Dialog
- [ ] Category Image Upload
- [ ] Parent Category Selector

#### Notifications (4 surfaces)
- [ ] Notifications Dropdown
- [ ] Unread Badge Counter
- [ ] Mark All Read Button
- [ ] Notification Settings Panel

#### GDPR/Privacy (3 surfaces)
- [ ] Consent Management UI
- [ ] Data Export Request Form
- [ ] Account Deletion Confirmation

#### Integrations (5 surfaces)
- [ ] Integration Cards
- [ ] Sync Status Indicators
- [ ] OAuth Flow Components
- [ ] API Key Manager
- [ ] Webhook Configuration Panel

## Code Quality Standards (MANDATORY)

### File Size Limits
- **Maximum 300 lines** per file
- **Maximum 50 lines** per function
- Split into multiple files if exceeded

### TypeScript Strictness
- No `any` types (use `unknown` + type guards)
- All props typed with interfaces
- Zod schemas for all validation

### Accessibility (WCAG 2.1 AA)
- All forms have labels (automatic via FormField)
- All buttons have aria-label where needed
- Keyboard navigation (Tab, Enter, Escape)
- Focus indicators (2px solid ring)
- Color contrast ≥ 4.5:1

### Performance
- Server Components by default (70%+ target)
- Client Components only for:
  - Forms (need React Hook Form)
  - Interactive widgets
  - Browser API usage
- Dynamic imports for heavy components

## Testing Requirements

### Unit Tests (Vitest + Testing Library)
```tsx
describe('ProductFormRefactored', () => {
  it('should validate required fields', () => {
    // Test Zod validation
  });

  it('should submit form with valid data', () => {
    // Test form submission
  });

  it('should show error messages', () => {
    // Test error display
  });
});
```

### E2E Tests (Playwright)
```tsx
test('should create product successfully', async ({ page }) => {
  await page.goto('/dashboard/products/new');
  await page.fill('input[name="name"]', 'Test Product');
  await page.fill('input[name="sku"]', 'TEST-001');
  await page.fill('input[name="price"]', '29.99');
  await page.selectOption('select[name="categoryId"]', 'cat-1');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard\/products\/\w+/);
});
```

## Migration Timeline

### Week 3 (Days 1-5)
- **Days 1-2**: B.1 - Critical Forms (4 forms)
- **Days 3-4**: B.2 - Data Tables (4 tables)
- **Day 5**: B.3 - Feature Components (5 components)

### Week 4 (Days 1-5)
- **Days 1-2**: B.4 - Dialogs & Modals (patterns)
- **Days 3-5**: B.5 - Missing UI Surfaces (40+ components)

## Success Metrics

### Phase B.1 (Forms)
- [x] ProductForm refactored (1/4)
- [ ] CategoryForm refactored (0/4)
- [ ] BrandForm refactored (0/4)
- [ ] AttributeForm refactored (0/4)
- [ ] Unit tests added (0/4)
- [ ] Type-check passing ✅

### Phase B.2 (Tables)
- [ ] ProductsTable refactored (0/4)
- [ ] OrdersTable refactored (0/4)
- [ ] CustomersTable refactored (0/4)
- [ ] CategoriesTable refactored (0/4)

### Phase B.3 (Feature Components)
- [ ] ProductCard refactored (0/5)
- [ ] OrderCard refactored (0/5)
- [ ] CheckoutForm refactored (0/5)
- [ ] ShippingAddressForm refactored (0/5)
- [ ] PaymentMethodSelector refactored (0/5)

### Phase B.4 (Dialogs)
- [ ] DeleteConfirmationDialog created (0/1)
- [ ] FormDialog wrapper created (0/1)
- [ ] All modals migrated to Dialog (0/15)
- [ ] All sidebars migrated to Sheet (0/8)
- [ ] Command palette added (0/1)

### Phase B.5 (Missing Surfaces)
- [ ] Analytics surfaces (0/5)
- [ ] Products surfaces (0/10)
- [ ] Orders surfaces (0/8)
- [ ] Categories surfaces (0/5)
- [ ] Notifications surfaces (0/4)
- [ ] GDPR surfaces (0/3)
- [ ] Integrations surfaces (0/5)

## Rollout Strategy

### Non-Breaking Migration
1. Create `-refactored.tsx` versions alongside originals
2. Update imports progressively per page
3. Keep originals until all pages migrated
4. Delete originals only after verification

### Compatibility Shims
```tsx
// product-form.tsx (legacy wrapper)
export { ProductFormRefactored as ProductForm } from './product-form-refactored';
```

## Documentation Updates

### Files to Update
- [ ] `docs/ui-component-mapping.md` - Mark surfaces as implemented
- [ ] `docs/ui-refactoring-guide.md` - Add Phase B patterns
- [ ] `README.md` - Update component library section
- [ ] `.github/instructions/components.instructions.md` - Add Form pattern requirement

## Risk Mitigation

### Potential Issues
1. **File size exceeds 300 lines**: Split into sub-components
2. **Complex validation**: Use Zod refinements and superRefine
3. **Performance regression**: Use React.memo and dynamic imports
4. **Type errors**: Add proper type guards and assertions
5. **Test failures**: Update tests to match new patterns

### Rollback Plan
1. Revert specific component file
2. Update imports back to original
3. Fix issues and retry refactoring
4. Keep atomic commits per component

## Next Steps (Immediate)

1. **Complete Category Form** (2 hours)
2. **Complete Brand Form** (1 hour)
3. **Complete Attribute Form** (2 hours)
4. **Add unit tests for all forms** (3 hours)
5. **Start ProductsTable refactoring** (4 hours)

---

**Status**: Phase B.1 started (1/4 forms complete)  
**Next Milestone**: All 4 forms refactored by end of Day 2  
**Overall Progress**: Phase B - 5% complete (1/90+ components)
