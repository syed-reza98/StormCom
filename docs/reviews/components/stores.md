---
title: Components – Stores
category: components/stores
files:
  - store-settings-form.tsx
  - CreateStoreForm.tsx
riskLevel: low
---

# Store Components Review

Notes:
- Forms manage store metadata, subscription plan changes, theme linkage.
- Validation: Enforce slug uniqueness; sanitize HTML fields (description) server-side.
- Access control: Only Super Admin or Store Admin modifies settings.

Recommendations:
1. Add tests for form validation and plan enforcement logic.
2. Provide real-time feedback on slug availability.
