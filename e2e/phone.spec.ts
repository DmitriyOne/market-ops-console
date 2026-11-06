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

test('settings sheet: the currency row switches amounts to pounds and closes the sheet', async ({
  page,
}) => {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: /^Settings/ }).click();
  await page.getByRole('button', { name: /^Currency/ }).click();
  await page.getByRole('menuitemradio', { name: /GBP/ }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // 22,850,419 $ × 0.74299
  await expect(page.getByRole('group', { name: 'Revenue' })).toContainText(/£17m/i);
  await expect(page).toHaveURL(/[?&]currency=GBP(&|$)/);
  await page.getByRole('button', { name: /^Settings/ }).click();
  await expect(page.getByRole('button', { name: /^Currency/ })).toContainText(
    'GBP · British pound',
  );
});

test('Share link is an icon next to the title, a 44 px target', async ({ page }) => {
  await page.goto('/dashboard?region=eu&market=de');
  const button = page.getByRole('button', { name: 'Share link' });
  await expect(button).toBeVisible();
  await expect(button.getByText('Share link')).not.toBeInViewport();
  const box = await button.boundingBox();
  expect(box?.width).toBe(44);
  expect(box?.height).toBe(44);
  const title = await page.getByRole('heading', { level: 1, name: 'Germany' }).boundingBox();
  // Same row as the title, at its end.
  expect(Math.abs((box?.y ?? 0) - (title?.y ?? 0))).toBeLessThan(12);
});

