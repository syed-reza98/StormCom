# Webhook Standards & Implementation Guide

## Overview

This document defines the webhook security and reliability standards for StormCom's multi-tenant e-commerce platform. All webhook implementations MUST follow these patterns to ensure secure, reliable event delivery across tenant boundaries.

**Functional Requirements:**
- **FR-10X**: HMAC-SHA256 signature verification with timing-safe comparison
- **FR-10Y**: Redis-based idempotency with 24h TTL and atomic operations
- **FR-10Z**: Sequence number validation with gap detection and state machine transitions

**Success Criteria:**
- **SC-026**: Webhook delivery 99.9% reliability with automatic retry
- **SC-033**: Audit log captures all state changes with timestamp, user, tenant context

---

## Table of Contents

1. [Signature Verification (FR-10X)](#signature-verification-fr-10x)
2. [Idempotency (FR-10Y)](#idempotency-fr-10y)
3. [Event Ordering (FR-10Z)](#event-ordering-fr-10z)
4. [Webhook Payload Structure](#webhook-payload-structure)
5. [Error Handling & Retry Logic](#error-handling--retry-logic)
6. [Rate Limiting Exemptions](#rate-limiting-exemptions)
7. [Testing Strategies](#testing-strategies)
8. [Monitoring & Alerting](#monitoring--alerting)

---

## Signature Verification (FR-10X)

### Overview

All webhook payloads MUST include an HMAC-SHA256 signature in the `X-Webhook-Signature` header. This prevents tampering and ensures authenticity.

### Implementation

#### Server-Side: Signature Generation

```typescript
// src/lib/webhook/signature.ts
import crypto from 'crypto';

export interface WebhookSignatureConfig {
  secret: string;
  algorithm: 'sha256' | 'sha512';
}

/**
 * Generates HMAC signature for webhook payload
 * @param payload - JSON stringified webhook payload
 * @param secret - Webhook secret from store settings
 * @param algorithm - HMAC algorithm (default: sha256)
 * @returns Hex-encoded signature
 */
export function generateWebhookSignature(
  payload: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): string {
  return crypto
    .createHmac(algorithm, secret)
    .update(payload, 'utf8')
    .digest('hex');
}

/**
 * Verifies webhook signature using timing-safe comparison
 * @param payload - JSON stringified webhook payload
 * @param receivedSignature - Signature from X-Webhook-Signature header
 * @param secret - Webhook secret from store settings
 * @param algorithm - HMAC algorithm (default: sha256)
 * @returns True if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  receivedSignature: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret, algorithm);
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    const receivedBuffer = Buffer.from(receivedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    // Ensure both buffers are same length to prevent timing leaks
    if (receivedBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
  } catch (error) {
    // Invalid signature format
    return false;
  }
}
```

#### Client-Side: Signature Validation (Receiving Webhooks)

```typescript
// src/app/api/webhooks/[storeId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/webhook/signature';
import { getStoreWebhookSecret } from '@/services/store-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    // 1. Extract signature from header
    const receivedSignature = request.headers.get('X-Webhook-Signature');
    if (!receivedSignature) {
      return NextResponse.json(
        { error: { code: 'MISSING_SIGNATURE', message: 'Webhook signature required' } },
        { status: 401 }
      );
    }

    // 2. Get raw body (IMPORTANT: Do NOT parse JSON yet)
    const rawBody = await request.text();
    
    // 3. Fetch webhook secret for this store
    const store = await getStoreWebhookSecret(params.storeId);
    if (!store?.webhookSecret) {
      return NextResponse.json(
        { error: { code: 'WEBHOOK_NOT_CONFIGURED', message: 'Webhook secret not found' } },
        { status: 400 }
      );
    }

    // 4. Verify signature using timing-safe comparison
    const isValid = verifyWebhookSignature(
      rawBody,
      receivedSignature,
      store.webhookSecret
    );
    
    if (!isValid) {
      return NextResponse.json(
        { error: { code: 'INVALID_SIGNATURE', message: 'Webhook signature verification failed' } },
        { status: 401 }
      );
    }

    // 5. NOW parse the JSON payload
    const payload = JSON.parse(rawBody);
    
    // 6. Process webhook event
    await processWebhookEvent(params.storeId, payload);
    
    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error('[WEBHOOK_ERROR]', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to process webhook' } },
      { status: 500 }
    );
  }
}
```

### Security Considerations

1. **Timing-Safe Comparison**: MUST use `crypto.timingSafeEqual()` to prevent timing attacks
2. **Raw Body Verification**: MUST verify signature on raw body BEFORE parsing JSON
3. **Secret Rotation**: Support webhook secret rotation with 24h grace period for old secrets
4. **HTTPS Only**: Webhooks MUST be sent over HTTPS in production
5. **Signature Algorithm**: Default to `sha256`, support `sha512` for enhanced security

---

## Idempotency (FR-10Y)

### Overview

Webhook consumers MUST handle duplicate deliveries gracefully using idempotency keys stored in Redis with 24h TTL. This prevents duplicate processing of the same event.

### Implementation

#### Redis Idempotency Key Management

```typescript
// src/lib/webhook/idempotency.ts
import { Redis } from '@vercel/kv';

const redis = Redis.fromEnv();

const IDEMPOTENCY_TTL = 24 * 60 * 60; // 24 hours in seconds
const IDEMPOTENCY_KEY_PREFIX = 'webhook:idempotency:';

export interface IdempotencyResult {
  isProcessed: boolean;
  processedAt?: Date;
  response?: unknown;
}

/**
 * Checks if webhook event has already been processed
 * @param storeId - Tenant identifier
 * @param eventId - Unique event identifier
 * @returns Idempotency result with processing status
 */
export async function checkIdempotency(
  storeId: string,
  eventId: string
): Promise<IdempotencyResult> {
  const key = `${IDEMPOTENCY_KEY_PREFIX}${storeId}:${eventId}`;
  
  try {
    const cached = await redis.get(key);
    
    if (cached) {
      return {
        isProcessed: true,
        processedAt: new Date((cached as any).processedAt),
        response: (cached as any).response,
      };
    }
    
    return { isProcessed: false };
  } catch (error) {
    console.error('[IDEMPOTENCY_CHECK_ERROR]', error);
    // Fail open: allow processing if Redis is unavailable
    return { isProcessed: false };
  }
}

/**
 * Marks webhook event as processed with atomic operation
 * @param storeId - Tenant identifier
 * @param eventId - Unique event identifier
 * @param response - Response data to cache
 */
export async function markProcessed(
  storeId: string,
  eventId: string,
  response: unknown
): Promise<void> {
  const key = `${IDEMPOTENCY_KEY_PREFIX}${storeId}:${eventId}`;
  
  try {
    // Atomic set with TTL (24 hours)
    await redis.set(
      key,
      {
        processedAt: new Date().toISOString(),
        response,
      },
      {
        ex: IDEMPOTENCY_TTL, // Expire after 24 hours
      }
    );
  } catch (error) {
    console.error('[IDEMPOTENCY_MARK_ERROR]', error);
    // Non-fatal: Log error but don't block webhook processing
  }
}

/**
 * Deletes idempotency key (for testing or manual intervention)
 * @param storeId - Tenant identifier
 * @param eventId - Unique event identifier
 */
export async function clearIdempotency(
  storeId: string,
  eventId: string
): Promise<void> {
  const key = `${IDEMPOTENCY_KEY_PREFIX}${storeId}:${eventId}`;
  await redis.del(key);
}
```

#### Webhook Handler with Idempotency

```typescript
// src/app/api/webhooks/[storeId]/route.ts (enhanced)
import { checkIdempotency, markProcessed } from '@/lib/webhook/idempotency';

export async function POST(
  request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    // 1. Signature verification (as before)
    const rawBody = await request.text();
    const receivedSignature = request.headers.get('X-Webhook-Signature');
    
    if (!receivedSignature || !verifyWebhookSignature(rawBody, receivedSignature, webhookSecret)) {
      return NextResponse.json(
        { error: { code: 'INVALID_SIGNATURE', message: 'Signature verification failed' } },
        { status: 401 }
      );
    }

    // 2. Parse payload
    const payload = JSON.parse(rawBody);
    const { eventId, eventType, data } = payload;
    
    // 3. Check idempotency
    const idempotencyResult = await checkIdempotency(params.storeId, eventId);
    
    if (idempotencyResult.isProcessed) {
      console.log('[WEBHOOK_DUPLICATE]', {
        storeId: params.storeId,
        eventId,
        processedAt: idempotencyResult.processedAt,
      });
      
      // Return cached response (200 OK with same response as first processing)
      return NextResponse.json(idempotencyResult.response, { status: 200 });
    }

    // 4. Process webhook event (first time)
    const result = await processWebhookEvent(params.storeId, payload);
    
    // 5. Mark as processed with result
    await markProcessed(params.storeId, eventId, result);
    
    return NextResponse.json(result, { status: 200 });
    
  } catch (error) {
    console.error('[WEBHOOK_ERROR]', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to process webhook' } },
      { status: 500 }
    );
  }
}
```

### Idempotency Best Practices

1. **Fail Open**: If Redis is unavailable, allow processing (don't block webhooks)
2. **Atomic Operations**: Use Redis `SET` with `EX` (expiry) in single operation
3. **Cache Response**: Store actual response to return same result for duplicates
4. **24h TTL**: Balance between memory usage and protection against late retries
5. **Tenant Isolation**: Include `storeId` in Redis key to prevent cross-tenant collisions

---

## Event Ordering (FR-10Z)

### Overview

Webhook events include sequence numbers to detect out-of-order delivery or missing events. Consumers MUST validate sequence numbers and handle gaps appropriately.

### Implementation

#### Sequence Number Validation

```typescript
// src/lib/webhook/sequence.ts
import { Redis } from '@vercel/kv';

const redis = Redis.fromEnv();

const SEQUENCE_KEY_PREFIX = 'webhook:sequence:';
const SEQUENCE_TTL = 30 * 24 * 60 * 60; // 30 days

export interface SequenceValidationResult {
  isValid: boolean;
  expectedSequence: number;
  receivedSequence: number;
  gap?: number; // Positive if events missing, negative if duplicate/out-of-order
}

/**
 * Validates webhook event sequence number
 * @param storeId - Tenant identifier
 * @param entityType - Entity type (order, product, customer)
 * @param entityId - Entity identifier
 * @param receivedSequence - Sequence number from webhook payload
 * @returns Validation result with gap detection
 */
export async function validateSequence(
  storeId: string,
  entityType: string,
  entityId: string,
  receivedSequence: number
): Promise<SequenceValidationResult> {
  const key = `${SEQUENCE_KEY_PREFIX}${storeId}:${entityType}:${entityId}`;
  
  try {
    // Get last processed sequence number
    const lastSequence = await redis.get(key);
    const expectedSequence = lastSequence ? (lastSequence as number) + 1 : 1;
    
    const gap = receivedSequence - expectedSequence;
    
    return {
      isValid: gap === 0, // Valid if no gap
      expectedSequence,
      receivedSequence,
      gap: gap !== 0 ? gap : undefined,
    };
  } catch (error) {
    console.error('[SEQUENCE_VALIDATION_ERROR]', error);
    // Fail open: allow processing if Redis is unavailable
    return {
      isValid: true,
      expectedSequence: receivedSequence,
      receivedSequence,
    };
  }
}

/**
 * Updates last processed sequence number
 * @param storeId - Tenant identifier
 * @param entityType - Entity type
 * @param entityId - Entity identifier
 * @param sequence - Sequence number to store
 */
export async function updateSequence(
  storeId: string,
  entityType: string,
  entityId: string,
  sequence: number
): Promise<void> {
  const key = `${SEQUENCE_KEY_PREFIX}${storeId}:${entityType}:${entityId}`;
  
  try {
    await redis.set(key, sequence, { ex: SEQUENCE_TTL });
  } catch (error) {
    console.error('[SEQUENCE_UPDATE_ERROR]', error);
    // Non-fatal: Log error but don't block webhook processing
  }
}
```

#### State Machine Validation

```typescript
// src/lib/webhook/state-machine.ts

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export const ORDER_STATE_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'refunded'],
  shipped: ['delivered'],
  delivered: ['refunded'],
  cancelled: [], // Terminal state
  refunded: [], // Terminal state
};

export interface StateTransitionResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates state machine transition for order status
 * @param currentStatus - Current order status from database
 * @param newStatus - New status from webhook event
 * @returns Validation result
 */
export function validateOrderStateTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): StateTransitionResult {
  // Allow idempotent same-state transitions
  if (currentStatus === newStatus) {
    return { isValid: true };
  }
  
  const allowedTransitions = ORDER_STATE_TRANSITIONS[currentStatus];
  
  if (!allowedTransitions.includes(newStatus)) {
    return {
      isValid: false,
      error: `Invalid transition: ${currentStatus} → ${newStatus}. Allowed: [${allowedTransitions.join(', ')}]`,
    };
  }
  
  return { isValid: true };
}
```

#### Webhook Handler with Sequence Validation

```typescript
// src/app/api/webhooks/[storeId]/route.ts (enhanced with sequence validation)
import { validateSequence, updateSequence } from '@/lib/webhook/sequence';
import { validateOrderStateTransition } from '@/lib/webhook/state-machine';

async function processWebhookEvent(storeId: string, payload: any) {
  const { eventId, eventType, sequence, data } = payload;
  
  // 1. Validate sequence number
  const sequenceResult = await validateSequence(
    storeId,
    data.entityType,
    data.entityId,
    sequence
  );
  
  if (!sequenceResult.isValid) {
    if (sequenceResult.gap && sequenceResult.gap > 0) {
      // Missing events detected
      console.error('[WEBHOOK_SEQUENCE_GAP]', {
        storeId,
        entityType: data.entityType,
        entityId: data.entityId,
        expected: sequenceResult.expectedSequence,
        received: sequenceResult.receivedSequence,
        gap: sequenceResult.gap,
      });
      
      // Alert monitoring system about missing events
      await alertMissingEvents(storeId, data.entityType, data.entityId, sequenceResult.gap);
      
      // Continue processing but flag for manual review
    } else if (sequenceResult.gap && sequenceResult.gap < 0) {
      // Out-of-order or duplicate event
      console.warn('[WEBHOOK_OUT_OF_ORDER]', {
        storeId,
        entityType: data.entityType,
        entityId: data.entityId,
        expected: sequenceResult.expectedSequence,
        received: sequenceResult.receivedSequence,
      });
      
      // Skip processing old events
      return { success: true, skipped: true, reason: 'out_of_order' };
    }
  }
  
  // 2. Validate state machine transition (for order events)
  if (data.entityType === 'order' && eventType === 'order.status_changed') {
    const currentOrder = await prisma.order.findUnique({
      where: { id: data.entityId, storeId },
      select: { status: true },
    });
    
    if (currentOrder) {
      const stateResult = validateOrderStateTransition(
        currentOrder.status as OrderStatus,
        data.newStatus as OrderStatus
      );
      
      if (!stateResult.isValid) {
        console.error('[WEBHOOK_INVALID_TRANSITION]', {
          storeId,
          orderId: data.entityId,
          error: stateResult.error,
        });
        
        return {
          success: false,
          error: {
            code: 'INVALID_STATE_TRANSITION',
            message: stateResult.error,
          },
        };
      }
    }
  }
  
  // 3. Process event
  await processEventByType(storeId, eventType, data);
  
  // 4. Update sequence number
  await updateSequence(storeId, data.entityType, data.entityId, sequence);
  
  return { success: true };
}
```

### Sequence Number Best Practices

1. **Per-Entity Sequences**: Track sequences per entity (order, product, customer), not globally
2. **Gap Detection**: Alert when gaps > 5 events (may indicate network issues)
3. **Out-of-Order Handling**: Skip processing events with sequence < last processed
4. **State Machine Validation**: Enforce valid transitions to prevent data corruption
5. **Monitoring**: Track sequence gaps and out-of-order events in metrics

---

## Webhook Payload Structure

### Standard Payload Format

```typescript
export interface WebhookPayload {
  eventId: string; // UUID v4 (for idempotency)
  eventType: string; // e.g., 'order.created', 'product.updated'
  sequence: number; // Monotonically increasing per entity
  timestamp: string; // ISO 8601 format
  storeId: string; // Tenant identifier
  data: {
    entityType: 'order' | 'product' | 'customer' | 'category';
    entityId: string; // Entity UUID
    [key: string]: any; // Event-specific data
  };
}
```

### Example Payloads

#### Order Status Change

```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "order.status_changed",
  "sequence": 42,
  "timestamp": "2025-01-20T14:30:00.000Z",
  "storeId": "store_abc123",
  "data": {
    "entityType": "order",
    "entityId": "order_xyz789",
    "oldStatus": "pending",
    "newStatus": "paid",
    "payment": {
      "method": "stripe",
      "transactionId": "pi_1234567890",
      "amount": 12999,
      "currency": "USD"
    }
  }
}
```

#### Product Inventory Update

```json
{
  "eventId": "660e8400-e29b-41d4-a716-446655440001",
  "eventType": "product.inventory_updated",
  "sequence": 15,
  "timestamp": "2025-01-20T14:35:00.000Z",
  "storeId": "store_abc123",
  "data": {
    "entityType": "product",
    "entityId": "prod_abc456",
    "sku": "SHIRT-BLU-M",
    "oldQuantity": 50,
    "newQuantity": 48,
    "reason": "order_placed"
  }
}
```

---

## Error Handling & Retry Logic

### HTTP Status Codes

Webhook consumers SHOULD return appropriate HTTP status codes to indicate processing status:

| Status | Meaning | Retry Behavior |
|--------|---------|----------------|
| 200 OK | Successfully processed | No retry |
| 201 Created | Resource created | No retry |
| 202 Accepted | Queued for async processing | No retry |
| 400 Bad Request | Invalid payload | No retry (permanent error) |
| 401 Unauthorized | Invalid signature | No retry (permanent error) |
| 409 Conflict | Duplicate/idempotency | No retry |
| 429 Too Many Requests | Rate limited | Retry after delay |
| 500 Internal Server Error | Temporary failure | Retry with backoff |
| 503 Service Unavailable | Service down | Retry with backoff |

### Retry Strategy

```typescript
// src/lib/webhook/retry.ts

export interface RetryConfig {
  maxAttempts: number; // Default: 5
  initialDelay: number; // Default: 1000ms
  maxDelay: number; // Default: 60000ms (1 minute)
  backoffMultiplier: number; // Default: 2 (exponential backoff)
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 60000,
  backoffMultiplier: 2,
};

/**
 * Calculates delay before next retry attempt
 * @param attempt - Current attempt number (1-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

/**
 * Determines if error is retryable
 * @param statusCode - HTTP status code
 * @returns True if error should trigger retry
 */
export function isRetryableError(statusCode: number): boolean {
  return statusCode === 429 || statusCode >= 500;
}

/**
 * Sends webhook with automatic retry logic
 * @param url - Webhook endpoint URL
 * @param payload - Webhook payload
 * @param signature - HMAC signature
 * @param config - Retry configuration
 */
export async function sendWebhookWithRetry(
  url: string,
  payload: WebhookPayload,
  signature: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<void> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Attempt': attempt.toString(),
        },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        console.log('[WEBHOOK_SUCCESS]', {
          url,
          eventId: payload.eventId,
          attempt,
        });
        return; // Success!
      }
      
      if (!isRetryableError(response.status)) {
        throw new Error(`Permanent error: ${response.status} ${response.statusText}`);
      }
      
      // Retryable error
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      
      if (attempt < config.maxAttempts) {
        const delay = calculateRetryDelay(attempt, config);
        console.warn('[WEBHOOK_RETRY]', {
          url,
          eventId: payload.eventId,
          attempt,
          nextRetryIn: delay,
          error: lastError.message,
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < config.maxAttempts) {
        const delay = calculateRetryDelay(attempt, config);
        console.warn('[WEBHOOK_RETRY]', {
          url,
          eventId: payload.eventId,
          attempt,
          nextRetryIn: delay,
          error: lastError.message,
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries exhausted
  console.error('[WEBHOOK_FAILED]', {
    url,
    eventId: payload.eventId,
    attempts: config.maxAttempts,
    error: lastError?.message,
  });
  
  throw new Error(`Webhook delivery failed after ${config.maxAttempts} attempts: ${lastError?.message}`);
}
```

### Dead Letter Queue (DLQ)

Failed webhooks after all retries SHOULD be stored in a Dead Letter Queue for manual review:

```typescript
// src/lib/webhook/dlq.ts
import { prisma } from '@/lib/prisma';

export async function addToDeadLetterQueue(
  storeId: string,
  payload: WebhookPayload,
  error: string
): Promise<void> {
  await prisma.webhookDeadLetter.create({
    data: {
      storeId,
      eventId: payload.eventId,
      eventType: payload.eventType,
      payload: JSON.stringify(payload),
      error,
      attempts: 5, // Max attempts reached
      createdAt: new Date(),
    },
  });
  
  // Alert admin via email/Slack
  await alertWebhookFailure(storeId, payload.eventId, error);
}
```

---

## Rate Limiting Exemptions

### Webhook Endpoint Exemption

Webhook endpoints MUST be exempt from standard rate limiting to prevent legitimate traffic from being blocked:

```typescript
// src/middleware.ts (Next.js middleware)
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Exempt webhook endpoints from rate limiting
  if (pathname.startsWith('/api/webhooks/')) {
    // Proceed without rate limit check
    return NextResponse.next();
  }
  
  // Apply rate limiting to other API routes
  return rateLimitMiddleware(request);
}
```

### Webhook-Specific Rate Limiting

Apply separate, more generous rate limits for webhook endpoints:

```typescript
// src/lib/webhook/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@vercel/kv';

const redis = Redis.fromEnv();

// 1000 requests per minute per store (vs 100/min for standard API)
const webhookRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '1 m'),
  prefix: 'webhook:ratelimit',
});

export async function checkWebhookRateLimit(storeId: string): Promise<boolean> {
  const { success } = await webhookRateLimit.limit(storeId);
  return success;
}
```

---

## Testing Strategies

### Unit Tests: Signature Verification

```typescript
// src/lib/webhook/__tests__/signature.test.ts
import { describe, it, expect } from 'vitest';
import { generateWebhookSignature, verifyWebhookSignature } from '../signature';

describe('Webhook Signature', () => {
  const secret = 'test_secret_key_abc123';
  const payload = JSON.stringify({ eventId: '123', eventType: 'test.event' });

  it('should generate valid HMAC-SHA256 signature', () => {
    const signature = generateWebhookSignature(payload, secret);
    expect(signature).toBeTruthy();
    expect(signature).toMatch(/^[a-f0-9]{64}$/); // 64 hex chars for SHA256
  });

  it('should verify valid signature', () => {
    const signature = generateWebhookSignature(payload, secret);
    const isValid = verifyWebhookSignature(payload, signature, secret);
    expect(isValid).toBe(true);
  });

  it('should reject invalid signature', () => {
    const isValid = verifyWebhookSignature(payload, 'invalid_signature', secret);
    expect(isValid).toBe(false);
  });

  it('should reject tampered payload', () => {
    const signature = generateWebhookSignature(payload, secret);
    const tamperedPayload = payload.replace('test.event', 'hacked.event');
    const isValid = verifyWebhookSignature(tamperedPayload, signature, secret);
    expect(isValid).toBe(false);
  });

  it('should use timing-safe comparison', () => {
    // Test that similar signatures don't leak timing information
    const signature1 = generateWebhookSignature(payload, secret);
    const signature2 = 'a'.repeat(64); // Same length, different content
    
    const start1 = Date.now();
    verifyWebhookSignature(payload, signature1, secret);
    const duration1 = Date.now() - start1;
    
    const start2 = Date.now();
    verifyWebhookSignature(payload, signature2, secret);
    const duration2 = Date.now() - start2;
    
    // Timing should be similar (within 5ms tolerance)
    expect(Math.abs(duration1 - duration2)).toBeLessThan(5);
  });
});
```

### Integration Tests: Idempotency

```typescript
// src/lib/webhook/__tests__/idempotency.integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { checkIdempotency, markProcessed, clearIdempotency } from '../idempotency';

describe('Webhook Idempotency (Integration)', () => {
  const storeId = 'test_store_123';
  const eventId = 'event_abc456';

  afterEach(async () => {
    // Clean up Redis keys
    await clearIdempotency(storeId, eventId);
  });

  it('should detect first-time event', async () => {
    const result = await checkIdempotency(storeId, eventId);
    expect(result.isProcessed).toBe(false);
  });

  it('should detect duplicate event', async () => {
    const response = { success: true, orderId: 'order_123' };
    
    // First processing
    await markProcessed(storeId, eventId, response);
    
    // Second attempt (duplicate)
    const result = await checkIdempotency(storeId, eventId);
    expect(result.isProcessed).toBe(true);
    expect(result.response).toEqual(response);
    expect(result.processedAt).toBeTruthy();
  });

  it('should expire idempotency key after TTL', async () => {
    // This test requires mocking Redis TTL or waiting 24 hours
    // In practice, use integration test with shorter TTL for testing
  });
});
```

### E2E Tests: Webhook Flow

```typescript
// tests/e2e/webhooks.spec.ts
import { test, expect } from '@playwright/test';
import { generateWebhookSignature } from '@/lib/webhook/signature';

test.describe('Webhook Processing', () => {
  test('should process valid webhook with signature', async ({ request }) => {
    const payload = {
      eventId: '550e8400-e29b-41d4-a716-446655440000',
      eventType: 'order.created',
      sequence: 1,
      timestamp: new Date().toISOString(),
      storeId: 'store_test',
      data: {
        entityType: 'order',
        entityId: 'order_test_123',
        total: 12999,
      },
    };
    
    const payloadString = JSON.stringify(payload);
    const signature = generateWebhookSignature(payloadString, process.env.WEBHOOK_SECRET!);
    
    const response = await request.post('/api/webhooks/store_test', {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
      },
      data: payloadString,
    });
    
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('should reject webhook with invalid signature', async ({ request }) => {
    const payload = {
      eventId: '550e8400-e29b-41d4-a716-446655440001',
      eventType: 'order.created',
      storeId: 'store_test',
      data: { entityType: 'order', entityId: 'order_test_456' },
    };
    
    const response = await request.post('/api/webhooks/store_test', {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': 'invalid_signature_12345',
      },
      data: JSON.stringify(payload),
    });
    
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe('INVALID_SIGNATURE');
  });

  test('should handle duplicate webhook (idempotency)', async ({ request }) => {
    const payload = {
      eventId: 'duplicate_event_123',
      eventType: 'order.created',
      sequence: 1,
      timestamp: new Date().toISOString(),
      storeId: 'store_test',
      data: { entityType: 'order', entityId: 'order_dup_789' },
    };
    
    const payloadString = JSON.stringify(payload);
    const signature = generateWebhookSignature(payloadString, process.env.WEBHOOK_SECRET!);
    
    // First request
    const response1 = await request.post('/api/webhooks/store_test', {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
      },
      data: payloadString,
    });
    expect(response1.status()).toBe(200);
    
    // Duplicate request (same eventId)
    const response2 = await request.post('/api/webhooks/store_test', {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
      },
      data: payloadString,
    });
    expect(response2.status()).toBe(200);
    
    // Should return cached response
    const body1 = await response1.json();
    const body2 = await response2.json();
    expect(body1).toEqual(body2);
  });
});
```

---

## Monitoring & Alerting

### Key Metrics

Track the following webhook metrics in Vercel Analytics / Sentry:

1. **Delivery Success Rate**: % of webhooks delivered on first attempt (target: >99%)
2. **Retry Rate**: % of webhooks requiring retries (target: <5%)
3. **DLQ Rate**: % of webhooks ending in Dead Letter Queue (target: <0.1%)
4. **Signature Verification Failures**: Count of invalid signatures (alert on spike)
5. **Sequence Gaps**: Count of missing events detected (alert if >10/hour)
6. **Processing Latency**: p95/p99 webhook processing time (target: <500ms p95)

### Alerting Rules

```typescript
// src/lib/webhook/monitoring.ts

export async function alertWebhookFailure(
  storeId: string,
  eventId: string,
  error: string
): Promise<void> {
  // Send to Sentry
  Sentry.captureException(new Error(error), {
    tags: { storeId, eventId, component: 'webhook' },
    level: 'error',
  });
  
  // Send to admin dashboard
  await notifyAdmin({
    type: 'webhook_failure',
    severity: 'high',
    storeId,
    eventId,
    error,
    timestamp: new Date().toISOString(),
  });
}

export async function alertMissingEvents(
  storeId: string,
  entityType: string,
  entityId: string,
  gap: number
): Promise<void> {
  if (gap > 5) {
    await notifyAdmin({
      type: 'sequence_gap',
      severity: gap > 10 ? 'critical' : 'warning',
      storeId,
      entityType,
      entityId,
      gap,
      message: `Missing ${gap} events for ${entityType}:${entityId}`,
    });
  }
}
```

---

## Implementation Checklist

### Phase 1: Core Security (Week 1-2)
- [ ] Implement HMAC-SHA256 signature generation
- [ ] Implement timing-safe signature verification
- [ ] Add signature verification to all webhook endpoints
- [ ] Write unit tests for signature functions
- [ ] Test with invalid/tampered signatures

### Phase 2: Idempotency (Week 2-3)
- [ ] Set up Vercel KV (Redis) for production
- [ ] Implement idempotency key management
- [ ] Add idempotency checks to webhook handlers
- [ ] Write integration tests with Redis
- [ ] Test duplicate event handling

### Phase 3: Event Ordering (Week 3-4)
- [ ] Implement sequence number validation
- [ ] Add state machine validation for order statuses
- [ ] Implement gap detection and alerting
- [ ] Write unit tests for sequence validation
- [ ] Test out-of-order event handling

### Phase 4: Retry & Error Handling (Week 4-5)
- [ ] Implement exponential backoff retry logic
- [ ] Set up Dead Letter Queue (DLQ) table
- [ ] Implement DLQ processing UI for admins
- [ ] Configure rate limiting exemptions
- [ ] Write E2E tests for retry scenarios

### Phase 5: Monitoring & Production (Week 5-6)
- [ ] Set up Sentry webhook error tracking
- [ ] Configure Vercel Analytics for webhook metrics
- [ ] Implement alerting for critical failures
- [ ] Create admin dashboard for webhook health
- [ ] Load test with k6 (simulate 1000 webhooks/min)
- [ ] Deploy to staging and validate

---

## References

- **FR-10X**: Webhook signature verification (HMAC-SHA256)
- **FR-10Y**: Idempotency with Redis (24h TTL)
- **FR-10Z**: Event ordering with sequence numbers
- **SC-026**: 99.9% webhook delivery reliability
- **SC-033**: Audit log for all state changes
- **Testing Strategy**: `docs/testing-strategy.md`
- **API Contracts**: `specs/001-multi-tenant-ecommerce/contracts/openapi.yaml`

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-20  
**Owner**: StormCom Engineering Team
