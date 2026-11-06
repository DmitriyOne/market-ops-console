import { expect, test } from './fixtures';

// The brief's happy path (ADR 0008): drill into a market on the map, ask the
// assistant about it, follow a source back to the dashboard.
test('map → Germany → ask why it dipped → a source opens that month', async ({ page }) => {
  await page.goto('/dashboard');

  await page.getByRole('button', { name: /^Germany, Attainment/ }).click();
  await expect(page).toHaveURL(/[?&]region=eu&market=de(&|$)/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Germany');
  await expect(page.getByRole('navigation', { name: 'Drill-down' })).toContainText('Europe');

  const assistant = page.getByRole('complementary', { name: 'Assistant' });
  // Count how often the panel's text changes while the answer comes: a
  // streamed answer changes it many times, one that arrives whole a few.
  await assistant.evaluate((element) => {
    const counter = { updates: 0 };
    Object.assign(window, { streamCounter: counter });
    new MutationObserver(() => {
      counter.updates += 1;
    }).observe(element, { characterData: true, childList: true, subtree: true });
  });
  await assistant.getByRole('button', { name: 'Why did Germany dip?' }).click();
  const log = assistant.getByRole('log');

  await expect(log).toContainText('Why did Germany dip in March?');
  await expect(log).toContainText('Confidence: High');
  await expect(log).toContainText('AI answer · may be incomplete');
  // Next to the AI answer, the authoritative block built from the data alone.
  await expect(log.getByRole('button', { name: 'What the data shows' })).toBeVisible();
  const updates = await page.evaluate(() =>
    'streamCounter' in window && typeof window.streamCounter === 'object' && window.streamCounter
      ? Number(Reflect.get(window.streamCounter, 'updates'))
      : 0,
  );
  expect(updates, 'the answer arrives token by token').toBeGreaterThan(20);

  await assistant.getByRole('button', { name: 'Germany, Mar 2026 (largest dip)' }).click();
  await expect(page).toHaveURL(/[?&]period=2026-03(&|$)/);
  await expect(page).toHaveURL(/[?&]market=de(&|$)/);
  await expect(page.getByRole('button', { name: /^Period: Mar 2026/ })).toBeVisible();
});

test('numbers follow the locale: German KPIs', async ({ page }) => {
  await page.goto('/de-DE/dashboard');
  const kpis = page.getByRole('region', { name: 'Kennzahlen' });
  await expect(kpis).toContainText('22,9 Mio. $');
  await expect(kpis).toContainText('100,4 %');
});

test('places follow the locale: German region and market names, Plan in the table', async ({
  page,
}) => {
  await page.goto('/de-DE/dashboard?mode=analyst&region=eu');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Europa');
  const table = page.getByRole('table', { name: /Märkte/ });
  await expect(table.getByRole('row', { name: /Deutschland/ })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: 'Plan', exact: true })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: /Prognose/ })).toHaveCount(0);
});
