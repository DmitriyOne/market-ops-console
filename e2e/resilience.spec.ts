import { expect, test } from './fixtures';

// Graceful degradation in a real browser (spec §10). The dataset ships inside
// the static page, so the failures a deployed app can meet are the network
// going away and an API the page calls at run time.

test('offline: one notice over the page, gone when the network is back', async ({
  page,
  context,
}) => {
  await page.goto('/dashboard?region=eu');
  await expect(page.getByRole('heading', { level: 1, name: 'Europe' })).toBeVisible();
  const period = page.getByRole('button', { name: /^Period:/ });
  await period.focus();

  await context.setOffline(true);
  const notice = page.getByRole('alertdialog', { name: "You're offline" });
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('Everything on this page is kept.');
  await expect(notice.getByRole('button', { name: 'Try again' })).toBeFocused();

  await context.setOffline(false);
  await expect(notice).toBeHidden();
  // The view the user had is still there, and so is their place in it.
  await expect(page.getByRole('heading', { level: 1, name: 'Europe' })).toBeVisible();
  await expect(period).toBeFocused();
});

test('the alerts API failing: the panel says so, Try again loads the rules', async ({ page }) => {
  await page.route('**/api/v1/alerts', (route) =>
    route.fulfill({ status: 500, json: { error: { code: 'internal', message: 'Down.' } } }),
  );
  await page.goto('/dashboard?tab=alerts');
  const sheet = page.getByRole('dialog', { name: 'Alerts' });
  const failed = sheet.getByRole('alert');
  await expect(failed).toContainText("Couldn't load your rules.");

  await page.unroute('**/api/v1/alerts');
  await failed.getByRole('button', { name: 'Try again' }).click();
  await expect(sheet.getByRole('region', { name: /^Firing now/ })).toBeVisible();
  await expect(sheet.getByRole('alert')).toHaveCount(0);
});
