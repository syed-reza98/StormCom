/**
 * Webhook idempotency helpers
 *
 * Provides a simple wrapper around Vercel KV with a fallback in-memory store for
 * development to implement the FR-10Y idempotency semantics.
 */
import { kv } from '@vercel/kv';

type IdempotencyValue = {
  processedAt?: string;
  orderId?: string | null;
  amountProcessed?: number | null;
  status: 'processing' | 'success' | 'failed';
  errorMessage?: string;
};

const devStore = new Map<string, IdempotencyValue>();

function isKVAvailable(): boolean {
  return !!(
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN
  );
}

/**
 * Generate canonical idempotency key
 */
export function generateIdempotencyKey(source: string, entity: string, identifier: string) {
  return `webhook:${source}:${entity}:${identifier}`;
}

/**
 * Try to acquire an idempotency lock/placeholder. Uses NX semantics so only one
 * caller can acquire. Stores a 'processing' status value until completed.
 * Returns true if we acquired the key and should proceed with processing.
 */
export async function tryAcquireIdempotency(key: string, ttlSeconds = 86400): Promise<boolean> {
  if (isKVAvailable()) {
    try {
      // Attempt to set key only if it does not exist
      // kv.set supports options { nx: true, ex: ttl }
      const value = JSON.stringify({ status: 'processing', createdAt: new Date().toISOString() } as IdempotencyValue);
      const res = await (kv as any).set(key, value, { nx: true, ex: ttlSeconds });
      // set returns true when set, false when not (existing)
      return !!res;
    } catch (error) {
      console.error('[Idempotency] KV acquire error:', error);
      // Fail open to avoid blocking processing in case of KV issues
      return true;
    }
  }

  // Development fallback: simple Map check
  if (!devStore.has(key)) {
    devStore.set(key, { status: 'processing' });
    return true;
  }
  return false;
}

/**
 * Mark idempotency key as success with metadata
 */
export async function markIdempotencySuccess(key: string, metadata: Partial<IdempotencyValue> = {}, ttlSeconds = 86400): Promise<void> {
  const value: IdempotencyValue = {
    status: 'success',
    processedAt: new Date().toISOString(),
    ...metadata,
  };

  if (isKVAvailable()) {
    try {
      await kv.set(key, JSON.stringify(value), { ex: ttlSeconds });
      return;
    } catch (error) {
      console.error('[Idempotency] KV set success error:', error);
      // best-effort
      return;
    }
  }

  devStore.set(key, value);
}

/**
 * Delete idempotency key (used when processing fails to allow retry)
 */
export async function deleteIdempotencyKey(key: string): Promise<void> {
  if (isKVAvailable()) {
    try {
      await kv.del(key);
      return;
    } catch (error) {
      console.error('[Idempotency] KV delete error:', error);
      return;
    }
  }

  devStore.delete(key);
}

/**
 * Get idempotency metadata if present
 */
export async function getIdempotency(key: string): Promise<IdempotencyValue | null> {
  if (isKVAvailable()) {
    try {
      const raw = await kv.get<string | null>(key);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as IdempotencyValue;
      } catch (err) {
        return { status: 'success', processedAt: new Date().toISOString() };
      }
    } catch (error) {
      console.error('[Idempotency] KV get error:', error);
      return null;
    }
  }

  return devStore.get(key) ?? null;
}

export type { IdempotencyValue };
