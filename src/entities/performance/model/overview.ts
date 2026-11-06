import type { Dataset, Period } from '@/shared/api';

import { computeKpis, type Kpis } from './kpis';
import { rowsInScope, sumRows, type Totals } from './rows';
import { marketsInScope, periodsInRange, type Range, type Scope } from './scope';
import { nonOnTrackMarkets } from './status';
import { trendSeries } from './trend';

/** "How many markets are at risk" (brief), or why it cannot be said. */
export type RiskCount =
  | { kind: 'count'; atRisk: number; offTrack: number; total: number }
  /** Status is stored for the latest month only (spec §5). */
  | { kind: 'latestOnly' }
  /** Status belongs to a market, not to a product in it. */
  | { kind: 'perProduct' };

export type OverviewKpis = {
  kpis: Kpis;
  /** Sums over the window, for the supporting lines (forecast, prior year). */
  totals: Totals;
  /** Up to 12 months ending at the period, one value per month. */
  spark: {
    periods: Period[];
    revenue: number[];
    attainmentPct: (number | null)[];
    growthPct: (number | null)[];
  };
  risk: RiskCount;
};

const pct = (num: number, den: number) => (den === 0 ? null : (num / den) * 100);

/** Everything the KPI cards show for one scope, period and range. */
export function overviewKpis(
  ds: Dataset,
  scope: Scope,
  period: Period,
  range: Range,
): OverviewKpis {
  const totals = sumRows(rowsInScope(ds, scope, periodsInRange(ds.meta.periods, period, range)));

  const months = new Set(periodsInRange(ds.meta.periods, period, '12m'));
  const points = trendSeries(ds, scope).filter((p) => months.has(p.period));

  let risk: RiskCount;
  const nonOnTrack = nonOnTrackMarkets(ds, period, range, scope);
  if (scope.productId) risk = { kind: 'perProduct' };
  else if (nonOnTrack === null) risk = { kind: 'latestOnly' };
  else {
    const offTrack = nonOnTrack.filter((m) => m.kpis.status === 'off_track').length;
    risk = {
      kind: 'count',
      atRisk: nonOnTrack.length - offTrack,
      offTrack,
      total: marketsInScope(ds, scope).length,
    };
  }

  return {
    kpis: computeKpis(ds, scope, period, range),
    totals,
    spark: {
      periods: points.map((p) => p.period),
      revenue: points.map((p) => p.actual),
      attainmentPct: points.map((p) => pct(p.actual, p.forecast)),
      growthPct: points.map((p) => {
        const g = pct(p.actual, p.priorYear);
        return g === null ? null : g - 100;
      }),
    },
    risk,
  };
}
