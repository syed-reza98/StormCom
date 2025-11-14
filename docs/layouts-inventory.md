# StormCom Layouts Inventory

**Date**: 2025-11-14  
**Purpose**: Comprehensive inventory of all layout files in the StormCom application for Phase A refactoring

## Overview

This document catalogs all layout files across the application, their purpose, current implementation status, and refactoring priorities.

## Layout File Locations

### 1. Root Layout
**File**: `src/app/layout.tsx`  
**Route**: All routes (`/`)  
**Purpose**: Global application shell, provides theme provider, session management, and global UI elements

**Current Implementation**:
- ✅ ThemeProvider (next-themes integration)
- ✅ SessionProvider for authentication
- ✅ Toaster for global notifications (added in Phase 1)
- ✅ Analytics and SpeedInsights
- ✅ Inter font configuration
- ⚠️ Missing: Skip-to-content link for accessibility
- ⚠️ Missing: Global error boundary
- ⚠️ Missing: Responsive container wrapper

**Current Structure**:
```tsx
<html lang="en">
  <body>
    <SessionProvider>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
    <Analytics />
    <SpeedInsights />
  </body>
</html>
```

**Refactoring Priority**: 🔴 **CRITICAL** (Foundation for all other layouts)

**Required Changes**:
1. Add skip-to-content link
2. Add global error boundary
3. Add semantic HTML landmarks
4. Implement responsive container with max-width
5. Add focus management utilities
6. Ensure proper ARIA attributes

---

### 2. Dashboard Layout
**File**: `src/app/(dashboard)/layout.tsx`  
**Route**: Dashboard routes (`/dashboard/*`)  
**Purpose**: Admin/staff interface with sidebar navigation and top bar

**Current Implementation**:
- ✅ Uses DashboardShell component
- ⚠️ Shell component location: `src/components/layout/dashboard-shell.tsx`
- ⚠️ Implementation details need inspection

**Current Structure**:
```tsx
<DashboardShell>{children}</DashboardShell>
```

**Refactoring Priority**: 🔴 **CRITICAL** (High user interaction area)

**Required Changes**:
1. Inspect and refactor DashboardShell component
2. Add responsive sidebar (collapse on mobile)
3. Implement Sheet component for mobile navigation
4. Add accessible top navigation with user menu
5. Add breadcrumb navigation
6. Ensure keyboard navigation
7. Add loading states for navigation

---

### 3. Storefront Layout
**File**: `src/app/shop/layout.tsx`  
**Route**: Storefront routes (`/shop/*`)  
**Purpose**: Customer-facing storefront with dynamic theme loading per store

**Current Implementation**:
- ✅ Dynamic theme loading based on subdomain
- ✅ Store detection via headers
- ✅ Inline CSS injection for store themes
- ⚠️ Uses inline styles (should use CSS variables)
- ⚠️ No header/footer navigation structure
- ⚠️ No responsive container

**Current Structure**:
```tsx
<>
  <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
  <div className="min-h-screen" style={...}>
    {children}
  </div>
</>
```

**Refactoring Priority**: 🟡 **HIGH** (Customer-facing, affects revenue)

**Required Changes**:
1. Replace inline styles with CSS variables in Tailwind config
2. Add storefront header with navigation
3. Add storefront footer with links
4. Implement shopping cart indicator
5. Add search functionality in header
6. Make fully responsive (mobile-first)
7. Add loading states for theme switching

---

### 4. Authentication Layout (Implicit)
**File**: None (uses root layout)  
**Route**: Auth routes (`/login`, `/register`, etc. in `(auth)` route group)  
**Purpose**: Authentication pages (login, register, forgot password, MFA)

**Current Implementation**:
- ⚠️ No dedicated layout file
- ⚠️ Auth pages inherit root layout directly
- ⚠️ No centered auth container pattern
- ⚠️ No auth-specific navigation

**Current Structure**:
```
(auth)/
  ├── login/page.tsx
  ├── register/page.tsx
  ├── forgot-password/page.tsx
  ├── mfa/
  │   ├── enroll/page.tsx
  │   └── challenge/page.tsx
  └── reset-password/page.tsx
```

**Refactoring Priority**: 🟢 **MEDIUM** (Functional but could be improved)

