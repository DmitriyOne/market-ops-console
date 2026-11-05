import { expect, test } from './fixtures';

// The phone layout (spec §5): one section at a time with a bottom tab bar.
test('tab bar: Alerts opens full screen with the count; Back returns to Overview', async ({
  page,
}) => {
  await page.goto('/dashboard');
  const alertsTab = page.getByRole('button', { name: /^Alerts\s*, \d+ markets? flagged$/ });
  await expect(page.getByRole('button', { name: 'Overview' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Assistant/ })).toBeVisible();
  await expect(alertsTab).toBeVisible();

  await alertsTab.click();
  await expect(page).toHaveURL(/[?&]tab=alerts(&|$)/);
  await expect(page.getByRole('heading', { level: 1, name: 'Alerts' })).toBeVisible();
  await expect(page.getByRole('radio', { name: /^Firing · \d+$/ })).toBeChecked();
  // The desktop sheet is not used on a phone.
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.goBack();
  await expect(page).not.toHaveURL(/tab=/);
  await expect(page.getByRole('heading', { level: 1, name: 'Portfolio' })).toBeVisible();

  const sideways = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(sideways, 'no sideways scroll').toBe(0);
});
