---
title: 'test: Email Service - Convert integration tests to unit tests with proper mocking'
labels: testing, technical-debt, P1-critical
---

## Context

Part of the Test Suite Improvement Roadmap to increase test pass rate from 67.7% to 95%+.

**Related**: See `docs/test-suite-improvement-roadmap.md` for full context.

## Problem

**Failing Tests**: 42 tests in `tests/unit/services/email-service.test.ts`

**Files Affected**:
- `tests/unit/services/email-service.test.ts`

**Root Cause**:
Tests use CommonJS `require()` in ES module context and attempt integration-style testing with real API calls instead of proper unit testing with mocks.

### Specific Issues

1. **Line 42**: `const { renderTemplate } = require('@/services/email-service')` 
   - Uses `require()` instead of ES module import
   - Fails in Vitest ES module environment

2. **Resend API Mocking**: Tests attempt to use real Resend API
   - Not properly mocked
   - Causes network-dependent test failures

3. **Date/Time Handling**: Tests fail due to timezone inconsistencies
   - Password reset expiration tests
   - Verification email expiration tests

4. **Template Rendering**: Tests for XSS protection and variable substitution fail
   - Module import issues prevent testing

## Proposed Solution

### Changes Required

1. **Convert to ES Module Imports**:
   ```typescript
   // Remove this:
   const { renderTemplate } = require('@/services/email-service');
   
   // Replace with:
   import { 
     renderTemplate, 
     sendEmail, 
     sendOrderConfirmation,
     sendShippingConfirmation,
     sendPasswordReset 
   } from '@/services/email-service';
   ```

2. **Add Proper Resend Mocking**:
   ```typescript
   vi.mock('resend', () => ({
     Resend: vi.fn(() => ({
       emails: {
         send: vi.fn().mockResolvedValue({ 
           id: 'test-email-id',
           from: 'noreply@stormcom.test',
           to: 'test@example.com',
         }),
       },
     })),
   }));
   ```

3. **Implement Consistent Date Mocking**:
   ```typescript
   beforeEach(() => {
     // Mock system time for consistent test results
     vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
   });
   
   afterEach(() => {
     vi.useRealTimers();
   });
   ```

4. **Refactor from Integration to Unit Tests**:
   - Test `renderTemplate()` function in isolation
   - Mock all external dependencies (Resend, database)
   - Verify function behavior, not side effects
   - Test error handling paths

### Expected Outcome

- [ ] All 42 tests passing
- [ ] No real API calls (fully mocked)
- [ ] Tests run in < 2 seconds
- [ ] TypeScript strict mode compliant
- [ ] Deterministic results (no timezone dependencies)

## Implementation Checklist

### Development
- [ ] Read `docs/test-suite-improvement-roadmap.md`
- [ ] Review ES module import patterns in passing tests
- [ ] Set up local environment
- [ ] Run failing tests: `npm run test -- tests/unit/services/email-service.test.ts`
- [ ] Convert all `require()` to ES imports
- [ ] Add proper Resend mocking at file top
- [ ] Add date/time mocking in beforeEach
- [ ] Refactor tests to be unit tests (not integration)
- [ ] Run `npm run type-check`
- [ ] Run `npm run lint`
- [ ] Verify all 42 tests passing

### Testing
- [ ] All 42 email service tests passing
- [ ] No new test failures introduced
- [ ] Tests complete in < 2 seconds
- [ ] Tests pass consistently (run 5 times)
- [ ] No real network calls

### Documentation
- [ ] Add JSDoc comments to complex test helpers
- [ ] Document Resend mocking pattern
- [ ] Update roadmap progress
- [ ] Add example to tests/README.md

### Code Review
- [ ] Self-review completed
- [ ] No functional code changes (test-only PR)
- [ ] Follows patterns from security-headers.test.ts
- [ ] Proper commit messages
- [ ] PR description includes before/after test results

## Acceptance Criteria

- [ ] All 42 tests passing (was: 42 failing)
- [ ] Test suite pass rate increased by ~4%
- [ ] No regressions in other tests
- [ ] TypeScript/ESLint passing
- [ ] Reusable Resend mock pattern documented

## Test Results

### Before
```
❌ FAIL tests/unit/services/email-service.test.ts (42 tests)
  Error: Cannot find module '@/services/email-service'
  
Test Files  1 failed (1)
     Tests  42 failed (42)
```

### After
```
✅ PASS tests/unit/services/email-service.test.ts (42 tests)
  
Test Files  1 passed (1)
     Tests  42 passed (42)
   Duration  1.8s
```

## Related Issues

- Part of: Test Suite Improvement Roadmap
- Blocks: #XXX (Notification Service tests - similar pattern)
- See also: `tests/unit/lib/security-headers.test.ts` for ES module mock example

## Priority

- [x] P1 - Critical (blocks production deployment)
- [ ] P2 - Important (blocks features)
- [ ] P3 - Nice to have (quality improvement)

## Estimated Effort

- [ ] Small (< 4 hours)
- [x] Medium (4-8 hours)
- [ ] Large (1-2 days)
- [ ] X-Large (> 2 days)

## Notes

### Key Files to Reference
- `tests/setup.ts` - ES module import patterns
- `tests/unit/lib/security-headers.test.ts` - next-auth mocking example
- `tests/unit/components/gdpr/cookie-consent.test.tsx` - date mocking example

### Testing Gotchas
- Must use `vi.setSystemTime()` not `vi.useFakeTimers()` for date mocking
- Resend mock must return proper structure with `id`, `from`, `to` fields
- Template rendering tests need actual HTML string validation

### Success Metrics
- Test execution time: < 2 seconds (currently fails to complete)
- Pass rate contribution: +4% to overall suite
- Code coverage: Email service should reach 80%+ coverage
