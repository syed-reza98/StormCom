---
title: Components – GDPR
category: components/gdpr
files:
  - cookie-consent.tsx
riskLevel: low
---

# GDPR Components Review

Notes:
- Cookie consent banner: Ensure proper categories (essential, analytics, marketing, preferences) tie into ConsentRecord model.
- Accessibility: Keyboard navigable; clear contrast; screen-reader friendly.
- Persistence: Store consent choices (per store) and honor on subsequent visits.

Recommendations:
1. Add unit tests to verify consent toggles mapping to categories.
2. Respect Do-Not-Track where applicable.
