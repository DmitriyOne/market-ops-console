import type { Anomaly, Citation, Dataset, MarketStatus, Period } from '@/shared/api';

import { computeKpis, type Kpis } from './kpis';
import { getMarket, getProduct, getRegion } from './reference';
import type { Scope } from './scope';
import { statusFor } from './status';
import { type TrendPoint, trendSeries } from './trend';

export type ResolvedCitation = {
  scope: Scope;
  period: Period;
  /** False when an id in the citation is not in the dataset. */
  known: boolean;
  names: { region?: string; market?: string; product?: string };
};

export type Evidence = {
  kpis: Kpis;
  /** Market status; only for a market (not a product) at the latest month. */
  status: MarketStatus | null;
  /** Status of the market now (latest month), shown next to a past month. */
  latestStatus: MarketStatus | null;
  /** The market's anomaly in that month, from the dataset. */
  anomaly: Pick<Anomaly, 'type' | 'note'> | null;
  /** Up to 12 months ending at the citation's period. */
  trend: TrendPoint[];
};

const TREND_MONTHS = 12;

/**
 * What a citation points at. A market brings its region; a period that is
 * missing or not in the dataset falls back to the latest month.
 */
export function resolveCitation(ds: Dataset, c: Citation): ResolvedCitation {
  const market = c.marketId ? getMarket(ds, c.marketId) : undefined;
  const regionId = market?.regionId ?? c.regionId;
  const region = regionId ? getRegion(ds, regionId) : undefined;
  const product = c.productId ? getProduct(ds, c.productId) : undefined;
  const known =
    (!c.marketId || market !== undefined) &&
    (!c.regionId || getRegion(ds, c.regionId) !== undefined) &&
    (!c.productId || product !== undefined);

  const scope: Scope = {};
  if (regionId) scope.regionId = regionId;
  if (c.marketId) scope.marketId = c.marketId;
  if (c.productId) scope.productId = c.productId;

  const names: ResolvedCitation['names'] = {};
  if (region) names.region = region.name;
  if (market) names.market = market.name;
  if (product) names.product = product.name;

  const period = c.period && ds.meta.periods.includes(c.period) ? c.period : ds.meta.latestPeriod;
  return { scope, period, known, names };
}

/** The numbers behind a citation, or null when it points outside the dataset. */
export function evidenceFor(ds: Dataset, r: ResolvedCitation): Evidence | null {
  if (!r.known) return null;
  const { marketId, productId } = r.scope;
  const end = ds.meta.periods.indexOf(r.period);
  const market = marketId && !productId ? getMarket(ds, marketId) : undefined;
  const anomaly = market?.kpis.anomalies.find((a) => a.period === r.period);
  return {
    kpis: computeKpis(ds, r.scope, r.period, '1m'),
    status: market ? statusFor(ds, market.id, r.period, '1m') : null,
    latestStatus: market?.kpis.status ?? null,
    anomaly: anomaly ? { type: anomaly.type, note: anomaly.note } : null,
    trend: trendSeries(ds, r.scope).slice(Math.max(0, end + 1 - TREND_MONTHS), end + 1),
  };
}
