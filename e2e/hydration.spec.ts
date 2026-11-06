import { expect, test } from './fixtures';

// The static page and the browser's first render must agree (React logs a
// mismatch as #418 in a production build, "Hydration failed" in development).
const MISMATCH = /Hydration failed|Minified React error #4(18|19|23|25)\b|did not match/;

for (const url of ['/dashboard', '/dashboard?region=eu&market=de&mode=analyst']) {
  test(`${url} hydrates without a mismatch, the bell's count included`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error' && MISMATCH.test(m.text())) errors.push(m.text().slice(0, 300));
    });
    page.on('pageerror', (e) => {
      if (MISMATCH.test(e.message)) errors.push(e.message.slice(0, 300));
    });
    // A slow phone's CPU: hydration takes long enough for the alert rules to
    // arrive before the bell's part of the page hydrates (seen in development).
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
    await page.goto(url);
    // The count arrives after hydration; then nothing is left to compare.
    await expect(
      page.getByRole('button', { name: /^Alerts, \d+ markets? flagged$/ }).first(),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
}
