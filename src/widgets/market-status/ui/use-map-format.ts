'use client';

import { useTranslations } from 'next-intl';

import {
  type KpiValue,
  type MapItem,
  type MapMetric,
  type ScaleMetric,
  useKpiFormat,
  useStatusLabel,
} from '@/entities/performance';

const KIND = {
  attainment: 'percent',
  growth: 'signedPercent',
  share: 'percent',
  revenue: 'currency',
} as const satisfies Record<ScaleMetric, string>;

/** Words and numbers of the map: metric names, values, legend bounds, country names. */
export function useMapFormat() {
  const t = useTranslations('marketStatus');
  const f = useKpiFormat();
  const statusLabel = useStatusLabel();

  const metricLabel = (metric: MapMetric) => t(`metric.${metric}`);
  /** Status shows attainment as its number. */
  const valueMetric = (metric: MapMetric): ScaleMetric =>
    metric === 'status' ? 'attainment' : metric;
  const value = (metric: MapMetric, kpi: KpiValue) =>
    kpi.value === null ? t('noData') : f.value(kpi, KIND[valueMetric(metric)]);
  const bound = (metric: ScaleMetric, n: number) =>
    f.value({ value: n, source: 'data' }, KIND[metric]);
  const countryName = (item: MapItem, metric: MapMetric) => {
    const args = {
      name: item.name,
      metric: metricLabel(valueMetric(metric)),
      value: value(metric, item.value),
    };
    return item.status
      ? t('countryStatus', { ...args, status: statusLabel(item.status) })
      : t('country', args);
  };
  return { metricLabel, valueMetric, value, bound, countryName };
}
