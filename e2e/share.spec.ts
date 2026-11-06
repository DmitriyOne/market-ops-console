import { expect, test } from './fixtures';

// "The URL reflects the drill path, selection and filters" (brief): a
// colleague opening a sent link sees the same view, and the mode switch is a
// step Back can undo.
const LINK =
  '/dashboard?region=eu&market=de&period=2026-03&range=3m&mode=analyst&kpi=growth&markets=de&markets=fr';

// Every test starts in a fresh browser context: no cookies, storage or history.
test('a shared link opens the same view in a fresh browser', async ({ page }) => {
  await page.goto(LINK);

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Germany');
  await expect(page.getByRole('navigation', { name: 'Drill-down' })).toContainText('Europe');
  await expect(page.getByRole('button', { name: /^Period: Mar 2026, 3 months/ })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Analyst' })).toBeChecked();
  const selected = page.getByRole('group', { name: 'Selected' });
  await expect(selected.getByRole('button', { name: 'Remove Germany' })).toBeVisible();
  await expect(selected.getByRole('button', { name: 'Remove France' })).toBeVisible();
  await expect(page.getByRole('grid', { name: /^Growth YoY by market and month/ })).toBeVisible();
});

test('Executive ↔ Analyst is in the URL, and Back undoes the switch', async ({ page }) => {
  await page.goto('/dashboard?region=eu&market=de');
  await page.getByRole('radio', { name: 'Analyst' }).click();
  await expect(page).toHaveURL(/[?&]mode=analyst(&|$)/);
  await expect(page.getByRole('grid', { name: /by market and month/ })).toBeVisible();

  await page.goBack();
  await expect(page).not.toHaveURL(/mode=/);
  await expect(page.getByRole('radio', { name: 'Executive' })).toBeChecked();
  await expect(page.getByRole('grid')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Germany');
});

test('Share link puts the address of the current view on the clipboard', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  // `#main` is where the skip link leaves the address; it is not part of the view.
  await page.goto('/dashboard?region=eu&market=de&mode=analyst&currency=GBP#main');
  await page.getByRole('button', { name: 'Share link' }).click();
  await expect(page.locator('[data-slot="share-copied"]')).toHaveText('Link copied');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(page.url().replace('#main', ''));
  expect(new URL(copied).searchParams.get('market')).toBe('de');
  expect(new URL(copied).searchParams.get('currency')).toBe('GBP');
});

// The static page shows the skeleton until the script runs: it must take the
// button's place exactly, in the longest label (Russian) too, so nothing moves.
for (const locale of ['', '/ru-RU']) {
  test(`the Share link skeleton is the button's size${locale ? ` (${locale})` : ''}`, async ({
    browser,
  }) => {
    const url = `${locale}/dashboard?region=eu&market=gb&product=veltrix`;
    const noScript = await browser.newContext({ javaScriptEnabled: false });
    const before = await noScript.newPage();
    await before.goto(url);
    const skeleton = await before
      .locator('[data-slot="skeleton"]')
      .filter({ has: before.locator('svg') })
      .boundingBox();
    await noScript.close();

    const live = await browser.newContext();
    const after = await live.newPage();
    await after.goto(url);
    const button = after.getByRole('button', { name: /^(Share link|Поделиться ссылкой)$/ });
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    await live.close();

    expect(skeleton).not.toBeNull();
    expect(Math.round(skeleton?.width ?? 0)).toBe(Math.round(box?.width ?? -1));
    expect(Math.round(skeleton?.height ?? 0)).toBe(Math.round(box?.height ?? -1));
  });
}
