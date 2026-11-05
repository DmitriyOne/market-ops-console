import { expect, test } from './fixtures';

// The map with a keyboard (spec §8): what jsdom can't check, as it has no
// layout. Desktop only: the phone shows tiles instead of the map.

test('Tab to a market outside the zoomed view brings it into view, ringed', async ({ page }) => {
  await page.goto('/dashboard');
  const map = page.getByRole('group', { name: /^World map of markets/ });
  await expect(map).toBeVisible();
  const zoomIn = page.getByRole('button', { name: 'Zoom in' });
  for (let i = 0; i < 4; i++) await zoomIn.click();

  // Whether the middle of Japan (or its tooltip) is inside the map's frame.
  const inMap = (selector: string) =>
    map.evaluate((svg, sel) => {
      const frame = svg.getBoundingClientRect();
      const box = document.querySelector(sel)?.getBoundingClientRect() ?? new DOMRect(-1, -1);
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      return x > frame.left && x < frame.right && y > frame.top && y < frame.bottom;
    }, selector);
  const japan = '[data-market="jp"]';

  // The world centre, zoomed in: Japan is off the edge.
  await expect.poll(() => inMap(japan)).toBe(false);
  await page.getByRole('button', { name: /^Japan, / }).focus();
  await expect.poll(() => inMap(japan)).toBe(true);

  // The tooltip points at where the country now is.
  await expect(page.getByRole('dialog').filter({ hasText: 'Japan' })).toBeVisible();
  await expect.poll(() => inMap('[role="dialog"]')).toBe(true);

  // The ring is drawn last, over every neighbour and pattern.
  const ringIsLast = await map.evaluate(
    (svg, sel) =>
      [...svg.querySelectorAll('path')].at(-1)?.getAttribute('d') ===
      svg.querySelector(sel)?.getAttribute('d'),
    japan,
  );
  expect(ringIsLast).toBe(true);
});
