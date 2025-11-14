/**
 * Transaction Wrapper Helper
 * 
 * Centralizes Prisma transaction usage for atomic multi-step operations.
 * Ensures consistency for checkout: order + items + inventory + payment.
 * 
 * @module transaction
 */

import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { InternalError } from '@/lib/errors';

/**
 * Transaction options
 */
export interface TransactionOptions {
  /** Maximum time to wait for transaction (ms) */
  timeout?: number;
  /** Isolation level */
  isolationLevel?: Prisma.TransactionIsolationLevel;
}

/**
 * Default transaction timeout (10 seconds)
 */
const DEFAULT_TIMEOUT = 10000;

/**
 * Execute operations in an atomic transaction
 * 
 * All operations succeed or all fail (no partial writes).
 * Use for checkout, inventory updates, or any multi-step mutation.
 * 
 * @param callback - Async function with transaction-aware Prisma client
 * @param options - Transaction configuration
 * @returns Result from callback
 * @throws InternalError if transaction fails
 * 
 * @example
 * await withTransaction(async (tx) => {
 *   const order = await tx.order.create({ data: orderData });
 *   await tx.product.update({ 
 *     where: { id: productId },
 *     data: { inventoryQty: { decrement: quantity } }
 *   });
 *   return order;
 * });
 */
export async function withTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: TransactionOptions
): Promise<T> {
  try {
    const result = await db.$transaction(callback, {
      timeout: options?.timeout || DEFAULT_TIMEOUT,
      isolationLevel: options?.isolationLevel,
    });
    
    return result;
  } catch (error) {
    // Log transaction failure
    console.error('Transaction failed:', error);
    
    // Wrap in InternalError for consistent error handling
    throw new InternalError(
      'Transaction failed - no changes were committed',
      {
        originalError: error instanceof Error ? error.message : String(error),
      }
    );
  }
}

/**
 * Execute interactive transaction with explicit control
 * 
 * Use when you need to run conditional logic within transaction
 * or handle complex transaction flows.
 * 
 * @param callback - Transaction logic with explicit tx client
 * @param options - Transaction configuration
 * @returns Result from callback
 */
export async function interactiveTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: TransactionOptions
): Promise<T> {
  return withTransaction(callback, {
    ...options,
    // Use more conservative isolation level for interactive transactions
    isolationLevel: options?.isolationLevel || Prisma.TransactionIsolationLevel.Serializable,
  });
}

/**
 * Retry transaction on deadlock or serialization failure
 * 
 * Useful for high-concurrency scenarios (e.g., inventory updates)
 * 
 * @param callback - Transaction callback
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @param options - Transaction options
 * @returns Result from callback
 */
export async function retryableTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  maxRetries = 3,
  options?: TransactionOptions
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await withTransaction(callback, options);
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable (deadlock or serialization failure)
      const isRetryable = 
        error instanceof Error &&
        (error.message.includes('deadlock') || 
         error.message.includes('serialization failure'));
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff before retry
      const delay = Math.pow(2, attempt - 1) * 100; // 100ms, 200ms, 400ms
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.warn(`Transaction retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
    }
  }
  
  // Should never reach here, but TypeScript needs this
  throw lastError || new InternalError('Transaction failed after retries');
}

/**
 * Transaction result with metadata
 */
export interface TransactionResult<T> {
  data: T;
  duration: number; // milliseconds
}

/**
 * Execute transaction and return result with timing metadata
 * Useful for performance monitoring
 * 
 * @param callback - Transaction callback
 * @param options - Transaction options
 * @returns Result with duration
 */
export async function timedTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: TransactionOptions
): Promise<TransactionResult<T>> {
  const startTime = Date.now();
  
  const data = await withTransaction(callback, options);
  
  const duration = Date.now() - startTime;
  
  // Log slow transactions (>2 seconds)
  if (duration > 2000) {
    console.warn(`Slow transaction detected: ${duration}ms`);
  }
  
  return { data, duration };
}
