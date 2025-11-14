/**
 * Payment Intent Pre-Validator Service (T012 + T041)
 * 
 * Validates payment intents BEFORE creating orders to prevent:
 * - Orders being created with failed/insufficient payments
 * - Race conditions between order creation and payment processing
 * - Fraudulent checkouts with tampered payment amounts
 * 
 * Requirements:
 * - FR-003: Pre-validate payment intent before order creation
 * - Must verify: amount matches, status is valid, belongs to correct store
 * - Must handle Stripe payment intents (extensible for other providers)
 * 
 * T041 Enhancements:
 * - Idempotency key handling (prevent duplicate validations)
 * - Exponential backoff retry for transient errors
 * - 30-second timeout handling for provider API calls
 * - Provider outage resilience
 */

import { db } from '@/lib/db';
import { PaymentError, ValidationError } from '@/lib/errors';

/**
 * Configuration for retry logic
 */
const RETRY_CONFIG = {
  maxAttempts: 3,           // Retry up to 3 times
  baseDelayMs: 100,         // Start with 100ms delay
  maxDelayMs: 5000,         // Cap at 5 seconds
  timeoutMs: 30000,         // 30-second timeout per attempt
} as const;

/**
 * Transient error patterns (safe to retry)
 */
const TRANSIENT_ERROR_PATTERNS = [
  /timeout/i,
  /ETIMEDOUT/i,
  /ECONNRESET/i,
  /ENOTFOUND/i,
  /rate_limit/i,
  /temporarily unavailable/i,
  /503/,
  /502/,
  /504/,
] as const;

/**
 * In-memory cache for idempotency keys (TTL: 24 hours)
 * 
 * In production, replace with Redis or database-backed cache
 * Key format: "payment-validation:{idempotencyKey}"
 */
interface CachedValidation {
  result: PaymentIntentValidation;
  timestamp: number;
}

const idempotencyCache = new Map<string, CachedValidation>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Clean expired cache entries (called periodically)
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, value] of idempotencyCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      idempotencyCache.delete(key);
    }
  }
}

// Auto-clean cache every hour
setInterval(cleanExpiredCache, 60 * 60 * 1000);

/**
 * Check if error is transient (safe to retry)
 */
function isTransientError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return TRANSIENT_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Calculate exponential backoff delay
 * 
 * Formula: min(baseDelay * 2^attempt, maxDelay) + jitter
 */
function calculateBackoffDelay(attempt: number): number {
  const exponentialDelay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, RETRY_CONFIG.maxDelayMs);
  const jitter = Math.random() * 100; // Add 0-100ms jitter
  return cappedDelay + jitter;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute function with timeout
 * 
 * @throws Error if function exceeds timeout
 */
