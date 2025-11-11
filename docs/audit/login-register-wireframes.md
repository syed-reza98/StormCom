# Login and Register Page Wireframes

**Project**: StormCom Multi-tenant E-commerce Platform  
**Feature**: Authentication and Authorization (User Story 0)  
**Created**: 2025-10-20  
**Status**: Design Specification  

## Purpose

This document specifies the visual design, layout, element positions, spacing, and all states (normal, loading, error, empty) for the Login and Register pages in the StormCom dashboard.

---

## Common Design Elements

### Layout Foundation
- **Container**: Centered card layout
- **Max Width**: 28rem (448px / `max-w-md`)
- **Padding**: 
  - Mobile (< 640px): 1rem (16px) horizontal
  - Tablet/Desktop: 1.5rem (24px) horizontal
- **Vertical Centering**: Full viewport height (`min-h-screen` with flexbox centering)
- **Background**: System background color (`bg-background`)

### Logo and Branding
- **Position**: Top of card, centered
- **Logo Container**: 
  - Size: 3rem × 3rem (48px × 48px) circular
  - Background: Primary brand color
  - Content**: Brand initial "S" (placeholder for actual logo)
  - Margin Bottom: 1rem (16px)
- **Typography**:
  - Title: 1.5rem (24px), bold, tight letter-spacing
  - Description: 0.875rem (14px), muted color

### Form Elements
- **Label Style**:
  - Font size: 0.875rem (14px)
  - Font weight: 500 (medium)
  - Margin bottom: 0.5rem (8px)
  - Required indicator: Red asterisk (*) with `aria-label="required"`

- **Input Fields**:
  - Height: 2.5rem (40px) minimum
  - Border radius: 0.375rem (6px)
  - Border: 1px solid muted
  - Focus state: 2px ring in primary color
  - Padding: 0.5rem 0.75rem (8px 12px)
  - Font size: 0.875rem (14px)
  - Touch target: Minimum 44px × 44px (WCAG AA)

- **Error Messages**:
  - Position: Directly below the related input field
  - Font size: 0.875rem (14px)
  - Color: Destructive (red)
  - Margin top: 0.5rem (8px)
  - Icon: None (text only)
  - Role: `role="alert"` for screen readers

- **Buttons**:
  - Width: Full width of card
  - Height: 2.5rem (40px) minimum
  - Border radius: 0.375rem (6px)
  - Font size: 0.875rem (14px)
  - Font weight: 500 (medium)
  - Loading state: Spinner icon (16px) + "Signing in..." text
  - Disabled state: 50% opacity, no pointer events

### Spacing System
- **Field Spacing**: 1rem (16px) vertical gap between form fields
- **Section Spacing**: 1.5rem (24px) between major sections
- **Card Padding**:
  - Header: 1.5rem (24px)
  - Content: 1.5rem (24px)
  - Footer: 1.5rem (24px) top, 0 bottom

### Color Palette
- **Primary**: Brand primary color (customizable via Tailwind theme)
- **Destructive**: Red for errors (`hsl(0 84.2% 60.2%)`)
- **Muted**: Gray for secondary text (`hsl(240 3.8% 46.1%)`)
- **Background**: System background (light/dark mode adaptive)
- **Card Background**: Elevated surface color
- **Focus Ring**: Primary color with 2px offset

---

## Login Page Wireframe

### Page Structure

