import { describe, expect, it } from 'vitest';

import { ds } from './test-dataset';
import { trendView } from './trend-view';

describe('trendView', () => {
  it('24 months for the scope with the selected window', () => {
    const v = trendView(ds, {}, '2026-03', '3m');
    expect(v.points).toHaveLength(24);
    expect(v.window).toEqual({ from: '2026-01', to: '2026-03' });
  });

  it('marks the anomalies in scope at their month, with the market name', () => {
    const v = trendView(ds, { regionId: 'eu', marketId: 'de' }, '2026-05', '1m');
    expect(v.anomalies).toEqual([
      expect.objectContaining({ period: '2026-03', marketName: 'Germany', type: 'dip' }),
    ]);
    const march = v.points.find((p) => p.period === '2026-03');
    expect(v.anomalies[0]?.actual).toBe(march?.actual);
  });

  it('no anomaly outside its market', () => {
    expect(trendView(ds, { regionId: 'apac' }, '2026-05', '1m').anomalies).toEqual([]);
  });

  it('the portfolio sees every anomaly in the data', () => {
    expect(trendView(ds, {}, '2026-05', '1m').anomalies.map((a) => a.marketName)).toEqual([
      'Germany',
    ]);
  });
});
