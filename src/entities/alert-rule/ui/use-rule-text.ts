'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useCallback } from 'react';

import type { AlertMetric, AlertRuleInput, Dataset } from '@/shared/api';

/** How many market names a scope spells out before it counts them. */
const NAMES_SHOWN = 3;

/** A threshold as the user typed it: "95%", "−5%", "$1.5M". */
export function useThresholdFormat(): (metric: AlertMetric, value: number) => string {
  const format = useFormatter();
  return useCallback(
    (metric, value) =>
      metric === 'revenue'
        ? format.number(value, 'compactCurrency')
        : format.number(
            value / 100,
            metric === 'growth' ? 'signedThresholdPercent' : 'thresholdPercent',
          ),
    [format],
  );
}

/** A market's figure as the dashboard shows it: "8.9%", "−9.7%", "$1.7M". */
export function useMetricValueFormat(): (metric: AlertMetric, value: number) => string {
  const format = useFormatter();
  return useCallback(
    (metric, value) =>
      metric === 'revenue'
        ? format.number(value, 'compactCurrency')
        : format.number(value / 100, metric === 'growth' ? 'signedPercent' : 'percent'),
    [format],
  );
}

/** A rule in plain words: "Attainment below 95% · Europe". */
export function useRuleText(ds: Dataset) {
  const t = useTranslations('alerts');
  const format = useFormatter();
  const threshold = useThresholdFormat();

  const condition = useCallback(
    (rule: Pick<AlertRuleInput, 'metric' | 'operator' | 'threshold'>) =>
      t('condition', {
        operator: rule.operator,
        metric: t(`metric.${rule.metric}`),
        threshold: threshold(rule.metric, rule.threshold),
      }),
    [t, threshold],
  );

  const scope = useCallback(
    (s: AlertRuleInput['scope']) => {
      if (s.kind === 'portfolio') return t('scope.portfolio');
      if (s.kind === 'region') {
        return ds.regions.find((r) => r.id === s.regionId)?.name ?? s.regionId;
      }
      const names = ds.markets.filter((m) => s.marketIds.includes(m.id)).map((m) => m.name);
      return names.length <= NAMES_SHOWN
        ? format.list(names, { type: 'conjunction' })
        : t('scope.marketsCount', { count: names.length });
    },
    [ds, format, t],
  );

  const full = useCallback(
    (rule: AlertRuleInput) => `${condition(rule)} · ${scope(rule.scope)}`,
    [condition, scope],
  );

  return { condition, scope, full };
}
