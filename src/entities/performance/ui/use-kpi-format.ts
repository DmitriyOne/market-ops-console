'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useCallback } from 'react';

import type { Period } from '@/shared/api';

import type { ResolvedCitation } from '../model/citation';
import type { KpiValue } from '../model/kpis';
import { periodToDate } from '../model/period';

/** Formatters for KPI values (stored as percent numbers, e.g. 92.0) and periods. */
export function useKpiFormat() {
  const format = useFormatter();
  const t = useTranslations('dataCheck');
  const dash = t('noStatus');

  const value = (
    kpi: KpiValue,
    kind: 'currency' | 'signedCurrency' | 'percent' | 'signedPercent' | 'integer',
  ) => {
    if (kpi.value === null) return dash;
    if (kind === 'currency') return format.number(kpi.value, 'compactCurrency');
    if (kind === 'signedCurrency') return format.number(kpi.value, 'signedCompactCurrency');
    if (kind === 'integer') return format.number(kpi.value, 'integer');
    return format.number(kpi.value / 100, kind);
  };
  const percent = (n: number) => format.number(n / 100, 'percent');
  const signedPercent = (n: number) => format.number(n / 100, 'signedPercent');
  const period = useCallback((p: Period) => format.dateTime(periodToDate(p), 'period'), [format]);

  /** "Veltrix · Germany · Mar 2026"; the period only when it is not `omitPeriod`. */
  const scopeName = (r: ResolvedCitation, omitPeriod?: Period) => {
    const parts = [r.names.product, r.names.market ?? r.names.region].filter(Boolean);
    const name = parts.length > 0 ? parts.join(' · ') : t('portfolio');
    return r.period === omitPeriod ? name : `${name} · ${period(r.period)}`;
  };

  return { value, percent, signedPercent, period, scopeName };
}
