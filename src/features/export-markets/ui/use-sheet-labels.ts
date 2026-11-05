'use client';

import { useFormatter, useTranslations } from 'next-intl';

import {
  getMarket,
  getProduct,
  scopeLabel,
  type TableColumn,
  useDashboard,
  useKpiFormat,
  useStatusLabel,
} from '@/entities/performance';

import type { MarketsSheetLabels } from '../model/markets-xlsx';

/** The workbook's words in the UI language, for the current view; the link is passed when saving. */
export function useSheetLabels(): (link: string) => MarketsSheetLabels {
  const t = useTranslations('exportMarkets');
  const tTable = useTranslations('marketsTable');
  const tDrill = useTranslations('drill');
  const tPeriod = useTranslations('period');
  const f = useKpiFormat();
  const format = useFormatter();
  const statusLabel = useStatusLabel();
  const { ds, state } = useDashboard();
  const { scope, period, range, selected, sort } = state;

  const span =
    range === '1m'
      ? f.period(period)
      : tPeriod('label', { period: f.period(period), range: tPeriod(`range.${range}`) });
  const portfolio = tDrill('portfolio');
  const place = scopeLabel(ds, { regionId: scope.regionId, marketId: scope.marketId }) ?? portfolio;
  const column = (c: TableColumn) => tTable(`column.${c}`);
  const product = scope.productId ? getProduct(ds, scope.productId)?.name : undefined;

  return (link) => ({
    sheets: { markets: t('sheet.markets'), months: t('sheet.months'), about: t('sheet.about') },
    title: [tTable('title'), scopeLabel(ds, scope) ?? portfolio, span].join(' · '),
    header: column,
    status: statusLabel,
    code: t('sheet.code'),
    anomaly: t('sheet.anomaly'),
    total: t('sheet.total'),
    month: t('sheet.month'),
    actual: t('sheet.actual'),
    about: [
      {
        label: t('about.source'),
        value: t('about.sourceValue', {
          date: format.dateTime(new Date(ds.meta.generatedAt), 'day'),
        }),
      },
      { label: t('about.view'), value: [place, span].join(' · ') },
      ...(product ? [{ label: t('about.product'), value: product }] : []),
      {
        label: t('about.selection'),
        value:
          selected.length > 0
            ? selected.map((id) => getMarket(ds, id)?.name ?? id).join(', ')
            : t('about.selectionAll'),
      },
      {
        label: t('about.sort'),
        value: sort
          ? t(sort.dir === 'asc' ? 'about.asc' : 'about.desc', { column: column(sort.column) })
          : t('about.sortDefault'),
      },
      { label: t('about.calculated'), value: t('about.calculatedValue') },
      { label: t('about.status'), value: t('about.statusValue') },
      { label: t('about.link'), value: link, link: true },
    ],
  });
}
