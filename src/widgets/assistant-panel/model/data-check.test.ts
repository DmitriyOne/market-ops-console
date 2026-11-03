import { describe, expect, it } from 'vitest';

import rawData from '@/data/data.json';
import rawFixtures from '@/data/fixtures.json';
import { datasetSchema, type Fixture, fixturesSchema } from '@/shared/api';

import { buildDataCheck } from './data-check';

const ds = datasetSchema.parse(rawData);
const fixtures = fixturesSchema.parse(rawFixtures);
const all: Fixture[] = [fixtures.default, ...fixtures.fixtures];

function check(id: string) {
  const fixture = all.find((f) => f.id === id);
  if (!fixture) throw new Error(`no fixture ${id}`);
  return buildDataCheck(ds, fixture.answer.citations);
}

type Expected = null | {
  expanded: boolean;
  notMentioned: string[];
  regionGaps: [string, string[]][];
};

const EXPECTED: Record<string, Expected> = {
  'at-risk': { expanded: true, notMentioned: ['es', 'gb', 'fr'], regionGaps: [] },
  'forecast-miss': { expanded: true, notMentioned: ['es', 'gb', 'fr'], regionGaps: [] },
  'apac-vs-europe': {
    expanded: true,
    notMentioned: [],
    regionGaps: [['eu', ['de', 'es', 'it', 'gb', 'fr']]],
  },
  'summary-long': {
    expanded: true,
    notMentioned: [],
    regionGaps: [['eu', ['es', 'it', 'gb', 'fr']]],
  },
  'germany-dip': { expanded: false, notMentioned: [], regionGaps: [] },
  'next-year': null,
  error: null,
  default: null,
};

describe('buildDataCheck', () => {
  it('has an expectation for every fixture', () => {
    expect(all.map((f) => f.id).sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  it.each(Object.entries(EXPECTED))('%s', (id, expected) => {
    const result = check(id);
    if (expected === null) {
      expect(result).toBeNull();
      return;
    }
    expect(result).not.toBeNull();
    expect(result?.expanded).toBe(expected.expanded);
    expect(result?.notMentioned.map((m) => m.id)).toEqual(expected.notMentioned);
    expect(result?.regionGaps.map((g) => [g.regionId, g.markets.map((m) => m.id)])).toEqual(
      expected.regionGaps,
    );
  });

  it('has one row per cited scope and period', () => {
    expect(check('germany-dip')?.rows.map((r) => r.key)).toHaveLength(3);
  });

  it('always has a portfolio row for the latest month', () => {
    // Above 100 while the forecast-miss answer talks about a miss.
    expect(check('forecast-miss')?.portfolio.attainmentPct.value).toBeCloseTo(100.4, 1);
  });

  it('gives a reason for a non-on-track market: growth when attainment is above plan', () => {
    const result = buildDataCheck(ds, [{ marketId: 'es' }, { marketId: 'de' }]);
    expect(result?.rows.map((r) => [r.resolved.scope.marketId, r.reason])).toEqual([
      ['es', { kind: 'growth', value: -4.6 }],
      ['de', { kind: 'attainment', value: 92.0 }],
    ]);
  });

  it('has no reason or status for a past month', () => {
    const row = check('germany-dip')?.rows.find((r) => r.resolved.period === '2026-03');
    expect(row?.status).toBeNull();
    expect(row?.reason).toBeNull();
  });

  it.each([
    ['at-risk', ['de', 'es', 'it', 'gb', 'br', 'fr']],
    ['apac-vs-europe', ['de', 'es', 'it', 'gb', 'fr', 'cn', 'jp']],
    ['germany-dip', ['de']],
  ])('%s highlights the listed markets, non-on-track first', (id, ids) => {
    expect(check(id)?.highlightIds).toEqual(ids);
  });

  it('summarises how many markets need attention and how many the answer names', () => {
    expect(check('at-risk')?.attention).toEqual([
      { regionId: null, needAttention: 6, markets: 13, named: 3 },
    ]);
    expect(check('apac-vs-europe')?.attention).toEqual([
      { regionId: 'eu', needAttention: 5, markets: 5, named: 0 },
    ]);
    expect(check('germany-dip')?.attention).toEqual([]);
  });

  it('gives a reason for a not-mentioned market above plan', () => {
    expect(check('at-risk')?.reasons.es).toEqual({ kind: 'growth', value: -4.6 });
  });

  it('skips unknown citations but keeps the block', () => {
    const result = buildDataCheck(ds, [{ marketId: 'xx', label: 'Atlantis' }]);
    expect(result?.rows).toEqual([]);
    expect(result?.expanded).toBe(false);
  });
});
