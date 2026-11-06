import { describe, expect, it } from 'vitest';

import { USD_RATES } from '@/shared/config';

import { inCurrency } from './in-currency';
import { computeKpis } from './kpis';
import { ds } from './test-dataset';

describe('inCurrency', () => {
  it('leaves USD as it is, the same object', () => {
    expect(inCurrency(ds, 'USD')).toBe(ds);
  });

  it('multiplies every amount by the rate, and nothing else', () => {
    const eur = inCurrency(ds, 'EUR');
    const [m, row] = [ds.markets[0], ds.series[0]];
    const [em, erow] = [eur.markets[0], eur.series[0]];
    if (!m || !row || !em || !erow) throw new Error('empty dataset');
    expect(em.kpis.revenue).toBeCloseTo(m.kpis.revenue * USD_RATES.EUR, 6);
    expect(erow.actual).toBeCloseTo(row.actual * USD_RATES.EUR, 6);
    expect(erow.forecast).toBeCloseTo(row.forecast * USD_RATES.EUR, 6);
    expect(erow.priorYear).toBeCloseTo(row.priorYear * USD_RATES.EUR, 6);
    expect(erow.units).toBe(row.units);
    expect(em.kpis.growthPct).toBe(m.kpis.growthPct);
    expect(em.kpis.sharePct).toBe(m.kpis.sharePct);
    expect(em.kpis.forecastAttainmentPct).toBe(m.kpis.forecastAttainmentPct);
    expect(eur.meta.currency).toBe('EUR');
    expect(ds.meta.currency).toBe('USD');
  });

  it('gives the same copy each time, so memoised views keep their results', () => {
    expect(inCurrency(ds, 'GBP')).toBe(inCurrency(ds, 'GBP'));
    expect(inCurrency(ds, 'GBP')).not.toBe(inCurrency(ds, 'EUR'));
  });

  it('keeps the KPI ratios and scales the revenue (portfolio, May 2026, 3 months)', () => {
    const usd = computeKpis(ds, {}, '2026-05', '3m');
    const gbp = computeKpis(inCurrency(ds, 'GBP'), {}, '2026-05', '3m');
    expect(gbp.revenue.value).toBeCloseTo((usd.revenue.value ?? 0) * USD_RATES.GBP, 2);
    expect(usd.revenue.value).toBeGreaterThan(0);
    for (const name of ['growthPct', 'attainmentPct', 'sharePct', 'units'] as const) {
      const [a, b] = [usd[name].value, gbp[name].value];
      if (a === null) expect(b).toBeNull();
      else expect(b).toBeCloseTo(a, 9);
    }
  });
});
