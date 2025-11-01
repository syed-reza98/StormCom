import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.next', 'tests/e2e/**'],
    // Use process isolation to prevent memory leaks between test suites
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 2, // Reduce from 4 to 2 to save memory
        minThreads: 1,
        isolate: true,
      },
    },
    // Give async hooks (DB setup/reset) more time
    hookTimeout: 30000,
    env: {
      // Test environment variables
      NODE_ENV: 'test',
      // DATABASE_URL: managed per test suite for isolation
      NEXTAUTH_SECRET: 'test-secret-key-for-unit-testing-only',
      NEXTAUTH_URL: 'http://localhost:3000',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/__tests__/**',
        'src/types/**',
        'src/app/**/layout.tsx',
        'src/app/**/page.tsx',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
