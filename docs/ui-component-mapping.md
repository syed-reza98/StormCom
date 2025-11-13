# API → UI Component Mapping

**Version**: 1.0.0  
**Date**: 2025-11-13  
**Status**: Initial Analysis

This document maps all API endpoints in StormCom to their corresponding UI surfaces, identifying missing components and documenting implementation requirements.

## Overview

- **Total API Routes**: 71 endpoints
- **Total Pages**: 44 page components
- **Existing shadcn/ui Components**: 26
- **Route Groups**: 
  - `(admin)`: Cross-store admin routes
  - `(dashboard)`: Tenant-scoped admin interface
  - `(auth)`: Public authentication pages
  - `(storefront)`: Customer-facing storefront

## API Endpoint Categories

### 1. Analytics (`/api/analytics/*`)

| Endpoint | Method | UI Component | Status | Notes |
|----------|--------|--------------|--------|-------|
| `/api/analytics/customers` | GET | Analytics Customer Widget | ✅ Exists | `src/app/(dashboard)/analytics/customers/page.tsx` |
| `/api/analytics/dashboard` | GET | Analytics Dashboard | ✅ Exists | `src/app/(dashboard)/analytics/page.tsx` |
| `/api/analytics/products` | GET | Analytics Product Widget | ⚠️ Missing | Need product analytics charts |
| `/api/analytics/revenue` | GET | Revenue Chart Widget | ⚠️ Missing | Need revenue analytics charts |
| `/api/analytics/sales` | GET | Sales Analytics Widget | ✅ Exists | `src/app/(dashboard)/analytics/sales/page.tsx` |

**Required Components**:
- [ ] Analytics Chart Card (recharts integration)
- [ ] Revenue Graph Component
- [ ] Product Performance Table
- [ ] Date Range Picker (shadcn/ui)
- [ ] Export to CSV Button

### 2. Attributes (`/api/attributes/*`)

| Endpoint | Method | UI Component | Status | Notes |
|----------|--------|--------------|--------|-------|
| `/api/attributes` | GET | Attributes List | ✅ Exists | `src/app/(dashboard)/attributes/page.tsx` |
| `/api/attributes` | POST | Create Attribute Form | ⚠️ Missing | Need dialog with form |
| `/api/attributes/[id]` | GET | Attribute Detail View | ⚠️ Missing | Need detail page |
| `/api/attributes/[id]` | PATCH | Edit Attribute Form | ⚠️ Missing | Need edit dialog |
| `/api/attributes/[id]` | DELETE | Delete Confirmation | ⚠️ Missing | Need alert dialog |
| `/api/attributes/[id]/products` | GET | Products by Attribute | ⚠️ Missing | Need filtered product list |

**Required Components**:
- [ ] Attribute Form Dialog (Create/Edit)
- [ ] Attribute Detail Page
- [ ] Delete Confirmation Alert Dialog
- [ ] Attribute Value Multi-Select
- [ ] Products by Attribute Table

### 3. Audit Logs (`/api/audit-logs`)

| Endpoint | Method | UI Component | Status | Notes |
|----------|--------|--------------|--------|-------|
| `/api/audit-logs` | GET | Audit Logs Table | ✅ Exists | `src/app/(dashboard)/audit-logs/page.tsx` |

**Required Components**:
- [ ] Audit Log Filter Panel
- [ ] Audit Log Detail Sheet
- [ ] Date/Time Formatter
- [ ] User Action Badge

### 4. Authentication (`/api/auth/*`)

| Endpoint | Method | UI Component | Status | Notes |
|----------|--------|--------------|--------|-------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth Handlers | ✅ Exists | Core auth |
| `/api/auth/register` | POST | Registration Form | ✅ Exists | `src/app/(auth)/register/page.tsx` |
| `/api/auth/forgot-password` | POST | Forgot Password Form | ✅ Exists | `src/app/(auth)/forgot-password/page.tsx` |
| `/api/auth/reset-password` | POST | Reset Password Form | ✅ Exists | `src/app/(auth)/reset-password/page.tsx` |
| `/api/auth/mfa/enroll` | POST | MFA Enrollment Form | ✅ Exists | `src/app/(auth)/mfa/enroll/page.tsx` |
| `/api/auth/mfa/verify` | POST | MFA Challenge Form | ✅ Exists | `src/app/(auth)/mfa/challenge/page.tsx` |
| `/api/auth/mfa/backup-codes` | GET/POST | Backup Codes Display | ⚠️ Missing | Need backup codes component |
| `/api/auth/session` | GET | Session Status | ⚠️ Missing | Need session info component |

