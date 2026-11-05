'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { type HeatCell, type HeatMetric, periodToDate } from '@/entities/performance';
import type { Period } from '@/shared/api';

/** Numbers and words of the heat map: short in a cell, one decimal in names and the detail line. */
export function useHeatFormat(metric: HeatMetric, marketNotes = false) {
  const t = useTranslations('heatMap');
  const tMetric = useTranslations('marketStatus.metric');
  const tData = useTranslations('dataCheck');
  const format = useFormatter();
  const dash = tData('noStatus');

  const short = (v: number | null) => {
    if (v === null) return dash;
    if (metric === 'revenue') return format.number(v, 'compact');
    return format.number(v / 100, metric === 'growth' ? 'signedWholePercent' : 'wholePercent');
  };
  const long = (v: number | null) => {
    if (v === null) return dash;
    if (metric === 'revenue') return format.number(v, 'compactCurrency');
    return format.number(v / 100, metric === 'growth' ? 'signedPercent' : 'percent');
  };
  const month = (p: Period) => format.dateTime(periodToDate(p), 'period');
  const monthShort = (p: Period) => format.dateTime(periodToDate(p), 'periodShort');
  const metricName = tMetric(metric);

  /** The data's note; in a product view it is said to be the market's. */
  const note = (text: string) =>
    marketNotes ? t('anomalyMarket', { note: text }) : t('anomaly', { note: text });

  const cellName = (cell: HeatCell) => {
    // Only what the cell adds: the row and column headers name the market and
    // the month, and a screen reader in the grid reads them as focus moves.
    // The visible (rounded) figure is part of the name (label in name, WCAG
    // 2.5.3), the exact one follows: "+12% (+11.7%)".
    const parts = [
      cell.value === null
        ? t('cell', { value: dash })
        : t('cellRounded', { shown: short(cell.value), value: long(cell.value) }),
    ];
    if (cell.anomaly) parts.push(note(cell.anomaly.note));
    return parts.join(', ');
  };

  return { short, long, month, monthShort, metricName, note, cellName };
}
