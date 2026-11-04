import { describe, expect, it } from 'vitest';

import { marketTiles, topRisks } from './market-status';
import { ds } from './test-dataset';

describe('marketTiles', () => {
  it('portfolio: every market, grouped by region in data order', () => {
    const groups = marketTiles(ds, {}, '2026-05', '1m', []);
    expect(groups.map((g) => [g.region.id, g.tiles.length])).toEqual([
      ['na', 2],
      ['eu', 5],
      ['apac', 4],
      ['latam', 2],
    ]);
    const de = groups[1]?.tiles.find((t) => t.id === 'de');
    expect(de).toMatchObject({
      iso2: 'DE',
      status: 'off_track',
      attainmentPct: { value: 92, source: 'data' },
      highlighted: false,
      selected: false,
    });
  });

  it('a region shows only its markets; the chosen market is marked', () => {
    const groups = marketTiles(ds, { regionId: 'eu', marketId: 'de' }, '2026-05', '1m', []);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.tiles.find((t) => t.id === 'de')?.selected).toBe(true);
    expect(groups[0]?.tiles.filter((t) => t.selected)).toHaveLength(1);
  });

  it('off the latest month there is no status and attainment is calculated', () => {
    const de = marketTiles(ds, {}, '2026-03', '1m', [])
      .flatMap((g) => g.tiles)
      .find((t) => t.id === 'de');
    expect(de?.status).toBeNull();
    expect(de?.attainmentPct.source).toBe('calculated');
  });

  it('markets from the assistant are highlighted', () => {
    const tiles = marketTiles(ds, {}, '2026-05', '1m', ['es', 'fr']).flatMap((g) => g.tiles);
    expect(tiles.filter((t) => t.highlighted).map((t) => t.id)).toEqual(['fr', 'es']);
  });
});

describe('topRisks', () => {
  it('off track first, then by attainment (spec §8)', () => {
    const risks = topRisks(ds, {}, '2026-05', '1m');
    expect(risks.kind === 'list' && risks.items.map((r) => r.id)).toEqual([
      'de',
      'es',
      'it',
      'gb',
      'br',
      'fr',
    ]);
  });

  it('carries the reason figures from the stored KPIs', () => {
    const risks = topRisks(ds, {}, '2026-05', '1m');
    expect(risks.kind === 'list' && risks.items[1]).toEqual({
      id: 'es',
      name: 'Spain',
      status: 'off_track',
      attainmentPct: 104.5,
      growthPct: -4.6,
    });
  });

  it('a region lists its own; a region with none gives an empty list', () => {
    const eu = topRisks(ds, { regionId: 'eu' }, '2026-05', '1m');
    expect(eu.kind === 'list' && eu.items).toHaveLength(5);
    const apac = topRisks(ds, { regionId: 'apac' }, '2026-05', '1m');
    expect(apac).toEqual({ kind: 'list', items: [] });
  });

  it('status exists for the latest month only, and per market only', () => {
    expect(topRisks(ds, {}, '2026-04', '1m')).toEqual({ kind: 'latestOnly' });
    expect(topRisks(ds, {}, '2026-05', '12m')).toEqual({ kind: 'latestOnly' });
    expect(
      topRisks(ds, { regionId: 'eu', marketId: 'de', productId: 'veltrix' }, '2026-05', '1m'),
    ).toEqual({ kind: 'perProduct' });
  });
});