test('period and mode share one row that slides away while scrolling down, without moving the page', async ({
  page,
}) => {
  await page.goto('/ru-RU/dashboard?range=12m');
  const period = page.getByRole('button', { name: /^Период: / });
  const mode = page.getByRole('banner').getByRole('radiogroup', { name: 'Вид' });
  await expect(period).toBeVisible();
  // One row: the button and the switch sit side by side.
  const [p, m] = [await period.boundingBox(), await mode.boundingBox()];
  expect(Math.abs((p?.y ?? 0) - (m?.y ?? 100)), 'same row').toBeLessThan(12);

  // The row is what slides (the button inside only goes with it).
  const row = period.locator('xpath=..');
  const main = page.locator('#main');
  const mainTop = async () => (await main.boundingBox())?.y;
  const before = await mainTop();
  // The wheel, as a user scrolls (a scroll from code leaves the row alone).
  const box = await main.boundingBox();
  await page.mouse.move((box?.x ?? 0) + 100, (box?.y ?? 0) + 300);
  await page.mouse.wheel(0, 600);
  await expect(row).toHaveCSS('opacity', '0');
  expect(await mainTop(), 'the dashboard does not move').toBe(before);

  await page.mouse.wheel(0, -200);
  await expect(row).toHaveCSS('opacity', '1');
  await period.click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('the period shows in full when it fits, as the month over "12 мес." when it does not', async ({
  page,
}) => {
  const shown = page.getByRole('banner').getByRole('button', { name: /^(Period|Период): / });
  await page.goto('/dashboard?range=12m');
  // `filter({ visible })`: the invisible copy it is measured with holds the full label too.
  await expect(
    shown.getByText('May 2026 · 12 months', { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await expect(shown.getByText('12 mo', { exact: true }).filter({ visible: true })).toHaveCount(0);

  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/ru-RU/dashboard?range=12m');
  await expect(shown.getByText('12 мес.', { exact: true })).toBeVisible();
  // The full label is there only as the invisible copy it is measured with.
  await expect(
    shown.getByText('май 2026 г. · 12 месяцев', { exact: true }).filter({ visible: true }),
  ).toHaveCount(0);
});

test('a control focused by keyboard is not hidden under the period row (WCAG 2.4.11)', async ({
  page,
}) => {
  await page.goto('/dashboard?region=eu&market=de');
  const share = page.getByRole('button', { name: 'Share link' });
  const row = page.getByRole('button', { name: /^Period: / }).locator('xpath=..');
  await expect(share).toBeVisible();
  // Half of it above the top edge: the browser then scrolls only as far as it
  // must (a control far off screen Chrome would centre, hiding the problem).
  await share.evaluate((el) => {
    const area = document.getElementById('main');
    if (!area) return;
    const offset = el.getBoundingClientRect().top - area.getBoundingClientRect().top;
    area.scrollTop += offset + el.getBoundingClientRect().height / 2;
  });
  // Focus scrolls the dashboard back up; the row comes back with it.
  await share.focus();
  await expect(row).toHaveCSS('opacity', '1');
  const [s, r] = [await share.boundingBox(), await row.boundingBox()];
  expect(s?.y ?? 0, 'below the row').toBeGreaterThanOrEqual((r?.y ?? 0) + (r?.height ?? 0) - 1);
});

test('heat map on a phone: a tap shows the cell, Open under the grid opens it', async ({
  page,
}) => {
  await page.goto('/dashboard?mode=analyst&region=eu');
  const grid = page.getByRole('grid', { name: /by market and month/ });
  const germany = grid
    .getByRole('row')
    .filter({ has: page.getByRole('rowheader', { name: /^Germany/ }) });
  await germany.getByRole('button').last().tap();
  const open = page.getByRole('button', { name: /^Open Germany, May 2026/ });
  await expect(open).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Europe' })).toBeVisible();
  await open.tap();
  await expect(page.getByRole('heading', { level: 1, name: 'Germany' })).toBeVisible();
});

test('a pick in the period menu after scrolling back up does not slide the row away and back', async ({
  page,
}) => {
  await page.goto('/dashboard?region=eu&market=de');
  const period = page.getByRole('button', { name: /^Period: / });
  const row = period.locator('xpath=..');
  const main = page.locator('#main');
  const box = await main.boundingBox();
  await page.mouse.move((box?.x ?? 0) + 100, (box?.y ?? 0) + 300);
  await page.mouse.wheel(0, 900);
  await expect(row).toHaveCSS('opacity', '0');
  await page.mouse.wheel(0, -150);
  await expect(row).toHaveCSS('opacity', '1');
  await period.click();
  // Marks the page if the row hides at any moment while the pick changes the
  // page's height and the browser moves the page to keep the view in place.
  await page.evaluate(() => {
    const header = document.querySelector('header');
    if (!header) return;
    new MutationObserver(() => {
      if (header.hasAttribute('data-controls-hidden')) document.body.dataset.rowHid = 'yes';
    }).observe(header, { attributes: true });
  });
  await page.getByRole('dialog').getByRole('button', { name: /^Mar/ }).click();
  await expect(page).toHaveURL(/[?&]period=2026-03(&|$)/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(row).toHaveCSS('opacity', '1');
  await expect(page.locator('body'), 'the row stayed').not.toHaveAttribute('data-row-hid', 'yes');
});

test('the period row stays above the dashboard, its sticky table cells too; a region pick does not slide it', async ({
  page,
}) => {
  await page.goto('/dashboard?region=eu&mode=analyst');
  const period = page.getByRole('button', { name: /^Period: / });
  const row = period.locator('xpath=..');
  // Put a sticky first-column cell of the markets table right under the row
  // (a scroll from code: the row stays where it is).
  const onTop = await row.evaluate((el) => {
    const main = document.getElementById('main');
    const cell = document.querySelector<HTMLElement>('#main td.sticky');
    if (!main || !cell) return 'no cell';
    const r = el.getBoundingClientRect();
    const c = cell.getBoundingClientRect();
    main.scrollTop += c.top + c.height / 2 - (r.top + r.height / 2);
    const now = cell.getBoundingClientRect();
    const hit = document.elementFromPoint(now.left + now.width / 2, now.top + now.height / 2);
    return hit !== null && el.contains(hit) ? 'row' : `covered by ${hit?.textContent ?? '?'}`;
  });
  expect(onTop, 'the row is on top of the sticky cell').toBe('row');
  await expect(row).toHaveCSS('opacity', '1');

  await page.evaluate(() => {
    const header = document.querySelector('header');
    if (!header) return;
    new MutationObserver(() => {
      if (header.hasAttribute('data-controls-hidden')) document.body.dataset.rowHid = 'yes';
    }).observe(header, { attributes: true });
  });
  await page.getByRole('button', { name: /^Region: Europe/ }).click();
  await page.getByRole('menuitemradio', { name: 'APAC' }).click();
  await expect(page).toHaveURL(/[?&]region=apac(&|$)/);
  await expect(row).toHaveCSS('opacity', '1');
  await expect(page.locator('body'), 'the row stayed').not.toHaveAttribute('data-row-hid', 'yes');
});
