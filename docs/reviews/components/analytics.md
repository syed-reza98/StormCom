---
title: Components – Analytics
category: components/analytics
files:
  - analytics-dashboard.tsx
  - analytics-date-picker.tsx
  - revenue-chart.tsx
  - sales-revenue-chart.tsx
  - sales-report.tsx
  - sales-metrics-cards.tsx
  - metrics-cards.tsx
  - top-products.tsx
  - top-products-table.tsx
  - top-products-chart.tsx
  - customer-metrics.tsx
  - customer-metrics-chart.tsx
riskLevel: medium
---

# Analytics Components Review

General Observations:
- All files expected to be Client Components if they use charts, hooks, or interactivity; verify `'use client'` directive present where hooks (state, effects) are used.
- Performance: Heavy chart components should leverage dynamic import with suspense boundaries inside client shells, not at server level.
- Data Fetching: Prefer server-side data aggregation passed as props to minimize client data mass; use lean datasets.
- Accessibility: Charts require textual summaries (ARIA live regions or descriptive text) for screen readers.
- Multi-tenancy: Ensure analytics queries filter by storeId and respect soft deletion; avoid leaking cross-tenant aggregates.

Per-File Notes (Heuristic):
- analytics-dashboard.tsx: Likely orchestrates multiple metric cards—should split layout vs data fetching; server component parent + client metric cards is preferred.
- analytics-date-picker.tsx: Ensure keyboard navigation, focus management, and proper aria-labels for date inputs.
- revenue-chart.tsx / sales-revenue-chart.tsx / top-products-chart.tsx / customer-metrics-chart.tsx: Confirm canvas/svg elements have fallback textual descriptions. Avoid large bundle of charting libs; tree-shake.
- sales-report.tsx: If generating tabular PDF/CSV export, do so server-side; avoid heavy client loops.
- sales-metrics-cards.tsx / metrics-cards.tsx / customer-metrics.tsx: Keep each card small (<50 lines), use semantic elements (<section>, <h2>). Provide skeleton loading states.
- top-products-table.tsx / top-products.tsx: Paginate tables; limit columns; ensure responsive design.

Recommendations:
1. Add explicit `<figure>` + `<figcaption>` for each chart for accessibility.
2. Provide loading/error boundaries (Suspense + error boundary) wrapping chart components.
3. Export pure data transformation utilities into `lib/analytics-utils.ts` to reduce duplication and improve testability.
4. Add unit tests for data bucketing and sorting logic (e.g., top products, revenue grouping).
5. Consider cache tags (e.g., `analytics:revenue`) for server-fetched aggregations to reduce recalculation.
