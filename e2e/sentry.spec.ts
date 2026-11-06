import type { Page } from '@playwright/test';

import { expect, type SentryItem, test } from './fixtures';

// 0.14.0 (ADR 0019). The E2E build runs Sentry with a DSN that points nowhere;
// the fixtures catch every envelope at /monitoring (the tunnel). These tests read what
// the real SDK would send: what is reported, and that nothing personal is.

const QUESTION = 'Why did Germany dip in March?';

const logs = (items: SentryItem[]) => items.filter((item) => item.type === 'log');

const errors = (items: SentryItem[]) =>
  items.filter((item) => item.type === 'event' && item.payload.level === 'error');

function exceptionOf(item: SentryItem): string {
  const { exception } = item.payload;
  return JSON.stringify(exception ?? '');
}

async function ask(page: Page, question: string) {
  const assistant = page.getByRole('complementary', { name: 'Assistant' });
  await assistant.getByRole('textbox', { name: 'Ask about the data' }).fill(question);
  await assistant.getByRole('button', { name: 'Send' }).click();
  return assistant.getByRole('log');
}

// A 502 from a gateway: the server never saw it, so the browser reports it.
// (A 500 with our own code is the server's to report: a breadcrumb here.)
async function openAlertsWithTheApiDown(page: Page) {
  await page.route('**/api/v1/alerts?*', (route) =>
    route.fulfill({ status: 502, body: 'Bad gateway' }),
  );
  await page.goto('/dashboard?tab=alerts');
  await expect(page.getByRole('dialog', { name: 'Alerts' }).getByRole('alert')).toContainText(
    "Couldn't load your rules.",
  );
}

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

test('a failing API is reported with the screen as tags, and nothing personal', async ({
  page,
  sentry,
}) => {
  await openAlertsWithTheApiDown(page);
  await expect.poll(() => errors(sentry.items()).length).toBeGreaterThan(0);

  const [event] = errors(sentry.items());
  const payload = event?.payload ?? {};
  expect(payload.tags).toMatchObject({
    scope: 'query',
    code: 'HttpError',
    // The E2E browser's language; the page follows it.
    locale: 'en-US',
    mode: 'executive',
    currency: 'USD',
    section: 'alerts',
  });
  expect(payload.user).toBeUndefined();
  // The page address only: no headers, cookies or body.
  expect(payload.request).toEqual({ url: expect.stringContaining('/dashboard?tab=alerts') });
  // Console output goes to Sentry Logs too (sent in batches, every ~5 s).
  await expect.poll(() => logs(sentry.items()).length, { timeout: 15_000 }).toBeGreaterThan(0);
  expect(
    logs(sentry.items())
      .map((item) => item.raw)
      .join('\n'),
  ).toContain('[query]');
});

test('an expected failure (the demo switch) is a breadcrumb, not an issue', async ({
  page,
  sentry,
}) => {
  await page.goto('/dashboard?tab=alerts');
  const sheet = page.getByRole('dialog', { name: 'Alerts' });
  await sheet.getByRole('radio', { name: /^Rules/ }).click();
  await sheet.getByRole('switch', { name: 'Fail the next save (demo)' }).click();
  await sheet.getByRole('switch', { name: 'Rule on: Share below 10%' }).click();
  await expect(
    // The toast and the panel's failure line both say so.
    page.getByRole('listitem').filter({ hasText: 'Simulated failure (demo switch).' }).first(),
  ).toBeVisible();
  await page.keyboard.press('Escape');

  // A real fault afterwards: its event carries the demo failure as a breadcrumb.
  await ask(page, 'force error');
  await expect.poll(() => errors(sentry.items()).length).toBeGreaterThan(0);
  const reported = errors(sentry.items());
  expect(reported.map((item) => exceptionOf(item))).not.toContainEqual(
    expect.stringContaining('HTTP 503'),
  );
  expect(reported[0]?.raw).toContain('HTTP 503 (simulated)');
});

test('the question asked never reaches Sentry', async ({ page, sentry }) => {
  await page.goto('/dashboard');
  const log = await ask(page, QUESTION);
  await expect(log).toContainText('Confidence:');

  // An error now carries every breadcrumb of the visit; the answer's span was sent too.
  await ask(page, 'force error');
  await expect.poll(() => errors(sentry.items()).length).toBeGreaterThan(0);
  // Console logs leave in batches: wait for them before reading everything.
  await expect.poll(() => logs(sentry.items()).length, { timeout: 15_000 }).toBeGreaterThan(0);
  const everything = sentry.raw().join('\n');
  expect(everything).not.toContain('Germany dip');
  expect(everything).not.toContain(encodeURIComponent(QUESTION));
});
