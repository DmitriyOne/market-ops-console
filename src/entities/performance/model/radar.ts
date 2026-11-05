import type { Dataset, Period } from '@/shared/api';

import { computeKpis, type KpiName } from './kpis';
import { getMarket } from './reference';
import { rowsInScope, sumRows } from './rows';
import { isLatestSnapshot, marketsInOrder, type Range, type Scope } from './scope';

export const RADAR_AXES = ['growth', 'attainment', 'share', 'revenue', 'momentum'] as const;
export type RadarAxis = (typeof RADAR_AXES)[number];
export type RadarAxisNotice = 'shareLatestOnly' | 'momentumTooEarly';

/** A real value (%, pp or $) and its 0–1 place between the worst and the best peer. */
export type RadarValue = { raw: number; scaled: number };

export type RadarSeries = {
  id: string;
  name: string;
  kind: 'market' | 'region' | 'portfolio';
  values: Partial<Record<RadarAxis, RadarValue>>;
};

/**
 * What is compared, first match wins: the selection; the open market and its
 * region's neighbours; the open region's markets; the four regions.
 */
export type RadarBasis = 'selection' | 'market' | 'region' | 'regions';

export type RadarView = {
  compared: 'markets' | 'regions';
  basis: RadarBasis;
  /** Axes with data, in RADAR_AXES order. */
  axes: RadarAxis[];
  removed: { axis: RadarAxis; notice: RadarAxisNotice }[];
  series: RadarSeries[];
  /** "Portfolio average", drawn as a dashed outline. */
  reference: RadarSeries;
  /** Markets of the basis beyond the first four. */
  hidden: number;
  /** A product is open, but the radar compares markets or regions (spec §6). */
  productIgnored: boolean;
};

export const RADAR_LIMIT = 4;
/** Momentum compares two 3-month windows: six months up to the period. */
const MOMENTUM_MONTHS = 6;

const KPI: Record<Exclude<RadarAxis, 'momentum'>, KpiName> = {
  growth: 'growthPct',
  attainment: 'attainmentPct',
  share: 'sharePct',
  revenue: 'revenue',
};

type Raw = Partial<Record<RadarAxis, number>>;

function growthOver(ds: Dataset, scope: Scope, periods: readonly Period[]): number | null {
  const t = sumRows(rowsInScope(ds, scope, periods));
  return t.priorYear === 0 ? null : (t.actual / t.priorYear - 1) * 100;
}

/** Growth YoY over the 3 months to `period` minus the 3 months before, in pp. */
function momentum(ds: Dataset, scope: Scope, period: Period): number | null {
  const all = ds.meta.periods;
  const end = all.indexOf(period);
  if (end + 1 < MOMENTUM_MONTHS) return null;
  const recent = growthOver(ds, scope, all.slice(end - 2, end + 1));
  const before = growthOver(ds, scope, all.slice(end - 5, end - 2));
  return recent === null || before === null ? null : recent - before;
}

function rawValues(
  ds: Dataset,
  scope: Scope,
  period: Period,
  range: Range,
  axes: readonly RadarAxis[],
): Raw {
  const kpis = computeKpis(ds, scope, period, range);
  const raw: Raw = {};
  for (const axis of axes) {
    const value = axis === 'momentum' ? momentum(ds, scope, period) : kpis[KPI[axis]].value;
    if (value !== null) raw[axis] = value;
  }
  return raw;
}

/** Place each raw value between the peers' worst (0) and best (1); all equal → middle. */
function scale(raw: Raw, peers: readonly Raw[], axes: readonly RadarAxis[]): RadarSeries['values'] {
  const values: RadarSeries['values'] = {};
  for (const axis of axes) {
    const v = raw[axis];
    if (v === undefined) continue;
    const known = peers.map((p) => p[axis]).filter((x) => x !== undefined);
    // No peer has a value: nothing to place it between.
    if (known.length === 0) continue;
    const min = Math.min(...known);
    const max = Math.max(...known);
    const scaled = max === min ? 0.5 : Math.min(1, Math.max(0, (v - min) / (max - min)));
    values[axis] = { raw: v, scaled };
  }
  return values;
}

