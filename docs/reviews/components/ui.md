---
title: Components – UI
category: components/ui
files:
  - alert.tsx
  - accordion.tsx
  - badge.tsx
  - button.tsx
  - calendar.tsx
  - card.tsx
  - checkbox.tsx
  - dialog.tsx
  - dropdown-menu.tsx
  - image-upload.tsx
  - input.tsx
  - label.tsx
  - nav-link.tsx
  - pagination.tsx
  - popover.tsx
  - progress.tsx
  - select.tsx
  - separator.tsx
  - skeleton.tsx
  - slider.tsx
  - switch.tsx
  - table.tsx
  - tabs.tsx
  - textarea.tsx
  - tooltip.tsx
riskLevel: low
---

# UI Components Review

Notes:
- Many are Client Components (`'use client'` detected in several). Verify component-only scope and avoid server imports.
- Accessibility: Ensure proper roles/aria attributes; keyboard interactions; visible focus indicators.
- Theming: Confirm components consume theme tokens and meet WCAG AA contrast.
- Performance: Keep components small and composable; avoid unnecessary re-renders.

Recommendations:
1. Add Storybook or a visual catalog for regression testing (optional).
2. Provide unit tests for critical interactive components (dialog, dropdown, select, tabs).
