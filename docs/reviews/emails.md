---
title: Emails Review
sourcePath: src/emails
category: emails
riskLevel: low
---

# Emails Review

Files:
- account-verification.tsx
- order-confirmation.tsx
- password-reset.tsx
- shipping-confirmation.tsx

Notes:
- Pure rendering components; ensure no client-only hooks used (should be server-render safe or standalone templates).
- Validate placeholder variables and ensure escaping to prevent injection.
- Consider test snapshots to ensure consistent rendering across template changes.
