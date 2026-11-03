import { describe, expect, it } from 'vitest';

import { ds } from './test-dataset';
import { anomaliesInScope, trendSeries } from './trend';

describe('trendSeries', () => {
  it('has one point per period with summed values', () => {
    const series = trendSeries(ds, {});
    expect(series).toHaveLength(24);
    expect(series.at(-1)).toMatchObject({ period: '2026-05', actual: 22850419, units: 103868 });
  });

  it('narrows to market × product', () => {
    expect(trendSeries(ds, { marketId: 'de', productId: 'veltrix' }).at(-1)).toMatchObject({
      actual: 574449,
      units: 3431,
    });
  });
});

describe('anomaliesInScope', () => {
  it('collects anomalies of the markets in scope', () => {
    const eu = anomaliesInScope(ds, { regionId: 'eu' });
    expect(eu).toHaveLength(1);
    expect(eu[0]).toMatchObject({ marketId: 'de', period: '2026-03', type: 'dip' });
    expect(anomaliesInScope(ds, { regionId: 'apac' })).toEqual([]);
  });
});
