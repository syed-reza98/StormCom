# StormCom Design System

**Version**: 1.0.0  
**Last Updated**: 2025-01-25  
**Status**: Active

## Overview

StormCom's design system provides a comprehensive set of design tokens, components, and patterns to ensure consistency, accessibility, and maintainability across the admin dashboard and customer storefront.

---

## Terminology Definitions

### Centered Card Layout
A vertically and horizontally centered container on the page with:
- **Maximum width**: 480px (mobile), 560px (tablet/desktop)
- **Padding**: 32px (2rem) on desktop, 24px (1.5rem) on mobile
- **Background**: White (#FFFFFF) in light mode, Slate 900 (#0f172a) in dark mode
- **Border radius**: 12px (rounded-xl)
- **Shadow**: Elevation 3 (0 10px 15px -3px rgba(0, 0, 0, 0.1))
- **Vertical alignment**: Center of viewport (min-height: 100vh with flexbox centering)
- **Horizontal alignment**: Center (margin: 0 auto)

**Use cases**: Login, register, forgot password, MFA enrollment, password reset pages

**Example CSS**:
```css
.centered-card {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.centered-card__container {
  width: 100%;
  max-width: 28rem; /* 448px */
  padding: 2rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

### Dashboard Branding
Dashboard-specific visual identity elements:
- **Logo**: StormCom logo (SVG) displayed in header, max height 40px
- **Primary color**: Teal 600 (#0f766e) for primary actions, links, active states
- **Secondary color**: Purple 600 (#7c3aed) for secondary actions, highlights
- **Typography**: Inter font family with optical sizing
- **Header height**: 64px with sticky positioning
- **Sidebar width**: 280px (expanded), 64px (collapsed)
- **Background**: Slate 50 (#f8fafc) in light mode, Slate 950 (#020617) in dark mode

**Contrast with Storefront Branding**: Storefronts use per-tenant `Store.primaryColor` and `Store.secondaryColor` from database, injected as CSS variables. Dashboard uses fixed platform colors.

---

## Glossary

| Term | Definition |
|------|------------|
| **Store Owner** | Billing entity (person/company) who owns the store subscription; not a user role |
| **Store Admin** | User role with full access to store management features |
| **Staff** | User role with limited permissions (configurable module access) |
| **Super Admin** | Platform-level administrator with cross-store access |
| **Customer** | Storefront user with account management and order history access |
| **Centered Card Layout** | Vertically/horizontally centered container (max-width 480px, padding 32px, rounded-xl) |
| **Dashboard Branding** | Platform-specific visual identity (Teal/Purple colors, Inter font, StormCom logo) |
| **Storefront Branding** | Per-tenant visual identity (custom colors from Store.primaryColor/secondaryColor) |
| **Wireframe** | Low-fidelity layout sketch showing element positions and hierarchy |
| **POM (Page Object Model)** | E2E testing pattern encapsulating page interactions in classes |
| **Constitution** | Project standards document (`.specify/memory/constitution.md`) defining code quality, testing, and architecture rules |

---

## Design Tokens

Design tokens are the atomic design decisions (colors, typography, spacing) that ensure consistency across the platform.

### Color Palette

**Brand Colors**:
```typescript
// Primary brand color (customizable per store)
primary: {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6',  // Default primary
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
  950: '#172554',
}

// Secondary/accent color
secondary: {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e',  // Default secondary
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
  950: '#052e16',
}
```

**Semantic Colors** (not customizable):
```typescript
// Success state
success: {
  DEFAULT: '#22c55e',
  light: '#86efac',
  dark: '#15803d',
}

// Warning state
warning: {
  DEFAULT: '#f59e0b',
  light: '#fbbf24',
  dark: '#d97706',
}

// Error state
error: {
  DEFAULT: '#ef4444',
  light: '#fca5a5',
  dark: '#dc2626',
}

// Info state
info: {
  DEFAULT: '#3b82f6',
  light: '#93c5fd',
  dark: '#1d4ed8',
}
```

**Neutral/Gray Scale**:
```typescript
gray: {
  50: '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
  950: '#030712',
}
```

### Typography Scale

**Font Families**:
```typescript
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  serif: ['Merriweather', 'Georgia', 'serif'],
  mono: ['JetBrains Mono', 'Menlo', 'monospace'],
}
```

**Font Sizes** (with responsive line heights):
```typescript
fontSize: {
  xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px / 16px
  sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px / 20px
  base: ['1rem', { lineHeight: '1.5rem' }],     // 16px / 24px
  lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px / 28px
  xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px / 28px
  '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px / 32px
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px / 36px
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px / 40px
  '5xl': ['3rem', { lineHeight: '1' }],         // 48px
  '6xl': ['3.75rem', { lineHeight: '1' }],      // 60px
}
```

**Font Weights**:
```typescript
fontWeight: {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
}
```

### Spacing Scale

Based on 4px grid system:
```typescript
spacing: {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  32: '8rem',       // 128px
}
```

### Border Radius

```typescript
borderRadius: {
  none: '0',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
}
```

### Shadows

```typescript
boxShadow: {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
}
```

---

## Tailwind Configuration

Complete Tailwind config with custom design tokens and plugins.

**File**: `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // CSS variable-based colors for dynamic theming
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Semantic colors (static, not themeable)
        success: {
          DEFAULT: '#22c55e',
          light: '#86efac',
          dark: '#15803d',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
          dark: '#d97706',
        },
        error: {
          DEFAULT: '#ef4444',
          light: '#fca5a5',
          dark: '#dc2626',
        },
        info: {
          DEFAULT: '#3b82f6',
          light: '#93c5fd',
          dark: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-merriweather)', 'Georgia', 'serif'],
        mono: ['var(--font-jetbrains-mono)', 'Menlo', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'slide-in-from-top': {
          from: { transform: 'translateY(-100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-in-from-bottom': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-in-from-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-in-from-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.3s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
        'slide-in-from-left': 'slide-in-from-left 0.3s ease-out',
        'slide-in-from-right': 'slide-in-from-right 0.3s ease-out',
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
  ],
};

export default config;
```

---

## CSS Variables

CSS variables enable dynamic theming per store while maintaining type safety.

**File**: `src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Base colors */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    
    /* Card colors */
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    
    /* Popover colors */
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    
    /* Primary brand color (customizable per store) */
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    
    /* Secondary/accent color */
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    
    /* Muted backgrounds */
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    
    /* Accent highlights */
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    
    /* Destructive/error states */
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    
    /* Border and input colors */
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    
    /* Border radius */
    --radius: 0.5rem;
  }
  
  .dark {
    /* Dark mode colors */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
  
  /* Custom store theme overrides */
  [data-store-theme] {
    /* Override primary color per store */
    --primary: var(--store-primary, 221.2 83.2% 53.3%);
    --primary-foreground: var(--store-primary-foreground, 210 40% 98%);
  }
}

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
  
  /* Focus visible styles for accessibility */
  *:focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
  }
  
  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }
  
  /* Remove number input spinners */
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  input[type="number"] {
    -moz-appearance: textfield;
  }
}

