import { expect, test } from './fixtures';

// 0.13.0 (ADR 0018): page metadata, icons, preview image, robots and the
// localised 404. The 500 pages are covered by unit tests (no route throws).

test('robots.txt keeps crawlers out and lists no sitemap', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.ok()).toBe(true);
  const text = await res.text();
  expect(text).toMatch(/User-Agent: \*\s+Disallow: \/\s*$/);
  expect(text).not.toMatch(/Sitemap/i);
});

test('the icons and the preview image are served', async ({ request }) => {
  for (const [path, type] of [
    ['/favicon.ico', 'image/x-icon'],
    ['/icon.svg', 'image/svg+xml'],
    ['/apple-icon.png', 'image/png'],
    ['/de-DE/opengraph-image/preview', 'image/png'],
  ] as const) {
    const res = await request.get(path);
    expect(res.ok(), path).toBe(true);
    expect(res.headers()['content-type'], path).toContain(type);
  }
});

test('the dashboard has its title, description and preview in the page language', async ({
  page,
}) => {
  await page.goto('/de-DE/dashboard');
  await expect(page).toHaveTitle('Dashboard · Market Ops Console');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /^Vertriebsleistung/,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'de_DE');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /\/de-DE\/opengraph-image\/preview/,
  );
});

test('an unknown address shows the 404 in the page language', async ({
  page,
  expectNoAxeViolations,
}) => {
  const res = await page.goto('/ru-RU/nope');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Страница не найдена' })).toBeVisible();
  await expect(page.getByText('/ru-RU/nope')).toBeVisible();
  await expect(page).toHaveTitle('Страница не найдена · Market Ops Console');
  await expectNoAxeViolations();
  await page.getByRole('link', { name: 'Вернуться к панели' }).click();
  await expect(page).toHaveURL(/\/ru-RU\/dashboard$/);
});
