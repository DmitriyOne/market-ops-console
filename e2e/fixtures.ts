import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test as base } from '@playwright/test';

/** WCAG 2.1 A and AA, the level the spec commits to (§11). */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

type Fixtures = {
  /** Scans the page as it is now; fails with one line per violation. */
  expectNoAxeViolations: (page?: Page) => Promise<void>;
};

export const test = base.extend<Fixtures>({
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
