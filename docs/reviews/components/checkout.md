---
title: Components – Checkout
category: components/checkout
files:
  - shipping-address-form.tsx
  - payment-method-selector.tsx
  - order-review.tsx
riskLevel: medium
---

# Checkout Components Review

Notes:
- Address form: Client-only; validate inputs; auto-complete attributes; accessibility for all fields.
- Payment: Clearly indicate supported methods; handle async states; show errors from gateways.
- Review: Summarize items, totals, taxes; ensure accurate currency formatting.
- Security: Never store raw card data; delegate to gateway components (Stripe Elements) when applicable.

Recommendations:
1. Add E2E tests for full checkout flow (cart → validate → payment intent → complete).
2. Provide skeleton states and disable double-submit.
