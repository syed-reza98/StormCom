---
title: Components – Orders
category: components/orders
files:
  - orders-table.tsx
  - orders-filters.tsx
  - update-status-form.tsx
riskLevel: medium
---

# Orders Components Review

Notes:
- Table: Paginated, sortable; ensure status and payment badges use accessible colors; prefer server-side pagination.
- Filters: Debounced inputs; preserve filter state in URL.
- Update-status-form: Client component invoking server action/API; enforce role checks and valid state transitions.
- Export: Prefer server-side CSV/PDF for large datasets.

Recommendations:
1. Add integration tests for status updates and optimistic UI.
2. Use Suspense boundaries for table content.
