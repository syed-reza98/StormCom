# Subscription Test Fixes Required

## Problem Summary

**File**: `tests/unit/lib/stripe-subscription.test.ts` (575 lines)
**Failing Tests**: 23/23 (100%)
**Error**: "function is not defined" for all subscription functions

## Root Cause

The test file has a critical flaw:

1. **Mocks the module under test**:
```typescript
vi.mock('@/lib/stripe-subscription', async () => {
  const actual = await vi.importActual('@/lib/stripe-subscription');
  return {
    ...actual,
    createSubscriptionCheckoutSession: vi.fn(), // Mocking function we want to test!
    handleStripeWebhook: vi.fn(),
    createCustomerPortalSession: vi.fn(),
    mapStripeStatusToPrisma: vi.fn(),
  };
});
```

2. **Never imports the functions**:
```typescript
// Missing:
import { 
  createSubscriptionCheckoutSession,
  createCustomerPortalSession,
  mapStripeStatusToPrisma,
  handleStripeWebhook
} from '@/lib/stripe-subscription';
```

3. **Tries to call undefined functions**:
```typescript
const result = await createSubscriptionCheckoutSession({ // ERROR: not defined
  priceId: 'price_basic_monthly',
  storeId: 'store-123',
  customerId: 'cus_customer_id',
});
```

## Fix Strategy

### Option A: Remove Module Mock (RECOMMENDED)
**Approach**: Don't mock the module under test, only mock dependencies

```typescript
// Remove this entire block:
// vi.mock('@/lib/stripe-subscription', async () => { ... });

// Add imports:
import { 
  createSubscriptionCheckoutSession,
  createCustomerPortalSession,
  mapStripeStatusToPrisma,
  handleStripeWebhook,
  stripe // Need to mock this
} from '@/lib/stripe-subscription';

// Mock only Stripe client (dependency):
vi.mock('stripe', () => ({
  default: vi.fn(() => mockStripeClient)
}));
```

**Pros**:
- Tests actual implementation code
- Functions are properly imported and callable
- Cleaner test structure

**Cons**:
- Need to ensure Stripe client is properly mocked
- Environment variables must be set correctly

---

### Option B: Use Mocked Functions (ALTERNATIVE)
**Approach**: Import from the mocked module

```typescript
import { 
  createSubscriptionCheckoutSession,
  createCustomerPortalSession,
  mapStripeStatusToPrisma,
  handleStripeWebhook
} from '@/lib/stripe-subscription';

// These will be the mocked versions from vi.mock()
```

**Pros**:
- Simpler if we just want to test function signatures
- No need to worry about implementation details

**Cons**:
- Not testing actual implementation
- Just testing that mocks are called correctly
- Less valuable for catching real bugs

---

## Recommended Fix Steps

### Step 1: Remove Module Mock
Delete lines that mock `@/lib/stripe-subscription` module (lines ~30-55)

### Step 2: Add Function Imports
Add after line 5:
```typescript
import { 
  createSubscriptionCheckoutSession,
  createCustomerPortalSession,
  mapStripeStatusToPrisma,
  handleStripeWebhook
} from '@/lib/stripe-subscription';
```

### Step 3: Keep Only Dependency Mocks
Keep the Stripe client mock (lines ~60-80):
```typescript
vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => mockStripeClient)
}));
```

### Step 4: Fix Environment Setup
Ensure environment variables are set in beforeEach (lines ~120-127):
```typescript
beforeEach(() => {
  process.env = {
    ...originalEnv,
    STRIPE_SECRET_KEY: 'sk_test_mock_key',
    STRIPE_WEBHOOK_SECRET: 'whsec_mock_secret',
    NEXT_PUBLIC_BASE_URL: 'https://example.com',
  };
  vi.clearAllMocks();
});
```

### Step 5: Run Tests
```bash
npm test -- tests/unit/lib/stripe-subscription.test.ts
```

---

## Expected Outcome

**Before**: 23 failing tests (functions not defined)
**After**: 0-5 failing tests (potential logic bugs to fix)

Most tests should pass once functions are properly imported and Stripe client is mocked correctly.

---

## Time Estimate

- **File Analysis**: 10 minutes (DONE)
- **Apply Fixes**: 15-20 minutes
- **Test & Debug**: 10-15 minutes
- **Total**: 35-45 minutes

---

## Related Issues

If tests still fail after import fix, likely causes:
1. **Environment variable validation** in source file (check `stripe-subscription.ts` lines ~30-50)
2. **Stripe client initialization** not matching mock structure
3. **Logic bugs** in subscription functions themselves
4. **Mock data structure** doesn't match Stripe API responses

---

*Created: 2025-01-26 09:15*
*Status: READY TO FIX*