```
┌─────────────────────────────────────────────────────┐
│                   [Full Viewport]                   │
│                                                     │
│    ┌───────────────────────────────────────────┐   │
│    │          [Centered Card - 448px]          │   │
│    │                                           │   │
│    │  ┌─────┐                                  │   │
│    │  │  S  │  [Logo - 48px circle]            │   │
│    │  └─────┘                                  │   │
│    │                                           │   │
│    │  Welcome to StormCom                      │   │
│    │  [Title - 24px, bold]                     │   │
│    │                                           │   │
│    │  Sign in to access your dashboard         │   │
│    │  [Description - 14px, muted]              │   │
│    │                                           │   │
│    │  ┌─────────────────────────────────────┐  │   │
│    │  │ [Error Banner - if present]         │  │   │
│    │  │ "Invalid email or password..."      │  │   │
│    │  └─────────────────────────────────────┘  │   │
│    │                                           │   │
│    │  Email *                                  │   │
│    │  ┌─────────────────────────────────────┐  │   │
│    │  │ you@example.com                     │  │   │
│    │  └─────────────────────────────────────┘  │   │
│    │  [Error: "Please enter a valid email"]   │   │
│    │                                           │   │
│    │  Password *         Forgot Password?      │   │
│    │  ┌─────────────────────────────────────┐  │   │
│    │  │ ••••••••                            │  │   │
│    │  └─────────────────────────────────────┘  │   │
│    │  [Error: "Password is required"]          │   │
│    │                                           │   │
│    │  ┌─────────────────────────────────────┐  │   │
│    │  │      [⟳ Spinner] Signing in...      │  │   │
│    │  │            Sign In                   │  │   │
│    │  └─────────────────────────────────────┘  │   │
│    │                                           │   │
│    │  Don't have an account? Create Account   │   │
│    │  [Footer link - 14px, primary color]     │   │
│    │                                           │   │
│    └───────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Element Positions and Spacing

1. **Logo Section**
   - Top margin: 1.5rem (24px)
   - Logo to title: 1rem (16px)
   - Title to description: 0.25rem (4px)
   - Description to form: 1.5rem (24px)

2. **Error Banner** (when present)
   - Margin bottom: 1rem (16px)
   - Padding: 0.75rem (12px)
   - Border radius: 0.375rem (6px)
   - Background: Destructive color at 10% opacity

3. **Email Field**
   - Label to input: 0.5rem (8px)
   - Input to error message: 0.5rem (8px)
   - Field to next field: 1rem (16px)

4. **Password Field**
   - Label layout: Flexbox, space-between
   - "Forgot Password?" link: Right-aligned, primary color, underline on hover
   - Field spacing: Same as email

5. **Submit Button**
   - Margin top: 1.5rem (24px)
   - Margin bottom: 1rem (16px)

6. **Footer Link**
   - Text alignment: Center
   - Font size: 0.875rem (14px)
   - "Create Account" link: Primary color, medium weight, underline on hover

### State Specifications

#### Normal State
- All fields empty with placeholders
- Submit button enabled, primary color
- No error messages visible

#### Loading State
- Submit button disabled with 50% opacity
- Button text: "Signing in..." with animated spinner (16px, left side)
- All input fields disabled
- Spinner animation: 360° rotation, 1s duration, infinite

#### Error State - Invalid Email Format
```
Email *
┌───────────────────────────────────┐
│ notanemail                        │  [Input with red border]
└───────────────────────────────────┘
⚠ Please enter a valid email address  [Red text, 14px]
```

#### Error State - Invalid Credentials
```
[Error Banner at top of form]
┌───────────────────────────────────────────────┐
│ ⚠ Invalid email or password. Please try again. │
└───────────────────────────────────────────────┘
[Focus automatically moves to email field]
```

#### Error State - Account Locked
```
[Error Banner at top of form]
┌─────────────────────────────────────────────────────┐
│ ⚠ Account locked due to too many failed login      │
│   attempts. Please try again in 15 minutes or use  │
│   "Forgot Password" to reset.                       │
└─────────────────────────────────────────────────────┘
```

#### Error State - Network Failure
```
[Error Banner at top of form]
┌──────────────────────────────────────────────┐
│ ⚠ Network error. Please check your connection │
│   and try again.                              │
└──────────────────────────────────────────────┘
```

---

## Register Page Wireframe

### Page Structure

```
┌─────────────────────────────────────────────────────┐
│                   [Full Viewport]                   │
│         [Scrollable if content exceeds viewport]    │
│                                                     │
│    ┌───────────────────────────────────────────┐   │
│    │          [Centered Card - 448px]          │   │
│    │                                           │   │
│    │  ┌─────┐                                  │   │
│    │  │  S  │  [Logo - 48px circle]            │   │
│    │  └─────┘                                  │   │
│    │                                           │   │
│    │  Create Your Account                      │   │
│    │  [Title - 24px, bold]                     │   │
│    │                                           │   │
│    │  Enter your details to get started        │   │
│    │  [Description - 14px, muted]              │   │
│    │                                           │   │
│    │  ┌─────────────────────────────────────┐  │   │
│    │  │ [Error Banner - if present]         │  │   │
│    │  └─────────────────────────────────────┘  │   │
│    │                                           │   │
│    │  Full Name *                              │   │
│    │  ┌─────────────────────────────────────┐  │   │
│    │  │ John Doe                            │  │   │
│    │  └─────────────────────────────────────┘  │   │
│    │                                           │   │
│    │  Email *                                  │   │
│    │  ┌─────────────────────────────────────┐  │   │
│    │  │ you@example.com                     │  │   │
│    │  └─────────────────────────────────────┘  │   │
│    │                                           │   │
│    │  Password *                               │   │
│    │  ┌─────────────────────────────────────┐  │   │
│    │  │ ••••••••                            │  │   │
│    │  └─────────────────────────────────────┘  │   │
│    │                                           │   │
│    │  ┌─────────────────────────────────────┐  │   │
│    │  │ Password must contain:              │  │   │
│    │  │ ✓ At least 8 characters             │  │   │
│    │  │ ✓ One uppercase letter              │  │   │
│    │  │ ✓ One lowercase letter              │  │   │
│    │  │ ✗ One number                        │  │   │
│    │  │ ✗ One special character             │  │   │
│    │  └─────────────────────────────────────┘  │   │
│    │                                           │   │
│    │  Confirm Password *                       │   │
│    │  ┌─────────────────────────────────────┐  │   │
│    │  │ ••••••••                            │  │   │
│    │  └─────────────────────────────────────┘  │   │
│    │  [Error: "Passwords do not match"]        │   │
│    │                                           │   │
│    │  ┌─────────────────────────────────────┐  │   │
│    │  │      [⟳ Spinner] Creating...         │  │   │
│    │  │            Sign Up                   │  │   │
│    │  └─────────────────────────────────────┘  │   │
│    │                                           │   │
│    │  Already have an account? Sign In        │   │
│    │  [Footer link - 14px, primary color]     │   │
│    │                                           │   │
│    └───────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Element Positions and Spacing

