# Follow-Up Issues for Test Suite Improvements

This directory contains pre-drafted GitHub issues for addressing the 158 remaining test failures.

## Quick Links

- [Roadmap](../test-suite-improvement-roadmap.md) - Full implementation plan
- [Issue Template](../../.github/ISSUE_TEMPLATE/test-suite-improvement.md) - Template for new issues

## Priority 1 Issues (Critical)

### Issue 1: Email Service Test Refactoring
**File**: `email-service-tests.md`  
**Impact**: 42 tests  
**Effort**: 4-6 hours  
**Description**: Convert email service tests from integration to unit tests with proper ES module imports and mocking.

### Issue 2: Notification Service Test Infrastructure  
**File**: `notification-service-tests.md`  
**Impact**: 22 tests  
**Effort**: 3-4 hours  
**Description**: Add Prisma mocking to notification service tests, remove real database dependencies.

## Priority 2 Issues (Important)

### Issue 3: Orders API Route Tests (next-auth mocking)
**File**: `orders-api-tests.md`  
**Impact**: 15+ tests across 4 files  
**Effort**: 2-3 hours  
**Description**: Add standardized next-auth default export mocking to all orders API route tests.

### Issue 4: Analytics API Route Tests
**File**: `analytics-api-tests.md`  
**Impact**: 30+ tests  
**Effort**: 4-5 hours  
**Description**: Fix authentication mock issues and parameter validation test expectations.

## Priority 3 Issues (Quality)

### Issue 5: Audit Logs Component Tests
**File**: `audit-logs-tests.md`  
**Impact**: 8 tests  
**Effort**: 1-2 hours  
**Description**: Fix fetch spy assertion format to handle options parameter.

### Issue 6: Miscellaneous Component Tests
**File**: `misc-component-tests.md`  
**Impact**: 20+ tests  
**Effort**: 6-8 hours  
**Description**: Apply systematic fixes to remaining component test failures.

## How to Use These Issues

1. Read the roadmap document first
2. Choose an issue based on priority and your expertise
3. Copy the issue content to GitHub
4. Follow the implementation checklist
5. Submit PR referencing the issue number
6. Update roadmap with progress

## Creating New Issues

Use the template at `.github/ISSUE_TEMPLATE/test-suite-improvement.md` for consistency.

## Progress Tracking

| Issue | Status | Tests Fixed | PR | 
|-------|--------|-------------|-----|
| #1 Email Service | 📋 Not Started | 0/42 | - |
| #2 Notification Service | 📋 Not Started | 0/22 | - |
| #3 Orders API Routes | 📋 Not Started | 0/15 | - |
| #4 Analytics API Routes | 📋 Not Started | 0/30 | - |
| #5 Audit Logs | 📋 Not Started | 0/8 | - |
| #6 Misc Components | 📋 Not Started | 0/20 | - |

**Total Progress**: 0/137 tests fixed (0%)  
**Target**: 137/158 tests (87% of remaining failures)

---

**Note**: Update this file as issues are created and resolved.