**Required Components**:
- [ ] MFA Backup Codes Display (with copy button)
- [ ] Session Info Card
- [ ] QR Code Display Component
- [ ] TOTP Input Component (6-digit)

### 5. Brands (`/api/brands/*`)

| Endpoint | Method | UI Component | Status | Notes |
|----------|--------|--------------|--------|-------|
| `/api/brands` | GET | Brands List | ✅ Exists | `src/app/(dashboard)/brands/page.tsx` |
| `/api/brands` | POST | Create Brand Form | ⚠️ Missing | Need dialog with form |
| `/api/brands/[id]` | GET | Brand Detail View | ⚠️ Missing | Need detail page |
| `/api/brands/[id]` | PATCH | Edit Brand Form | ⚠️ Missing | Need edit dialog |
| `/api/brands/[id]` | DELETE | Delete Confirmation | ⚠️ Missing | Need alert dialog |
| `/api/brands/[id]/products` | GET | Products by Brand | ⚠️ Missing | Need filtered product list |

**Required Components**:
- [ ] Brand Form Dialog (Create/Edit)
- [ ] Brand Detail Page
- [ ] Brand Logo Upload Component
- [ ] Delete Confirmation Alert Dialog
- [ ] Products by Brand Table

### 6. Bulk Operations (`/api/bulk/*`)

| Endpoint | Method | UI Component | Status | Notes |
|----------|--------|--------------|--------|-------|
| `/api/bulk/products/import` | POST | Product Import Form | ✅ Exists | `src/app/(dashboard)/bulk-import/page.tsx` |
| `/api/bulk/products/export` | GET | Product Export Button | ⚠️ Missing | Need export dialog |
| `/api/bulk/categories/import` | POST | Category Import Form | ⚠️ Missing | Need import dialog |
| `/api/bulk/categories/export` | GET | Category Export Button | ⚠️ Missing | Need export dialog |

**Required Components**:
- [ ] CSV File Upload Component
- [ ] Import Preview Table
- [ ] Import Progress Indicator
- [ ] Export Configuration Dialog
- [ ] Download CSV Button

### 7. Categories (`/api/categories/*`)

| Endpoint | Method | UI Component | Status | Notes |
|----------|--------|--------------|--------|-------|
| `/api/categories` | GET | Categories List | ✅ Exists | `src/app/(dashboard)/categories/page.tsx` |
| `/api/categories` | POST | Create Category Form | ⚠️ Missing | Need dialog with form |
| `/api/categories/[id]` | GET | Category Detail View | ⚠️ Missing | Need detail page |
| `/api/categories/[id]` | PATCH | Edit Category Form | ⚠️ Missing | Need edit dialog |
| `/api/categories/[id]` | DELETE | Delete Confirmation | ⚠️ Missing | Need alert dialog |
| `/api/categories/[id]/move` | POST | Move Category Dialog | ⚠️ Missing | Need hierarchy selector |
| `/api/categories/reorder` | POST | Reorder Categories UI | ⚠️ Missing | Need drag-and-drop |

**Required Components**:
- [ ] Category Form Dialog (Create/Edit)
- [ ] Category Tree View (hierarchical)
- [ ] Category Move Dialog
- [ ] Drag-and-Drop Category Reorder
- [ ] Category Image Upload
- [ ] Delete Confirmation Alert Dialog

### 8. Checkout (`/api/checkout/*`)

| Endpoint | Method | UI Component | Status | Notes |
|----------|--------|--------------|--------|-------|
| `/api/checkout/validate` | POST | Checkout Form Validation | ✅ Exists | `src/app/shop/checkout/page.tsx` |
| `/api/checkout/shipping` | POST | Shipping Address Form | ✅ Exists | Part of checkout flow |
| `/api/checkout/payment-intent` | POST | Payment Form (Stripe) | ✅ Exists | Stripe integration |
| `/api/checkout/complete` | POST | Order Confirmation | ✅ Exists | `src/app/shop/orders/[id]/confirmation/page.tsx` |

**Required Components**:
- [ ] Address Autocomplete Component
- [ ] Shipping Method Selector
- [ ] Payment Method Cards
- [ ] Order Summary Card
- [ ] Coupon Code Input

### 9. GDPR (`/api/gdpr/*`)

