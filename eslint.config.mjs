import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';
import i18next from 'eslint-plugin-i18next';
import playwright from 'eslint-plugin-playwright';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['**/*.{ts,tsx,mts}'],
    extends: [tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  {
    // No visible copy outside the dictionaries (ADR 0010, 0011): JSX text and
    // the attributes screen readers announce. Plain string literals elsewhere
    // (class names, enum values) are left alone by "jsx-only".
    files: ['src/**/*.tsx', 'app/**/*.tsx'],
    ignores: ['**/*.test.tsx'],
    plugins: { i18next },
    rules: {
      'i18next/no-literal-string': [
        'error',
        {
          mode: 'jsx-only',
          'jsx-attributes': {
            include: [
              'aria-label',
              'aria-labelledby',
              'aria-description',
              'aria-roledescription',
              'aria-valuetext',
              'aria-placeholder',
              'alt',
              'title',
              'placeholder',
            ],
          },
          callees: { exclude: ['t', 't\\.rich'] },
        },
      ],
    },
  },
  {
    // No visible copy in plain .ts either (0.13.0, ADR 0011): hooks and
    // helpers that build labels. Every string literal or template text with a
    // space or a non-ASCII character is reported; identifiers, keys, class
    // names, URLs and lone punctuation are not. Left out: API messages for
    // developers (shared/api, app/api: the UI shows translated texts by error
    // code) and config (shared/config).
    files: ['src/**/*.ts', 'app/**/*.ts'],
    ignores: [
      '**/*.test.ts',
      'src/shared/api/**',
      'app/api/**',
      'src/shared/config/**',
      'src/shared/lib/test/**',
    ],
    plugins: { i18next },
    rules: {
      'i18next/no-literal-string': [
        'error',
        {
          mode: 'all',
          'should-validate-template': true,
          words: { exclude: ['[\\x21-\\x7E]+', 'use (client|server)'] },
          // Developer messages (errors), media queries and input clean-up
          // are not shown as copy.
          callees: {
            exclude: [
              't',
              't\\.rich',
              'super',
              '\\w*Error',
              '(window\\.)?matchMedia',
              'useMediaQuery',
              '\\w+\\.replace',
            ],
          },
        },
      ],
    },
  },
  {
    // A separator written in code ("a · b", "a, b") is text too: join label
    // parts with useJoinParts or next-intl's format.list (ADR 0011). Also the
    // announced attributes the i18next rule skips on native tags.
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', 'src/shared/api/**', 'app/api/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.property.name='join'] > Literal.arguments[value=/(\\S.*\\s|\\s.*\\S|[^\\x00-\\x7F])/]",
          message:
            'Join label parts with useJoinParts() or format.list(), not a separator in code.',
        },
        {
          // i18next/no-literal-string checks these on components only; on
          // native tags it trusts its own attribute list.
          selector:
            'JSXAttribute[name.name=/^aria-(description|roledescription|valuetext|placeholder)$/] > Literal[value=/[A-Za-z\\u0080-\\uFFFF]/]',
          message: 'Announced text comes from the dictionaries (ADR 0010).',
        },
      ],
    },
  },
  {
    // End-to-end tests (ADR 0008): Playwright's own rules on top of the above.
    files: ['e2e/**/*.ts'],
    ...playwright.configs['flat/recommended'],
  },
  prettier,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'next-env.d.ts',
    'reference/**',
    'playwright-report/**',
    'test-results/**',
  ]),
]);
