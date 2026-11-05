import { describe, expect, it } from 'vitest';

import { heatMap } from './heat-map';
import { ds } from './test-dataset';

const cell = (view: ReturnType<typeof heatMap>, market: string, period: string) =>
  view.rows.find((r) => r.id === market)?.cells.find((c) => c.period === period);

const value = (view: ReturnType<typeof heatMap>, market: string, period: string) =>
  cell(view, market, period)?.value ?? Number.NaN;

describe('heatMap', () => {
  it('status has no months: growth instead, with a notice, 13 × 24 in map order', () => {
    const view = heatMap(ds, {}, '2026-05', '1m', 'status', []);
    expect(view.metric).toBe('growth');
    expect(view.notice).toBe('statusPerMonth');
    expect(view.periods).toHaveLength(24);
    expect(view.rows).toHaveLength(13);
    expect(view.rows.map((r) => r.id).slice(0, 2)).toEqual(['ca', 'us']);
    expect(view.rows.every((r) => r.cells.length === 24)).toBe(true);
  });

  it('shows Germany’s March 2026 dip as growth, in the lowest step, with its anomaly', () => {
    const view = heatMap(ds, {}, '2026-05', '1m', 'status', []);
    expect(value(view, 'de', '2026-03')).toBeCloseTo(-31, 0);
    expect(cell(view, 'de', '2026-03')).toMatchObject({ step: 0, anomaly: { type: 'dip' } });
    expect(cell(view, 'de', '2026-02')?.anomaly).toBeNull();
  });

  it('share has no months either', () => {
    const view = heatMap(ds, {}, '2026-05', '1m', 'share', []);
    expect(view).toMatchObject({ metric: 'growth', notice: 'sharePerMonth' });
  });

  it('attainment per month: the dip does not show (the forecast fell too)', () => {
    const view = heatMap(ds, {}, '2026-05', '1m', 'attainment', []);
    expect(view.notice).toBeNull();
    expect(value(view, 'de', '2026-03')).toBeCloseTo(92.2, 0);
    expect(cell(view, 'de', '2026-03')?.step).toBe(0);
  });

  it('revenue steps are judged per month', () => {
    const view = heatMap(ds, {}, '2026-05', '1m', 'revenue', []);
    const cn = view.rows.find((r) => r.id === 'cn');
    expect(cn?.cells.every((c) => c.step !== null && c.step >= 3)).toBe(true);
  });

  it('follows the scope like the tiles', () => {
    expect(heatMap(ds, { regionId: 'eu' }, '2026-05', '1m', 'growth', []).rows).toHaveLength(5);
    const market = heatMap(ds, { regionId: 'eu', marketId: 'de' }, '2026-05', '1m', 'growth', []);
    expect(market.rows).toHaveLength(5);
    expect(market.rows.filter((r) => r.current).map((r) => r.id)).toEqual(['de']);
  });

  it('a product narrows each market to it', () => {
    const view = heatMap(
      ds,
      { regionId: 'eu', marketId: 'de', productId: 'veltrix' },
      '2026-05',
      '1m',
      'attainment',
      [],
    );
    const row = ds.series.find(
      (r) => r.marketId === 'fr' && r.productId === 'veltrix' && r.period === '2025-01',
    );
    expect(row).toBeDefined();
    if (!row) return;
    expect(value(view, 'fr', '2025-01')).toBeCloseTo((row.actual / row.forecast) * 100, 6);
  });

  it('marks the window of the period and range', () => {
    const view = heatMap(ds, {}, '2026-05', '3m', 'growth', []);
    expect(view.window).toEqual(['2026-03', '2026-04', '2026-05']);
    const de = view.rows.find((r) => r.id === 'de');
    expect(de?.cells.filter((c) => c.inWindow).map((c) => c.period)).toEqual(view.window);
  });

  it('marks selected markets of the scope; others are not rows', () => {
    const view = heatMap(ds, { regionId: 'eu' }, '2026-05', '1m', 'growth', ['de', 'jp']);
    expect(view.rows.filter((r) => r.selected).map((r) => r.id)).toEqual(['de']);
    expect(view.rows.some((r) => r.id === 'jp')).toBe(false);
  });
});
