import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

// Back and Forward in a real browser (the unit tests' URL adapter keeps no
// history). Every view is a URL (spec §6): each step must come back.

const drill = (page: Page) => page.getByRole('navigation', { name: 'Drill-down' });
const title = (page: Page) => page.getByRole('heading', { level: 1 });

async function pick(page: Page, trigger: RegExp, item: string) {
  await drill(page).getByRole('button', { name: trigger }).click();
  await page.getByRole('menuitemradio', { name: item }).click();
}

test('drill-down: Back steps up one level at a time, Forward comes back', async ({ page }) => {
  await page.goto('/dashboard');
  // Each pick is checked in the URL: two inside nuqs's throttle would share
  // one history entry.
  await pick(page, /^Choose a region/, 'Europe');
  await expect(title(page)).toHaveText('Europe');
  await expect(page).toHaveURL(/[?&]region=eu(&|$)/);
  await pick(page, /^Choose a market/, 'Germany');
  await expect(title(page)).toHaveText('Germany');
  await expect(page).toHaveURL(/[?&]market=de(&|$)/);
  await pick(page, /^Choose a product/, 'Veltrix');
  await expect(page).toHaveURL(/[?&]product=veltrix(&|$)/);

  // Another market keeps the product; Back returns to the old market with it.
  await pick(page, /^Market: Germany/, 'France');
  await expect(page).toHaveURL(/[?&]market=fr&product=veltrix(&|$)/);
  await page.goBack();
  await expect(page).toHaveURL(/[?&]market=de&product=veltrix(&|$)/);

  await page.goBack();
  await expect(page).not.toHaveURL(/product=/);
  await expect(title(page)).toHaveText('Germany');
  await page.goBack();
  await expect(title(page)).toHaveText('Europe');
  await page.goBack();
  await expect(title(page)).toHaveText('Portfolio');

  await page.goForward();
  await expect(title(page)).toHaveText('Europe');
});

test('selected markets: Back takes off the last one, and the table follows', async ({ page }) => {
  await page.goto('/dashboard?mode=analyst');
  // Shift+Enter, as from the keyboard (Europe is small on the world map).
  const map = page.getByRole('group', { name: /^World map of markets/ });
  await map.getByRole('button', { name: /^France,/ }).press('Shift+Enter');
  // Two picks within nuqs's URL throttle would share one history entry.
  await expect(page).toHaveURL(/markets=fr(&|$)/);
  await map.getByRole('button', { name: /^Spain,/ }).press('Shift+Enter');
  await expect(page).toHaveURL(/markets=fr&markets=es/);

  const table = page.getByRole('table', { name: /^Markets in / });
  const row = (market: string) => table.getByRole('button', { name: new RegExp(` ${market}$`) });
  await expect(row('France')).toBeVisible();
  await expect(row('Spain')).toBeVisible();
  await expect(row('Germany')).toHaveCount(0);

  await page.goBack();
  await expect(page).toHaveURL(/markets=fr(&|$)/);
  await expect(page).not.toHaveURL(/markets=es/);
  await expect(row('France')).toBeVisible();
  await expect(row('Spain')).toHaveCount(0);
});

test('alerts sheet: closing leaves no step behind; a link closes in place', async ({ page }) => {
  await page.goto('/dashboard?region=eu');
  await page.goto('/dashboard');
  const bell = page.getByRole('banner').getByRole('button', { name: /^Alerts/ });
  const sheet = page.getByRole('dialog', { name: 'Alerts' });

  await bell.click();
  await expect(sheet).toBeVisible();
  await expect(page).toHaveURL(/[?&]tab=alerts(&|$)/);
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(page).not.toHaveURL(/tab=/);

  await bell.click();
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'Close' }).click();
  await expect(sheet).toBeHidden();
  await expect(page).not.toHaveURL(/tab=/);

  // One Back leaves for the page before, the sheet stays shut.
  await page.goBack();
  await expect(page).toHaveURL(/[?&]region=eu(&|$)/);
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.goto('/dashboard?tab=alerts');
  await expect(sheet).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).not.toHaveURL(/tab=/);
});

test('heat map: Back to a scope without the focused row keeps focus in the grid', async ({
  page,
}) => {
  await page.goto('/dashboard?mode=analyst&region=eu');
  await drill(page).getByRole('button', { name: 'Portfolio' }).click();
  await expect(title(page)).toHaveText('Portfolio');

  const grid = page.getByRole('grid', { name: /by market and month/ });
  await grid.getByRole('button', { name: /^Japan, May 2026/ }).focus();
  await page.goBack();
  await expect(title(page)).toHaveText('Europe');
  await expect(grid.getByRole('button', { name: /^Japan/ })).toHaveCount(0);
  // Focus lands on the clamped row: Europe's last market, same month.
  await expect(grid.getByRole('button', { name: /^United Kingdom, May 2026/ })).toBeFocused();
});
