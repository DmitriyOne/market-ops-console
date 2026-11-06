import { expect, test } from './fixtures';

// 0.14.0 (ADR 0019): the Sentry test page and its API exist only where
// ENABLE_SENTRY_TEST_PAGE is set; the E2E build never sets it.

test('the Sentry test page is a 404 in every locale', async ({ page }) => {
  for (const path of ['/sentry-test', '/de-DE/sentry-test', '/ru-RU/sentry-test/server']) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(404);
  }
});

test('the Sentry test API is a 404', async ({ request }) => {
  const res = await request.get('/api/v1/sentry-test');
  expect(res.status()).toBe(404);
});
