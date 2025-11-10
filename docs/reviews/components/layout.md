---
title: Components – Layout
category: components/layout
files:
  - dashboard-shell.tsx
  - notifications-dropdown.tsx
riskLevel: low
---

# Layout Components Review

Notes:
- Dashboard shell should be Server Component when possible; embed client widgets (notifications) via islands.
- Notifications dropdown: ensure keyboard and screen reader support; use aria-haspopup/menu roles.
- Performance: Avoid heavy client hydration for static shell parts.

Recommendations:
1. Add unit tests for notification list rendering and read/unread toggling.
2. Ensure notification API uses pagination and read markers.
