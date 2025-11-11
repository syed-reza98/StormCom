// src/lib/logger.ts
// Simple environment-aware logger utility
export const logger = {
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      // eslint-disable-next-line no-console
      console.debug('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    // eslint-disable-next-line no-console
    console.info('[INFO]', ...args);
  },
  warn: (...args: any[]) => {
    // eslint-disable-next-line no-console
    console.warn('[WARN]', ...args);
  },
  error: (...args: any[]) => {
    // eslint-disable-next-line no-console
    console.error('[ERROR]', ...args);
  },
};

export default logger;
