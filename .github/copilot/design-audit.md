# StormCom Radix UI Design Audit

**Date**: 2025-10-30  
**Version**: 1.0  
**Status**: Phase 1 Foundation

---

## Executive Summary

This document outlines the comprehensive redesign of StormCom's UI using **Radix UI** as the canonical design reference system. The audit covers current state analysis, migration strategy, and implementation roadmap for adopting Radix Themes, Primitives, Icons, and Colors.

### Current State
- **UI Framework**: shadcn/ui components (built on Radix UI primitives)
- **Styling**: Tailwind CSS 4.1.16 with custom CSS variables
- **Icons**: lucide-react (50+ icons used)
- **Components**: 50+ React components across 11 directories
- **Theme System**: Custom CSS variables for light/dark mode
- **Missing**: Radix Themes integration, comprehensive design system, accessibility testing

### Target State
- **Design Foundation**: @radix-ui/themes with unified appearance/scale/radius
- **Components**: All interactive elements using Radix primitives
- **Icons**: Consolidated to @radix-ui/react-icons
- **Colors**: Standardized using Radix Colors scales
- **Accessibility**: WCAG 2.2 AA compliant with automated testing
- **Performance**: Server Components-first, <200KB initial bundle

---

## 1. Radix Themes Configuration

### Theme Provider Setup

**Location**: `src/app/layout.tsx`

**Configuration**:
```tsx
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Theme
          appearance="inherit" // Auto light/dark based on system preference
          accentColor="teal"    // Matches current primary color
          grayColor="slate"     // Neutral scale
          radius="medium"       // Default border radius
          scaling="100%"        // Base scaling (can be 90%, 95%, 100%, 105%, 110%)
        >
          {children}
        </Theme>
      </body>
    </html>
  );
}
```