| Endpoint | Method | UI Component | Status | Notes |
|----------|--------|--------------|--------|-------|
| `/api/gdpr/consent` | GET/POST | Consent Management UI | ⚠️ Missing | Need consent toggles |
| `/api/gdpr/export` | POST | Data Export Request | ⚠️ Missing | Need request form |
| `/api/gdpr/delete` | POST | Account Deletion Request | ⚠️ Missing | Need confirmation dialog |

**Required Components**:
- [ ] Consent Toggle Switches
- [ ] Data Export Request Form
- [ ] Account Deletion Confirmation Dialog
- [ ] Privacy Settings Page

### 10. Integrations (`/api/integrations/*`)

| Endpoint | Method | UI Component | Status | Notes |
|----------|--------|--------------|--------|-------|
| `/api/integrations/mailchimp/connect` | POST | Mailchimp Connect Form | ✅ Exists | `src/app/(dashboard)/integrations/page.tsx` |
| `/api/integrations/mailchimp/sync` | POST | Mailchimp Sync Button | ⚠️ Missing | Need sync status |
| `/api/integrations/shopify/connect` | POST | Shopify Connect Form | ✅ Exists | Part of integrations |
| `/api/integrations/shopify/export` | POST | Shopify Export Button | ⚠️ Missing | Need export dialog |
| `/api/integrations/[platform]/disconnect` | DELETE | Disconnect Confirmation | ⚠️ Missing | Need alert dialog |

**Required Components**:
- [ ] Integration Card Component
- [ ] Connect/Disconnect Buttons
- [ ] Sync Status Indicator
- [ ] OAuth Flow Components
- [ ] Integration Settings Panel

### 11. Inventory (`/api/inventory/*`)

| Endpoint | Method | UI Component | Status | Notes |
|----------|--------|--------------|--------|-------|
| `/api/inventory` | GET | Inventory List | ✅ Exists | `src/app/(dashboard)/inventory/page.tsx` |
| `/api/inventory/adjust` | POST | Stock Adjustment Form | ⚠️ Missing | Need dialog with reason |

**Required Components**:
- [ ] Stock Adjustment Dialog
- [ ] Inventory Alert Badges
- [ ] Low Stock Warning Component
- [ ] Stock History Table

### 12. Notifications (`/api/notifications/*`)

| Endpoint | Method | UI Component | Status | Notes |
|----------|--------|--------------|--------|-------|
| `/api/notifications` | GET | Notifications List | ⚠️ Missing | Need dropdown/panel |
| `/api/notifications/[id]/read` | POST | Mark as Read Action | ⚠️ Missing | Need notification component |

**Required Components**:
- [ ] Notifications Dropdown
- [ ] Notification Item Component
- [ ] Unread Badge Counter
- [ ] Mark All Read Button

### 13. Orders (`/api/orders/*`)

| Endpoint | Method | UI Component | Status | Notes |
|----------|--------|--------------|--------|-------|
| `/api/orders` | GET | Orders List | ✅ Exists | `src/app/(dashboard)/orders/page.tsx` |
| `/api/orders` | POST | Create Order (Admin) | ⚠️ Missing | Need admin order form |
| `/api/orders/[id]` | GET | Order Detail View | ✅ Exists | `src/app/(dashboard)/orders/[id]/page.tsx` |
| `/api/orders/[id]` | PATCH | Edit Order | ⚠️ Missing | Need edit dialog |
| `/api/orders/[id]/status` | PATCH | Update Order Status | ⚠️ Missing | Need status dropdown |
| `/api/orders/[id]/invoice` | GET | Order Invoice PDF | ⚠️ Missing | Need invoice download button |

**Required Components**:
- [ ] Order Status Badge
- [ ] Order Timeline Component
- [ ] Status Update Dropdown
- [ ] Invoice Download Button
- [ ] Admin Order Create Form
- [ ] Order Edit Dialog

### 14. Products (`/api/products/*`)

| Endpoint | Method | UI Component | Status | Notes |
|----------|--------|--------------|--------|-------|
| `/api/products` | GET | Products List | ✅ Exists | `src/app/(dashboard)/products/page.tsx` |
| `/api/products` | POST | Create Product Form | ⚠️ Missing | Need comprehensive form |
| `/api/products/[id]` | GET | Product Detail View | ✅ Exists | `src/app/(dashboard)/products/[id]/page.tsx` |
| `/api/products/[id]` | PATCH | Edit Product Form | ⚠️ Missing | Need edit form |
| `/api/products/[id]` | DELETE | Delete Confirmation | ⚠️ Missing | Need alert dialog |
| `/api/products/[id]/stock/check` | GET | Stock Check Badge | ⚠️ Missing | Need stock indicator |
| `/api/products/[id]/stock` | PATCH | Update Stock | ⚠️ Missing | Need stock dialog |
| `/api/products/[id]/stock/decrease` | POST | Decrease Stock Action | ⚠️ Missing | Need confirmation |
| `/api/products/import` | POST | Product Import | ✅ Exists | Part of bulk import |
| `/api/products/export` | GET | Product Export | ⚠️ Missing | Need export dialog |

