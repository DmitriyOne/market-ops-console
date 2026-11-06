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

test('settings sheet: a pick closes the currency menu in place, not with a jump to the other side', async ({
  page,
}) => {
  // The screen the jump was seen on: the menu fits below the row until the sheet slides down.
  await page.setViewportSize({ width: 425, height: 791 });
  await page.goto('/dashboard?region=eu&market=de');
  await page.getByRole('button', { name: /^Settings/ }).click();
  await page.getByRole('button', { name: /^Currency/ }).click();
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  // The menu's top on every frame until it is gone; the largest step between two frames.
  await page.evaluate(() => {
    const el = document.querySelector('[data-slot="dropdown-menu-content"]');
    if (!el) return;
    let last = el.getBoundingClientRect().top;
    let jump = 0;
    const check = () => {
      if (!el.isConnected) {
        document.body.dataset.menuJump = String(Math.round(jump));
        return;
      }
      const top = el.getBoundingClientRect().top;
      jump = Math.max(jump, Math.abs(top - last));
      last = top;
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });
  await menu.getByRole('menuitemradio', { name: /GBP/ }).click();
  await expect(page).toHaveURL(/[?&]currency=GBP(&|$)/);
  await expect(page.locator('body')).toHaveAttribute('data-menu-jump', /^\d+$/);
  const jump = Number(await page.locator('body').getAttribute('data-menu-jump'));
  expect(jump, 'largest move between two frames, px').toBeLessThan(40);
});

test('period and mode share one row in the header, side by side', async ({ page }) => {
  await page.goto('/dashboard?range=12m');
  const period = page.getByRole('banner').getByRole('button', { name: /^Period: / });
  const mode = page.getByRole('banner').getByRole('radiogroup', { name: 'View' });
  const [p, m] = [await period.boundingBox(), await mode.boundingBox()];
  expect(
    Math.abs((p?.y ?? 0) + (p?.height ?? 0) / 2 - ((m?.y ?? 100) + (m?.height ?? 0) / 2)),
    'same row',
  ).toBeLessThan(4);
  // In the header, not over the dashboard.
  const header = await page.getByRole('banner').boundingBox();
  expect((m?.y ?? 0) + (m?.height ?? 0)).toBeLessThanOrEqual(
    (header?.y ?? 0) + (header?.height ?? 0),
  );
});
