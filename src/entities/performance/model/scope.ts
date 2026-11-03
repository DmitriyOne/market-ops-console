import type { Dataset, Market, Period } from '@/shared/api';

export type Range = '1m' | '3m' | '12m';
export type Scope = { regionId?: string; marketId?: string; productId?: string };

const RANGE_MONTHS: Record<Range, number> = { '1m': 1, '3m': 3, '12m': 12 };

/** Periods of the window that ends at `end` (inclusive), clipped at the first period. */
export function periodsInRange(periods: readonly Period[], end: Period, range: Range): Period[] {
  const endIndex = periods.indexOf(end);
  if (endIndex === -1) return [];
  return periods.slice(Math.max(0, endIndex + 1 - RANGE_MONTHS[range]), endIndex + 1);
}

/** Stored market KPIs and statuses describe exactly this view. */
export function isLatestSnapshot(ds: Dataset, period: Period, range: Range): boolean {
  return period === ds.meta.latestPeriod && range === '1m';
}

export function marketsInScope(ds: Dataset, scope: Scope): Market[] {
  if (scope.marketId) return ds.markets.filter((m) => m.id === scope.marketId);
  if (scope.regionId) return ds.markets.filter((m) => m.regionId === scope.regionId);
  return ds.markets;
}