1. **Header Section**: Same as Login page

2. **Full Name Field**
   - First field after header
   - Margin bottom: 1rem (16px)

3. **Email Field**
   - Standard spacing after previous field

4. **Password Field**
   - Password requirements checklist appears immediately below password input
   - Checklist container:
     - Margin top: 0.75rem (12px)
     - Padding: 0.75rem (12px)
     - Border: 1px solid muted
     - Border radius: 0.375rem (6px)
     - Background: Subtle gray (`bg-muted/50`)

5. **Password Requirements Checklist**
   - Header: "Password must contain:" (14px, medium weight)
   - List items: 
     - Each item: 0.375rem (6px) vertical spacing
     - Icon (checkmark/x) size: 1rem (16px)
     - Icon to text gap: 0.5rem (8px)
     - Met requirements: Green text (`text-green-600`)
     - Unmet requirements: Muted text (`text-muted-foreground`)

6. **Confirm Password Field**
   - Margin top: 1rem (16px) after password checklist

7. **Submit Button and Footer**: Same spacing as Login page

### State Specifications

#### Normal State
- All fields empty with placeholders
- Password requirements all showing X (unmet) in muted color
- Submit button enabled

#### Interactive State - Password Typing
```
Password must contain:
✓ At least 8 characters         [Green]
✓ One uppercase letter          [Green]
✓ One lowercase letter          [Green]
✗ One number                    [Muted gray]
✗ One special character         [Muted gray]

[Updates in real-time as user types]
```

#### Error State - Password Mismatch
```
Confirm Password *
┌───────────────────────────────────┐
│ ••••••••                          │  [Input with red border]
└───────────────────────────────────┘
⚠ Passwords do not match             [Red text, 14px]
```

#### Error State - Email Already Exists
```
[Error Banner at top of form]
┌───────────────────────────────────────────────────┐
│ ⚠ An account with this email already exists.     │
│   Please sign in instead.                        │
└───────────────────────────────────────────────────┘
[Focus automatically moves to email field]
```

#### Loading State
- Submit button disabled, text: "Creating account..." with spinner
- All input fields disabled

---

## Accessibility Specifications

### Keyboard Navigation
1. **Tab Order**:
   - Login: Logo (skip) → Email → Forgot Password link → Password → Submit button → Create Account link
   - Register: Logo (skip) → Name → Email → Password → Confirm Password → Submit button → Sign In link

2. **Focus Indicators**:
   - All interactive elements: 2px ring in primary color with 2px offset
   - Ring visible on keyboard focus, hidden on mouse click
   - Color contrast: Minimum 3:1 against background (WCAG AA)

