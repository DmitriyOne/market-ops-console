import { describe, expect, it } from 'vitest';

import { comparisonRadar } from './radar';
import { ds } from './test-dataset';

const germany = ds.markets.find((m) => m.id === 'de');

describe('comparisonRadar', () => {
  it('nothing selected: the four regions and the portfolio, every axis', () => {
    const view = comparisonRadar(ds, {}, '2026-05', '1m', []);
    expect(view.compared).toBe('regions');
    expect(view.series.map((s) => s.id)).toEqual(['na', 'eu', 'apac', 'latam']);
    expect(view.reference.kind).toBe('portfolio');
    expect(view.axes).toEqual(['growth', 'attainment', 'share', 'revenue', 'momentum']);
    expect(view.removed).toEqual([]);
    expect(view.basis).toBe('regions');
    expect(view.hidden).toBe(0);
  });

  it('selected markets: stored KPIs at the latest month, momentum from series', () => {
    const view = comparisonRadar(ds, {}, '2026-05', '1m', ['de', 'es']);
    expect(view.compared).toBe('markets');
    expect(view.series.map((s) => s.id)).toEqual(['de', 'es']);
    const de = view.series[0];
    expect(de?.values.growth?.raw).toBe(germany?.kpis.growthPct);
    expect(de?.values.momentum?.raw).toBeCloseTo(-11.8, 1);
    for (const s of view.series) {
      for (const v of Object.values(s.values)) {
        expect(v.scaled).toBeGreaterThanOrEqual(0);
        expect(v.scaled).toBeLessThanOrEqual(1);
      }
    }
  });

  it('scales each axis worst → best across the 13 markets', () => {
    const cn = comparisonRadar(ds, {}, '2026-05', '1m', ['cn']).series[0];
    expect(cn?.values.growth?.scaled).toBe(1);
    const de = comparisonRadar(ds, {}, '2026-05', '1m', ['de']).series[0];
    expect(de?.values.growth?.scaled).toBe(0);
  });

  it('more than four selected: the first four, in selection order', () => {
    const view = comparisonRadar(ds, {}, '2026-05', '1m', ['jp', 'de', 'es', 'fr', 'it']);
    expect(view.series.map((s) => s.id)).toEqual(['jp', 'de', 'es', 'fr']);
    expect(view.basis).toBe('selection');
    expect(view.hidden).toBe(1);
  });

  it('nothing selected, a region open: its markets, the first four', () => {
    const view = comparisonRadar(ds, { regionId: 'eu' }, '2026-05', '1m', []);
    expect(view).toMatchObject({ compared: 'markets', basis: 'region', hidden: 1 });
    expect(view.series.map((s) => s.id)).toEqual(['fr', 'de', 'it', 'es']);
  });

  it('nothing selected, a market open: it first, then its region’s neighbours', () => {
    const view = comparisonRadar(ds, { regionId: 'eu', marketId: 'gb' }, '2026-05', '1m', []);
    expect(view).toMatchObject({ compared: 'markets', basis: 'market', hidden: 1 });
    expect(view.series.map((s) => s.id)).toEqual(['gb', 'fr', 'de', 'it']);
    const small = comparisonRadar(ds, { regionId: 'na', marketId: 'us' }, '2026-05', '1m', []);
    expect(small.series.map((s) => s.id)).toEqual(['us', 'ca']);
    expect(small.hidden).toBe(0);
  });

  it('a selection wins over the open market', () => {
    const view = comparisonRadar(ds, { regionId: 'eu', marketId: 'gb' }, '2026-05', '1m', ['jp']);
    expect(view.basis).toBe('selection');
    expect(view.series.map((s) => s.id)).toEqual(['jp']);
  });

  it('unknown ids in the selection are ignored', () => {
    const view = comparisonRadar(ds, {}, '2026-05', '1m', ['xx']);
    expect(view.compared).toBe('regions');
  });

  it('a 3-month window has no share axis', () => {
    const view = comparisonRadar(ds, {}, '2026-05', '3m', ['de']);
    expect(view.axes).not.toContain('share');
    expect(view.removed).toEqual([{ axis: 'share', notice: 'shareLatestOnly' }]);
    expect(view.series[0]?.values.share).toBeUndefined();
  });

  it('an early month has no momentum (it needs six months) and no share', () => {
    const view = comparisonRadar(ds, {}, '2024-08', '1m', ['de']);
    expect(view.axes).toEqual(['growth', 'attainment', 'revenue']);
    expect(view.removed.map((r) => r.notice)).toEqual(['shareLatestOnly', 'momentumTooEarly']);
  });

  it('a window clipped at the first month still works', () => {
    const view = comparisonRadar(ds, {}, '2024-06', '3m', []);
    expect(view.series).toHaveLength(4);
    expect(view.axes).toEqual(['growth', 'attainment', 'revenue']);
  });

  it('regions: revenue is scaled across the regions; the reference is their mean', () => {
    const view = comparisonRadar(ds, {}, '2026-05', '1m', []);
    const revenue = view.series.map((s) => s.values.revenue?.raw ?? 0);
    const scaled = view.series.map((s) => s.values.revenue?.scaled);
    expect(scaled).toContain(0);
    expect(scaled).toContain(1);
    const mean = revenue.reduce((a, b) => a + b, 0) / revenue.length;
    expect(view.reference.values.revenue?.raw).toBeCloseTo(mean, 6);
  });

  it('the reference uses portfolio ratios', () => {
    const view = comparisonRadar(ds, {}, '2026-05', '1m', ['de']);
    expect(view.reference.values.attainment?.raw).toBeCloseTo(100.4, 0);
    expect(view.reference.values.growth?.raw).toBeCloseTo(7.3, 0);
  });

  it('ignores the product: the radar stays at market level', () => {
    const plain = comparisonRadar(ds, {}, '2026-05', '1m', ['de']);
    const product = comparisonRadar(
      ds,
      { regionId: 'eu', marketId: 'de', productId: 'veltrix' },
      '2026-05',
      '1m',
      ['de'],
    );
    expect(product.series).toEqual(plain.series);
    expect(product.productIgnored).toBe(true);
    expect(plain.productIgnored).toBe(false);
  });
});