/**
 * The comparison radar (spec §8): up to four markets of the basis (the
 * selection, else the open market with its neighbours, else the open
 * region's markets), or the four regions, against the portfolio. Every axis is
 * "higher is better" and scaled across the compared group's peers (the 13
 * markets, or the 4 regions), so a region's revenue is not measured
 * against one market's. An axis the data cannot fill is removed rather
 * than drawn at the centre, where it would read as the worst.
 */
export function comparisonRadar(
  ds: Dataset,
  scope: Scope,
  period: Period,
  range: Range,
  selected: readonly string[],
): RadarView {
  const removed: RadarView['removed'] = [];
  if (!isLatestSnapshot(ds, period, range)) {
    removed.push({ axis: 'share', notice: 'shareLatestOnly' });
  }
  if (ds.meta.periods.indexOf(period) + 1 < MOMENTUM_MONTHS) {
    removed.push({ axis: 'momentum', notice: 'momentumTooEarly' });
  }
  const gone = new Set(removed.map((r) => r.axis));
  const axes = RADAR_AXES.filter((a) => !gone.has(a));

  const picked = selected.filter((id) => getMarket(ds, id) !== undefined);
  const neighbours = (regionId: string) =>
    marketsInOrder(ds)
      .filter((m) => m.regionId === regionId)
      .map((m) => m.id);
  const open = scope.marketId ? getMarket(ds, scope.marketId) : undefined;
  const { basis, ids } = ((): { basis: RadarBasis; ids: string[] } => {
    if (picked.length > 0) return { basis: 'selection', ids: picked };
    if (open) {
      return {
        basis: 'market',
        ids: [open.id, ...neighbours(open.regionId).filter((id) => id !== open.id)],
      };
    }
    if (scope.regionId) return { basis: 'region', ids: neighbours(scope.regionId) };
    return { basis: 'regions', ids: [] };
  })();
  const compared = basis === 'regions' ? 'regions' : 'markets';
  // Peers: every entity of the compared kind, as its own scope (no product).
  const peers =
    compared === 'markets'
      ? ds.markets.map((m) => ({
          id: m.id,
          name: m.name,
          scope: { regionId: m.regionId, marketId: m.id },
        }))
      : ds.regions.map((r) => ({ id: r.id, name: r.name, scope: { regionId: r.id } }));
  const rawById = new Map(peers.map((p) => [p.id, rawValues(ds, p.scope, period, range, axes)]));
  const peerRaws = [...rawById.values()];

  const shown =
    compared === 'markets'
      ? ids.slice(0, RADAR_LIMIT).flatMap((id) => peers.filter((p) => p.id === id))
      : peers;
  const series = shown.map((p): RadarSeries => ({
    id: p.id,
    name: p.name,
    kind: compared === 'markets' ? 'market' : 'region',
    values: scale(rawById.get(p.id) ?? {}, peerRaws, axes),
  }));

  // Portfolio ratios, but the revenue of a typical peer: the total would be off the scale.
  const portfolio = rawValues(ds, {}, period, range, axes);
  if (portfolio.revenue !== undefined) {
    const revenues = peerRaws.map((r) => r.revenue).filter((x) => x !== undefined);
    portfolio.revenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;
  }
  const reference: RadarSeries = {
    id: 'portfolio',
    name: 'portfolio',
    kind: 'portfolio',
    values: scale(portfolio, peerRaws, axes),
  };

  return {
    compared,
    basis,
    axes,
    removed,
    series,
    reference,
    hidden: Math.max(0, ids.length - RADAR_LIMIT),
    productIgnored: Boolean(scope.productId),
  };
}
