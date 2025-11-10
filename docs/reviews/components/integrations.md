---
title: Components – Integrations
category: components/integrations
files:
  - integration-card.tsx
riskLevel: low
---

# Integrations Components Review

Notes:
- Card displays status and sync metrics; ensure status badges have sufficient contrast.
- Provide actions (connect, disconnect, sync) gated by role and storeId.
- Include accessible descriptions of integration scope (what data syncs).

Recommendations:
1. Add tests for rendering connect/disconnect states.
2. Show lastSyncAt relative time with proper locale.
