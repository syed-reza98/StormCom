# StormCom Radix UI Migration - Complete Implementation Guide

## Overview

This document provides the complete implementation guide for finishing all remaining phases of the Radix UI design system migration. The foundation has been successfully established (Phase 1: 100% complete), and this guide ensures systematic completion of Phases 2-4.

---

## Current Status Summary

### ✅ Completed (47.5% overall)
- **Phase 0**: Analysis & Planning - 100%
- **Phase 1**: Design System Foundation - 100%
  - 8 UI primitives created
  - Theme configuration complete
  - Color system migrated
  - 40KB+ documentation
  - Accessibility testing infrastructure
- **Phase 2**: Component Migration - 10% (3/29 pages)
- **Phase 3**: Accessibility Testing - 7% (2/29 pages tested)
- **Phase 4**: Documentation - 50%

### 🚧 Remaining Work (52.5% overall)
- **Phase 2**: 26 pages to migrate
- **Phase 3**: 27 pages to test
- **Phase 4**: Storybook + final docs

---

## Phase 2: Component Migration - Completion Guide

### Auth Pages (5 remaining) - Priority: HIGH

#### 1. Register Page
**File**: `src/app/(auth)/register/page.tsx`

**Migration Pattern**:
```tsx
import { Flex, Heading, Text, Container, Section } from '@radix-ui/themes';
import { PersonIcon, EnvelopeClosedIcon, LockClosedIcon } from '@radix-ui/react-icons';

// Add branded header
<Flex direction="column" gap="2" align="center">
  <PersonIcon width="48" height="48" color="teal" />
  <Heading size="8">Create Account</Heading>
  <Text size="3" color="gray">Join StormCom today</Text>
</Flex>

// Enhanced labels with icons
<Label htmlFor="firstName">
  <Flex align="center" gap="2">
    <PersonIcon /> First Name
  </Flex>
</Label>
```

**Testing**: Run `npm run test:e2e -- --grep="Register"`

#### 2. Forgot Password Page
**File**: `src/app/(auth)/forgot-password/page.tsx`

**Migration Pattern**:
```tsx
import { QuestionMarkCircledIcon } from '@radix-ui/react-icons';

<QuestionMarkCircledIcon width="48" height="48" color="amber" />
<Heading size="8">Reset Password</Heading>
```

#### 3. Reset Password Page
**File**: `src/app/(auth)/reset-password/page.tsx`

**Similar to forgot-password with password input fields**

#### 4-5. MFA Pages
**Files**: `src/app/(auth)/mfa/enroll/page.tsx`, `challenge/page.tsx`

**Add QR code display with Radix Card for enroll**
**Use OTP input pattern for challenge**

### Dashboard Pages (13 remaining) - Priority: MEDIUM

#### Categories Page
**Pattern**: Use Radix Accordion for category tree

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