@layer utilities {
  /* Text balance for headings */
  .text-balance {
    text-wrap: balance;
  }
  
  /* Screen reader only text */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
}
```

### Dynamic Theme Application

**File**: `src/lib/theme.ts`

```typescript
/**
 * Apply store-specific theme colors dynamically
 * Converts hex colors to HSL for CSS variable compatibility
 */
export function applyStoreTheme(storeTheme: {
  primaryColor: string;
  secondaryColor: string;
  radius?: number;
}) {
  const root = document.documentElement;
  
  // Convert hex to HSL
  const primaryHSL = hexToHSL(storeTheme.primaryColor);
  const secondaryHSL = hexToHSL(storeTheme.secondaryColor);
  
  // Set CSS variables
  root.style.setProperty('--store-primary', primaryHSL);
  root.style.setProperty('--store-secondary', secondaryHSL);
  
  if (storeTheme.radius !== undefined) {
    root.style.setProperty('--radius', `${storeTheme.radius}rem`);
  }
}

/**
 * Convert hex color to HSL string for CSS variables
 * Example: #3b82f6 => "221.2 83.2% 53.3%"
 */
function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Calculate HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  // Convert to CSS HSL format
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lightness = Math.round(l * 100);
  
  return `${h} ${s}% ${lightness}%`;
}
```

---

## Component Library

All UI components built with shadcn/ui + Radix UI primitives.

### Component Structure

```
src/components/
├── ui/                    # shadcn/ui primitives
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── select.tsx
│   ├── table.tsx
│   └── ...
├── admin/                 # Admin dashboard components
│   ├── dashboard/
│   ├── products/
│   ├── orders/
│   └── settings/
└── storefront/            # Customer-facing components
    ├── header.tsx
    ├── product-card.tsx
    ├── cart-drawer.tsx
    └── checkout-form.tsx
