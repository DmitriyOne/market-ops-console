import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

// The assistant's honest states in a real browser (spec §7): an error says
// so and can be retried; a question the data cannot answer gets no sources.

async function ask(page: Page, question: string) {
  const assistant = page.getByRole('complementary', { name: 'Assistant' });
  await assistant.getByRole('textbox', { name: 'Ask about the data' }).fill(question);
  await assistant.getByRole('button', { name: 'Send' }).click();
  return assistant;
}

test('a failed answer says so, and Try again asks again', async ({ page }) => {
  await page.goto('/dashboard');
  const assistant = await ask(page, 'force error');
  const log = assistant.getByRole('log');
  await expect(log).toContainText('No answer');
  await expect(log).not.toContainText('Confidence:');

  const retried = page.waitForResponse(
    (response) => response.url().includes('/api/v1/chat') && response.request().method() === 'POST',
  );
  await log.getByRole('button', { name: 'Try again' }).click();
  await retried;
  // Try again asks once more: a second answer, which fails the same way.
  await expect(log.getByText('No answer')).toHaveCount(2);
});

test('a question past the data says it cannot answer, with no sources', async ({ page }) => {
  await page.goto('/dashboard');
  const assistant = await ask(page, 'What will sales be next year?');
  const log = assistant.getByRole('log');
  await expect(log).toContainText("I can't answer this from the data");
  await expect(log).toContainText('2026');
  await expect(log).not.toContainText('Confidence: High');
  await expect(log.getByRole('button', { name: /, \w{3} 20\d\d/ })).toHaveCount(0);
  await expect(log.getByRole('button', { name: 'What the data shows' })).toHaveCount(0);
});

test('Stop mid-answer keeps the words so far, without sources or confidence', async ({ page }) => {
  await page.goto('/dashboard');
  const assistant = await ask(page, 'Give me a full summary of the portfolio');
  const log = assistant.getByRole('log');
  await expect(log).toContainText("Here's the portfolio at a glance.");

  // Stop must cancel the request itself, not only change what is shown.
  const aborted = page.waitForEvent('requestfailed', (request) =>
    request.url().includes('/api/v1/chat'),
  );
  await assistant.getByRole('button', { name: 'Stop answer' }).click();
  expect((await aborted).failure()?.errorText).toContain('ERR_ABORTED');
  await expect(log).toContainText('Stopped — answer incomplete.');
  await expect(log).toContainText('No sources or confidence for a partial answer.');
  // The words that came stay; the rest never arrives.
  await expect(log).toContainText("Here's the portfolio at a glance.");
  await expect(log).not.toContainText('for the detail behind these numbers');
  await expect(log).not.toContainText('Confidence:');
  await expect(assistant.getByRole('button', { name: 'Ask again' })).toBeVisible();
});
