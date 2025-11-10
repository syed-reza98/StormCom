---
title: Components – Attributes
category: components/attributes
files:
  - attribute-form.tsx
  - attributes-filters.tsx
  - attributes-table.tsx
riskLevel: low
---

# Attribute Components Review

Notes:
- Forms: attribute-form.tsx should use controlled inputs, Zod validation server-side; client form should handle optimistic UI updates.
- Filters/table: Ensure table is paginated and accessible (table headers <th>, sortable columns with aria-sort).
- Multi-tenancy: All modify/read operations must filter attributes by storeId indirectly through products/categories if applicable.
- Performance: Debounce filter inputs; avoid fetching large attribute lists at once.
- Accessibility: Provide labels for filters, keyboard navigation in table.

Recommendations:
1. Add skeleton states for table loading.
2. Add unit tests for value list normalization (e.g., parsing JSON arrays of attribute values).
3. Ensure attribute-form enforces unique attribute names if required.
