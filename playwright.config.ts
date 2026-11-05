import { defineConfig, devices } from '@playwright/test';

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
    : [['list'], ['html', { open: 'on-failure' }]],
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
        reuseExistingServer: !ci,
        timeout: 180_000,
        env: {
          // An answer streams word by word: ~1 s for a short one, ~3.5 s for
          // the long one, so Stop can be pressed mid-answer.
          MOCK_TOKEN_DELAY_MS: '20',
          MOCK_ALERTS_DELAY_MS: '400',
        },
      },
});
