---
title: Components – Audit Logs
category: components/audit-logs
files:
  - audit-logs-table.tsx
  - audit-logs-filters.tsx
riskLevel: low
---

# Audit Logs Components Review

Notes:
- Read-only views; must be server-fetched and paginated.
- Ensure filters (date range, user, action) debounce requests and use accessible controls.
- Security: Mask sensitive changes; avoid displaying secrets.
- Performance: Use indexed fields (createdAt, userId, entityType) as per schema; select necessary columns only.

Recommendations:
1. Add CSV export server-side with permission checks.
2. Provide row-level details in a dialog with keyboard accessible triggers.
