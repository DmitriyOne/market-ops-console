import { expect, test } from './fixtures';

// Currency picker (ADR 0017): fixed ECB rates, kept in the URL (`?currency=EUR`).
test('EUR converts every amount, keeps the percentages, is in the URL and survives a reload', async ({
  page,
  browser,
}) => {
  await page.goto('/dashboard');
  const revenue = page.getByRole('group', { name: 'Revenue' });
  await expect(revenue).toContainText(/\$22\.9m/i);

  await page.getByRole('button', { name: 'Currency: USD, US dollar' }).click();
  await expect(page.getByRole('menu')).toContainText(/ECB rates of (5 November|November 5,) 2026/);
  await page.getByRole('menuitemradio', { name: /EUR/ }).click();

  // 22,850,419 $ × 0.89095
  await expect(revenue).toContainText(/€20\.4m/i);
  await expect(page.getByRole('group', { name: 'Forecast attainment' })).toContainText('100.4%');
  await expect(page).toHaveURL(/[?&]currency=EUR(&|$)/);

  await page.reload();
  await expect(page.getByRole('group', { name: 'Revenue' })).toContainText(/€20\.4m/i);
  await expect(page.getByRole('button', { name: 'Currency: EUR, Euro' })).toHaveText('EUR');
  await expect(page.getByRole('main')).not.toContainText('$');

  // The link opens in euros for someone else too (a fresh browser, nothing stored).
  const other = await browser.newPage();
  await other.goto(page.url());
  await expect(other.getByRole('group', { name: 'Revenue' })).toContainText(/€20\.4m/i);
  await other.close();
});

test('back to USD and Reset view both leave the URL without a currency', async ({ page }) => {
  await page.goto('/dashboard?region=eu&currency=GBP');
  await expect(page.getByRole('group', { name: 'Revenue' })).toContainText('£');
  await page.getByRole('button', { name: 'Currency: GBP, British pound' }).click();
  await page.getByRole('menuitemradio', { name: /USD/ }).click();
  await expect(page).not.toHaveURL(/currency=/);
  await expect(page).toHaveURL(/[?&]region=eu(&|$)/);

  await page.goto('/dashboard?region=eu&currency=EUR');
  await page
    .getByRole('link', { name: /Market Ops Console/ })
    .first()
    .click();
  await expect(page).not.toHaveURL(/[?&]/);
  await expect(page.getByRole('group', { name: 'Revenue' })).toContainText('$');
});
