### Phase Structure Overview
P0 Verification Baseline
P1 Security & Isolation Core (Checkout + Storefront Tenancy)
P2 Transaction & Data Integrity Expansion
P3 Error Handling & Response Standardization
P4 Schema & Migration Alignment
P5 Caching & Performance Foundations
P6 Newsletter Engagement Feature Delivery
P7 Testing Coverage Uplift & Tooling
P8 Documentation, Observability & Final Audit

### Phase Details

Phase 0: Verification Baseline
Deliverables: Current metrics snapshot (coverage, Lighthouse, Axe), inventory of hardcoded storeIds, pricing tamper test script.
Risks: Hidden edge cases. Mitigation: grep + dynamic runtime assertion tests.
Exit Criteria: Inventory complete; baseline reports stored.

Phase 1: Security & Isolation Core
Actions: Implement server-side price recalculation service, auth enforcement in checkout route/server action, domain-based store resolver (lib/store/resolve-store.ts), remove hardcoded storeIds, adjust proxy.ts to enforce tenancy for storefront paths. Remove DEFAULT_STORE_ID fallback; introduce Suspense + skeleton components for dashboard lists; ensure unauthenticated redirect.
Testing: E2E checkout tamper test; unit tests store resolver; integration test unauthorized checkout.
Exit: Tamper attempt corrected; unauthorized blocked; no hardcoded storeIds left.

Phase 2: Transaction & Data Integrity
Actions: Introduce transaction wrapper (services/transaction.ts), refactor checkout to single transaction, include inventory adjustments & discount usage. Add payment validation adapter (services/payments/intent-validator.ts).
Testing: Integration rollback tests (forced failure at payment validation), inventory consistency assertions.
Exit: All writes atomic; rollback verified.

Phase 3: Error Handling Standardization
Actions: Create src/lib/errors.ts (BaseError subclasses: ValidationError, AuthError, NotFoundError, ConflictError, RateLimitError, InternalError); refactor API route handlers & services to throw typed errors; implement mapper (lib/error-response.ts). Introduce API middleware (auth, rate limit, validation, logging, requestId header) and migrate routes away from string matching.
Testing: Unit map tests, integration endpoint error shape tests.
Exit: 100% of modified endpoints conform; legacy string matching removed.

Phase 4: Schema & Migration Alignment
Actions: Identify inconsistent fields (e.g., images stored as CSV vs string[]), add missing deletedAt, plan JSON column migrations (PostgreSQL only) backlog entry, run `prisma migrate dev` with descriptive names, update validation schemas.
Testing: Migration test script (seed pre-migration, run, verify shape), unit validators.
Exit: Schema consistent; migrations applied; green type-check.

Phase 5: Caching & Performance Foundations
Actions: Define cache tag registry (lib/cache/tags.ts), implement tag usage in product/category/page fetch services, call revalidateTag(tag,"max") on mutations, document enabling Cache Components; add minimal metrics logging. Add storefront unstable_cache wrappers for featured products & category tree with tag-based revalidation; instrument analytics data aggregation caching.
Testing: Integration mutation triggers tag invalidation; manual build check; Lighthouse unaffected.
Exit: Tags operational; invalidations logged; docs updated.

Phase 6: Newsletter Engagement
Actions: Implement Server Action (app/(storefront)/newsletter/actions.ts) with Zod schema, consent record creation, audit log entry, rate limiting integration, optimistic UI state. Implement GDPR cookie consent banner linked to ConsentRecord model & DNT respect.
Testing: Unit validation tests, integration duplication prevention, E2E subscription path.
Exit: Newsletter functional; consent & audit rows created; E2E passes.

Phase 7: Testing Coverage Uplift & Tooling
Actions: Add missing unit tests (transactions, payment validator, error mapper, cache tags), add E2E isolation attempts, ensure coverage >= targets, integrate coverage threshold gating in CI.
Testing: Automated via Vitest + Playwright; coverage report.
Exit: Coverage thresholds met; CI gating green.

Phase 8: Documentation & Final Audit
Actions: Update design-system.md (error classes, cache tags), testing-strategy.md (new suites), CHANGELOG.md entries, generate final audit report, risk register updates.
Testing: Review checklists; grep verification; accessibility scan.
Exit: Final report stored; all acceptance criteria satisfied.

### Architectural Decisions
- Use Server Actions where form-based (checkout optional; ensure auth & price recalculation in server boundary).
- Maintain services layer segregation (pure business logic). Keep transaction wrapper isolated.
- Error classes centralize codes; enumerated codes exported.
- Cache tags minimal first iteration; avoid premature complexity.
 - API middleware centralizes cross-cutting concerns (auth, rate limiting, validation, logging, requestId) for consistency and observability.

### Testing Strategy (Detailed)
- Use fixtures under tests/fixtures for deterministic product/discount/inventory states.
- Payment validator stub with scenario variants (valid/invalid/expired).
- Timeout & rate limit tests using synthetic fast repeated calls.
- Accessibility check integrated into E2E for checkout & newsletter forms.

### Performance Strategy
- Monitor query times via instrumentation logs (only around new transaction boundary).
- Ensure product fetch selects minimal fields.
- Avoid client component sprawl; keep newsletter form minimal client footprint.
 - Use dynamic import + Suspense for heavy analytics chart components; server-side aggregation with lean datasets and cache tags to reduce recalculation.

### Risk Matrix (Expanded)
| Risk | Phase | Impact | Likelihood | Mitigation |
|------|-------|--------|------------|------------|
| Deadlocks | P2 | High | Low | Short-living transactions, index usage review |
| Migration Data Loss | P4 | High | Medium | Backup + dry-run + verification script |
| Cache Incorrectness | P5 | Medium | Medium | Observability logging, staged rollout |
| Test Flakiness | P7 | Medium | Medium | Deterministic fixtures, retry budget |
| Performance Regress | Any | High | Medium | Lighthouse & k6 gate before merge |

### Phase Dependencies
- P2 depends on secure base from P1.
- P3 waits for transaction shapes from P2.
- P4 independent but safer post-P2.
- P5 builds on product/category service stability from earlier phases.
- P6 newsletter can start after tenancy (P1) to ensure correct storeId.

### Exit Review Checklist (Global)
- All acceptance criteria mapped to test IDs.
- Coverage thresholds enforced.
- No hardcoded storeId.
- Error codes documented.
- Cache tags listed & referenced.
