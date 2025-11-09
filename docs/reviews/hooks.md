---
title: Hooks Review
sourcePath: src/hooks
category: hooks
riskLevel: low
---

# Hooks Review

Files:
- use-analytics.tsx ('use client')
- use-auth.ts ('use client')
- use-cart.ts ('use client')
- use-notifications.ts ('use client')
- use-session.ts ('use client')
- use-toast.ts ('use client')

Notes:
- All hooks are client-side as expected; ensure they do not import server-only modules (db/prisma, fs, etc.).
- Confirm they rely on providers (SessionProvider, AuthProvider) and handle loading/error states gracefully.
- Keep hook functions < 50 lines; split into helpers if needed.
- Test: Add unit tests for core logic (e.g., cart calculations, analytics event formatting) where sensible.
