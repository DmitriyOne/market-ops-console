import type { Dataset, Period } from '@/shared/api';

import { getMarket } from './reference';
import { periodsInRange, type Range, type Scope } from './scope';
import { anomaliesInScope, type ScopedAnomaly, type TrendPoint, trendSeries } from './trend';

export type TrendAnomaly = ScopedAnomaly & { marketName: string; actual: number };

export type TrendView = {
  points: TrendPoint[];
  /** The months the rest of the dashboard is showing (spec §8: the series follows the period). */
  window: { from: Period; to: Period };
  anomalies: TrendAnomaly[];
};

/** Actual, forecast and prior year over all months for the scope, with what to mark on it. */
export function trendView(ds: Dataset, scope: Scope, period: Period, range: Range): TrendView {
  const points = trendSeries(ds, scope);
  const window = periodsInRange(ds.meta.periods, period, range);
  const actualAt = new Map(points.map((p) => [p.period, p.actual]));
  return {
    points,
    window: { from: window[0] ?? period, to: window.at(-1) ?? period },
    anomalies: anomaliesInScope(ds, scope).flatMap((a) => {
      const actual = actualAt.get(a.period);
      return actual === undefined
        ? []
        : [{ ...a, marketName: getMarket(ds, a.marketId)?.name ?? a.marketId, actual }];
    }),
  };
}