3. **Keyboard Actions**:
   - Enter key: Submit form
   - Tab: Move to next field
   - Shift+Tab: Move to previous field
   - Escape: Clear focus (when applicable)

### Screen Reader Support
1. **Form Labels**:
   - All inputs have visible labels with `<label>` elements
   - Labels use `htmlFor` attribute matching input `id`
   - Required fields indicated with `aria-label="required"` on asterisk

2. **Error Announcements**:
   - Error messages use `role="alert"` for immediate announcement
   - Inputs with errors: `aria-invalid="true"` and `aria-describedby` linking to error message ID

3. **Loading States**:
   - Submit button: `aria-label` changes to "Signing in..." or "Creating account..."
   - Loading spinner: `aria-hidden="true"` (decorative)

4. **Password Requirements**:
   - Checklist container: `aria-label="Password requirements"`
   - Each item: Icon labeled "Requirement met" or "Requirement not met"

### Color Contrast (WCAG 2.1 Level AA)
- Normal text (14px+): Minimum 4.5:1 contrast ratio
- Large text (18px+): Minimum 3:1 contrast ratio
- Interactive elements: Minimum 3:1 contrast for focus indicators
- Error messages: Red color with sufficient contrast (`hsl(0 84.2% 60.2%)` meets AA on white background)

### Touch Targets
- Minimum size: 44px × 44px for all interactive elements
- Spacing: Minimum 8px between adjacent touch targets
- Input fields: Height 40px + padding = 44px+ effective target

---

## Responsive Behavior

### Mobile (< 640px)
- Card width: `calc(100vw - 2rem)` (full width minus 1rem padding each side)
- Font sizes: Same as desktop (no reduction)
- Vertical spacing: Slightly reduced (0.75rem instead of 1rem between fields)
- Touch targets: Maintained at 44px minimum

### Tablet (640px - 1024px)
- Card width: 448px (max-w-md)
- Centered horizontally with auto margins
- All spacing: Standard desktop values

### Desktop (1024px+)
- Same as tablet
- Hover states enabled:
  - Links: Underline on hover
  - Buttons: Slight brightness increase on hover
  - Inputs: Border color change on hover (subtle)

---

## Visual Hierarchy

### Primary Actions
1. Submit button (highest prominence): Primary color, full width, bold text
2. Input fields (secondary): Clear borders, ample padding
3. Links (tertiary): Primary color, medium weight, underline on interaction

### Information Hierarchy
1. **Critical**: Error messages (red, prominent placement)
2. **Important**: Field labels (medium weight, clear contrast)
3. **Supporting**: Help text, descriptions (muted color, smaller text)
4. **Decorative**: Logo, icons (visual interest, not critical for understanding)

---

## Implementation Notes

### Component Library
- Built with shadcn/ui components: `Card`, `Input`, `Label`, `Button`
- Tailwind CSS 4.1.14+ for utility classes
- Custom components: Password strength checklist (React component with state)

### Form Validation
- Client-side validation: Zod schema with React Hook Form
- Real-time validation: Password requirements update on input change
- Server-side validation: Duplicate email, weak password, rate limiting

### Error Handling Priority
1. Network errors: Top priority (banner at form top)
2. Field validation errors: Inline below each field
3. Success messages: Not shown on these pages (redirect instead)

### Animation
- Loading spinner: Smooth 360° rotation, 1s duration, ease-in-out
- Error message appearance: Fade in over 150ms
- Focus ring: Instant appearance (no delay for accessibility)

---

## Design Review Checklist

- [x] All element positions specified with pixel/rem values
- [x] Spacing system documented (vertical and horizontal)
- [x] All states documented (normal, loading, error, empty)
- [x] Visual hierarchy clearly defined
- [x] Accessibility requirements specified (WCAG 2.1 AA)
- [x] Responsive breakpoints and behaviors documented
- [x] Color palette and contrast ratios specified
- [x] Touch target sizes meet minimum requirements (44px)
- [x] Keyboard navigation order documented
- [x] Screen reader announcements specified
- [x] Error message wording and placement finalized

---

**Last Updated**: 2025-10-20  
**Reviewed By**: Design Team, Accessibility Specialist  
**Status**: ✅ Approved for Implementation
