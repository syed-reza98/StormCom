---
title: Components – Root Provider
category: components/root
files:
  - theme-provider.tsx
riskLevel: low
---

# Root Theme Provider Review

Notes:
- Client-only provider injecting theme context; ensure minimal state and avoid large context objects (may cause re-render storms).
- Defer non-critical theme calculations until after hydration if possible.

Recommendations:
1. Memoize context value.
2. Add unit test for dark/light mode switching and persistence.
