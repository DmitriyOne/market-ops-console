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
  await page.goto('/dashboard?region=eu&market=de&mode=analyst');
  await page.getByRole('button', { name: 'Share link' }).click();
  await expect(page.getByText('Link copied')).toBeAttached();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(page.url());
  expect(new URL(copied).searchParams.get('market')).toBe('de');
});
