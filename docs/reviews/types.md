---
title: Types Review
sourcePath: src/types
category: types
riskLevel: low
---

# Types Review

Files:
- analytics.ts
- api.ts
- auth.ts
- index.ts
- store.ts

Notes:
- Ensure strict typing; avoid any. Use narrow, composable types.
- Keep shared API response types aligned with lib/api-response.ts.
- Export barrel in index.ts to simplify imports; avoid deep paths from consumers.