**Required Changes**:
1. Create `src/app/(auth)/layout.tsx`
2. Add centered container with max-width
3. Add auth-specific header with logo
4. Add "Back to home" link
5. Implement consistent auth page styling
6. Add progress indicators for multi-step flows (MFA)

---

### 5. Admin Layout (Implicit)
**File**: None (may use dashboard layout)  
**Route**: Admin routes (`/admin/*` in `(admin)` route group)  
**Purpose**: Super admin cross-store administration

**Current Implementation**:
- ⚠️ No dedicated layout file found
- ⚠️ Admin route group exists but may share dashboard layout
- ⚠️ No differentiation from store admin UI

**Current Structure**:
```
(admin)/
  └── admin/
      └── dashboard/
```

**Refactoring Priority**: 🟢 **MEDIUM** (Lower user volume)

**Required Changes**:
1. Create `src/app/(admin)/layout.tsx` if needed
2. Add admin-specific navigation
3. Add visual distinction from store dashboard
4. Add store switcher if cross-store management
5. Ensure proper role-based access control UI

---

## Layout Components Inventory

### DashboardShell Component
**File**: `src/components/layout/dashboard-shell.tsx`  
**Used By**: Dashboard layout  
**Status**: ⚠️ Needs inspection and refactoring

**Potential Issues**:
- May not use shadcn/ui primitives
- Sidebar may not be responsive
- Mobile navigation may not use Sheet component
- Navigation may not be keyboard accessible

### NotificationsDropdown Component
**File**: `src/components/layout/notifications-dropdown.tsx`  
**Used By**: Likely DashboardShell  
**Status**: ⚠️ Needs inspection and refactoring

**Potential Issues**:
- May not use shadcn/ui Popover/Sheet
- May not have proper ARIA attributes
- May not be keyboard accessible

---

## Layout Patterns to Implement

### 1. Root Layout Pattern (Foundation)
```tsx
<html lang="en">
  <body>
    {/* Skip to content link */}
    <a href="#main-content" className="sr-only focus:not-sr-only">
      Skip to main content
    </a>

    {/* Providers */}
    <SessionProvider>
      <ThemeProvider>
        {/* Global Error Boundary */}
        <ErrorBoundary>
          {/* Main content wrapper */}
          <div className="min-h-screen flex flex-col">
            {children}
          </div>

          {/* Global UI */}
          <Toaster />
        </ErrorBoundary>
      </ThemeProvider>
    </SessionProvider>

    {/* Analytics */}
    <Analytics />
    <SpeedInsights />
  </body>
</html>
```

### 2. Dashboard Layout Pattern
```tsx
<div className="flex min-h-screen">
  {/* Sidebar (desktop) */}
  <aside className="hidden lg:flex lg:w-64 lg:flex-col">
    <DashboardSidebar />
  </aside>

  {/* Main content */}
  <div className="flex-1 flex flex-col">
    {/* Top bar */}
    <header className="sticky top-0 z-40 border-b bg-background">
      <DashboardHeader />
    </header>

    {/* Page content */}
    <main id="main-content" className="flex-1 p-6">
      {children}
    </main>
  </div>

  {/* Mobile sidebar (Sheet) */}
  <Sheet>
    <SheetContent side="left">
      <DashboardSidebar />
    </SheetContent>
  </Sheet>
</div>
```

### 3. Storefront Layout Pattern
```tsx
<div className="min-h-screen flex flex-col">
  {/* Storefront header */}
  <header className="sticky top-0 z-40 border-b bg-background">
    <StorefrontHeader />
  </header>

  {/* Main content */}
  <main id="main-content" className="flex-1">
    {children}
  </main>

  {/* Storefront footer */}
  <footer className="border-t bg-muted">
    <StorefrontFooter />
  </footer>
</div>
```

### 4. Auth Layout Pattern
```tsx
<div className="min-h-screen flex items-center justify-center p-4">
  <div className="w-full max-w-md">
    {/* Auth header */}
    <div className="mb-8 text-center">
      <Logo />
      <Link href="/" className="text-sm text-muted-foreground">
        Back to home
      </Link>
    </div>

    {/* Auth content */}
    <main id="main-content">
      {children}
    </main>
  </div>
</div>
```

---

## Refactoring Priority Order

