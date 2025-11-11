---
title: Components – Theme
category: components/theme
files:
  - theme-editor.tsx
riskLevel: medium
---

# Theme Components Review

Notes:
- Client editor likely heavy; dynamically import sub-editors; debounce updates; persist changes via server action with validation.
- Accessibility: Ensure color pickers and sliders are accessible; provide text alternatives.
- Multi-tenancy: Persist theme by storeId; ensure optimistic UI reconciles with server constraints.

Recommendations:
1. Add autosave with clear status indicators.
2. Invalidate cache for storefront after theme updates.
