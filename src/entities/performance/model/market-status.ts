import type { Dataset, MarketStatus, Period, Region } from '@/shared/api';

import { computeKpis, type KpiValue } from './kpis';
import { isLatestSnapshot, type Range, type Scope } from './scope';
import { nonOnTrackMarkets, statusFor } from './status';

export type MarketTile = {
  id: string;
  name: string;
  iso2: string;
  attainmentPct: KpiValue;
  /** Null off the latest month: the stored status describes that month only. */
  status: MarketStatus | null;
  /** In the selection (assistant, map, tiles or table filter). */
  selected: boolean;
  /** The market the dashboard is drilled into. */
  current: boolean;
};

export type TileGroup = { region: Region; tiles: MarketTile[] };

/**
 * Market status tiles (variant A), grouped by region in data order. A drill
 * into a region or market shows that region only. Attainment follows the
 * period, range and product (one product compared across markets); status
 * is market level and only at the latest month.
 */
export function marketTiles(
  ds: Dataset,
  scope: Scope,
  period: Period,
  range: Range,
  selected: readonly string[],
): TileGroup[] {
  const marked = new Set(selected);
  return ds.regions
    .filter((region) => !scope.regionId || region.id === scope.regionId)
    .map((region) => ({
      region,
      tiles: ds.markets
        .filter((m) => m.regionId === region.id)
        .map((m) => ({
          id: m.id,
          name: m.name,
          iso2: m.iso2,
          attainmentPct: computeKpis(
            ds,
            {
              regionId: region.id,
              marketId: m.id,
              ...(scope.productId ? { productId: scope.productId } : {}),
            },
            period,
            range,
          ).attainmentPct,
          status: statusFor(ds, m.id, period, range),
          selected: marked.has(m.id),
          current: m.id === scope.marketId,
        })),
    }));
}

export type RiskItem = {
  id: string;
  name: string;
  status: MarketStatus;
  attainmentPct: number;
  growthPct: number;
};

export type TopRisks =
  { kind: 'list'; items: RiskItem[] } | { kind: 'latestOnly' } | { kind: 'perProduct' };

/** Non-on-track markets in scope, off track first, then by attainment (spec §8). */
export function topRisks(ds: Dataset, scope: Scope, period: Period, range: Range): TopRisks {
  if (scope.productId) return { kind: 'perProduct' };
  if (!isLatestSnapshot(ds, period, range)) return { kind: 'latestOnly' };
  const items = (nonOnTrackMarkets(ds, period, range, scope) ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    status: m.kpis.status,
    attainmentPct: m.kpis.forecastAttainmentPct,
    growthPct: m.kpis.growthPct,
  }));
  return { kind: 'list', items };
}
