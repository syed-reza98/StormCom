/**
 * Performance Utility Functions
 */

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Measure execution time
 */
export async function measureTime<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  // Use centralized logger for consistency
  try {
    const { logger } = await import('@/lib/logger');
    logger.debug(`${label} took ${end - start}ms`);
  } catch {
    // Fallback if logger import fails
    // eslint-disable-next-line no-console
    console.log(`${label} took ${end - start}ms`);
  }
  return result;
}

/**
 * Memoize an API call result for a short duration (in-memory)
 * Useful for caching repeated fetches in a short timeframe during tests.
 */
export function memoizeApiCall<T extends (...args: any[]) => Promise<any>>(fn: T, ttl = 5000) {
  const cache = new Map<string, { value: any; expiresAt: number }>();
  return async (...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    const entry = cache.get(key);
    const now = Date.now();
    if (entry && entry.expiresAt > now) return entry.value;
    const value = await fn(...args);
    cache.set(key, { value, expiresAt: now + ttl });
    return value;
  };
}
