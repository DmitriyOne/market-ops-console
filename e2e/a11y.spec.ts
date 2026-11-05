import { expect, test } from './fixtures';

// Rendered accessibility scans (axe, WCAG 2.1 A/AA) on desktop and phone.
// axe finds a part of the problems only; keyboard and screen-reader checks
// stay manual (README, accessibility).

test('Executive view', async ({ page, expectNoAxeViolations }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { level: 1, name: 'Portfolio' })).toBeVisible();
  // The map on desktop, tiles on a phone: wait for the card's markets.
  await expect(page.getByRole('button', { name: /Germany/ }).first()).toBeVisible();
  await expectNoAxeViolations();
});

test('Analyst view', async ({ page, expectNoAxeViolations }) => {
  await page.goto('/dashboard?mode=analyst');
  await expect(page.getByRole('grid', { name: /by market and month/ })).toBeVisible();
  await expectNoAxeViolations();
});

test('alerts panel', async ({ page, expectNoAxeViolations }) => {
  await page.goto('/dashboard?tab=alerts');
  await expect(page.getByRole('region', { name: /^Firing now/ })).toBeVisible();
  await expectNoAxeViolations();
  await page.getByRole('radio', { name: /^Rules/ }).click();
  await expect(page.getByRole('list', { name: 'Your rules' })).toBeVisible();
  await expectNoAxeViolations();
  await page.getByRole('button', { name: 'New rule' }).click();
  await expect(page.getByRole('textbox', { name: 'Name' })).toBeVisible();
  await expectNoAxeViolations();
});

test('assistant with a finished answer', async ({ page, expectNoAxeViolations }) => {
  await page.goto('/dashboard?tab=assistant');
  await page.getByRole('button', { name: 'Why did Germany dip?' }).click();
  await expect(page.getByRole('log')).toContainText('Confidence: High');
  await expectNoAxeViolations();
});
