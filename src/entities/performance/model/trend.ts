import type { Anomaly, Dataset, Period } from '@/shared/api';

import { rowsInScope, sumRows } from './rows';
import { marketsInScope, type Scope } from './scope';

export type TrendPoint = {
  period: Period;
  actual: number;
  forecast: number;
  priorYear: number;
  units: number;
};

/** One summed point per period in the dataset. */
export function trendSeries(ds: Dataset, scope: Scope): TrendPoint[] {
  const rows = rowsInScope(ds, scope);
  return ds.meta.periods.map((period) => ({
    period,
    ...sumRows(rows.filter((row) => row.period === period)),
  }));
}

export type ScopedAnomaly = Anomaly & { marketId: string };

export function anomaliesInScope(ds: Dataset, scope: Scope): ScopedAnomaly[] {
  return marketsInScope(ds, scope).flatMap((market) =>
    market.kpis.anomalies.map((anomaly) => ({ ...anomaly, marketId: market.id })),
  );
}
