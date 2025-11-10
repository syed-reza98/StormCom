---
title: Components – Products
category: components/products
files:
  - product-form.tsx
  - product-images.tsx
  - product-inventory.tsx
  - product-variants.tsx
  - products-table.tsx
  - products-filters.tsx
  - products-bulk-actions.tsx
riskLevel: medium
---

# Product Components Review

Notes:
- Forms: Use Zod schemas; display inline errors; prevent SKU/slug duplicates per store via server validation.
- Images: Use Next.js Image; optimize sizes; ensure alt text.
- Inventory: Client UI for adjustments; server transaction for logs and stock changes; validate lowStockThreshold rules.
- Variants: Keep UI simple; consider virtualized lists for many variants.
- Tables/filters: Paginate; accessible; URL state for filters.

Recommendations:
1. Add tests for form validation and image upload flows.
2. Use cache tags (products) to invalidate storefront on changes.
