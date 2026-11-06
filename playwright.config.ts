import { defineConfig, devices } from '@playwright/test';

import { E2E_SENTRY_DSN } from './e2e/sentry-dsn';

// One config, two targets (ADR 0008): with BASE_URL (a deployed preview) the
// suite tests that URL; without it, it builds the app and starts it on 3100,
// apart from the dev server on 3000 (the Next guide tests a production build).
const PORT = 3100;
const baseURL = process.env.BASE_URL ?? `http://localhost:${String(PORT)}`;
const ci = Boolean(process.env.CI);

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  reporter: ci
    ? [['list'], ['html', { open: 'never' }]]
    : // Never opens a report server that waits for Ctrl+C (agents run this too);
      // `pnpm exec playwright show-report` opens the last one.
      [['list'], ['html', { open: 'never' }]],
  // A whole answer, or a preview's cold start, can take longer than 5 s.
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    // Desktop runs every spec but the phone's; the phone runs its own, the
    // smoke test and the accessibility scans.
    {
      name: 'desktop',
      testIgnore: /phone\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'phone',
      testMatch: /(phone|smoke|a11y)\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `pnpm build && pnpm start --port ${String(PORT)}`,
        url: baseURL,
        // Reuse a running :3100 only when asked: a server left over from an
        // older build or another branch would test old code and pass.
        reuseExistingServer: process.env.E2E_REUSE === '1',
        timeout: 180_000,
        env: {
          // An answer streams word by word: ~1 s for a short one, ~3.5 s for
          // the long one, so Stop can be pressed mid-answer.
          MOCK_TOKEN_DELAY_MS: '20',
          MOCK_ALERTS_DELAY_MS: '400',
          // Sentry on, as in production, with a DSN that points nowhere: the
          // browser's events are caught at /monitoring (the tunnel) by the fixtures and
          // read by e2e/sentry.spec.ts; nothing can leave the machine. The
          // test page stays closed even if .env.local opens it (ADR 0019).
          NEXT_PUBLIC_SENTRY_DSN: E2E_SENTRY_DSN,
          ENABLE_SENTRY_TEST_PAGE: 'false',
        },
      },
});
