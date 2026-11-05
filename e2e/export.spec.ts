import { readFile } from 'node:fs/promises';

import { expect, test } from './fixtures';

// "Export" in Analyst: real browser downloads, which jsdom cannot make.
// The rows are the table's as shown, so the selection narrows the file too.
test.beforeEach(async ({ page }) => {
  await page.goto('/dashboard?mode=analyst&markets=de&markets=fr');
});

test('CSV: the selected markets, raw numbers', async ({ page }) => {
  await page.getByRole('button', { name: 'Export' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: /^CSV/ }).click();
  const file = await download;

  expect(file.suggestedFilename()).toMatch(/^markets-.+\.csv$/);
  const lines = (await readFile(await file.path(), 'utf8')).trim().split(/\r?\n/);
  expect(lines).toHaveLength(3);
  expect(lines.slice(1).join('\n')).toContain('Germany');
  expect(lines.slice(1).join('\n')).toContain('France');
  expect(lines.join('\n')).not.toContain('Spain');
});

test('Excel: a workbook named like the CSV', async ({ page }) => {
  await page.getByRole('button', { name: 'Export' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: /^Excel/ }).click();
  const file = await download;

  expect(file.suggestedFilename()).toMatch(/^markets-.+\.xlsx$/);
  const bytes = await readFile(await file.path());
  // An .xlsx is a zip archive: "PK" first, and more than an empty shell.
  expect(bytes.subarray(0, 2).toString()).toBe('PK');
  expect(bytes.length).toBeGreaterThan(5_000);
});
