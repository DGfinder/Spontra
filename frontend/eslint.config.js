import { FlatCompat } from '@eslint/eslintrc'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

export default [
  ...compat.extends('next/core-web-vitals'),
  
  // Global ignores
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      'build/**',
      '.vercel/**',
      'coverage/**',
      '*.config.js',
      '*.config.ts',
      'public/**',
    ],
  },

  // Main configuration for TypeScript and JavaScript files
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
    },
    rules: {
      // Disable problematic rules from old config
      '@next/next/no-img-element': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'jsx-a11y/role-supports-aria-props': 'off',
      'jsx-a11y/role-has-required-aria-props': 'off',
      
      // React 19 specific rules
      'react/no-deprecated': 'error',
      'react/jsx-no-useless-fragment': 'error',
      'react/self-closing-comp': 'error',
      
      // Performance rules
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'warn',
      
      // Next.js 15 optimizations
      '@next/next/no-sync-scripts': 'error',
      '@next/next/no-css-tags': 'error',
      '@next/next/no-page-custom-font': 'error',
      
      // TypeScript 5.9 enhanced rules
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      
      // Modern JavaScript patterns
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'object-shorthand': 'error',
      'prefer-template': 'error',
      
      // Import/export rules
      'import/order': ['error', {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'never',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        }
      }],
    },
  },

  // Server Actions specific rules
  {
    files: ['**/app/**/*.{js,jsx,ts,tsx}', '**/actions/**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Ensure proper Server Action patterns
      'react-hooks/rules-of-hooks': 'off', // Server Actions don't follow hook rules
    },
  },

  // API routes specific rules  
  {
    files: ['**/app/api/**/*.{js,ts}', '**/pages/api/**/*.{js,ts}'],
    rules: {
      // API routes can use console for logging
      'no-console': 'off',
    },
  },

  // Test files
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    rules: {
      // Test files can be more flexible
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // Configuration files
  {
    files: [
      '*.config.{js,ts,mjs}',
      '**/scripts/**/*.{js,ts}',
      '**/prisma/**/*.{js,ts}',
    ],
    rules: {
      // Config files can use console and require
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]