import { expect, test } from './fixtures';

// The brief's form requirement on the real cookie route (spec §9): saved
// optimistically, kept across a reload, rolled back with a reason and Retry.
// Every test has its own browser context, so its own cookie.

test('a new rule shows at once as saving, then stays after a reload', async ({ page }) => {
  await page.goto('/dashboard?tab=alerts');
  const sheet = page.getByRole('dialog', { name: 'Alerts' });
  await sheet.getByRole('button', { name: 'New rule' }).click();
  await sheet.getByRole('textbox', { name: 'Name' }).fill('E2E growth watch');
  await sheet.getByRole('button', { name: 'Save rule' }).click();

  const rules = sheet.getByRole('list', { name: 'Your rules' });
  const row = rules.getByRole('listitem').filter({ hasText: 'E2E growth watch' });
  await expect(row).toContainText('Saving…');
  const saved = page
    .getByRole('listitem')
    .filter({ hasText: /^Saved “E2E growth watch”: it flags \d+ markets? now\./ });
  await expect(saved).toBeVisible();
  await expect(row).not.toContainText('Saving…');

  // The toast's Show works over the open sheet: Firing, its heading focused.
  await saved.getByRole('button', { name: 'Show' }).click();
  await expect(sheet.getByRole('radio', { name: /^Firing/ })).toBeChecked();
  await expect(sheet.getByRole('heading', { name: /^Firing now/ })).toBeFocused();

  await page.reload();
  await sheet.getByRole('radio', { name: /^Rules/ }).click();
  await expect(rules.getByRole('listitem').filter({ hasText: 'E2E growth watch' })).toBeVisible();
});

test('a failed save rolls back with the reason, and Retry saves it', async ({ page }) => {
  await page.goto('/dashboard?tab=alerts');
  const sheet = page.getByRole('dialog', { name: 'Alerts' });
  await sheet.getByRole('radio', { name: /^Rules/ }).click();
  const share = sheet.getByRole('switch', { name: 'Rule on: Share below 10%' });
  await expect(share).toBeChecked();

  await sheet.getByRole('switch', { name: 'Fail the next save (demo)' }).click();
  await share.click();
  // Optimistic: off at once…
  await expect(share).not.toBeChecked();
  // …then back on, with the reason and Retry.
  const toast = page.getByRole('listitem').filter({
    hasText: "Couldn't save — restored previous state. Simulated failure (demo switch).",
  });
  await expect(toast).toBeVisible();
  await expect(share).toBeChecked();

  // Retry in the toast works over the open sheet (it is modal) and keeps it open.
  await toast.getByRole('button', { name: 'Retry' }).click();
  await expect(sheet).toBeVisible();
  await expect(share).not.toBeChecked();
  const row = sheet.getByRole('listitem').filter({ hasText: 'Share below 10%' });
  await expect(row).toContainText('Saving…');
  await expect(row).not.toContainText('Saving…');
  await page.reload();
  await sheet.getByRole('radio', { name: /^Rules/ }).click();
  await expect(sheet.getByRole('switch', { name: 'Rule on: Share below 10%' })).not.toBeChecked();
});
