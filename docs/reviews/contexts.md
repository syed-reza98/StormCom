---
title: Contexts Review
sourcePath: src/contexts
category: contexts
riskLevel: low
---

# Contexts Review

Files:
- auth-provider.tsx ('use client')

Notes:
- Client context provider should avoid heavy computations; memoize context values; provide clear types.
- Ensure no server-only imports; use isomorphic APIs if necessary.
- Consider testing provider logic for auth edge cases (token refresh, role changes).