<Accordion type="multiple">
  {categories.map(category => (
    <AccordionItem key={category.id} value={category.id}>
      <AccordionTrigger>{category.name}</AccordionTrigger>
      <AccordionContent>
        {/* Subcategories */}
      </AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
```

#### Product Details Page
**Pattern**: Use Radix Tabs for product information sections

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

<Tabs defaultValue="details">
  <TabsList>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="inventory">Inventory</TabsTrigger>
    <TabsTrigger value="pricing">Pricing</TabsTrigger>
  </TabsList>
  <TabsContent value="details">{/* Content */}</TabsContent>
</Tabs>
```

#### All Other Dashboard Pages
**Common Pattern**:
```tsx
<Section size="2">
  <Container size="4">
    <Flex direction="column" gap="6">
      <Flex justify="between">
        <Flex direction="column" gap="1">
          <Heading size="8">{pageTitle}</Heading>
          <Text size="3" color="gray">{description}</Text>
        </Flex>
        <Flex gap="3">{/* Action buttons */}</Flex>
      </Flex>
      {/* Page content */}
    </Flex>
  </Container>
</Section>
```

### Storefront Pages (7 remaining) - Priority: MEDIUM

#### Shop Listing
**Pattern**: Grid layout with Radix components

```tsx
<Section>
  <Container size="4">
    <Flex gap="6">
      {/* Filters sidebar with Radix Accordion */}
      <aside className="w-64">
        <Accordion type="multiple">
          <AccordionItem value="price">
            <AccordionTrigger>Price Range</AccordionTrigger>
            <AccordionContent>
              <Slider min={0} max={1000} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </aside>
      
      {/* Product grid */}
      <Flex direction="column" gap="4" className="flex-1">
        {/* Products */}
      </Flex>
    </Flex>
  </Container>
</Section>
```

#### Shopping Cart & Checkout
**Pattern**: Multi-step forms with Radix Tabs or stepped UI

```tsx
<Tabs value={currentStep}>
  <TabsList>
    <TabsTrigger value="cart">Cart</TabsTrigger>
    <TabsTrigger value="shipping">Shipping</TabsTrigger>
    <TabsTrigger value="payment">Payment</TabsTrigger>
  </TabsList>
  {/* Tab contents */}
</Tabs>
```

---

## Phase 3: Accessibility Testing - Completion Guide

### Test Execution Strategy

#### 1. Batch Testing by Category

**Auth Pages Batch**:
```bash
npm run test:e2e -- tests/e2e/accessibility.spec.ts --grep="auth"
```

**Dashboard Pages Batch**:
```bash
npm run test:e2e -- tests/e2e/accessibility.spec.ts --grep="dashboard"
```

**Storefront Pages Batch**:
```bash
npm run test:e2e -- tests/e2e/accessibility.spec.ts --grep="shop"
```

#### 2. Create Additional Test Cases

Add to `tests/e2e/accessibility.spec.ts`:

```typescript
// Register page
test('Register page should not have accessibility violations', async ({ page }) => {
  await page.goto('http://localhost:3000/register');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

// Products page
test('Products page should not have accessibility violations', async ({ page }) => {
  await page.goto('http://localhost:3000/products');
  const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});

// Shop page
test('Shop page should not have accessibility violations', async ({ page }) => {
  await page.goto('http://localhost:3000/shop');
  const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});
```

#### 3. Fix Common Violations

**Color Contrast Issues**:
```css
/* Ensure all text meets 4.5:1 ratio */
.text-muted-foreground {
  color: var(--slate-11); /* Higher contrast than slate-10 */
}
```

**Missing Alt Text**:
```tsx
<Image src={product.image} alt={`${product.name} - ${product.category}`} />
```

**Form Label Association**:
```tsx
<Label htmlFor="email">Email</Label>
<Input id="email" {...register('email')} />
```

#### 4. Automated Testing Script

```bash
#!/bin/bash
# Run full accessibility test suite
echo "Running accessibility tests on all pages..."

pages=("/" "/login" "/register" "/products" "/shop" "/cart" "/checkout")

for page in "${pages[@]}"; do
  echo "Testing: $page"
  npm run test:e2e -- --grep="$page.*accessibility" || echo "FAILED: $page"
done

echo "Accessibility testing complete"
```

---

## Phase 4: Documentation - Completion Guide

### Storybook Integration

#### 1. Install Storybook

```bash
npx storybook@latest init
```

#### 2. Create Stories for Primitives

**Dialog Story** (`src/components/ui/dialog.stories.tsx`):
```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Button } from './button';

const meta: Meta<typeof Dialog> = {
  title: 'UI/Dialog',
  component: Dialog,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>This is a dialog description.</DialogDescription>
        </DialogHeader>
        <p>Dialog content goes here.</p>
      </DialogContent>
    </Dialog>
  ),
};
```

#### 3. Component API Documentation

Create `docs/components/dialog.md`:

```markdown
# Dialog Component

Accessible modal dialog component built on Radix UI Dialog primitive.

## Usage

\`\`\`tsx
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    {/* Content */}
  </DialogContent>
</Dialog>
\`\`\`

## Props

### Dialog
- `open?: boolean` - Controlled open state
- `onOpenChange?: (open: boolean) => void` - Callback when open state changes

### DialogContent
- `className?: string` - Additional CSS classes

## Accessibility
- ✅ ARIA role="dialog"
- ✅ aria-labelledby pointing to title
- ✅ Escape key closes dialog
- ✅ Focus trap inside dialog
- ✅ Auto-focus on first focusable element
```

### Final Screenshots

#### Capture All Pages

```bash
#!/bin/bash
# Screenshot all pages with Playwright

pages=(
  "/:homepage"
  "/login:login"
  "/register:register"
  "/products:products"
  "/shop:shop"
  "/cart:cart"
  "/checkout:checkout"
)

for page_def in "${pages[@]}"; do
  IFS=':' read -r url name <<< "$page_def"
  npx playwright screenshot "http://localhost:3000$url" "$name-after.png"
done
```

### Migration Guide for Developers

Create `docs/MIGRATION_GUIDE.md`:

```markdown
# Radix UI Migration Guide

## How to Migrate a Page

### Step 1: Import Radix Components
\`\`\`tsx
import { Flex, Heading, Text, Container, Section } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
\`\`\`

### Step 2: Replace Layout Elements
Before:
\`\`\`tsx
<div className="container mx-auto py-6">
  <h1 className="text-3xl font-bold">Title</h1>
\`\`\`

After:
\`\`\`tsx
<Section size="2">
  <Container size="4">
    <Heading size="8">Title</Heading>
  </Container>
</Section>
\`\`\`

### Step 3: Replace Icons
Before:
\`\`\`tsx
import { Plus } from 'lucide-react';
<Plus className="h-4 w-4" />
\`\`\`

After:
\`\`\`tsx
import { PlusIcon } from '@radix-ui/react-icons';
<PlusIcon className="h-4 w-4" />
\`\`\`

### Step 4: Test Accessibility
\`\`\`bash
npm run test:e2e -- --grep="YourPage.*accessibility"
\`\`\`

### Step 5: Update Documentation
Document any new patterns or components used.
```

---

## Implementation Checklist

### Phase 2: Component Migration

#### Auth Pages
- [ ] Register page migrated
- [ ] Forgot password page migrated
- [ ] Reset password page migrated
- [ ] MFA enroll page migrated
- [ ] MFA challenge page migrated

#### Dashboard Pages
- [ ] Product details page migrated
- [ ] Categories page migrated (with Accordion)
- [ ] Attributes page migrated
- [ ] Brands page migrated
- [ ] Stores listing page migrated
- [ ] Store details page migrated
- [ ] New store page migrated
- [ ] Bulk import page migrated
- [ ] Inventory page migrated
- [ ] Additional dashboard pages migrated

#### Storefront Pages
- [ ] Shop listing page migrated
- [ ] Product details page migrated (with Tabs)
- [ ] Shopping cart page migrated
- [ ] Checkout page migrated (multi-step)
- [ ] Search page migrated
- [ ] Category page migrated
- [ ] Order confirmation page migrated

#### Icon Consolidation
- [ ] All lucide-react icons replaced
- [ ] Icon sizes standardized (16px, 20px, 24px)
- [ ] Icon usage documented

### Phase 3: Accessibility Testing

#### Test Coverage
- [ ] All 29 pages have accessibility tests
- [ ] All tests passing with 0 violations
- [ ] Cross-browser testing complete
- [ ] Mobile responsiveness verified
- [ ] Keyboard navigation tested

#### Documentation
- [ ] Violations documented and fixed
- [ ] Accessibility patterns documented
- [ ] WCAG compliance report created

### Phase 4: Documentation

#### Storybook
- [ ] Storybook installed and configured
- [ ] Stories for all 8 primitives
- [ ] Stories for common patterns
- [ ] Accessibility notes in stories

#### Component Docs
- [ ] API reference for all primitives
- [ ] Usage examples for each component
- [ ] Props documentation
- [ ] Accessibility notes

#### Guides
- [ ] Migration guide complete
- [ ] Design system usage guide
- [ ] Best practices document
- [ ] Troubleshooting guide

#### Screenshots
- [ ] Before/after for all pages
- [ ] Component showcase screenshots
- [ ] Mobile responsive screenshots

---

## Estimated Timeline

### Week 1: Phase 2 Completion
- Days 1-2: Auth pages (5 pages)
- Days 3-4: Dashboard pages part 1 (7 pages)
- Day 5: Dashboard pages part 2 (6 pages)

### Week 2: Storefront & Testing
- Days 1-2: Storefront pages (7 pages)
- Days 3-4: Icon consolidation
- Day 5: Accessibility testing (batch 1)

### Week 3: Testing & Documentation
- Days 1-2: Accessibility testing (batch 2)
- Day 3: Fix violations
- Days 4-5: Storybook integration

### Week 4: Final Polish
- Days 1-2: Component documentation
- Day 3: Screenshots and guides
- Days 4-5: Final review and cleanup

**Total: 4 weeks (20 working days)**

---

## Success Criteria

### Must Have
- ✅ All 29 pages migrated to Radix UI
- ✅ Zero WCAG 2.2 AA violations
- ✅ All E2E tests passing
- ✅ Bundle size <200KB
- ✅ Complete documentation package

### Should Have
- ✅ 80%+ icons consolidated
- ✅ Storybook component library
- ✅ Migration guide
- ✅ Cross-browser testing

### Nice to Have
- Theme switching UI
- Per-tenant theming
- Advanced animations
- Keyboard shortcuts

---

## Quick Start Commands

### Run Migrations
```bash
# Start dev server
npm run dev

# Run tests
npm run test:e2e

# Check accessibility
npm run test:e2e -- --grep="accessibility"

# Build production
npm run build

# Type check
npm run type-check
```

### Development Workflow
1. Migrate page with Radix components
2. Run accessibility test
3. Fix any violations
4. Commit changes
5. Move to next page

---

## Conclusion

This guide provides a complete roadmap for finishing the Radix UI migration. The foundation is solid, patterns are proven, and the path to completion is clear. Follow the systematic approach outlined here to achieve 100% completion across all phases.

**Next Action**: Begin with auth pages migration (highest priority, quickest wins).

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-30  
**Status**: Implementation guide for remaining 52.5% of project
