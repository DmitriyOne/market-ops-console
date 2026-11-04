import { describe, expect, it } from 'vitest';

import { marketMap } from './market-map';
import { ds } from './test-dataset';

const sum = (market: string, periods: string[], key: 'actual' | 'forecast', product?: string) =>
  ds.series
    .filter(
      (r) =>
        r.marketId === market &&
        periods.includes(r.period) &&
        (!product || r.productId === product),
    )
    .reduce((total, r) => total + r[key], 0);

describe('marketMap', () => {
  it('latest month, status: stored status per market, counted in the legend', () => {
    const map = marketMap(ds, {}, '2026-05', '1m', 'status', []);
    expect(map.metric).toBe('status');
    expect(map.notice).toBeNull();
    expect(map.legend).toEqual({
      kind: 'status',
      counts: { on_track: 7, at_risk: 4, off_track: 2 },
    });
    const de = map.items.find((i) => i.id === 'de');
    expect(de).toMatchObject({
      numericIso: '276',
      regionId: 'eu',
      inScope: true,
      status: 'off_track',
      value: { value: 92, source: 'data' },
      step: null,
    });
  });

  it('Spain is off track at 104.5 %: attainment paints it on the plus side', () => {
    const es = marketMap(ds, {}, '2026-05', '1m', 'attainment', []).items.find(
      (i) => i.id === 'es',
    );
    expect(es).toMatchObject({ status: 'off_track', value: { value: 104.5 }, step: 3 });
  });

  it('items in Tab order: regions in data order, then market names', () => {
    const ids = marketMap(ds, {}, '2026-05', '1m', 'status', []).items.map((i) => i.id);
    expect(ids).toEqual([
      'ca',
      'us',
      'fr',
      'de',
      'it',
      'es',
      'gb',
      'au',
      'cn',
      'in',
      'jp',
      'br',
      'mx',
    ]);
  });

  it('every item carries the world-atlas id', () => {
    const items = marketMap(ds, {}, '2026-05', '1m', 'status', []).items;
    expect(items.every((i) => /^\d{3}$/.test(i.numericIso))).toBe(true);
  });

  it('status off the latest view falls back to attainment with a notice', () => {
    for (const [period, range] of [
      ['2026-04', '1m'],
      ['2026-05', '3m'],
      ['2026-05', '12m'],
    ] as const) {
      const map = marketMap(ds, {}, period, range, 'status', []);
      expect(map.metric).toBe('attainment');
      expect(map.notice).toBe('statusLatestOnly');
      expect(map.items.every((i) => i.status === null)).toBe(true);
      expect(map.legend.kind).toBe('scale');
    }
  });

  it('share off the latest view falls back to attainment', () => {
    const map = marketMap(ds, {}, '2026-04', '1m', 'share', []);
    expect([map.metric, map.notice]).toEqual(['attainment', 'shareLatestOnly']);
  });

  it('share with a product falls back to attainment, even at the latest month', () => {
    const scope = { regionId: 'eu', marketId: 'de', productId: 'veltrix' };
    const map = marketMap(ds, scope, '2026-05', '1m', 'share', []);
    expect([map.metric, map.notice]).toEqual(['attainment', 'sharePerProduct']);
  });

  it('share at the latest month uses the stored share', () => {
    const map = marketMap(ds, {}, '2026-05', '1m', 'share', []);
    expect(map.notice).toBeNull();
    const de = map.items.find((i) => i.id === 'de');
    expect(de?.value.source).toBe('data');
    expect(de?.step).not.toBeNull();
  });

  it('a product colours every market by that product; status stays market level', () => {
    const scope = { regionId: 'eu', marketId: 'de', productId: 'veltrix' };
    const map = marketMap(ds, scope, '2026-05', '1m', 'attainment', []);
    const fr = map.items.find((i) => i.id === 'fr');
    const expected =
      (sum('fr', ['2026-05'], 'actual', 'veltrix') /
        sum('fr', ['2026-05'], 'forecast', 'veltrix')) *
      100;
    expect(fr?.value.source).toBe('calculated');
    expect(fr?.value.value).toBeCloseTo(expected, 6);
    expect(fr?.status).toBe(ds.markets.find((m) => m.id === 'fr')?.kpis.status);
  });

  it('revenue in a window clipped at the first period counts the months present', () => {
    // "12 months to Aug 2024" holds three months of data.
    const map = marketMap(ds, {}, '2024-08', '12m', 'revenue', []);
    const periods = ['2024-06', '2024-07', '2024-08'];
    const us = map.items.find((i) => i.id === 'us');
    expect(us?.value.value).toBeCloseTo(sum('us', periods, 'actual'), 6);
    expect(map.legend.kind === 'scale' && map.legend.steps[1]).toMatchObject({
      from: 3_000_000,
      to: 4_500_000,
    });
  });

  it('a region drill keeps every market on the map but counts the region only', () => {
    const map = marketMap(ds, { regionId: 'eu', marketId: 'de' }, '2026-05', '1m', 'status', []);
    expect(map.items).toHaveLength(13);
    expect(map.items.filter((i) => i.inScope).map((i) => i.id)).toEqual([
      'fr',
      'de',
      'it',
      'es',
      'gb',
    ]);
    expect(map.legend).toEqual({
      kind: 'status',
      counts: { on_track: 0, at_risk: 3, off_track: 2 },
    });
    expect(map.items.filter((i) => i.current).map((i) => i.id)).toEqual(['de']);
  });

  it('scale counts add up to the markets in scope', () => {
    const map = marketMap(ds, { regionId: 'apac' }, '2026-03', '3m', 'growth', []);
    expect(map.legend.kind).toBe('scale');
    if (map.legend.kind !== 'scale') return;
    expect(map.legend.steps).toHaveLength(6);
    expect(map.legend.steps.reduce((n, s) => n + s.count, 0)).toBe(4);
  });

  it('marks the markets listed by the assistant', () => {
    const map = marketMap(ds, {}, '2026-05', '1m', 'status', ['es', 'fr']);
    expect(map.items.filter((i) => i.selected).map((i) => i.id)).toEqual(['fr', 'es']);
  });
});
