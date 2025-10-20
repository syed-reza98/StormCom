import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'dist/**',
      'build/**',
      '.cache/**',
      'coverage/**',
    ],
  },
  {
    files: [
      'src/lib/api-wrapper.ts',
      'src/lib/errors.ts',
      'src/lib/response.ts',
      'src/lib/validation/**/*.ts',
      'src/lib/middleware/**/*.ts',
      'src/lib/auth.ts',
      'src/types/**/*.ts',
      '**/__tests__/**/*.ts',
      '**/*.test.ts',
      '**/*.spec.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'import/no-anonymous-default-export': 'off',
    },
  },
];

export default eslintConfig;
