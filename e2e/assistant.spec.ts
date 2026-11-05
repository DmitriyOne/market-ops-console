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

  const retried = page.waitForRequest(
    (request) => request.url().includes('/api/v1/chat') && request.method() === 'POST',
  );
  await log.getByRole('button', { name: 'Try again' }).click();
  await retried;
  await expect(log).toContainText('No answer');
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
