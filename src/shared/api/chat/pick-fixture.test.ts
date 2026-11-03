import { describe, expect, it } from 'vitest';

import raw from '@/data/fixtures.json';

import { fixturesSchema } from './contract';
import { pickFixture } from './pick-fixture';

const fixtures = fixturesSchema.parse(raw);

describe('pickFixture', () => {
  it.each([
    ['Which markets are at risk this quarter, and why?', 'at-risk'],
    ["Why did Germany's revenue dip in March 2026?", 'germany-dip'],
    ['Compare APAC and Europe on growth and forecast attainment', 'apac-vs-europe'],
    ["What's driving the portfolio's forecast miss?", 'forecast-miss'],
    ['Will sales grow next year?', 'next-year'],
    ['force error', 'error'],
    ['hello', 'default'],
  ])('routes %j to %s', (question, id) => {
    expect(pickFixture(fixtures, question).id).toBe(id);
  });

  it('matches case-insensitively', () => {
    expect(pickFixture(fixtures, 'FORCE ERROR').id).toBe('error');
  });
});
