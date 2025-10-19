/**
 * Idempotency Key Handler
 * Prevents duplicate payment processing on retries
 */

import prisma from '@/lib/prisma';

interface IdempotencyRecord {
  key: string;
  requestHash: string;
  response: any;
  statusCode: number;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Generate hash from request body
 */
function generateRequestHash(requestBody: any): string {
  const crypto = require('crypto');
  const bodyString = typeof requestBody === 'string' 
    ? requestBody 
    : JSON.stringify(requestBody);
  
  return crypto
    .createHash('sha256')
    .update(bodyString)
    .digest('hex');
}

/**
 * Check if request with idempotency key was already processed
 * Returns cached response if found, null otherwise
 */
export async function checkIdempotency(
  idempotencyKey: string,
  requestBody: any
): Promise<{ response: any; statusCode: number } | null> {
  try {
    // Use audit log as temporary storage for idempotency
    // In production, consider using Redis or dedicated table
    const record = await prisma.auditLog.findFirst({
      where: {
        action: 'PAYMENT_IDEMPOTENCY',
        entityId: idempotencyKey,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || !record.changes) {
      return null;
    }

    const data = JSON.parse(record.changes);
    const requestHash = generateRequestHash(requestBody);

    // Verify request body matches to prevent key collision
    if (data.requestHash !== requestHash) {
      throw new Error('Idempotency key mismatch: request body differs');
    }

    // Return cached response
    return {
      response: data.response,
      statusCode: data.statusCode || 200,
    };
  } catch (error) {
    console.error('Error checking idempotency:', error);
    return null;
  }
}

/**
 * Store idempotency record for future duplicate detection
 */
export async function storeIdempotency(
  idempotencyKey: string,
  requestBody: any,
  response: any,
  statusCode: number = 200
): Promise<void> {
  try {
    const requestHash = generateRequestHash(requestBody);

    // Store in audit log
    await prisma.auditLog.create({
      data: {
        action: 'PAYMENT_IDEMPOTENCY',
        entityType: 'Payment',
        entityId: idempotencyKey,
        changes: JSON.stringify({
          requestHash,
          response,
          statusCode,
        }),
        metadata: JSON.stringify({
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        }),
      },
    });
  } catch (error) {
    console.error('Error storing idempotency:', error);
    // Don't throw - idempotency storage failure shouldn't break the payment
  }
}

/**
 * Clean up expired idempotency records
 * Should be run periodically (e.g., daily cron job)
 */
export async function cleanupExpiredIdempotency(): Promise<number> {
  try {
    const result = await prisma.auditLog.deleteMany({
      where: {
        action: 'PAYMENT_IDEMPOTENCY',
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Older than 24 hours
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error('Error cleaning up idempotency records:', error);
    return 0;
  }
}

/**
 * Generate idempotency key
 * Use this when client doesn't provide one
 */
export function generateIdempotencyKey(prefix: string = 'idem'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Validate idempotency key format
 */
export function isValidIdempotencyKey(key: string): boolean {
  // Key should be 16-64 characters, alphanumeric with hyphens/underscores
  const pattern = /^[a-zA-Z0-9_-]{16,64}$/;
  return pattern.test(key);
}

/**
 * Extract idempotency key from request headers
 */
export function extractIdempotencyKey(headers: Headers): string | null {
  return (
    headers.get('Idempotency-Key') ||
    headers.get('X-Idempotency-Key') ||
    headers.get('idempotency-key') ||
    null
  );
}

/**
 * Middleware wrapper for idempotent API routes
 */
export async function withIdempotency<T>(
  idempotencyKey: string,
  requestBody: any,
  handler: () => Promise<{ data: T; statusCode?: number }>
): Promise<{ data: T; statusCode: number; fromCache: boolean }> {
  // Validate key
  if (!isValidIdempotencyKey(idempotencyKey)) {
    throw new Error('Invalid idempotency key format');
  }

  // Check if already processed
  const cached = await checkIdempotency(idempotencyKey, requestBody);
  if (cached) {
    return {
      data: cached.response,
      statusCode: cached.statusCode,
      fromCache: true,
    };
  }

  // Execute handler
  const result = await handler();
  const statusCode = result.statusCode || 200;

  // Store for future requests
  await storeIdempotency(idempotencyKey, requestBody, result.data, statusCode);

  return {
    data: result.data,
    statusCode,
    fromCache: false,
  };
}