**Required Components**:
- [ ] Product Form (Create/Edit) with tabs
- [ ] Product Variant Manager
- [ ] Product Image Gallery Upload
- [ ] SEO Meta Fields Component
- [ ] Stock Management Dialog
- [ ] Delete Confirmation Alert Dialog
- [ ] Product Quick Actions Menu

### 15. Stores (`/api/stores/*`)

| Endpoint | Method | UI Component | Status | Notes |
|----------|--------|--------------|--------|-------|
| `/api/stores` | GET | Stores List | ✅ Exists | `src/app/(dashboard)/stores/page.tsx` |
| `/api/stores` | POST | Create Store Form | ✅ Exists | `src/app/(dashboard)/stores/new/page.tsx` |
| `/api/stores/[id]` | GET | Store Detail View | ✅ Exists | `src/app/(dashboard)/stores/[id]/page.tsx` |
| `/api/stores/[id]` | PATCH | Edit Store Form | ⚠️ Missing | Need edit form |
| `/api/stores/[id]` | DELETE | Delete Confirmation | ⚠️ Missing | Need alert dialog |
| `/api/stores/[id]/admins` | GET/POST | Manage Store Admins | ⚠️ Missing | Need admin management UI |
| `/api/stores/[id]/theme` | GET/PATCH | Store Theme Customizer | ✅ Exists | `src/app/(dashboard)/settings/theme/page.tsx` |

**Required Components**:
- [ ] Store Settings Form
- [ ] Store Admin Management Table
- [ ] Invite Admin Dialog
- [ ] Store Logo/Favicon Upload
- [ ] Domain Configuration Panel
- [ ] Delete Store Confirmation Dialog

### 16. Subscriptions (`/api/subscriptions/*`)

| Endpoint | Method | UI Component | Status | Notes |
|----------|--------|--------------|--------|-------|
| `/api/subscriptions` | GET | Subscriptions List | ⚠️ Missing | Need subscription cards |
| `/api/subscriptions/[storeId]` | GET | Store Subscription | ✅ Exists | `src/app/(dashboard)/subscription/billing/page.tsx` |
| `/api/subscriptions/[storeId]` | POST | Subscribe/Upgrade | ✅ Exists | `src/app/(dashboard)/subscription/plans/page.tsx` |
| `/api/subscriptions/[storeId]/cancel` | POST | Cancel Subscription | ⚠️ Missing | Need cancellation dialog |

**Required Components**:
- [ ] Subscription Plan Cards
- [ ] Payment Method Manager
- [ ] Billing History Table
- [ ] Cancel Subscription Dialog
- [ ] Upgrade Plan Dialog
- [ ] Usage Metrics Display

### 17. Themes (`/api/themes`)

| Endpoint | Method | UI Component | Status | Notes |
|----------|--------|--------------|--------|-------|
| `/api/themes` | GET | Theme Templates List | ✅ Exists | `src/app/(dashboard)/settings/theme/page.tsx` |

**Required Components**:
- [ ] Theme Preview Cards
- [ ] Color Picker Component
- [ ] Font Selector
- [ ] Theme Apply Button

### 18. Webhooks (`/api/webhooks/*`)

| Endpoint | Method | UI Component | Status | Notes |
|----------|--------|--------------|--------|-------|
| `/api/webhooks/stripe` | POST | Stripe Webhook Handler | N/A | Backend only |
| `/api/webhooks/stripe/subscription` | POST | Subscription Webhook | N/A | Backend only |

**Required Components**:
- N/A (Backend-only endpoints)

### 19. Miscellaneous

| Endpoint | Method | UI Component | Status | Notes |
|----------|--------|--------------|--------|-------|
| `/api/csrf-token` | GET | CSRF Token Provider | N/A | Backend only |
| `/api/docs` | GET | API Documentation | ⚠️ Missing | Need docs page |
| `/api/emails/send` | POST | Email Preview/Test | ⚠️ Missing | Need email tester |

**Required Components**:
- [ ] API Documentation Page
- [ ] Email Preview Component

## Storefront UI (`/shop/*`)

