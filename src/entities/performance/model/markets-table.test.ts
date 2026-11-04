import { describe, expect, it } from 'vitest';

import { marketsTable, parseSort, sortParam } from './markets-table';
import { ds } from './test-dataset';

const ids = (view: ReturnType<typeof marketsTable>) => view.rows.map((r) => r.id);
const sum = (markets: string[], key: 'actual' | 'forecast') =>
  ds.series
    .filter((r) => markets.includes(r.marketId) && r.period === '2026-05')
    .reduce((total, r) => total + r[key], 0);

describe('marketsTable', () => {
  it('portfolio, latest month: 13 rows in the map order; stored KPIs, calculated gap', () => {
    const view = marketsTable(ds, {}, '2026-05', '1m', [], null);
    expect(view.rows).toHaveLength(13);
    expect(view.inScope).toBe(13);
    expect(view.filtered).toBe(false);
    // Regions in data order, then names: same order as the map's Tab order.
    expect(ids(view).slice(0, 2)).toEqual(['ca', 'us']);
    const de = view.rows.find((r) => r.id === 'de');
    expect(de).toMatchObject({
      regionId: 'eu',
      status: 'off_track',
      current: false,
      revenue: { source: 'data' },
      growthPct: { value: -9.7, source: 'data' },
      attainmentPct: { source: 'data' },
      sharePct: { source: 'data' },
      gap: { source: 'calculated' },
      units: { source: 'calculated' },
    });
    expect(de?.gap.value).toBeCloseTo(sum(['de'], 'actual') - sum(['de'], 'forecast'));
  });

  it('a region shows its markets; a market drill keeps its region and marks the market', () => {
    expect(marketsTable(ds, { regionId: 'eu' }, '2026-05', '1m', [], null).rows).toHaveLength(5);
    const view = marketsTable(ds, { regionId: 'eu', marketId: 'de' }, '2026-05', '1m', [], null);
    expect(view.rows).toHaveLength(5);
    expect(view.rows.filter((r) => r.current).map((r) => r.id)).toEqual(['de']);
  });

  it('a product: that product in every market, no share', () => {
    const view = marketsTable(
      ds,
      { regionId: 'eu', marketId: 'de', productId: 'veltrix' },
      '2026-05',
      '1m',
      [],
      null,
    );
    expect(view.rows).toHaveLength(5);
    expect(view.rows.every((r) => r.sharePct.source === 'unavailable')).toBe(true);
    const units = ds.series
      .filter((r) => r.marketId === 'gb' && r.productId === 'veltrix' && r.period === '2026-05')
      .reduce((total, r) => total + r.units, 0);
    expect(view.rows.find((r) => r.id === 'gb')?.units.value).toBe(units);
  });

  it('a 3-month window: no status, no share', () => {
    const view = marketsTable(ds, {}, '2026-05', '3m', [], null);
    expect(view.rows.every((r) => r.status === null)).toBe(true);
    expect(view.rows.every((r) => r.sharePct.source === 'unavailable')).toBe(true);
  });

  it('the selection narrows the rows; outside the scope nothing is left', () => {
    const view = marketsTable(ds, {}, '2026-05', '1m', ['es', 'de'], null);
    expect(ids(view)).toEqual(['de', 'es']);
    expect(view.filtered).toBe(true);
    expect(view.inScope).toBe(13);
    const none = marketsTable(ds, { regionId: 'eu' }, '2026-05', '1m', ['jp'], null);
    expect(none.rows).toEqual([]);
    expect(none.inScope).toBe(5);
    expect(none.filtered).toBe(true);
  });

  it('sorts numbers both ways', () => {
    const asc = marketsTable(ds, {}, '2026-05', '1m', [], { column: 'growth', dir: 'asc' });
    expect(ids(asc)[0]).toBe('de');
    const desc = marketsTable(ds, {}, '2026-05', '1m', [], { column: 'growth', dir: 'desc' });
    expect(ids(desc)[0]).toBe('cn');
  });

  it('missing values keep the default order, last in both directions', () => {
    const plain = ids(marketsTable(ds, {}, '2026-05', '3m', [], null));
    for (const dir of ['asc', 'desc'] as const) {
      const view = marketsTable(ds, {}, '2026-05', '3m', [], { column: 'share', dir });
      expect(ids(view)).toEqual(plain);
    }
  });

  it('status sorts off track, at risk, on track', () => {
    const view = marketsTable(ds, {}, '2026-05', '1m', [], { column: 'status', dir: 'asc' });
    expect(view.rows.slice(0, 2).map((r) => r.status)).toEqual(['off_track', 'off_track']);
    expect(view.rows[2]?.status).toBe('at_risk');
    expect(view.rows.at(-1)?.status).toBe('on_track');
  });

  it('totals of the rows shown: sums, and ratios from the series', () => {
    const view = marketsTable(ds, {}, '2026-05', '1m', [], null);
    const revenue = view.rows.reduce((total, r) => total + (r.revenue.value ?? 0), 0);
    expect(view.totals.revenue.value).toBeCloseTo(revenue, -1);
    expect(view.totals.attainmentPct.value).toBeCloseTo(100.4, 1);
    expect(view.totals.attainmentPct.source).toBe('calculated');
    const two = marketsTable(ds, {}, '2026-05', '1m', ['de', 'es'], null);
    expect(two.totals.gap.value).toBeCloseTo(
      sum(['de', 'es'], 'actual') - sum(['de', 'es'], 'forecast'),
    );
    expect(marketsTable(ds, {}, '2026-05', '3m', [], null).totals.sharePct.source).toBe(
      'unavailable',
    );
  });
});

describe('parseSort / sortParam', () => {
  it('reads a column with an optional minus', () => {
    expect(parseSort('growth')).toEqual({ column: 'growth', dir: 'asc' });
    expect(parseSort('-growth')).toEqual({ column: 'growth', dir: 'desc' });
  });

  it('anything else is invalid', () => {
    for (const raw of ['foo', '--growth', '', '-', 'Growth']) {
      expect(parseSort(raw)).toBeUndefined();
    }
  });

  it('writes the same spelling back; the default order is not written', () => {
    expect(sortParam({ column: 'units', dir: 'desc' })).toBe('-units');
    expect(sortParam({ column: 'market', dir: 'asc' })).toBe('market');
    expect(sortParam(null)).toBeNull();
  });
});
