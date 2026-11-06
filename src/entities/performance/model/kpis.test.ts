import { describe, expect, it } from 'vitest';

import { computeKpis } from './kpis';
import { ds } from './test-dataset';

describe('computeKpis', () => {
  it('computes the portfolio at the latest month from series', () => {
    const k = computeKpis(ds, {}, '2026-05', '1m');
    expect(k.revenue).toEqual({ value: 22850419, source: 'calculated' });
    expect(k.attainmentPct.value).toBeCloseTo(100.4, 1);
    expect(k.growthPct.value).toBeCloseTo(7.3, 1);
    expect(k.units).toEqual({ value: 103868, source: 'calculated' });
    expect(k.sharePct.value).toBeCloseTo(21.87, 1);
    expect(k.sharePct.source).toBe('calculated');
  });

  it('computes regions', () => {
    const eu = computeKpis(ds, { regionId: 'eu' }, '2026-05', '1m');
    expect(eu.attainmentPct.value).toBeCloseTo(95.4, 1);
    expect(eu.sharePct.value).toBeCloseTo(17.88, 1);
    expect(computeKpis(ds, { regionId: 'apac' }, '2026-05', '1m').attainmentPct.value).toBeCloseTo(
      104.9,
      1,
    );
  });

  it('takes a market at the latest month from its stored KPIs', () => {
    const de = computeKpis(ds, { marketId: 'de' }, '2026-05', '1m');
    expect(de.revenue).toEqual({ value: 1676586, source: 'data' });
    expect(de.growthPct).toEqual({ value: -9.7, source: 'data' });
    expect(de.attainmentPct).toEqual({ value: 92.0, source: 'data' });
    expect(de.sharePct).toEqual({ value: 8.9, source: 'data' });
    expect(de.units.source).toBe('calculated');
  });

  it('prefers stored attainment over the recomputed one', () => {
    expect(computeKpis(ds, { marketId: 'in' }, '2026-05', '1m').attainmentPct).toEqual({
      value: 103.1,
      source: 'data',
    });
  });

  it('computes a market over 3 months from series, without share', () => {
    const de = computeKpis(ds, { marketId: 'de' }, '2026-05', '3m');
    expect(de.attainmentPct.value).toBeCloseTo(92.23, 1);
    expect(de.growthPct.value).toBeCloseTo(-15.93, 1);
    expect(de.revenue).toEqual({ value: 4546490, source: 'calculated' });
    expect(de.attainmentPct.source).toBe('calculated');
    expect(de.sharePct).toEqual({ value: null, source: 'unavailable' });
  });

  it('computes a market × product from series, without share', () => {
    const k = computeKpis(ds, { marketId: 'de', productId: 'veltrix' }, '2026-05', '1m');
    expect(k.revenue).toEqual({ value: 574449, source: 'calculated' });
    expect(k.units).toEqual({ value: 3431, source: 'calculated' });
    expect(k.sharePct).toEqual({ value: null, source: 'unavailable' });
  });

  it('has no share for past periods', () => {
    expect(computeKpis(ds, {}, '2026-04', '1m').sharePct).toEqual({
      value: null,
      source: 'unavailable',
    });
  });

  it('invents nothing when the scope has no rows', () => {
    const unavailable = { value: null, source: 'unavailable' };
    for (const k of [
      computeKpis(ds, { marketId: 'zz' }, '2026-05', '1m'),
      computeKpis(ds, {}, '2030-01', '1m'),
    ]) {
      expect(k).toEqual({
        revenue: unavailable,
        growthPct: unavailable,
        attainmentPct: unavailable,
        sharePct: unavailable,
        units: unavailable,
      });
    }
  });
});
