---
title: Components – Brands
category: components/brands
files:
  - brands-table.tsx
  - brands-filters.tsx
  - brands-bulk-actions.tsx
riskLevel: low
---

# Brand Components Review

Notes:
- Table: Paginated; ensure accessible sorting and selection for bulk actions.
- Filters: Debounce; provide clear labels and ARIA descriptions; maintain state in URL params for deep linking.
- Bulk actions: Confirm authorization (STORE_ADMIN only) and optimistic updates with server validation.

Recommendations:
1. Add integration tests for bulk publish/unpublish flows.
2. Use Suspense boundaries around table data for streaming updates if applicable.
