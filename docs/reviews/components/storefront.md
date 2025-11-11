---
title: Components – Storefront
category: components/storefront
files:
  - product-card.tsx
  - product-image-gallery.tsx
  - product-filters.tsx
  - related-products.tsx
  - product-tabs.tsx
  - product-sort.tsx
  - product-info.tsx
riskLevel: medium
---

# Storefront Components Review

Notes:
- Many of these are Client Components (`'use client'` detected in several). Ensure no server-only APIs are imported.
- Use Next.js Image with proper `sizes` and alt text.
- Performance: Lazy-load below-the-fold assets; keep initial JS small; defer heavy carousels/galleries.
- Accessibility: Keyboard navigation for galleries and tabs; ARIA roles for tablist/tab/panel.

Recommendations:
1. Add unit tests for price/availability rendering and variant selection.
2. Provide skeletons for image gallery and related products.