async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Retry function with exponential backoff
 * 
 * @param fn - Async function to retry
 * @param options - Retry configuration (defaults to RETRY_CONFIG)
 * @returns Function result
 * @throws Error if all retries exhausted
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    timeoutMs?: number;
  } = {}
): Promise<T> {
  const config = { ...RETRY_CONFIG, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      // Execute function with timeout
      return await withTimeout(
        fn,
        config.timeoutMs,
        `Payment validation timeout after ${config.timeoutMs}ms`
      );
    } catch (error) {
      lastError = error;

      // Don't retry non-transient errors
      if (!isTransientError(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === config.maxAttempts - 1) {
        break;
      }

      // Calculate backoff delay
      const delay = calculateBackoffDelay(attempt);
      
      // Log retry attempt (in production, use proper logger)
      if (process.env.NODE_ENV !== 'test') {
        console.warn(
          `[Payment Validator] Attempt ${attempt + 1}/${config.maxAttempts} failed, retrying in ${delay}ms:`,
          error instanceof Error ? error.message : error
        );
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  // All retries exhausted
  throw new PaymentError(
    `Payment validation failed after ${config.maxAttempts} attempts`,
    { originalError: lastError instanceof Error ? lastError.message : String(lastError) }
  );
}

/**
 * Payment intent validation result
 */
export interface PaymentIntentValidation {
  isValid: boolean;
  reason?: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
}

/**
 * Validate payment intent before order creation
 * 
 * T041 Enhancements:
 * - Idempotency key support (prevent duplicate validations)
 * - Retry with exponential backoff for transient errors
 * - 30-second timeout per attempt
 * 
 * @param paymentIntentId - Stripe payment intent ID
 * @param expectedAmount - Expected amount in cents (server-calculated)
 * @param storeId - Store ID for multi-tenant isolation
 * @param idempotencyKey - Optional: Idempotency key for caching (e.g., checkout session ID)
 * @returns Validation result with status and reason if invalid
 * 
 * @throws ValidationError if paymentIntentId is missing
 * @throws PaymentError if validation fails critically
 */
export async function validatePaymentIntent(
  paymentIntentId: string,
  expectedAmount: number,
  storeId: string,
  idempotencyKey?: string
): Promise<PaymentIntentValidation> {
  if (!paymentIntentId) {
    throw new ValidationError('Payment intent ID is required');
  }

  // Check idempotency cache (prevent duplicate validations)
  if (idempotencyKey) {
    const cached = idempotencyCache.get(idempotencyKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[Payment Validator] Cache hit for idempotency key: ${idempotencyKey}`);
      }
      return cached.result;
    }
  }

  // Validate with retry logic
  const result = await retryWithBackoff(async () => {
    return await performPaymentValidation(paymentIntentId, expectedAmount, storeId);
  });

  // Cache result if idempotency key provided
  if (idempotencyKey) {
    idempotencyCache.set(idempotencyKey, {
      result,
      timestamp: Date.now(),
    });
  }

  return result;
}

/**
 * Internal function: Perform actual payment validation
 * 
 * Separated for retry logic and testing
 */
async function performPaymentValidation(
  paymentIntentId: string,
  expectedAmount: number,
  storeId: string
): Promise<PaymentIntentValidation> {
    // TODO: Integrate with actual Stripe SDK
    // For now, check database payment records
    // In production, this should call Stripe API:
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Look up payment intent in database (temporary implementation)
    const existingPayment = await db.payment.findFirst({
      where: {
        gatewayPaymentId: paymentIntentId,
        order: {
          storeId, // Multi-tenant isolation
        },
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        orderId: true,
      },
    });

    // If payment already exists and is completed, prevent duplicate order creation
    if (existingPayment) {
      if (existingPayment.status === 'PAID') {
        return {
          isValid: false,
          reason: 'Payment intent already used for a completed order',
          paymentIntentId,
          amount: Number(existingPayment.amount),
          currency: existingPayment.currency,
          status: existingPayment.status,
        };
      }

      if (existingPayment.status === 'REFUNDED' || existingPayment.status === 'DISPUTED') {
        return {
          isValid: false,
          reason: `Payment intent has status: ${existingPayment.status}`,
          paymentIntentId,
          amount: Number(existingPayment.amount),
          currency: existingPayment.currency,
          status: existingPayment.status,
        };
      }
    }

    // TODO: Replace with actual Stripe API validation
    // Mock validation for development
    // In production, verify:
    // 1. Payment intent exists in Stripe
    // 2. Status is 'requires_confirmation' or 'succeeded'
    // 3. Amount matches expected amount
    // 4. Currency matches store currency
    // 5. Payment method is attached

    // For now, validate payment intent ID format (Stripe format: pi_*)
    if (!paymentIntentId.startsWith('pi_')) {
      return {
        isValid: false,
        reason: 'Invalid payment intent ID format',
        paymentIntentId,
        amount: expectedAmount,
        currency: 'usd',
        status: 'invalid',
      };
    }

    // Mock: Assume payment intent is valid if not found in DB yet
    // In production, this would be a Stripe API call
    return {
      isValid: true,
      paymentIntentId,
      amount: expectedAmount,
      currency: 'usd',
      status: 'requires_confirmation',
    };
}

/**
 * Verify payment intent amount matches server-calculated total
 * 
 * Prevents tampering where client submits payment intent with lower amount
 * than actual order total.
 * 
 * @param _paymentIntentId - Stripe payment intent ID (unused in mock)
 * @param _expectedAmount - Server-calculated order total in cents (unused in mock)
 * @returns True if amounts match within 1 cent tolerance
 */
export async function verifyPaymentIntentAmount(
  _paymentIntentId: string,
  _expectedAmount: number
): Promise<boolean> {
  // TODO: Implement Stripe API call to retrieve payment intent amount
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  // const actualAmount = intent.amount;

  // For now, return true (mock implementation)
  // In production, compare with 1 cent tolerance to account for rounding
  // return Math.abs(actualAmount - expectedAmount) <= 1;

  return true;
}

/**
 * Check if payment intent belongs to the specified store
 * 
 * Multi-tenant isolation: Prevent using payment intents from other stores
 * 
 * @param paymentIntentId - Stripe payment intent ID
 * @param storeId - Expected store ID
 * @returns True if payment intent belongs to store
 */
export async function verifyPaymentIntentStore(
  paymentIntentId: string,
  storeId: string
): Promise<boolean> {
  // TODO: Implement Stripe metadata check
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  // return intent.metadata.storeId === storeId;

  // For now, check database payment records
  const payment = await db.payment.findFirst({
    where: {
      gatewayPaymentId: paymentIntentId,
      order: {
        storeId,
      },
    },
    select: { id: true },
  });

  return !!payment;
}

/**
 * Get valid payment statuses for checkout
 * 
 * @returns Array of payment statuses that allow order creation
 */
export function getValidCheckoutStatuses(): string[] {
  return [
    'PENDING',     // Payment initiated
    'AUTHORIZED',  // Payment authorized (not captured)
    // Note: 'PAID' is excluded - if payment is already PAID, order likely exists
  ];
}

/**
 * Clear idempotency cache (for testing)
 * 
 * @internal
 */
export function clearIdempotencyCache(): void {
  idempotencyCache.clear();
}

/**
 * Get idempotency cache size (for testing)
 * 
 * @internal
 */
export function getIdempotencyCacheSize(): number {
  return idempotencyCache.size;
}
