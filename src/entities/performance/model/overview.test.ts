import { describe, expect, it } from 'vitest';

import { overviewKpis } from './overview';
import { ds } from './test-dataset';

describe('overviewKpis', () => {
  it('portfolio, May 2026, 1 month: the figures from spec §4', () => {
    const o = overviewKpis(ds, {}, '2026-05', '1m');
    expect((o.kpis.revenue.value ?? 0) / 1e6).toBeCloseTo(22.85, 2);
    expect(o.kpis.attainmentPct.value).toBeCloseTo(100.4, 1);
    expect(o.kpis.growthPct.value).toBeCloseTo(7.3, 1);
    expect(o.kpis.revenue.source).toBe('calculated');
    expect(o.risk).toEqual({ kind: 'count', atRisk: 4, offTrack: 2, total: 13 });
  });

  it('window totals back the supporting lines', () => {
    const o = overviewKpis(ds, {}, '2026-05', '1m');
    expect(o.totals.actual).toBe(o.kpis.revenue.value);
    expect(o.totals.priorYear).toBeGreaterThan(0);
    expect(o.totals.actual / o.totals.forecast).toBeCloseTo(1.004, 3);
  });

  it('a market in the latest month uses its stored KPIs', () => {
    const o = overviewKpis(ds, { regionId: 'eu', marketId: 'de' }, '2026-05', '1m');
    expect(o.kpis.attainmentPct).toEqual({ value: 92, source: 'data' });
    expect(o.risk).toEqual({ kind: 'count', atRisk: 0, offTrack: 1, total: 1 });
  });

  it('status is not counted off the latest month or for a wider range', () => {
    expect(overviewKpis(ds, {}, '2026-03', '1m').risk).toEqual({ kind: 'latestOnly' });
    expect(overviewKpis(ds, {}, '2026-05', '3m').risk).toEqual({ kind: 'latestOnly' });
  });

  it('status is per market, so a product has none', () => {
    const scope = { regionId: 'eu', marketId: 'de', productId: 'veltrix' };
    expect(overviewKpis(ds, scope, '2026-05', '1m').risk).toEqual({ kind: 'perProduct' });
  });

  it('sparklines are the 12 months ending at the period', () => {
    const o = overviewKpis(ds, {}, '2026-03', '1m');
    expect(o.spark.periods).toHaveLength(12);
    expect(o.spark.periods.at(-1)).toBe('2026-03');
    expect(o.spark.periods[0]).toBe('2025-04');
    expect(o.spark.revenue.at(-1)).toBe(o.kpis.revenue.value);
    expect(o.spark.attainmentPct).toHaveLength(12);
    expect(o.spark.growthPct).toHaveLength(12);
  });

  it('early periods give a shorter sparkline, never invented months', () => {
    expect(overviewKpis(ds, {}, '2024-08', '1m').spark.periods).toEqual([
      '2024-06',
      '2024-07',
      '2024-08',
    ]);
  });
});
