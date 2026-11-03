import type { Fixture, Fixtures } from './contract';

/** First fixture with a keyword contained in the question (case-insensitive), else the default. */
export function pickFixture(fixtures: Fixtures, question: string): Fixture {
  const q = question.toLowerCase();
  return (
    fixtures.fixtures.find((f) => (f.keywords ?? []).some((keyword) => q.includes(keyword))) ??
    fixtures.default
  );
}
