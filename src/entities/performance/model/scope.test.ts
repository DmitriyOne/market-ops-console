import { describe, expect, it } from 'vitest';

import { isLatestSnapshot, marketsInScope, periodsInRange } from './scope';
import { ds } from './test-dataset';

const P = ds.meta.periods;

describe('periodsInRange', () => {
  it('returns the window ending at the given period', () => {
    expect(periodsInRange(P, '2026-05', '3m')).toEqual(['2026-03', '2026-04', '2026-05']);
    expect(periodsInRange(P, '2026-05', '1m')).toEqual(['2026-05']);
    const year = periodsInRange(P, '2026-05', '12m');
    expect(year).toHaveLength(12);
    expect(year.at(-1)).toBe('2026-05');
    expect(year[0]).toBe('2025-06');
  });

  it('clips at the first period', () => {
    expect(periodsInRange(P, '2024-07', '3m')).toEqual(['2024-06', '2024-07']);
  });

  it('returns nothing for an unknown period', () => {
    expect(periodsInRange(P, '2030-01', '1m')).toEqual([]);
  });
});

describe('isLatestSnapshot', () => {
  it('is true only for the latest period with a 1-month range', () => {
    expect(isLatestSnapshot(ds, '2026-05', '1m')).toBe(true);
    expect(isLatestSnapshot(ds, '2026-05', '3m')).toBe(false);
    expect(isLatestSnapshot(ds, '2026-04', '1m')).toBe(false);
  });
});

describe('marketsInScope', () => {
  it('narrows by region and market', () => {
    expect(marketsInScope(ds, {})).toHaveLength(13);
    expect(marketsInScope(ds, { regionId: 'eu' }).map((m) => m.id)).toEqual(
      expect.arrayContaining(['de', 'gb', 'fr', 'it', 'es']),
    );
    expect(marketsInScope(ds, { regionId: 'eu' })).toHaveLength(5);
    expect(marketsInScope(ds, { regionId: 'eu', marketId: 'de' }).map((m) => m.id)).toEqual(['de']);
  });
});
