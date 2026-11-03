import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';
import i18next from 'eslint-plugin-i18next';
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
    // Tool configs import third-party typings that resolve to `any`
    // (@feature-sliced/steiger-plugin); type-aware rules add nothing there.
    files: ['*.config.{ts,mts}'],
    extends: [tseslint.configs.disableTypeChecked],
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
            include: ['aria-label', 'aria-labelledby', 'alt', 'title', 'placeholder'],
          },
          callees: { exclude: ['t', 't\\.rich'] },
        },
      ],
    },
  },
  prettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'coverage/**', 'next-env.d.ts', 'reference/**']),
]);
