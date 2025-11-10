# Architecture Overview

This document summarizes the project structure and counts per category, based on repository scan at 2025-11-10.

Top-level categories under `src/` with file counts (approximate):
- app/: 136 files
- components/: 83 files
- lib/: 34 files
- services/: 30 files
- hooks/: 6 files
- contexts/: 1 file
- providers/: 1 file
- emails/: 4 files
- types/: 5 files

Key conventions observed:
- Next.js 16 App Router present with route groups (auth, dashboard, storefront) and extensive API routes under `src/app/api/*`.
- Server Components by default; Client Components explicitly marked with `'use client'` in select hooks, providers, and UI components.
- Multi-tenant boundaries enforced in Prisma schema (extensive storeId indexes) and mirrored in services.
- Tailwind and Radix UI used; global styles at `src/app/globals.css`.

Recommendations:
- Keep files under 300 lines and functions under 50 lines; refactor large components into smaller composables.
- Ensure App Router pages and route handlers use Next.js 16 async patterns (await params, await searchParams; cookies/headers/draftMode now async).
- Maintain 70%+ Server Components; minimize client bundle by isolating client-only interactivity.
