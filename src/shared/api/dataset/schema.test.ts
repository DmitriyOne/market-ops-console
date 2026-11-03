import { describe, expect, it } from 'vitest';

import raw from '@/data/data.json';

import { datasetSchema } from './schema';

const clone = (): typeof raw => structuredClone(raw);

describe('datasetSchema', () => {
  it('accepts data.json', () => {
    const ds = datasetSchema.parse(raw);
    expect(ds.series).toHaveLength(1560);
    expect(ds.markets).toHaveLength(13);
    expect(ds.meta.periods).toHaveLength(24);
  });

  it('rejects a series row pointing at an unknown market', () => {
    const bad = clone();
    const row = bad.series[0];
    if (row) row.marketId = 'zz';
    expect(datasetSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a series row outside meta.periods', () => {
    const bad = clone();
    const row = bad.series[0];
    if (row) row.period = '2027-01';
    expect(datasetSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a latestPeriod that is not the last period', () => {
    const bad = clone();
    bad.meta.latestPeriod = '2026-04';
    expect(datasetSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a market in an unknown region', () => {
    const bad = clone();
    const market = bad.markets[0];
    if (market) market.regionId = 'mars';
    expect(datasetSchema.safeParse(bad).success).toBe(false);
  });
});
