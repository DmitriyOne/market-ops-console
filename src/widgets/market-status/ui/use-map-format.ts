'use client';

import { useLocale, useTranslations } from 'next-intl';

import {
  type KpiValue,
  type MapItem,
  type MapMetric,
  type ScaleMetric,
  useKpiFormat,
  useStatusLabel,
} from '@/entities/performance';
import { formats } from '@/shared/config';

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
  const locale = useLocale();

  const metricLabel = (metric: MapMetric) => t(`metric.${metric}`);
  /** Status shows attainment as its number. */
  const valueMetric = (metric: MapMetric): ScaleMetric =>
    metric === 'status' ? 'attainment' : metric;
  const value = (metric: MapMetric, kpi: KpiValue) =>
    kpi.value === null ? t('noData') : f.value(kpi, KIND[valueMetric(metric)]);
  const bound = (metric: ScaleMetric, n: number) =>
    f.value({ value: n, source: 'data' }, KIND[metric]);
  /**
   * A legend step: "US$1–1.5m", "94.0% – 98.0%". Growth spells both ends
   * out, as ICU drops the second minus of a negative range ("-5.0–1.0%").
   */
  const range = (metric: ScaleMetric, from: number, to: number) => {
    if (metric === 'growth')
      return t('between', { from: bound(metric, from), to: bound(metric, to) });
    const revenue = metric === 'revenue';
    const options = revenue ? formats.number.compactCurrency : formats.number.percent;
    const scale = revenue ? 1 : 1 / 100;
    return new Intl.NumberFormat(locale, options).formatRange(from * scale, to * scale);
  };
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
  return { metricLabel, valueMetric, value, bound, range, countryName };
}
