import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@\/data\//, replacement: fileURLToPath(new URL('./data/', import.meta.url)) },
      { find: /^@\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) },
    ],
  },
  test: {
    setupFiles: ['./vitest.setup.ts'],
    // The mock alerts route answers at once under test.
    env: { MOCK_ALERTS_DELAY_MS: '0' },
    // Logic (*.test.ts) runs without a DOM, components (*.test.tsx) in jsdom:
    // building jsdom for every file was a third of the time on the 2-core CI
    // runner. A *.test.ts that needs the DOM says `// @vitest-environment jsdom`.
    projects: [
      {
        extends: true,
        test: {
          name: 'logic',
          environment: 'node',
          include: ['src/**/*.test.ts', 'app/**/*.test.ts', 'scripts/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'components',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx', 'app/**/*.test.tsx'],
        },
      },
    ],
    // next-intl imports `next/navigation` without an extension; inlining lets
    // Vite resolve it (next has no exports map).
    server: { deps: { inline: ['next-intl'] } },
  },
});
