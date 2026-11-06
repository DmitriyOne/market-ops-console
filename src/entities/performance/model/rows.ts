import type { Dataset, Period, SeriesRow } from '@/shared/api';

import { marketsInScope, type Scope } from './scope';

/** Series rows for the markets (and product) in scope, optionally limited to some periods. */
export function rowsInScope(ds: Dataset, scope: Scope, periods?: readonly Period[]): SeriesRow[] {
  const marketIds = new Set(marketsInScope(ds, scope).map((m) => m.id));
  const periodSet = periods ? new Set(periods) : undefined;
  return ds.series.filter(
    (row) =>
      marketIds.has(row.marketId) &&
      (!scope.productId || row.productId === scope.productId) &&
      (!periodSet || periodSet.has(row.period)),
  );
}

export type Totals = { actual: number; forecast: number; priorYear: number; units: number };

export function sumRows(rows: readonly SeriesRow[]): Totals {
  const totals: Totals = { actual: 0, forecast: 0, priorYear: 0, units: 0 };
  for (const row of rows) {
    totals.actual += row.actual;
    totals.forecast += row.forecast;
    totals.priorYear += row.priorYear;
    totals.units += row.units;
  }
  return totals;
}