```

### Example Component: Button

**File**: `src/components/ui/button.tsx`

```typescript
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

### Component Documentation Template

Each component should include:

1. **TypeScript types** for all props
2. **Variants** for different visual styles (using CVA)
3. **Sizes** for responsive scaling
4. **States** (default, hover, focus, active, disabled)
5. **Accessibility** attributes (ARIA labels, roles, keyboard support)
6. **Usage examples** in JSDoc comments

---

## Storybook Documentation

Storybook provides interactive component documentation and visual testing.

### Storybook Setup

**File**: `.storybook/main.ts`

```typescript
import type { StorybookConfig } from '@storybook/nextjs';
import path from 'path';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y', // Accessibility testing
    '@storybook/addon-themes',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../public'],
  webpackFinal: async (config) => {
    // Resolve Tailwind CSS
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../src'),
    };
    return config;
  },
};

export default config;
```

**File**: `.storybook/preview.ts`

```typescript
import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#111827' },
      ],
    },
    a11y: {
      // axe-core configuration
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
```

### Example Story: Button Component

**File**: `src/components/ui/button.stories.tsx`

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { Mail, Plus, Trash2 } from 'lucide-react';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants, sizes, and states. Built with Radix UI primitives for accessibility.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default button
export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
  },
};

// All variants showcase
export const Variants: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

// All sizes showcase
export const Sizes: Story = {
  render: () => (
    <div className="flex gap-4 items-end">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon"><Plus className="h-4 w-4" /></Button>
    </div>
  ),
};

// With icons
export const WithIcons: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <Button>
        <Mail className="mr-2 h-4 w-4" />
        Email
      </Button>
      <Button variant="destructive">
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>
      <Button size="icon">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  ),
};

// States
export const States: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <Button>Default</Button>
      <Button disabled>Disabled</Button>
      <Button className="hover:bg-primary/90">Hover (trigger manually)</Button>
      <Button className="ring-2 ring-ring ring-offset-2">Focused</Button>
    </div>
  ),
};

// Loading state
export const Loading: Story = {
  render: () => (
    <Button disabled>
      <svg
        className="mr-2 h-4 w-4 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      Loading...
    </Button>
  ),
};
```

### Running Storybook

```bash
# Start Storybook development server
npm run storybook

# Build Storybook static site
npm run build-storybook

# Deploy Storybook (e.g., to Vercel)
vercel --prod ./storybook-static
```

---

## Accessibility Testing

Comprehensive accessibility testing ensures WCAG 2.1 Level AA compliance.

### Testing Tools

1. **axe-core/playwright** - Automated accessibility scanning
2. **BrowserStack Accessibility Testing** - Cross-browser a11y validation
3. **Manual keyboard navigation testing**
4. **Screen reader testing** (NVDA, JAWS, VoiceOver)

### Automated Accessibility Tests

**File**: `tests/e2e/accessibility/a11y.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('Homepage passes axe accessibility scan', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('Admin dashboard passes axe scan', async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3000/auth/login');
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('Product page meets color contrast requirements', async ({ page }) => {
    await page.goto('http://localhost:3000/products/test-product');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Keyboard Navigation', () => {
  test('Can navigate entire homepage with keyboard only', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Tab through all interactive elements
    await page.keyboard.press('Tab'); // Skip to content link
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'skip-to-content');
    
    await page.keyboard.press('Tab'); // Logo
    await page.keyboard.press('Tab'); // First nav link
    await page.keyboard.press('Tab'); // Second nav link
    // ... continue for all interactive elements
    
    // Verify focus visible on all elements
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toHaveCSS('outline-style', 'solid');
  });
  
  test('Form can be submitted with keyboard only', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/login');
    
    // Tab to email field
    await page.keyboard.press('Tab');
    await page.keyboard.type('user@example.com');
    
    // Tab to password field
    await page.keyboard.press('Tab');
    await page.keyboard.type('password123');
    
    // Tab to submit button and press Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Verify form submission
    await expect(page).toHaveURL('**/dashboard');
  });
});
```

### BrowserStack Accessibility Testing Integration

**File**: `.github/workflows/accessibility.yml`

```yaml
name: Accessibility Testing

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm run start &
        env:
          PORT: 3000
      
      - name: Wait for application to start
        run: npx wait-on http://localhost:3000
      
      - name: Run axe accessibility tests
        run: npm run test:a11y
      
      - name: Run BrowserStack Accessibility Testing
        env:
          BROWSERSTACK_USERNAME: ${{ secrets.BROWSERSTACK_USERNAME }}
          BROWSERSTACK_ACCESS_KEY: ${{ secrets.BROWSERSTACK_ACCESS_KEY }}
        run: |
          npx browserstack-accessibility-cli \
            --url http://localhost:3000 \
            --pages '/, /products, /cart, /checkout' \
            --standards wcag2aa \
            --report-format json \
            --output accessibility-report.json
      
      - name: Upload accessibility report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: accessibility-report
          path: accessibility-report.json
      
      - name: Comment PR with results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('accessibility-report.json', 'utf8'));
            const violations = report.violations.length;
            
            const comment = violations === 0
              ? '✅ No accessibility violations found!'
              : `⚠️ ${violations} accessibility violations detected. See report for details.`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### Accessibility Checklist

