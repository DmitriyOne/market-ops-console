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
    // names, URLs and lone punctuation are not (the rule trims text first, so
    // separators get the selectors below). Left out: API messages for
    // developers (shared/api, app/api: the UI shows translated texts by error
    // code) and test helpers (shared/lib/test).
    files: ['src/**/*.ts', 'app/**/*.ts'],
    ignores: ['**/*.test.ts', 'src/shared/api/**', 'app/api/**', 'src/shared/lib/test/**'],
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
              '[A-Z]\\w*Error',
              'Error',
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
    ignores: ['**/*.test.{ts,tsx}', 'src/shared/api/**', 'app/api/**', 'src/shared/lib/test/**'],
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
        {
          // Separators in template text, string concatenation and JSX: "a · b",
          // `${a}, ${b}`, {' · '}, "· {t('x')}". The i18next rule trims text and
          // lets lone punctuation through, so these need their own check.
          selector: 'TemplateElement[value.raw=/[·—–]|[,;:]\\s/]',
          message:
            'A separator in template text: use useJoinParts() or a message with placeholders.',
        },
        {
          selector: "BinaryExpression[operator='+'] > Literal[value=/[·—–]|[,;:]\\s/]",
          message:
            'A separator in concatenated text: use useJoinParts() or a message with placeholders.',
        },
        {
          selector: 'JSXExpressionContainer > Literal[value=/[·—–]|^\\s*[,;:]\\s*$/]',
          message: 'A separator in JSX: use useJoinParts() or a message with placeholders.',
        },
        {
          selector: 'Literal[value=/^\\s*[·—–]\\s*$/]',
          message: 'A separator kept in a constant: use useJoinParts() or a message.',
        },
        {
          selector: 'JSXText[value=/[·—–]/]',
          message: 'A separator in JSX text: use useJoinParts() or a message with placeholders.',
        },
        {
          // Text in an announced attribute or a field label, also inside {…}.
          selector:
            'JSXAttribute[name.name=/^(aria-(label|description|roledescription|valuetext|placeholder)|title|alt|placeholder|label)$/] :matches(JSXExpressionContainer, ConditionalExpression, LogicalExpression) > Literal[value=/[A-Za-z\\u0080-\\uFFFF]/]',
          message: 'Announced text comes from the dictionaries (ADR 0010).',
        },
        {
          selector:
            'JSXAttribute[name.name=/^(aria-(label|description|roledescription|valuetext|placeholder)|title|alt|placeholder|label)$/] TemplateElement[value.raw=/\\S/]',
          message: 'Announced text built in a template: use a message with placeholders.',
        },
      ],
    },
  },
  {
    // The bare dataset query gives dollars; useDataset() and useDashboard()
    // convert to the chosen currency. Only the files listed below may read it
    // raw, each for its own reason (ADR 0017).
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    ignores: [
      'src/entities/performance/api/dataset-query.ts',
      'src/entities/performance/index.ts',
      'src/entities/performance/model/use-dataset.ts',
      'src/entities/performance/model/use-dashboard.ts',
      'src/entities/performance/ui/DatasetGate.tsx',
      'src/features/export-markets/ui/ExportMenu.tsx',
      'app/[[]locale]/dashboard/page.tsx',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/entities/performance', '**/dataset-query'],
              importNames: ['datasetQueryOptions'],
              message:
                'datasetQueryOptions gives dollars: read the dataset with useDataset() or useDashboard() (ADR 0017).',
            },
          ],
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