**Rationale**:
- `appearance="inherit"` respects system dark mode preference
- `accentColor="teal"` aligns with current primary color (#0f766e)
- `grayColor="slate"` provides neutral backgrounds/text
- `radius="medium"` matches existing `rounded-lg` usage
- `scaling="100%"` provides 1:1 mapping with current design

---

## 2. Design Token Migration

### Color Palette

**Current State** (from `globals.css`):
- Primary: HSL(221.2, 83.2%, 53.3%) - Blue
- Secondary: HSL(210, 40%, 96.1%) - Light slate
- Destructive: HSL(0, 84.2%, 60.2%) - Red
- Custom per-store theming via CSS variables

**Radix Colors Migration**:

| Current Token | Radix Color Scale | Usage |
|---------------|-------------------|-------|
| `--primary` | `teal-9` | Primary actions, links, brand |
| `--secondary` | `purple-9` | Secondary actions, accents |
| `--neutral` | `slate-7` | Text, borders, dividers |
| `--success` | `grass-9` | Success states, confirmations |
| `--warning` | `amber-9` | Warnings, cautions |
| `--danger` / `--destructive` | `tomato-9` | Errors, destructive actions |
| `--muted` | `slate-3` | Subtle backgrounds |
| `--background` | `slate-1` | Page background |
| `--foreground` | `slate-12` | Primary text |

**Implementation Strategy**:
1. Import Radix Colors in `globals.css`: `@import '@radix-ui/colors/slate.css';`
2. Map Radix variables to existing Tailwind tokens
3. Use CSS custom properties for runtime theme switching
4. Maintain backward compatibility during migration

**Example Mapping**:
```css
:root {
  /* Map Radix colors to existing Tailwind tokens */
  --primary: var(--teal-9);
  --primary-foreground: white;
  --background: var(--slate-1);
  --foreground: var(--slate-12);
  --muted: var(--slate-3);
  --muted-foreground: var(--slate-11);
  /* ... continue for all tokens */
}
```

### Typography Scale

**Current State**:
- Font: Inter (Google Fonts)
- Headings: `text-3xl`, `text-2xl`, `text-xl`
- Body: `text-base`, `text-sm`
- Line height: `leading-relaxed`

**Radix Themes Typography**:

| Element | Radix Theme Class | Fallback Tailwind |
|---------|-------------------|-------------------|
| H1 | `rt-Heading size="9"` | `text-4xl font-bold` |
| H2 | `rt-Heading size="7"` | `text-3xl font-semibold` |
| H3 | `rt-Heading size="5"` | `text-2xl font-medium` |
| Body | `rt-Text size="3"` | `text-base` |
| Small | `rt-Text size="2"` | `text-sm` |
| Caption | `rt-Text size="1"` | `text-xs` |

**Migration Plan**:
- Replace `<h1>`, `<h2>`, `<h3>` with `<Heading>` from Radix Themes
- Use `<Text>` component for paragraphs and inline text
- Maintain semantic HTML structure
- Add `asChild` prop where needed for custom elements

### Spacing & Layout

**Current State**:
- Base unit: 4px (Tailwind's `0.5` spacing)
- Common gaps: `gap-4`, `gap-6`, `gap-8`
- Padding: `p-4`, `p-6`, `p-8`
- Max width: `max-w-screen-xl` (1280px)

**Radix Themes Spacing**:

| Current | Radix Theme | Usage |
|---------|-------------|-------|
| `gap-2` | `gap="2"` | Tight spacing (8px) |
| `gap-4` | `gap="4"` | Standard spacing (16px) |
| `gap-6` | `gap="6"` | Generous spacing (24px) |
| `p-6` | `p="6"` | Card padding |

**No changes required** - Radix Themes uses the same 4px base unit as Tailwind.

### Border Radius

**Current State**:
- Buttons/Inputs: `rounded-md` (0.375rem)
- Cards: `rounded-xl` (0.75rem)
- CSS variable: `--radius: 0.5rem`

**Radix Themes Radius**:

| Radix Radius | Value | Usage |
|--------------|-------|-------|
| `none` | 0 | Sharp edges |
| `small` | 0.25rem | Tight curves |
| `medium` | 0.5rem | **Default** - matches current |
| `large` | 1rem | Generous curves |
| `full` | 9999px | Circular elements |

**Selected**: `radius="medium"` (0.5rem) - matches current design.

---

## 3. Component Primitive Mapping

### Current Components Audit

**Existing shadcn/ui Components** (already using Radix primitives):

| Component | Radix Primitive Used | Status | Migration Needed |
|-----------|---------------------|--------|------------------|
| Button | @radix-ui/react-slot | ✅ Compatible | Update variants to Radix Themes |
| Card | Native div | ⚠️ Custom | Migrate to Radix Card component |
| Dialog | (not yet implemented) | ❌ Missing | Add @radix-ui/react-dialog |
| Dropdown Menu | @radix-ui/react-dropdown-menu | ✅ Compatible | Update styling |
| Select | @radix-ui/react-select | ✅ Compatible | Update styling |
| Checkbox | (not yet implemented) | ❌ Missing | Add @radix-ui/react-checkbox |
| Toast | @radix-ui/react-toast | ✅ Compatible | Update styling |
| Progress | @radix-ui/react-progress | ✅ Compatible | Update styling |

### Required Radix Primitives

**High Priority** (Used in >5 places):
1. **Dialog** - Modals, confirmations, forms
2. **Tooltip** - Help text, icon explanations
3. **Popover** - Context menus, filters
4. **Tabs** - Navigation, settings panels
5. **Accordion** - FAQ, expandable sections

**Medium Priority** (Used in 2-4 places):
6. **Switch** - Toggle settings
7. **Slider** - Price filters, quantity selectors
8. **Scroll Area** - Long lists, content areas
9. **Separator** - Visual dividers
10. **Toggle Group** - View modes, filters

**Low Priority** (Used in <2 places):
11. **Context Menu** - Right-click menus
12. **Hover Card** - Rich previews
13. **Radio Group** - Single-choice selections
14. **Alert Dialog** - Critical confirmations

### Component Creation Plan

**Phase 1** - Core Primitives (Week 1):
```
src/components/ui/
├── dialog.tsx          # Radix Dialog primitive
├── tooltip.tsx         # Radix Tooltip primitive
├── popover.tsx         # Radix Popover primitive
├── tabs.tsx            # Radix Tabs primitive
└── accordion.tsx       # Radix Accordion primitive
```

**Phase 2** - Interactive Controls (Week 2):
```
src/components/ui/
├── switch.tsx          # Radix Switch primitive
├── slider.tsx          # Radix Slider primitive
├── scroll-area.tsx     # Radix ScrollArea primitive
├── separator.tsx       # Radix Separator primitive
└── toggle-group.tsx    # Radix ToggleGroup primitive
```

**Phase 3** - Advanced Patterns (Week 3):
```
src/components/ui/
├── context-menu.tsx    # Radix ContextMenu primitive
├── hover-card.tsx      # Radix HoverCard primitive
├── radio-group.tsx     # Radix RadioGroup primitive
└── alert-dialog.tsx    # Radix AlertDialog primitive
```

---

## 4. Icon Consolidation

### Current Icon Usage

**lucide-react** icons currently used:
- Navigation: ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Menu, X
- Actions: Plus, Minus, Edit, Trash2, Save, Upload, Download
- Status: Check, AlertCircle, Info, XCircle, Loader2
- E-commerce: ShoppingCart, Package, CreditCard, Truck, Store
- **Total**: ~30 unique icons

### Radix Icons Migration

**Available @radix-ui/react-icons equivalents**:

| lucide-react | @radix-ui/react-icons | Notes |
|--------------|----------------------|-------|
| ChevronDown | ChevronDownIcon | ✅ Direct match |
| ChevronUp | ChevronUpIcon | ✅ Direct match |
| ChevronLeft | ChevronLeftIcon | ✅ Direct match |
| ChevronRight | ChevronRightIcon | ✅ Direct match |
| Menu | HamburgerMenuIcon | ✅ Direct match |
| X | Cross2Icon | ✅ Direct match |
| Plus | PlusIcon | ✅ Direct match |
| Minus | MinusIcon | ✅ Direct match |
| Edit | Pencil1Icon | ⚠️ Similar style |
| Trash2 | TrashIcon | ✅ Direct match |
| Check | CheckIcon | ✅ Direct match |
| AlertCircle | ExclamationTriangleIcon | ⚠️ Different style |
| Info | InfoCircledIcon | ✅ Direct match |
| XCircle | CrossCircledIcon | ✅ Direct match |
| Loader2 | ReloadIcon | ⚠️ Use with rotation |
| ShoppingCart | (none) | ❌ Keep lucide-react |
| Package | (none) | ❌ Keep lucide-react |
| CreditCard | (none) | ❌ Keep lucide-react |
| Truck | (none) | ❌ Keep lucide-react |
| Store | (none) | ❌ Keep lucide-react |

**Migration Strategy**:
1. **Phase 1**: Replace all UI chrome icons (navigation, actions) with Radix icons
2. **Phase 2**: Keep domain-specific icons (e-commerce, payments) with lucide-react
3. **Phase 3**: Create custom SVG wrappers for missing icons if needed

**Icon Component Wrapper**:
```tsx
// src/components/ui/icon.tsx
import * as RadixIcons from '@radix-ui/react-icons';
import * as LucideIcons from 'lucide-react';

export const Icon = ({ name, ...props }) => {
  const RadixIcon = RadixIcons[name];
  const LucideIcon = LucideIcons[name];
  
  const Component = RadixIcon || LucideIcon;
  if (!Component) return null;
  
  return <Component {...props} />;
};
```

---

## 5. Page-by-Page Migration Plan

### Current Pages Audit

**Public Pages** (Storefront):
- `/` - Homepage (1 page)
- `/shop` - Product listing (1 page)
- `/shop/[slug]` - Product details (1 page)
- `/cart` - Shopping cart (1 page)
- `/checkout` - Checkout flow (1 page)

**Admin Pages** (Dashboard):
- `/dashboard` - Dashboard home (1 page)
- `/products` - Product management (4 pages)
- `/categories` - Category management (3 pages)
- `/attributes` - Attribute management (2 pages)
- `/stores` - Store management (2 pages)

**Auth Pages**:
- `/login` - Login form (1 page)
- `/register` - Registration form (1 page)
- `/forgot-password` - Password reset (1 page)

**Total**: 19 pages

### Migration Priority

**Week 1** - Core UI Components:
- [x] Install Radix UI packages
- [ ] Configure Radix Themes in root layout
- [ ] Create Dialog, Tooltip, Popover primitives
- [ ] Migrate Button component to Radix Themes
- [ ] Migrate Card component to Radix Themes

**Week 2** - Admin Dashboard:
- [ ] Homepage (`/`) - Update with Radix components
- [ ] Dashboard (`/dashboard`) - Migrate cards, stats
- [ ] Products (`/products`) - Migrate table, filters, modals
- [ ] Categories (`/categories`) - Migrate tree view, forms
- [ ] Auth pages (`/login`, `/register`) - Migrate forms

**Week 3** - Storefront:
- [ ] Shop (`/shop`) - Migrate product grid, filters
- [ ] Product Details (`/shop/[slug]`) - Migrate gallery, tabs
- [ ] Cart (`/cart`) - Migrate line items, summary
- [ ] Checkout (`/checkout`) - Migrate multi-step form

**Week 4** - Polish & Testing:
- [ ] Icon consolidation to Radix Icons
- [ ] Accessibility audit with axe-core
- [ ] Keyboard navigation testing
- [ ] Visual regression testing
- [ ] Documentation updates

---

## 6. Accessibility Compliance

### WCAG 2.2 AA Requirements

**Current Status**:
- ❓ Color Contrast: Unknown (needs audit)
- ❓ Keyboard Navigation: Unknown (needs testing)
- ⚠️ Focus Indicators: Partial (custom ring styles)
- ❓ ARIA Labels: Unknown (needs audit)
- ❓ Screen Reader Testing: Not done

### Radix Accessibility Benefits

**Built-in A11y Features**:
- ✅ **ARIA attributes**: All primitives include proper roles/states
- ✅ **Keyboard navigation**: Tab, Arrow keys, Escape, Enter
- ✅ **Focus management**: Auto-focus, trap focus, restore focus
- ✅ **Screen reader support**: Announcements, live regions
- ✅ **RTL support**: Right-to-left language support

### Testing Plan

**Automated Testing** (Playwright + axe-core):
```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Homepage should not have accessibility violations', async ({ page }) => {
  await page.goto('/');
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

**Manual Testing Checklist**:
- [ ] Keyboard-only navigation through all pages
- [ ] Screen reader testing (NVDA/JAWS/VoiceOver)
- [ ] Color contrast verification (4.5:1 for text, 3:1 for UI elements)
- [ ] Focus visible on all interactive elements
- [ ] Semantic HTML structure (headings, landmarks, lists)
- [ ] Alt text for all images
- [ ] Form labels and error messages
- [ ] Skip links for main content

---

## 7. Performance Impact

### Bundle Size Analysis

**Current Bundle** (estimated):
- Next.js core: ~80KB
- React 19: ~45KB
- Tailwind CSS: ~10KB (purged)
- lucide-react: ~15KB (tree-shaken)
- shadcn/ui components: ~20KB
- **Total**: ~170KB (within <200KB budget)

**After Radix Migration** (estimated):
- @radix-ui/themes: ~25KB
- @radix-ui/react-icons: ~5KB (tree-shaken)
- Additional primitives: ~15KB
- **New Total**: ~190KB (still within budget)

**Optimization Strategy**:
- Use dynamic imports for heavy components
- Code-split by route (automatic with Next.js App Router)
- Lazy-load below-the-fold content
- Optimize images with Next.js Image component

### Server Components Usage

**Target**: 70% Server Components, 30% Client Components

**Current Breakdown**:
- Server Components: ~35 components (70%)
- Client Components: ~15 components (30%)
- ✅ Already meets target ratio

**Client Component Justification**:
- Forms with React Hook Form
- Interactive filters and search
- Shopping cart state management
- Toast notifications
- Modals with animations

---

## 8. Risk Mitigation

### Potential Issues

1. **Breaking Changes**
   - Risk: Existing components may break during migration
   - Mitigation: Incremental migration, maintain parallel components, comprehensive testing

2. **Performance Regression**
   - Risk: Additional Radix packages increase bundle size
   - Mitigation: Tree-shaking, dynamic imports, bundle analysis

3. **Design Inconsistency**
   - Risk: Mixed Radix/custom components during transition
   - Mitigation: Clear migration plan, design tokens, component library

4. **Accessibility Regressions**
   - Risk: Custom implementations may break a11y features
   - Mitigation: Automated testing, manual QA, screen reader testing

5. **Learning Curve**
   - Risk: Team unfamiliar with Radix API
   - Mitigation: Documentation, examples, pair programming

### Rollback Plan

If critical issues arise:
1. Revert to previous commit (Git)
2. Keep old components in `/components/ui/legacy/`
3. Feature flag new Radix components
4. Gradual rollout (10% → 50% → 100%)

---

## 9. Success Metrics

### Quantitative Metrics

- [ ] **Accessibility**: 0 WCAG 2.2 AA violations in automated tests
- [ ] **Performance**: <200KB initial bundle size (gzipped)
- [ ] **Coverage**: 100% of pages migrated to Radix components
- [ ] **Icons**: 80%+ icons using @radix-ui/react-icons
- [ ] **Color Tokens**: 100% using Radix Colors scales
- [ ] **Test Pass Rate**: 100% E2E tests passing

### Qualitative Metrics

- [ ] **Consistency**: Unified design language across all pages
- [ ] **Maintainability**: Reduced custom CSS by 50%
- [ ] **Developer Experience**: Faster component development
- [ ] **User Experience**: Improved keyboard navigation
- [ ] **Documentation**: Complete Storybook coverage

---

## 10. Next Steps

### Immediate Actions (This Week)

1. ✅ Install @radix-ui/themes, @radix-ui/react-icons, @radix-ui/colors
2. [ ] Configure Radix Themes in `src/app/layout.tsx`
3. [ ] Map Radix Colors to Tailwind CSS variables
4. [ ] Create Dialog primitive in `src/components/ui/dialog.tsx`
5. [ ] Create Tooltip primitive in `src/components/ui/tooltip.tsx`

### Phase 1 Deliverables (Week 1)

- [ ] Design audit document (this file) ✅
- [ ] Radix Themes configuration complete
- [ ] 5 core primitives created (Dialog, Tooltip, Popover, Tabs, Accordion)
- [ ] Button and Card components migrated
- [ ] Color token migration complete

### Phase 2 Deliverables (Week 2-3)

- [ ] All admin pages migrated
- [ ] All auth pages migrated
- [ ] Icon consolidation to Radix Icons
- [ ] Accessibility testing setup

### Phase 3 Deliverables (Week 4)

- [ ] All storefront pages migrated
- [ ] Accessibility audit complete
- [ ] Performance validation
- [ ] Documentation updates
- [ ] PR ready for review

---

## Appendix A: Radix Themes API Reference

### Theme Configuration Props

```tsx
<Theme
  appearance="light" | "dark" | "inherit"
  accentColor="blue" | "teal" | "purple" | ... // 12 options
  grayColor="slate" | "sand" | "olive" | ... // 6 options
  panelBackground="solid" | "translucent"
  radius="none" | "small" | "medium" | "large" | "full"
  scaling="90%" | "95%" | "100%" | "105%" | "110%"
>
  {children}
</Theme>
```

### Component Primitives

- **Layout**: Box, Flex, Grid, Container, Section
- **Typography**: Heading, Text, Code, Em, Strong, Quote
- **Forms**: Button, TextField, TextArea, Select, Checkbox, Radio, Switch, Slider
- **Data Display**: Table, Card, Badge, Avatar, Callout
- **Overlay**: Dialog, DropdownMenu, ContextMenu, Popover, Tooltip, HoverCard, AlertDialog
- **Navigation**: Tabs, RadioGroup, SegmentedControl
- **Feedback**: Progress, Spinner, Skeleton

---

## Appendix B: Resources

- **Radix Themes Documentation**: https://www.radix-ui.com/themes/docs
- **Radix Primitives Documentation**: https://www.radix-ui.com/primitives/docs
- **Radix Colors**: https://www.radix-ui.com/colors
- **Radix Icons**: https://www.radix-ui.com/icons
- **WCAG 2.2 Guidelines**: https://www.w3.org/WAI/WCAG22/quickref/
- **Axe DevTools**: https://www.deque.com/axe/devtools/
- **Next.js Accessibility**: https://nextjs.org/docs/accessibility

---

**End of Design Audit Document**
