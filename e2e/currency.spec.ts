import { expect, test } from './fixtures';

// Currency picker (ADR 0017): fixed ECB rates, remembered in this browser.
test('EUR converts every amount, keeps the percentages and survives a reload', async ({ page }) => {
  await page.goto('/dashboard');
  const revenue = page.getByRole('group', { name: 'Revenue' });
  await expect(revenue).toContainText(/\$22\.9m/i);

  await page.getByRole('button', { name: 'Currency: USD, US dollar' }).click();
  await expect(page.getByRole('menu')).toContainText(/ECB rates of (5 November|November 5,) 2026/);
  await page.getByRole('menuitemradio', { name: /EUR/ }).click();

  // 22,850,419 $ × 0.89095
  await expect(revenue).toContainText(/€20\.4m/i);
  await expect(page.getByRole('group', { name: 'Forecast attainment' })).toContainText('100.4%');

  await page.reload();
  await expect(page.getByRole('group', { name: 'Revenue' })).toContainText(/€20\.4m/i);
  await expect(page.getByRole('button', { name: 'Currency: EUR, Euro' })).toHaveText('EUR');
  await expect(page.getByRole('main')).not.toContainText('$');
});
