import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test as base } from '@playwright/test';

/** WCAG 2.1 A and AA, the level the spec commits to (§11). */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** One item of a Sentry envelope: `event`, `session`, `transaction`… */
export type SentryItem = { type: string; payload: Record<string, unknown>; raw: string };

type Fixtures = {
  /** Scans the page as it is now; fails with one line per violation. */
  expectNoAxeViolations: (page?: Page) => Promise<void>;
  /**
   * Every Sentry envelope the browser sent, caught at /monitoring (ADR
   * 0019). On for every test: the tunnel answers 200 without forwarding, and
   * the test fails if the browser ever calls sentry.io itself.
   */
  sentry: { items: () => SentryItem[]; raw: () => string[] };
};

function parseEnvelope(body: string): SentryItem[] {
  const lines = body.split('\n').filter((line) => line.trim() !== '');
  const items: SentryItem[] = [];
  // Line 0 is the envelope header; then an item header and its payload.
  for (let i = 1; i + 1 < lines.length; i += 2) {
    const header: unknown = JSON.parse(lines[i] ?? '{}');
    const payload: unknown = JSON.parse(lines[i + 1] ?? '{}');
    const type =
      typeof header === 'object' && header !== null && 'type' in header ? String(header.type) : '';
    items.push({
      type,
      payload: typeof payload === 'object' && payload !== null ? { ...payload } : {},
      raw: lines[i + 1] ?? '',
    });
  }
  return items;
}

export const test = base.extend<Fixtures>({
  sentry: [
    async ({ page }, provide) => {
      const bodies: string[] = [];
      const direct: string[] = [];
      page.on('request', (request) => {
        if (/sentry\.io/.test(new URL(request.url()).hostname)) direct.push(request.url());
      });
      await page.route('**/monitoring*', async (route) => {
        bodies.push(route.request().postData() ?? '');
        await route.fulfill({ status: 200, body: '{}' });
      });
      await provide({ raw: () => [...bodies], items: () => bodies.flatMap(parseEnvelope) });
      expect(direct, 'the browser called sentry.io directly').toEqual([]);
    },
    { auto: true },
  ],
  // `provide` is Playwright's `use`; renamed so React's hook rule does not
  // mistake it for a hook.
  expectNoAxeViolations: async ({ page }, provide) => {
    await provide(async (target = page) => {
      // A sheet or popover still fading in reads as low contrast: let every
      // finite animation end first (spinners and pulses never do).
      await target.evaluate(() =>
        Promise.all(
          document
            .getAnimations()
            .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
            .map((a) => a.finished.catch(() => undefined)),
        ),
      );
      const { violations } = await new AxeBuilder({ page: target }).withTags(WCAG_TAGS).analyze();
      const lines = violations.map(
        (v) =>
          `${v.id} (${String(v.nodes.length)}): ${v.help} — ${v.nodes[0]?.target.join(' ') ?? ''}`,
      );
      expect(lines, 'axe violations').toEqual([]);
    });
  },
});

export { expect };