| Page | Status | Required Components |
|------|--------|---------------------|
| `/shop` | ✅ Exists | Homepage with featured products |
| `/shop/products` | ✅ Exists | Product grid with filters |
| `/shop/products/[slug]` | ✅ Exists | Product detail with images |
| `/shop/categories/[slug]` | ✅ Exists | Category products listing |
| `/shop/cart` | ✅ Exists | Shopping cart with quantity controls |
| `/shop/checkout` | ✅ Exists | Multi-step checkout form |
| `/shop/orders` | ✅ Exists | Customer order history |
| `/shop/orders/[id]/confirmation` | ✅ Exists | Order confirmation page |
| `/shop/profile` | ✅ Exists | Customer profile/settings |
| `/shop/search` | ✅ Exists | Product search results |
| `/shop/wishlists` | ✅ Exists | Customer wishlist |

**Enhancements Needed**:
- [ ] Product Quick View Modal
- [ ] Product Comparison Feature
- [ ] Advanced Filters (price range, ratings)
- [ ] Product Reviews Component
- [ ] Wishlist Heart Icon
- [ ] Recently Viewed Products

## Missing shadcn/ui Components to Add

### High Priority
1. **Form Components** (CRITICAL)
   ```bash
   npx shadcn@latest add form
   ```
   - Needed for all forms across the application
   - Integrates React Hook Form + Zod validation

2. **Toast/Toaster** (CRITICAL)
   ```bash
   npx shadcn@latest add toast
   npx shadcn@latest add sonner
   ```
   - Needed for user feedback (success, error, info)
   - Replace current toast implementation

3. **Sheet** (HIGH)
   ```bash
   npx shadcn@latest add sheet
   ```
   - Needed for side panels (notifications, filters, cart)

4. **Alert Dialog** (HIGH)
   ```bash
   npx shadcn@latest add alert-dialog
   ```
   - Needed for delete confirmations

5. **Command** (HIGH)
   ```bash
   npx shadcn@latest add command
   ```
   - Needed for search/command palette

### Medium Priority
6. **Avatar** (MEDIUM)
   ```bash
   npx shadcn@latest add avatar
   ```
   - Needed for user profiles

7. **Data Table** (MEDIUM)
   ```bash
   npx shadcn@latest add data-table
   ```
   - Template for all table views

8. **Navigation Menu** (MEDIUM)
   ```bash
   npx shadcn@latest add navigation-menu
   ```
   - Needed for main navigation

9. **Breadcrumb** (MEDIUM)
   ```bash
   npx shadcn@latest add breadcrumb
   ```
   - Needed for navigation context

10. **Context Menu** (MEDIUM)
    ```bash
    npx shadcn@latest add context-menu
    ```
    - Needed for right-click actions

### Low Priority
11. **Collapsible** (LOW)
    ```bash
    npx shadcn@latest add collapsible
    ```
    - Needed for expandable sections

12. **Hover Card** (LOW)
    ```bash
    npx shadcn@latest add hover-card
    ```
    - Needed for tooltips with rich content

13. **Aspect Ratio** (LOW)
    ```bash
    npx shadcn@latest add aspect-ratio
    ```
    - Needed for responsive images

## Component Refactor Priority Matrix

### Phase 1: Foundation (Week 1)
- Add missing shadcn/ui components (form, toast, sheet, alert-dialog)
- Refactor all forms to use shadcn Form + React Hook Form + Zod
- Implement toast notifications globally
- Create reusable dialog patterns

### Phase 2: Data Display (Week 2)
- Implement data table template for all lists
- Create consistent card layouts
- Add loading skeletons for all async content
- Implement error boundaries

### Phase 3: User Actions (Week 3)
- Implement delete confirmations with alert-dialog
- Add sheet components for side panels
- Create command palette for search
- Add notifications dropdown

### Phase 4: Navigation (Week 4)
- Implement navigation menu
- Add breadcrumbs
- Create user profile dropdown
- Add mobile menu

### Phase 5: Polish (Week 5)
- Accessibility audit with axe-core
- Performance optimization
- Visual regression tests with Percy
- E2E tests with Playwright

## Implementation Guidelines

### Form Pattern (REQUIRED)
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
  email: z.string().email('Invalid email'),
});

export function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '' },
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

### Toast Pattern (REQUIRED)
```tsx
import { toast } from '@/components/ui/use-toast';

// Success
toast({
  title: 'Success',
  description: 'Product created successfully',
});

// Error
toast({
  title: 'Error',
  description: 'Failed to create product',
  variant: 'destructive',
});
```

