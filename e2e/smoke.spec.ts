import { expect, test } from './fixtures';

test('the dashboard opens with its title and main content', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveTitle(/Market Ops Console/);
  await expect(page.getByRole('main')).toBeVisible();
});
