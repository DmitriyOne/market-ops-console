import type { Locator } from '@playwright/test';

import { expect, test } from './fixtures';

// The map with a keyboard and a finger (spec §8): what jsdom can't check, as
// it has no layout. Desktop size only: the phone shows tiles instead.

/** Whether the middle of `target` is inside the map's frame. */
const inMap = async (map: Locator, target: Locator) => {
  const svg = await map.elementHandle();
  return target.evaluate((el, frameEl) => {
    const frame = frameEl.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    return x > frame.left && x < frame.right && y > frame.top && y < frame.bottom;
  }, svg);
};

/** Paths drawn in the map: the keyboard ring adds two. */
const pathCount = (map: Locator) => map.evaluate((svg) => svg.querySelectorAll('path').length);

test('Tab to a market outside the zoomed view brings it into view, ringed', async ({ page }) => {
  await page.goto('/dashboard');
  const map = page.getByRole('group', { name: /^World map of markets/ });
  await expect(map).toBeVisible();
  const zoomIn = page.getByRole('button', { name: 'Zoom in' });
  for (let i = 0; i < 4; i++) await zoomIn.click();

  // The world centre, zoomed in: Japan is off the edge.
  const japan = map.getByRole('button', { name: /^Japan, / });
  await expect.poll(() => inMap(map, japan)).toBe(false);
  const before = await pathCount(map);
  // Focus by keyboard (a press first, so it counts as keyboard focus).
  await page.keyboard.press('Shift');
  await japan.focus();
  await expect.poll(() => inMap(map, japan)).toBe(true);

  // The tooltip points at where the country now is.
  const tip = page.getByRole('dialog').filter({ hasText: 'Japan' });
  await expect(tip).toBeVisible();
  await expect.poll(() => inMap(map, tip)).toBe(true);

  // The ring: two paths drawn last, the last one Japan's outline.
  expect(await pathCount(map)).toBe(before + 2);
  const svg = await map.elementHandle();
  const ringIsJapan = await japan.evaluate(
    (path, frameEl) =>
      [...frameEl.querySelectorAll('path')].at(-1)?.getAttribute('d') === path.getAttribute('d'),
    svg,
  );
  expect(ringIsJapan).toBe(true);
});

test.describe('on a touch screen', () => {
  test.use({ hasTouch: true });

  test('a tap shows the tooltip with Open, no keyboard ring and no move', async ({ page }) => {
    await page.goto('/dashboard');
    const map = page.getByRole('group', { name: /^World map of markets/ });
    await expect(map).toBeVisible();
    const brazil = map.getByRole('button', { name: /^Brazil, / });
    const before = await pathCount(map);
    const box = await brazil.boundingBox();
    await brazil.tap();
    const tip = page.getByRole('dialog').filter({ hasText: 'Brazil' });
    await expect(tip.getByRole('button', { name: /^Open/ })).toBeVisible();
    expect(await pathCount(map)).toBe(before);
    expect(await brazil.boundingBox()).toEqual(box);
  });
});
