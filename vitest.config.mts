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
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'app/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    // next-intl imports `next/navigation` without an extension; inlining lets
    // Vite resolve it (next has no exports map).
    server: { deps: { inline: ['next-intl'] } },
  },
});