### Delete Confirmation Pattern (REQUIRED)
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

## Accessibility Requirements (WCAG 2.1 AA)

### Keyboard Navigation
- All interactive elements accessible via Tab
- Modal focus trapping
- Escape key closes dialogs
- Enter key submits forms

### ARIA Labels
- All buttons have aria-label or visible text
- Form inputs have associated labels
- Loading states announced to screen readers
- Error messages linked to form fields

### Color Contrast
- Text: ≥ 4.5:1 ratio
- UI components: ≥ 3:1 ratio
- Focus indicators: ≥ 3:1 ratio

### Focus Management
- Visible focus rings (2px solid)
- No focus traps (except modals)
- Logical tab order

## Performance Requirements

### Bundle Size
- JavaScript bundle < 200KB (gzip)
- Lazy load non-critical components
- Use dynamic imports for heavy components

### Server Components
- 70%+ of components should be Server Components
- Use 'use client' only when necessary
- Minimize client-side JavaScript

### Core Web Vitals
- LCP < 2.0s (desktop), < 2.5s (mobile)
- FID < 100ms
- CLS < 0.1

## Testing Requirements

### Unit Tests
- 80% coverage for business logic
- 100% coverage for utilities
- Test all form validations

### E2E Tests
- 100% coverage for critical paths:
  - Authentication flow
  - Product creation
  - Order placement
  - Checkout process
  - Admin dashboard navigation

### Visual Regression
- Percy snapshots for all pages
- 0.1% difference threshold
- Viewports: mobile (375px), tablet (768px), desktop (1280px)

## Migration Strategy

### Breaking Changes
- None expected (additive changes only)

### Deprecation Notices
- Custom form components → shadcn/ui Form
- Custom toast implementation → shadcn/ui Toast
- Custom dialog components → shadcn/ui Dialog

### Migration Timeline
- Phase 1: 2 weeks (foundation)
- Phase 2: 2 weeks (data display)
- Phase 3: 2 weeks (user actions)
- Phase 4: 1 week (navigation)
- Phase 5: 1 week (polish)
- **Total: 8 weeks**

## Next Steps

1. **Add missing shadcn/ui components** (Day 1-2)
   - Run CLI commands to add form, toast, sheet, alert-dialog
   - Configure Toaster in root layout
   - Create component examples

2. **Create component showcase** (Day 3-4)
   - Document all shadcn/ui components
   - Create usage examples
   - Add accessibility notes

3. **Start form refactoring** (Week 1)
   - Refactor product form
   - Refactor category form
   - Refactor order form

4. **Implement toast notifications** (Week 1)
   - Replace custom toast with shadcn/ui
   - Add toast to all API responses
   - Test toast variants

5. **Add missing UI surfaces** (Week 2-3)
   - Implement missing dialogs
   - Add missing forms
   - Create missing detail pages

6. **Accessibility audit** (Week 4)
   - Run axe-core on all pages
   - Fix WCAG 2.1 AA violations
   - Add keyboard navigation tests

7. **Performance optimization** (Week 5)
   - Run bundle analysis
   - Optimize component imports
   - Add loading states

8. **Testing & documentation** (Week 6-7)
   - Add E2E tests
   - Add Percy snapshots
   - Update documentation

9. **Final review & polish** (Week 8)
   - Code review
   - Manual QA
   - Create PR

## Appendix

### shadcn/ui Components Status

#### Installed (26)
- [x] accordion
- [x] alert
- [x] badge
- [x] button
- [x] calendar
- [x] card
- [x] checkbox
- [x] dialog
- [x] dropdown-menu
- [x] image-upload
- [x] input
- [x] label
- [x] nav-link
- [x] pagination
- [x] popover
- [x] progress
- [x] select
- [x] separator
- [x] skeleton
- [x] slider
- [x] switch
- [x] table
- [x] tabs
- [x] textarea
- [x] tooltip

#### To Install (15)
- [ ] alert-dialog
- [ ] aspect-ratio
- [ ] avatar
- [ ] breadcrumb
- [ ] collapsible
- [ ] command
- [ ] context-menu
- [ ] data-table
- [ ] form
- [ ] hover-card
- [ ] navigation-menu
- [ ] sheet
- [ ] sonner (toast alternative)
- [ ] toast
- [ ] toaster

### References
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)

---

**Document Status**: Initial Draft  
**Review Required**: Yes  
**Approved By**: Pending  
**Last Updated**: 2025-11-13