For each component, verify:

- [ ] Semantic HTML elements used (`<button>`, `<nav>`, `<main>`, `<article>`)
- [ ] All interactive elements keyboard accessible (Tab, Enter, Space, Arrow keys)
- [ ] Focus visible indicator with 4.5:1 contrast ratio
- [ ] ARIA labels for icon-only buttons (`aria-label="Close dialog"`)
- [ ] ARIA roles where needed (`role="navigation"`, `role="dialog"`)
- [ ] ARIA states (`aria-expanded`, `aria-selected`, `aria-disabled`)
- [ ] Color contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- [ ] Form labels associated with inputs (`<label htmlFor="email">`)
- [ ] Error messages announced to screen readers (`aria-describedby`, `role="alert"`)
- [ ] Skip to content link for keyboard users
- [ ] Heading hierarchy correct (h1 → h2 → h3, no skipping levels)
- [ ] Images have alt text (or `alt=""` for decorative images)
- [ ] Videos have captions and transcripts
- [ ] No content conveyed by color alone (use icons + text)

---

## Visual Regression Testing

BrowserStack Percy automatically detects visual changes across browsers and viewports.

### Percy Setup

**File**: `.percy.yml`

```yaml
version: 2

static:
  # Static directory for Storybook builds
  cleanUrls: true

snapshot:
  widths:
    - 375   # Mobile
    - 768   # Tablet
    - 1280  # Desktop
  minHeight: 1024
  percyCSS: |
    /* Hide dynamic content from visual diffs */
    [data-testid="current-time"],
    [data-testid="live-badge"],
    .animate-spin {
      visibility: hidden !important;
    }

discovery:
  # Allowed hostnames for resource loading
  allowed-hostnames:
    - fonts.googleapis.com
    - fonts.gstatic.com
    - cdn.example.com

# Visual comparison settings
visual:
  threshold: 0.001  # 0.1% threshold for detecting changes
```

### Percy Integration in Tests

**File**: `tests/e2e/visual-regression/percy.spec.ts`

