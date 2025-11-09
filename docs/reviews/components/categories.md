---
title: Components – Categories
category: components/categories
files:
  - category-form.tsx
  - categories-tree.tsx
riskLevel: low
---

# Categories Components Review

Notes:
- Tree: Use accessible tree patterns (aria-expanded, role=tree); keyboard navigation for expand/collapse.
- Form: Validate slug uniqueness per store; show preview URL.
- Performance: Virtualize long trees; lazy load children.

Recommendations:
1. Include drag-and-drop reordering with keyboard fallback.
2. Add unit tests for tree manipulation utilities.
