import type { Dataset, Market, MarketStatus, Period } from '@/shared/api';

import { getMarket } from './reference';
import { isLatestSnapshot, marketsInScope, type Range, type Scope } from './scope';

/** Stored status, or null when the view is not the latest month (spec §5). */
export function statusFor(
  ds: Dataset,
  marketId: string,
  period: Period,
  range: Range,
): MarketStatus | null {
  if (!isLatestSnapshot(ds, period, range)) return null;
  return getMarket(ds, marketId)?.kpis.status ?? null;
}

/** At-risk and off-track markets: off-track first, then by attainment ascending. */
export function nonOnTrackMarkets(
  ds: Dataset,
  period: Period,
  range: Range,
  scope: Scope = {},
): Market[] | null {
  if (!isLatestSnapshot(ds, period, range)) return null;
  return marketsInScope(ds, scope)
    .filter((m) => m.kpis.status !== 'on_track')
    .sort(
      (a, b) =>
        Number(b.kpis.status === 'off_track') - Number(a.kpis.status === 'off_track') ||
        a.kpis.forecastAttainmentPct - b.kpis.forecastAttainmentPct,
    );
}

export function marketsAtRiskCount(
  ds: Dataset,
  period: Period,
  range: Range,
  scope: Scope = {},
): number | null {
  return nonOnTrackMarkets(ds, period, range, scope)?.length ?? null;
}