```typescript
import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Visual Regression Tests', () => {
  test('Storefront homepage visual baseline', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Wait for fonts and images to load
    await page.waitForLoadState('networkidle');
    
    // Take Percy snapshot
    await percySnapshot(page, 'Storefront Homepage', {
      widths: [375, 768, 1280],
      minHeight: 1024,
    });
  });
  
  test('Product listing page all states', async ({ page }) => {
    await page.goto('http://localhost:3000/products');
    await page.waitForLoadState('networkidle');
    
    // Default state
    await percySnapshot(page, 'Product Listing - Default');
    
    // Filtered state
    await page.click('[data-testid="filter-category"]');
    await page.click('[data-testid="category-apparel"]');
    await percySnapshot(page, 'Product Listing - Filtered');
    
    // Grid view
    await page.click('[data-testid="grid-view-button"]');
    await percySnapshot(page, 'Product Listing - Grid View');
    
    // List view
    await page.click('[data-testid="list-view-button"]');
    await percySnapshot(page, 'Product Listing - List View');
  });
  
  test('Admin dashboard responsive snapshots', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/auth/login');
    await page.fill('[data-testid="email-input"]', 'admin@example.com');
    await page.fill('[data-testid="password-input"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
    
    // Dashboard
    await percySnapshot(page, 'Admin Dashboard', {
      widths: [768, 1280, 1920],
    });
  });
  
  test('Component library Storybook snapshots', async ({ page }) => {
    // Assumes Storybook running on port 6006
    await page.goto('http://localhost:6006');
    
    // Button variants
    await page.goto('http://localhost:6006/iframe.html?id=ui-button--variants');
    await percySnapshot(page, 'Button Variants');
    
    // Form components
    await page.goto('http://localhost:6006/iframe.html?id=ui-input--default');
    await percySnapshot(page, 'Input Component');
    
    // Card components
    await page.goto('http://localhost:6006/iframe.html?id=ui-card--default');
    await percySnapshot(page, 'Card Component');
  });
});
```

### Running Percy Tests

```bash
# Set Percy token
export PERCY_TOKEN=your_percy_token_here

# Run Percy snapshots locally
npx percy exec -- npm run test:e2e:visual

# Run in CI (automatically runs on PR)
# See .github/workflows/visual-regression.yml
```

### GitHub Actions Percy Integration

**File**: `.github/workflows/visual-regression.yml`

```yaml
name: Visual Regression Testing

on:
  pull_request:
    branches: [main, develop]

jobs:
  percy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm run start &
        env:
          PORT: 3000
      
      - name: Wait for application
        run: npx wait-on http://localhost:3000
      
      - name: Run Percy visual tests
        run: npx percy exec -- npm run test:e2e:visual
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
          PERCY_BRANCH: ${{ github.head_ref }}
          PERCY_PULL_REQUEST: ${{ github.event.pull_request.number }}
      
      - name: Comment PR with Percy results
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            const comment = `🎨 Percy visual regression tests complete!
            
            View detailed comparison: https://percy.io/StormCom/pull-requests/${context.payload.pull_request.number}`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

---

## Theming and Customization

Per-store theme customization with real-time preview.

### Theme Configuration Model

**File**: `prisma/schema.prisma` (excerpt)

```prisma
model Store {
  id        String   @id @default(cuid())
  name      String
  subdomain String   @unique
  
  // Theme customization
  theme     StoreTheme?
  
  // ... other fields
}

model StoreTheme {
  id        String   @id @default(cuid())
  storeId   String   @unique
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  // Brand colors (hex format)
  primaryColor     String  @default("#3b82f6")
  secondaryColor   String  @default("#22c55e")
  
  // Typography
  fontFamily       String  @default("Inter")
  headingFont      String? // Optional separate heading font
  
  // Layout
  borderRadius     Float   @default(0.5) // In rem units
  
  // Logo
  logoUrl          String?
  faviconUrl       String?
  
  // Custom CSS (sanitized)
  customCSS        String? @db.Text
  
  // Preview snapshot
  previewSnapshot  Json?
  
  // Published snapshot (atomic publish)
  publishedSnapshot Json?
  publishedAt      DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Theme Preview Component

**File**: `src/components/admin/theme/theme-preview.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { applyStoreTheme } from '@/lib/theme';

interface ThemePreviewProps {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    borderRadius?: number;
  };
  children: React.ReactNode;
}

export function ThemePreview({ theme, children }: ThemePreviewProps) {
  useEffect(() => {
    // Apply theme in isolated iframe or shadow DOM
    applyStoreTheme(theme);
    
    // Cleanup on unmount
    return () => {
      document.documentElement.style.removeProperty('--store-primary');
      document.documentElement.style.removeProperty('--store-secondary');
    };
  }, [theme]);
  
  return (
    <div className="theme-preview" data-store-theme>
      {children}
    </div>
  );
}
```

### Theme Editor Component

**File**: `src/components/admin/theme/theme-editor.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemePreview } from './theme-preview';
import { toast } from 'sonner';

interface ThemeEditorProps {
  storeId: string;
  currentTheme: {
    primaryColor: string;
    secondaryColor: string;
    borderRadius: number;
  };
}

