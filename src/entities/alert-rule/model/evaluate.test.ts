import { describe, expect, it } from 'vitest';

import raw from '@/data/data.json';
import { type AlertRule, datasetSchema } from '@/shared/api';
import { USD_RATES } from '@/shared/config';

import { evaluateRules, flaggedIds, ruleMarkets } from './evaluate';
import { ruleInCurrency } from './in-currency';

const ds = datasetSchema.parse(raw);

const rule = (over: Partial<AlertRule>): AlertRule => ({
  id: 'r',
  name: 'Rule',
  metric: 'attainment',
  operator: 'below',
  threshold: 95,
  scope: { kind: 'portfolio' },
  severity: 'warning',
  enabled: true,
  ...over,
});

const ids = (r: AlertRule) => ruleMarkets(ds, r).map((m) => m.id);

describe('ruleMarkets (stored KPIs of the latest month)', () => {
  it('the two examples flag DE GB IT and US DE AU', () => {
    expect(ids(rule({}))).toEqual(['de', 'gb', 'it']);
    expect(ids(rule({ metric: 'share', threshold: 10 }))).toEqual(['us', 'de', 'au']);
  });

  it('below and above are strict', () => {
    // Germany's attainment is exactly 92.
    expect(ids(rule({ threshold: 92 }))).toEqual([]);
    expect(ids(rule({ operator: 'above', threshold: 105.9 }))).toEqual(['cn']);
    expect(ids(rule({ operator: 'above', threshold: 106 }))).toEqual([]);
  });

  it('growth and revenue (USD)', () => {
    expect(ids(rule({ metric: 'growth', threshold: 0 }))).toEqual(['de', 'es']);
    expect(ids(rule({ metric: 'revenue', operator: 'above', threshold: 3_000_000 }))).toEqual([
      'cn',
    ]);
  });

  it('each scope kind', () => {
    expect(ids(rule({ scope: { kind: 'region', regionId: 'eu' } }))).toEqual(['de', 'gb', 'it']);
    expect(ids(rule({ scope: { kind: 'region', regionId: 'apac' } }))).toEqual([]);
    expect(ids(rule({ scope: { kind: 'markets', marketIds: ['it', 'jp'] } }))).toEqual(['it']);
  });
});

describe('evaluateRules', () => {
  it('ignores disabled rules, keeps every rule per market and the highest severity', () => {
    const flags = evaluateRules(ds, [
      rule({ id: 'a', name: 'Attainment', severity: 'critical' }),
      rule({ id: 'b', name: 'Share', metric: 'share', threshold: 10 }),
      rule({ id: 'c', name: 'Off', metric: 'growth', threshold: 50, enabled: false }),
    ]);
    expect(flags.count).toBe(5);
    expect([...flags.byMarket.keys()]).toEqual(['de', 'gb', 'it', 'us', 'au']);
    expect(flags.byMarket.get('de')).toMatchObject({ severity: 'critical' });
    expect(flags.byMarket.get('de')?.rules.map((r) => r.id)).toEqual(['a', 'b']);
    expect(flags.byMarket.get('us')).toMatchObject({ severity: 'warning' });
  });

  it('flagged ids: critical first', () => {
    const flags = evaluateRules(ds, [
      rule({ id: 'a', metric: 'share', threshold: 10 }),
      rule({ id: 'b', severity: 'critical' }),
    ]);
    expect(flaggedIds(flags)).toEqual(['de', 'gb', 'it', 'us', 'au']);
  });

  it('a later warning does not lower a critical market', () => {
    const flags = evaluateRules(ds, [
      rule({ id: 'a', severity: 'critical' }),
      rule({ id: 'b', severity: 'warning', threshold: 99 }),
    ]);
    expect(flags.byMarket.get('de')?.severity).toBe('critical');
  });

  it('a market on a revenue threshold flags the same in every currency (ADR 0017)', () => {
    const de = ds.markets.find((m) => m.id === 'de');
    if (!de) throw new Error('no Germany');
    // "below" Germany's own revenue: not flagged in USD, so not in EUR or GBP either.
    for (const operator of ['below', 'above'] as const) {
      const r = rule({ metric: 'revenue', operator, threshold: de.kpis.revenue });
      const usd = ruleMarkets(ds, r).some((m) => m.id === 'de');
      expect(usd).toBe(false);
      for (const currency of ['EUR', 'GBP'] as const) {
        // Market revenue as `inCurrency` gives it (that slice is not imported here).
        const converted = {
          ...ds,
          markets: ds.markets.map((m) => ({
            ...m,
            kpis: { ...m.kpis, revenue: m.kpis.revenue * USD_RATES[currency] },
          })),
        };
        const shown = ruleMarkets(converted, ruleInCurrency(r, currency));
        expect(shown.some((m) => m.id === 'de')).toBe(usd);
        expect(shown.map((m) => m.id)).toEqual(ruleMarkets(ds, r).map((m) => m.id));
      }
    }
  });
});
