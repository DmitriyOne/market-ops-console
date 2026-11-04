import type { Dataset, Period } from '@/shared/api';

import { MAP_METRICS, type MapMetric } from './map-scale';
import { parseSort, type TableSort } from './markets-table';
import { getMarket, getProduct, getRegion } from './reference';
import type { Range, Scope } from './scope';

export const RANGES = ['1m', '3m', '12m'] as const satisfies readonly Range[];
export const MODES = ['executive', 'analyst'] as const;
export type Mode = (typeof MODES)[number];

/** The dashboard view as the URL holds it, before any check. */
export type RawDashboardParams = {
  region: string | null;
  market: string | null;
  product: string | null;
  period: string | null;
  range: string | null;
  mode: string | null;
  markets: string[] | null;
  kpi: string | null;
  sort: string | null;
};

/** The view every widget reads: valid ids only, defaults filled in. */
export type DashboardState = {
  scope: Scope;
  period: Period;
  range: Range;
  mode: Mode;
  /** Map metric; always `status` in Executive. */
  kpi: MapMetric;
  /**
   * Selected markets: from the assistant ("Show on dashboard"), the map,
   * the tiles or the table filter. Rings on the map, narrows the table.
   */
  selected: string[];
  /** Markets table order (Analyst); null = the default order. */
  sort: TableSort;
};

const isRange = (v: string): v is Range => RANGES.some((r) => r === v);
const isMode = (v: string): v is Mode => MODES.some((m) => m === v);
const isMetric = (v: string): v is MapMetric => MAP_METRICS.some((m) => m === v);

/**
 * Applies the URL rules (spec §6): a market brings its region, a product
 * needs a market, unknown values fall back to the default. `fix` lists the
 * params to rewrite (null = remove) so the URL has one spelling per view.
 */
export function normalizeDashboardState(
  ds: Dataset,
  raw: RawDashboardParams,
): { state: DashboardState; fix: Partial<RawDashboardParams> | null } {
  const fix: Partial<RawDashboardParams> = {};

  const market = raw.market === null ? undefined : getMarket(ds, raw.market);
  if (raw.market !== null && !market) fix.market = null;

  let regionId: string | undefined;
  if (market) {
    regionId = market.regionId;
    if (raw.region !== regionId) fix.region = regionId;
  } else if (raw.region !== null) {
    if (getRegion(ds, raw.region)) regionId = raw.region;
    else fix.region = null;
  }

  const product = raw.product !== null && market ? getProduct(ds, raw.product) : undefined;
  if (raw.product !== null && !product) fix.product = null;

  const knownPeriod = raw.period !== null && ds.meta.periods.includes(raw.period);
  const period = knownPeriod && raw.period !== null ? raw.period : ds.meta.latestPeriod;
  if (raw.period !== null && (!knownPeriod || raw.period === ds.meta.latestPeriod)) {
    fix.period = null;
  }

  const range = raw.range !== null && isRange(raw.range) ? raw.range : '1m';
  if (raw.range !== null && range === '1m') fix.range = null;

  const mode = raw.mode !== null && isMode(raw.mode) ? raw.mode : 'executive';
  if (raw.mode !== null && mode === 'executive') fix.mode = null;

  // Executive reads status but leaves a valid metric in the URL for Analyst.
  const metric = raw.kpi !== null && isMetric(raw.kpi) ? raw.kpi : 'status';
  if (raw.kpi !== null && metric === 'status') fix.kpi = null;
  const kpi = mode === 'analyst' ? metric : 'status';

  const selected = (raw.markets ?? []).filter((id) => getMarket(ds, id));
  if (raw.markets !== null && selected.length !== raw.markets.length) {
    fix.markets = selected.length > 0 ? selected : null;
  }

  const sort = raw.sort === null ? undefined : parseSort(raw.sort);
  if (raw.sort !== null && !sort) fix.sort = null;

  const scope: Scope = {
    ...(regionId ? { regionId } : {}),
    ...(market ? { marketId: market.id } : {}),
    ...(product ? { productId: product.id } : {}),
  };

  return {
    state: { scope, period, range, mode, kpi, selected, sort: sort ?? null },
    fix: Object.keys(fix).length > 0 ? fix : null,
  };
}