export function ThemeEditor({ storeId, currentTheme }: ThemeEditorProps) {
  const [theme, setTheme] = useState(currentTheme);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const handlePublish = async () => {
    setIsPublishing(true);
    
    try {
      const response = await fetch(`/api/stores/${storeId}/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(theme),
      });
      
      if (!response.ok) throw new Error('Failed to publish theme');
      
      toast.success('Theme published successfully');
    } catch (error) {
      toast.error('Failed to publish theme');
    } finally {
      setIsPublishing(false);
    }
  };
  
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Theme Controls */}
      <div className="space-y-6">
        <div>
          <Label htmlFor="primaryColor">Primary Color</Label>
          <Input
            id="primaryColor"
            type="color"
            value={theme.primaryColor}
            onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
          />
        </div>
        
        <div>
          <Label htmlFor="secondaryColor">Secondary Color</Label>
          <Input
            id="secondaryColor"
            type="color"
            value={theme.secondaryColor}
            onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
          />
        </div>
        
        <div>
          <Label htmlFor="borderRadius">Border Radius</Label>
          <Input
            id="borderRadius"
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={theme.borderRadius}
            onChange={(e) => setTheme({ ...theme, borderRadius: parseFloat(e.target.value) })}
          />
          <span className="text-sm text-muted-foreground">{theme.borderRadius}rem</span>
        </div>
        
        <Button onClick={handlePublish} disabled={isPublishing} className="w-full">
          {isPublishing ? 'Publishing...' : 'Publish Theme'}
        </Button>
      </div>
      
      {/* Live Preview */}
      <div className="border rounded-lg overflow-hidden">
        <ThemePreview theme={theme}>
          <div className="p-6 space-y-4">
            <h3 className="text-2xl font-bold">Preview</h3>
            <p className="text-muted-foreground">This is how your store will look with the new theme.</p>
            <div className="flex gap-2">
              <Button variant="default">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
            </div>
            <div className="border rounded-lg p-4">
              <p>Card with custom border radius</p>
            </div>
          </div>
        </ThemePreview>
      </div>
    </div>
  );
}
```

---

## Resources and Tools

### Design System References

- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **shadcn/ui Components**: https://ui.shadcn.com
- **Radix UI Primitives**: https://www.radix-ui.com
- **CVA (Class Variance Authority)**: https://cva.style

### Accessibility Resources

- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **axe DevTools**: https://www.deque.com/axe/devtools/
- **BrowserStack Accessibility**: https://www.browserstack.com/accessibility-testing
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/

### Visual Regression Tools

- **BrowserStack Percy**: https://www.browserstack.com/percy
- **Percy Docs**: https://www.browserstack.com/docs/percy
- **Percy Playwright Integration**: https://www.browserstack.com/docs/percy/integrate/playwright

### Development Tools

- **Storybook**: https://storybook.js.org
- **Playwright**: https://playwright.dev
- **VS Code Extensions**:
  - Tailwind CSS IntelliSense
  - Headwind (Tailwind class sorter)
  - axe Accessibility Linter

---

## Maintenance and Updates

### Design System Versioning

- **Major version** (1.x.x → 2.x.x): Breaking changes to component APIs or design tokens
- **Minor version** (x.1.x → x.2.x): New components or non-breaking enhancements
- **Patch version** (x.x.1 → x.x.2): Bug fixes, accessibility improvements, performance optimizations

### Update Checklist

When updating design system components:

1. [ ] Update component code in `src/components/ui/`
2. [ ] Update Storybook story with new examples
3. [ ] Run accessibility tests (`npm run test:a11y`)
4. [ ] Run visual regression tests (`npm run test:visual`)
5. [ ] Update this documentation with new examples
6. [ ] Create migration guide if breaking changes
7. [ ] Bump version number in `package.json`
8. [ ] Create changelog entry

### Review Schedule

- **Weekly**: Review accessibility violation reports from BrowserStack
- **Monthly**: Audit Percy visual regression baselines and approve/reject changes
- **Quarterly**: Review design token usage across codebase, identify inconsistencies
- **Annually**: Major design system audit and planning for next version

---

**Document Owner**: Design Team  
**Last Review**: October 22, 2025  
**Next Review**: January 22, 2026
