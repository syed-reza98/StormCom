---
title: 'test: Notification Service - Add Prisma mocking and remove database dependencies'
labels: testing, technical-debt, P1-critical
---

## Context

Part of the Test Suite Improvement Roadmap to increase test pass rate from 67.7% to 95%+.

**Related**: See `docs/test-suite-improvement-roadmap.md` for full context.

## Problem

**Failing Tests**: 22 tests in `tests/unit/services/notification-service.test.ts`

**Files Affected**:
- `tests/unit/services/notification-service.test.ts`

**Root Cause**:
Tests attempt to use real Prisma client and make actual database operations instead of using mocks. This causes all tests to fail with `TypeError: Cannot read properties of undefined (reading 'id')`.

### Specific Issues

1. **Line 17-25**: Attempts real database operations
   ```typescript
   const user = await prisma.user.create({...})
   testUserId = user.id;  // ❌ user is undefined
   ```

2. **No Prisma Mocking**: Missing mock configuration
   - Prisma client not mocked
   - All CRUD operations fail
   - Test cleanup attempts also fail

3. **Test Isolation**: Tests depend on database state
   - No proper setup/teardown
   - Cascade failures if one test fails
   - Not true unit tests

## Proposed Solution

### Changes Required

1. **Add Prisma Mock Configuration**:
   ```typescript
   import { prismaMock } from '@/tests/mocks/prisma';
   
   vi.mock('@/lib/prisma', () => ({
     prisma: prismaMock,
   }));
   ```

2. **Mock Test Setup Data**:
   ```typescript
   let testUserId: string;
   let testNotificationId: string;
   
   beforeEach(() => {
     vi.clearAllMocks();
     testUserId = 'test-user-id-123';
     testNotificationId = 'test-notif-id-456';
     
     // Mock user creation
     prismaMock.user.create.mockResolvedValue({
       id: testUserId,
       email: 'notif-test@example.com',
       name: 'Notification Test User',
       role: 'CUSTOMER',
       password: 'hashed_password',
       createdAt: new Date(),
       updatedAt: new Date(),
     });
     
     // Mock notification operations
     prismaMock.notification.create.mockResolvedValue({
       id: testNotificationId,
       userId: testUserId,
       title: 'Test Notification',
       message: 'Test message',
       type: 'order_update',
       read: false,
       createdAt: new Date(),
       updatedAt: new Date(),
     });
     
     prismaMock.notification.findMany.mockResolvedValue([]);
     prismaMock.notification.count.mockResolvedValue(0);
     prismaMock.notification.update.mockResolvedValue({} as any);
     prismaMock.notification.deleteMany.mockResolvedValue({ count: 0 });
   });
   ```

3. **Remove Database Cleanup Logic**:
   ```typescript
   // Remove this:
   afterEach(async () => {
     if (testUserId) {
       await prisma.notification.deleteMany({ where: { userId: testUserId } });
       await prisma.user.delete({ where: { id: testUserId } });
     }
   });
   
   // No cleanup needed with mocks
   afterEach(() => {
     vi.clearAllMocks();
   });
   ```

4. **Update Test Assertions**:
   ```typescript
   // Verify mock calls instead of database state
   it('should create a notification successfully', async () => {
     const notification = await service.create({
       userId: testUserId,
       title: 'New Order',
       message: 'You have a new order #12345',
       type: 'order_update',
     });
     
     expect(prismaMock.notification.create).toHaveBeenCalledWith({
       data: expect.objectContaining({
         userId: testUserId,
         title: 'New Order',
         type: 'order_update',
       }),
     });
     
     expect(notification).toBeDefined();
     expect(notification.id).toBe(testNotificationId);
   });
   ```

### Expected Outcome

- [ ] All 22 tests passing
- [ ] No database dependencies
- [ ] Tests run in < 1 second
- [ ] TypeScript strict mode compliant
- [ ] Reusable Prisma mock patterns

## Implementation Checklist

### Development
- [ ] Read `docs/test-suite-improvement-roadmap.md`
- [ ] Review Prisma mocking in `tests/setup.ts`
- [ ] Set up local environment
- [ ] Run failing tests: `npm run test -- tests/unit/services/notification-service.test.ts`
- [ ] Add Prisma mock import and configuration
- [ ] Update beforeEach with proper mock setup
- [ ] Remove database cleanup from afterEach
- [ ] Update all test assertions to verify mocks
- [ ] Run `npm run type-check`
- [ ] Run `npm run lint`
- [ ] Verify all 22 tests passing

### Testing
- [ ] All 22 notification service tests passing
- [ ] No new test failures introduced
- [ ] Tests complete in < 1 second
- [ ] Tests pass consistently (run 5 times)
- [ ] No database connections

### Documentation
- [ ] Document Prisma notification mock pattern
- [ ] Create reusable mock helper (if beneficial)
- [ ] Update roadmap progress
- [ ] Add pattern to tests/README.md

### Code Review
- [ ] Self-review completed
- [ ] No functional code changes (test-only PR)
- [ ] Follows patterns from plan-enforcement.test.ts
- [ ] Proper commit messages
- [ ] PR description includes before/after test results

## Acceptance Criteria

- [ ] All 22 tests passing (was: 22 failing)
- [ ] Test suite pass rate increased by ~2%
- [ ] No regressions in other tests
- [ ] TypeScript/ESLint passing
- [ ] Reusable Prisma mock helpers created (optional)

## Test Results

### Before
```
❌ FAIL tests/unit/services/notification-service.test.ts (22 tests)
  TypeError: Cannot read properties of undefined (reading 'id')
  
Test Files  1 failed (1)
     Tests  22 failed (22)
```

### After
```
✅ PASS tests/unit/services/notification-service.test.ts (22 tests)
  
Test Files  1 passed (1)
     Tests  22 passed (22)
   Duration  0.8s
```

## Related Issues

- Part of: Test Suite Improvement Roadmap
- Similar to: #XXX (Email Service tests - also needs mock refactoring)
- Depends on: `tests/setup.ts` Prisma mock patterns

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
- `tests/setup.ts` - Base Prisma mock configuration
- `tests/unit/lib/plan-enforcement.test.ts` - Example of Prisma mock usage
- `src/services/notification-service.ts` - Implementation to understand mock needs

### Mock Setup Pattern
```typescript
// Reusable pattern for notification mocks
const mockNotification = {
  id: 'test-id',
  userId: 'test-user-id',
  title: 'Test Title',
  message: 'Test Message',
  type: 'order_update',
  read: false,
  linkUrl: null,
  linkText: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

prismaMock.notification.create.mockResolvedValue(mockNotification);
prismaMock.notification.findMany.mockResolvedValue([mockNotification]);
prismaMock.notification.findUnique.mockResolvedValue(mockNotification);
prismaMock.notification.update.mockResolvedValue(mockNotification);
```

### Testing Gotchas
- All Prisma methods must be mocked in beforeEach
- Use `vi.clearAllMocks()` not `vi.resetAllMocks()` to preserve mock functions
- Mock return values must match Prisma schema types exactly
- Count operations need both `count()` and `findMany()` mocked

### Success Metrics
- Test execution time: < 1 second (currently fails immediately)
- Pass rate contribution: +2% to overall suite
- Code coverage: Notification service should reach 85%+ coverage
