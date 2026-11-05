'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { type HeatCell, type HeatMetric, type HeatRow, periodToDate } from '@/entities/performance';
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

  const cellName = (row: HeatRow, cell: HeatCell) => {
    // The cell's visible (rounded) figure is part of its name (label in
    // name, WCAG 2.5.3), the exact one follows: "Canada, Dec 2024: +12% (+11.7%)".
    const where = { market: row.name, month: month(cell.period) };
    const parts = [
      cell.value === null
        ? t('cell', { ...where, value: dash })
        : t('cellRounded', { ...where, shown: short(cell.value), value: long(cell.value) }),
    ];
    if (cell.anomaly) parts.push(note(cell.anomaly.note));
    if (row.selected) parts.push(t('selected'));
    return parts.join(', ');
  };

  return { short, long, month, monthShort, metricName, note, cellName };
}