### Phase A.1: Critical Foundation (Week 1, Days 1-3)
1. **Root Layout** - Establish global structure and providers
2. **Dashboard Layout** - Refactor DashboardShell component
3. **DashboardShell Component** - Implement responsive sidebar with Sheet

### Phase A.2: Customer-Facing (Week 1, Days 4-5)
4. **Storefront Layout** - Add header, footer, responsive container
5. **StorefrontHeader Component** (new) - Navigation, search, cart
6. **StorefrontFooter Component** (new) - Links, newsletter, social

### Phase A.3: Authentication Flow (Week 2, Days 1-2)
7. **Auth Layout** (new) - Centered container for auth pages
8. **Admin Layout** - Differentiate from store admin if needed

---

## Accessibility Checklist (Per Layout)

### Must Have (WCAG 2.1 AA)
- [ ] Skip-to-content link (visible on focus)
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] ARIA landmarks (header, nav, main, footer)
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Focus indicators (2px solid ring)
- [ ] Color contrast ≥ 4.5:1 for text
- [ ] Touch targets ≥ 44×44px
- [ ] Screen reader announcements for dynamic content

### Layout-Specific
- **Root**: Skip link, focus management
- **Dashboard**: Sidebar collapse, mobile sheet, keyboard nav
- **Storefront**: Cart indicator, search, mobile menu
- **Auth**: Clear focus flow, error announcements

---

## Responsive Design Requirements

### Breakpoints (Mobile-First)
- **sm**: 640px - Mobile landscape
- **md**: 768px - Tablet portrait
- **lg**: 1024px - Tablet landscape / Small desktop
- **xl**: 1280px - Desktop
- **2xl**: 1536px - Large desktop

### Layout Behavior by Breakpoint
- **Mobile (< 768px)**: Single column, hamburger menu, bottom nav
- **Tablet (768px - 1024px)**: Sidebar collapsed, top nav
- **Desktop (> 1024px)**: Full sidebar, expanded navigation

---

## Testing Requirements

### Unit Tests (Vitest + Testing Library)
- [ ] Root layout renders providers
- [ ] Dashboard layout renders shell
- [ ] Sidebar toggles on mobile
- [ ] Theme switching works
- [ ] Navigation keyboard accessibility

### E2E Tests (Playwright)
- [ ] Skip-to-content link works
- [ ] Mobile navigation opens/closes
- [ ] Dashboard sidebar persists state
- [ ] Storefront navigation works
- [ ] Auth flow navigation

### Visual Regression (Percy)
- [ ] Root layout shell (light/dark)
- [ ] Dashboard layout (desktop/mobile)
- [ ] Storefront layout (desktop/mobile)
- [ ] Auth layout (desktop/mobile)
- [ ] Mobile navigation open state

---

## Implementation Timeline

### Week 1 (Phase A.1 & A.2)
- **Day 1**: Root layout refactor + skip link + error boundary
- **Day 2**: Dashboard layout + DashboardShell refactor
- **Day 3**: Mobile sidebar with Sheet component
- **Day 4**: Storefront layout + header/footer
- **Day 5**: Responsive testing across breakpoints

### Week 2 (Phase A.3)
- **Day 1**: Auth layout creation
- **Day 2**: Admin layout (if needed)
- **Day 3**: Accessibility audit (axe)
- **Day 4**: E2E tests for layouts
- **Day 5**: Percy snapshots + documentation

---

## Success Criteria

### Phase A Complete When:
- ✅ All layout files refactored with shadcn/ui primitives
- ✅ Root layout has skip link, error boundary, proper structure
- ✅ Dashboard has responsive sidebar with Sheet for mobile
- ✅ Storefront has header/footer with navigation
- ✅ Auth has dedicated centered layout
- ✅ All layouts responsive at constitution breakpoints
- ✅ Keyboard navigation works across all layouts
- ✅ WCAG 2.1 AA compliance verified
- ✅ TypeScript, lint, build passing
- ✅ Percy snapshots captured for all layouts

---

## Next Steps After Phase A

1. **Phase B**: Component refactoring using layout foundations
2. **Phase C**: Final accessibility validation and optimization
3. Update `ui-component-mapping.md` with layout components
4. Update `ui-refactoring-guide.md` with layout patterns
5. Create layout component showcase/Storybook

---

**Document Status**: Initial inventory complete  
**Last Updated**: 2025-11-14  
**Next Review**: After Phase A.1 completion
