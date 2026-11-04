import { describe, expect, it } from 'vitest';

import { normalizeDashboardState, type RawDashboardParams } from './dashboard-state';
import { ds } from './test-dataset';

const EMPTY: RawDashboardParams = {
  region: null,
  market: null,
  product: null,
  period: null,
  range: null,
  mode: null,
  markets: null,
  kpi: null,
};

const normalize = (raw: Partial<RawDashboardParams>) =>
  normalizeDashboardState(ds, { ...EMPTY, ...raw });

describe('normalizeDashboardState', () => {
  it('an empty URL is the portfolio, latest month, 1 month, executive', () => {
    const { state, fix } = normalize({});
    expect(state).toEqual({
      scope: {},
      period: '2026-05',
      range: '1m',
      mode: 'executive',
      kpi: 'status',
      highlighted: [],
    });
    expect(fix).toBeNull();
  });

  it('Analyst keeps a valid map metric', () => {
    const { state, fix } = normalize({ mode: 'analyst', kpi: 'growth' });
    expect(state.kpi).toBe('growth');
    expect(fix).toBeNull();
  });

  it('an unknown metric or the default is removed from the URL', () => {
    expect(normalize({ mode: 'analyst', kpi: 'profit' })).toMatchObject({
      state: { kpi: 'status' },
      fix: { kpi: null },
    });
    expect(normalize({ mode: 'analyst', kpi: 'status' }).fix).toEqual({ kpi: null });
  });

  it('Executive always shows status but keeps the metric for Analyst', () => {
    const { state, fix } = normalize({ kpi: 'growth' });
    expect(state.kpi).toBe('status');
    expect(fix).toBeNull();
  });

  it('keeps a valid deep link as it is', () => {
    const { state, fix } = normalize({
      region: 'eu',
      market: 'de',
      product: 'veltrix',
      period: '2026-03',
      range: '3m',
      mode: 'analyst',
      markets: ['de', 'es'],
    });
    expect(state.scope).toEqual({ regionId: 'eu', marketId: 'de', productId: 'veltrix' });
    expect(state).toMatchObject({ period: '2026-03', range: '3m', mode: 'analyst' });
    expect(state.highlighted).toEqual(['de', 'es']);
    expect(fix).toBeNull();
  });

  it('a market brings its own region', () => {
    const { state, fix } = normalize({ market: 'de' });
    expect(state.scope).toEqual({ regionId: 'eu', marketId: 'de' });
    expect(fix).toEqual({ region: 'eu' });
  });

  it('a market outside the given region is moved to its own region', () => {
    const { state, fix } = normalize({ region: 'apac', market: 'de' });
    expect(state.scope).toEqual({ regionId: 'eu', marketId: 'de' });
    expect(fix).toEqual({ region: 'eu' });
  });

  it('a product without a market is dropped', () => {
    const { state, fix } = normalize({ region: 'eu', product: 'veltrix' });
    expect(state.scope).toEqual({ regionId: 'eu' });
    expect(fix).toEqual({ product: null });
  });

  it('unknown ids fall back to the level above', () => {
    const unknownRegion = normalize({ region: 'mars' });
    expect(unknownRegion.state.scope).toEqual({});
    expect(unknownRegion.fix).toEqual({ region: null });
    expect(normalize({ market: 'xx', product: 'veltrix' }).fix).toEqual({
      market: null,
      product: null,
    });
    expect(normalize({ market: 'de', product: 'nope' }).state.scope).toEqual({
      regionId: 'eu',
      marketId: 'de',
    });
  });

  it('a period outside the data, a bad range or mode fall back to defaults', () => {
    const { state, fix } = normalize({ period: '2019-01', range: '7m', mode: 'boss' });
    expect(state).toMatchObject({ period: '2026-05', range: '1m', mode: 'executive' });
    expect(fix).toEqual({ period: null, range: null, mode: null });
  });

  it('defaults written out are removed so a link has one spelling', () => {
    const { fix } = normalize({ period: '2026-05', range: '1m', mode: 'executive' });
    expect(fix).toEqual({ period: null, range: null, mode: null });
  });

  it('unknown highlighted markets are dropped; none left clears the list', () => {
    expect(normalize({ markets: ['de', 'zz'] })).toMatchObject({
      state: { highlighted: ['de'] },
      fix: { markets: ['de'] },
    });
    expect(normalize({ markets: ['zz'] }).fix).toEqual({ markets: null });
  });
});
