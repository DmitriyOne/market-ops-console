import { describe, expect, it } from 'vitest';

import { evidenceFor, resolveCitation } from './citation';
import { ds } from './test-dataset';

describe('resolveCitation', () => {
  it('fills the region of a cited market and keeps a known period', () => {
    expect(resolveCitation(ds, { marketId: 'de', period: '2026-03' })).toEqual({
      scope: { regionId: 'eu', marketId: 'de' },
      period: '2026-03',
      known: true,
      names: { region: 'Europe', market: 'Germany' },
    });
  });

  it('uses the latest period when the citation has none', () => {
    expect(resolveCitation(ds, { regionId: 'apac' })).toMatchObject({
      scope: { regionId: 'apac' },
      period: '2026-05',
      known: true,
      names: { region: 'APAC' },
    });
  });

  it('uses the latest period when the period is outside the dataset', () => {
    expect(resolveCitation(ds, { period: '1999-01' }).period).toBe('2026-05');
  });

  it('marks an unknown id as not known', () => {
    expect(resolveCitation(ds, { marketId: 'xx' }).known).toBe(false);
    expect(resolveCitation(ds, { marketId: 'de', productId: 'nope' }).known).toBe(false);
  });

  it('names the product', () => {
    expect(resolveCitation(ds, { marketId: 'de', productId: 'veltrix' }).names).toEqual({
      region: 'Europe',
      market: 'Germany',
      product: 'Veltrix',
    });
  });
});

describe('evidenceFor', () => {
  it('is null for an unknown citation', () => {
    expect(evidenceFor(ds, resolveCitation(ds, { marketId: 'xx' }))).toBeNull();
  });

  it('uses stored KPIs and status for a market at the latest month', () => {
    const evidence = evidenceFor(ds, resolveCitation(ds, { marketId: 'de', period: '2026-05' }));
    expect(evidence?.status).toBe('off_track');
    expect(evidence?.kpis.attainmentPct).toEqual({ value: 92.0, source: 'data' });
    expect(evidence?.trend).toHaveLength(12);
    expect(evidence?.trend.at(-1)?.period).toBe('2026-05');
  });

  it('calculates a product in a past month and has no status', () => {
    const evidence = evidenceFor(
      ds,
      resolveCitation(ds, { marketId: 'de', productId: 'veltrix', period: '2026-03' }),
    );
    expect(evidence?.status).toBeNull();
    expect(evidence?.kpis.revenue.source).toBe('calculated');
    expect(evidence?.trend.at(-1)?.period).toBe('2026-03');
  });

  it('has no status for a product even at the latest month', () => {
    const evidence = evidenceFor(ds, resolveCitation(ds, { marketId: 'de', productId: 'veltrix' }));
    expect(evidence?.status).toBeNull();
  });
});
