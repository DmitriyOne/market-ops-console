import type { Anomaly, Dataset, Period, SeriesRow } from '@/shared/api';

import { type MapMetric, type ScaleMetric, stepFor } from './map-scale';
import { sumRows, type Totals } from './rows';
import { marketsInOrder, periodsInRange, type Range, type Scope } from './scope';

export type HeatMetric = Exclude<ScaleMetric, 'share'>;
/** Status and share exist for the latest month only: the heat map shows growth instead. */
export type HeatNotice = 'statusPerMonth' | 'sharePerMonth';

export type HeatCell = {
  period: Period;
  /** The month's value, calculated from series; null when its base is 0. */
  value: number | null;
  /** Scale step (0-based), judged per month; null without a value. */
  step: number | null;
  anomaly: Anomaly | null;
  /** In the window that ends at the selected period. */
  inWindow: boolean;
};

export type HeatRow = {
  id: string;
  name: string;
  regionId: string;
  cells: HeatCell[];
  /** In the selection (`markets`). */
  selected: boolean;
  /** The market the dashboard is drilled into. */
  current: boolean;
};

export type HeatMapView = {
  metric: HeatMetric;
  notice: HeatNotice | null;
  periods: Period[];
  window: Period[];
  rows: HeatRow[];
};

function resolveHeatMetric(kpi: MapMetric): { metric: HeatMetric; notice: HeatNotice | null } {
  if (kpi === 'status') return { metric: 'growth', notice: 'statusPerMonth' };
  if (kpi === 'share') return { metric: 'growth', notice: 'sharePerMonth' };
  return { metric: kpi, notice: null };
}

function monthValue(metric: HeatMetric, t: Totals): number | null {
  if (metric === 'revenue') return t.actual;
  if (metric === 'attainment') return t.forecast === 0 ? null : (t.actual / t.forecast) * 100;
  return t.priorYear === 0 ? null : (t.actual / t.priorYear - 1) * 100;
}

/**
 * The heat map (spec §8): the scope's markets × every month, coloured by
 * the map's metric and steps. Rows follow the scope like the tiles (a
 * market drill shows its region); a product narrows each market to it.
 * Every value is calculated from series.
 */
export function heatMap(
  ds: Dataset,
  scope: Scope,
  period: Period,
  range: Range,
  kpi: MapMetric,
  selected: readonly string[],
): HeatMapView {
  const { metric, notice } = resolveHeatMetric(kpi);
  const periods = [...ds.meta.periods];
  const window = periodsInRange(periods, period, range);
  const inWindow = new Set(window);
  const marked = new Set(selected);
  const markets = marketsInOrder(ds).filter(
    (m) => !scope.regionId || m.regionId === scope.regionId,
  );

  // One pass over series: rows grouped by market and month.
  const ids = new Set(markets.map((m) => m.id));
  const grouped = new Map<string, SeriesRow[]>();
  for (const row of ds.series) {
    if (!ids.has(row.marketId) || (scope.productId && row.productId !== scope.productId)) continue;
    const key = `${row.marketId}|${row.period}`;
    const list = grouped.get(key);
    if (list) list.push(row);
    else grouped.set(key, [row]);
  }

  const rows = markets.map((m): HeatRow => {
    const anomalies = new Map(m.kpis.anomalies.map((a) => [a.period, a]));
    return {
      id: m.id,
      name: m.name,
      regionId: m.regionId,
      selected: marked.has(m.id),
      current: m.id === scope.marketId,
      cells: periods.map((p): HeatCell => {
        const value = monthValue(metric, sumRows(grouped.get(`${m.id}|${p}`) ?? []));
        return {
          period: p,
          value,
          step: value === null ? null : stepFor(metric, value, 1),
          anomaly: anomalies.get(p) ?? null,
          inWindow: inWindow.has(p),
        };
      }),
    };
  });

  return { metric, notice, periods, window, rows };
}
