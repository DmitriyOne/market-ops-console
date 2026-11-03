import type { Dataset, Period } from '@/shared/api';

import { getMarket } from './reference';
import { rowsInScope, sumRows } from './rows';
import { isLatestSnapshot, marketsInScope, periodsInRange, type Range, type Scope } from './scope';

/** Where a number comes from: stored in data.json, computed from series, or not available. */
export type KpiSource = 'data' | 'calculated' | 'unavailable';
export type KpiValue = { value: number | null; source: KpiSource };
export type KpiName = 'revenue' | 'growthPct' | 'attainmentPct' | 'sharePct' | 'units';
export type Kpis = Record<KpiName, KpiValue>;

const UNAVAILABLE: KpiValue = { value: null, source: 'unavailable' };

const fromData = (value: number): KpiValue => ({ value, source: 'data' });
const calculated = (value: number): KpiValue => ({ value, source: 'calculated' });
const ratioPct = (numerator: number, denominator: number): number | null =>
  denominator === 0 ? null : (numerator / denominator) * 100;
const calculatedOrUnavailable = (value: number | null): KpiValue =>
  value === null ? UNAVAILABLE : calculated(value);

/** Revenue-weighted mean of stored market shares (latest month only). */
function weightedShare(ds: Dataset, scope: Scope): KpiValue {
  let weighted = 0;
  let revenue = 0;
  for (const market of marketsInScope(ds, scope)) {
    weighted += market.kpis.sharePct * market.kpis.revenue;
    revenue += market.kpis.revenue;
  }
  return revenue === 0 ? UNAVAILABLE : calculated(weighted / revenue);
}

/**
 * KPIs for a scope over the window ending at `period` (spec §5).
 * A market at the latest month uses its stored KPIs; everything else is
 * computed from series. Share exists only at the latest month and never
 * per product.
 */
export function computeKpis(ds: Dataset, scope: Scope, period: Period, range: Range): Kpis {
  const totals = sumRows(rowsInScope(ds, scope, periodsInRange(ds.meta.periods, period, range)));
  const latest = isLatestSnapshot(ds, period, range);
  const units = calculated(totals.units);

  const market = scope.marketId ? getMarket(ds, scope.marketId) : undefined;
  if (market && !scope.productId && latest) {
    return {
      revenue: fromData(market.kpis.revenue),
      growthPct: fromData(market.kpis.growthPct),
      attainmentPct: fromData(market.kpis.forecastAttainmentPct),
      sharePct: fromData(market.kpis.sharePct),
      units,
    };
  }

  const growth = ratioPct(totals.actual, totals.priorYear);
  return {
    revenue: calculated(totals.actual),
    growthPct: calculatedOrUnavailable(growth === null ? null : growth - 100),
    attainmentPct: calculatedOrUnavailable(ratioPct(totals.actual, totals.forecast)),
    sharePct:
      latest && !scope.productId && !scope.marketId ? weightedShare(ds, scope) : UNAVAILABLE,
    units,
  };
}
