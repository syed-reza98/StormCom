# StormCom Design System Tokens

**Version**: 1.0.0  
**Last Updated**: 2025-11-13  
**Based on**: shadcn/ui + Radix UI + Tailwind CSS 4.1.16

## Overview

This document defines the design tokens used throughout the StormCom application. These tokens ensure visual consistency, accessibility compliance (WCAG 2.1 AA), and seamless dark mode support.

## Color System

### Semantic Colors

All semantic colors are defined as CSS variables in `src/app/globals.css` and use the Radix UI color scales for automatic light/dark mode support.

#### Base Colors

```css
:root {
  --background: var(--slate-1);        /* Page background */
  --foreground: var(--slate-12);       /* Primary text */
  --card: var(--slate-1);              /* Card background */
  --card-foreground: var(--slate-12);  /* Card text */
}
```

#### Brand Colors

```css
:root {
  --primary: var(--teal-9);            /* Primary actions */
  --primary-foreground: white;         /* Text on primary */
  --secondary: var(--purple-3);        /* Secondary backgrounds */
  --secondary-foreground: var(--purple-11); /* Text on secondary */
}
```

## Typography

### Font Families

- Primary: Inter (sans-serif)
- Serif: Merriweather
- Monospace: JetBrains Mono

## Spacing Scale

Using Tailwind's 4px base scale: 4, 8, 12, 16, 24, 32, 48, 64px

## Border Radius

- `--radius`: 8px (default)
- `rounded-lg`: 8px
- `rounded-md`: 6px
- `rounded-sm`: 4px

## Breakpoints

- sm: 640px (Mobile landscape)
- md: 768px (Tablet)
- lg: 1024px (Desktop)
- xl: 1280px (Large desktop)
- 2xl: 1536px (Extra large)

## References

- [shadcn/ui Theming](https://ui.shadcn.com/themes)
- [Radix UI Colors](https://www.radix-ui.com/colors)
- [Tailwind CSS](https://tailwindcss.com/docs)
