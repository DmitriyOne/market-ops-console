import type { Dataset, MarketStatus, Period } from '@/shared/api';

import { ISO3_TO_NUMERIC } from './iso-numeric';
import { computeKpis, type KpiName, type KpiValue } from './kpis';
import {
  MAP_SCALES,
  type MapMetric,
  type ScaleMetric,
  type ScaleStep,
  scaleSteps,
  stepFor,
} from './map-scale';
import { isLatestSnapshot, periodsInRange, type Range, type Scope } from './scope';
import { statusFor } from './status';

export type MapNotice = 'statusLatestOnly' | 'shareLatestOnly' | 'sharePerProduct';

export type MapItem = {
  id: string;
  name: string;
  /** world-atlas shape id. */
  numericIso: string;
  regionId: string;
  /** Outside a region drill the market is drawn as plain land. */
  inScope: boolean;
  /** The metric's value; attainment when the metric is status. */
  value: KpiValue;
  /** Null off the latest month: the stored status describes that month only. */
  status: MarketStatus | null;
  /** Scale step (0-based); null for status or a missing value. */
  step: number | null;
  highlighted: boolean;
  selected: boolean;
};

export type MapLegend =
  | { kind: 'status'; counts: Record<MarketStatus, number> }
  | { kind: 'scale'; scale: 'diverging' | 'sequential'; steps: (ScaleStep & { count: number })[] };

export type MarketMapView = {
  /** The metric actually drawn, after any fallback. */
  metric: MapMetric;
  notice: MapNotice | null;
  legend: MapLegend;
  /** In Tab order: regions in data order, then market names. */
  items: MapItem[];
};

const KPI: Record<ScaleMetric, KpiName> = {
  attainment: 'attainmentPct',
  growth: 'growthPct',
  share: 'sharePct',
  revenue: 'revenue',
};

/** Status and share exist only at the latest 1-month view; share never per product. */
function resolveMetric(
  wanted: MapMetric,
  latest: boolean,
  perProduct: boolean,
): { metric: MapMetric; notice: MapNotice | null } {
  if (wanted === 'status' && !latest) return { metric: 'attainment', notice: 'statusLatestOnly' };
  if (wanted === 'share' && perProduct) return { metric: 'attainment', notice: 'sharePerProduct' };
  if (wanted === 'share' && !latest) return { metric: 'attainment', notice: 'shareLatestOnly' };
  return { metric: wanted, notice: null };
}

/**
 * The market map (spec §8): every market with the chosen metric's value
 * and scale step. A selected product colours each market by that product;
 * status stays market level. A region drill keeps all markets on the map
 * but counts only the region's in the legend.
 */
export function marketMap(
  ds: Dataset,
  scope: Scope,
  period: Period,
  range: Range,
  kpi: MapMetric,
  highlighted: readonly string[],
): MarketMapView {
  const latest = isLatestSnapshot(ds, period, range);
  const { metric, notice } = resolveMetric(kpi, latest, Boolean(scope.productId));
  const valueMetric: ScaleMetric = metric === 'status' ? 'attainment' : metric;
  const months = periodsInRange(ds.meta.periods, period, range).length;
  const marked = new Set(highlighted);
  const regionOrder = new Map(ds.regions.map((r, i) => [r.id, i]));

  const items = ds.markets
    .toSorted(
      (a, b) =>
        (regionOrder.get(a.regionId) ?? 0) - (regionOrder.get(b.regionId) ?? 0) ||
        a.name.localeCompare(b.name, 'en'),
    )
    .map((m): MapItem => {
      const kpis = computeKpis(
        ds,
        {
          regionId: m.regionId,
          marketId: m.id,
          ...(scope.productId ? { productId: scope.productId } : {}),
        },
        period,
        range,
      );
      const value = kpis[KPI[valueMetric]];
      return {
        id: m.id,
        name: m.name,
        numericIso: ISO3_TO_NUMERIC[m.iso3] ?? '',
        regionId: m.regionId,
        inScope: !scope.regionId || m.regionId === scope.regionId,
        value,
        status: statusFor(ds, m.id, period, range),
        step:
          metric === 'status' || value.value === null
            ? null
            : stepFor(valueMetric, value.value, months),
        highlighted: marked.has(m.id),
        selected: m.id === scope.marketId,
      };
    });

  const counted = items.filter((i) => i.inScope);
  const legend: MapLegend =
    metric === 'status'
      ? {
          kind: 'status',
          counts: {
            on_track: counted.filter((i) => i.status === 'on_track').length,
            at_risk: counted.filter((i) => i.status === 'at_risk').length,
            off_track: counted.filter((i) => i.status === 'off_track').length,
          },
        }
      : {
          kind: 'scale',
          scale: MAP_SCALES[metric].kind,
          steps: scaleSteps(metric, months).map((s, i) => ({
            ...s,
            count: counted.filter((item) => item.step === i).length,
          })),
        };

  return { metric, notice, legend, items };
}
