'use client';

import { useFormatter, useTranslations } from 'next-intl';

import {
  getMarket,
  getProduct,
  type TableColumn,
  useDashboard,
  useKpiFormat,
  useScopeLabel,
  useStatusLabel,
} from '@/entities/performance';
import { RATES_DATE, USD_RATES } from '@/shared/config';
import { useCurrency, useJoinParts } from '@/shared/lib';

import type { MarketsSheetLabels } from '../model/markets-xlsx';

/** The workbook's words in the UI language, for the current view; the link is passed when saving. */
export function useSheetLabels(): (link: string) => MarketsSheetLabels {
  const t = useTranslations('exportMarkets');
  const tTable = useTranslations('marketsTable');
  const tDrill = useTranslations('drill');
  const tPeriod = useTranslations('period');
  const tCurrency = useTranslations('currency');
  const currency = useCurrency();
  const f = useKpiFormat();
  const format = useFormatter();
  const statusLabel = useStatusLabel();
  const scopeLabel = useScopeLabel();
  const join = useJoinParts();
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
    title: join([tTable('title'), scopeLabel(ds, scope) ?? portfolio, span]),
    header: column,
    status: statusLabel,
    code: t('sheet.code'),
    anomaly: t('sheet.anomaly'),
    anomalies: (list) =>
      list.length === 0
        ? null
        : join(
            list.map((a) => t('sheet.anomalyItem', { period: f.period(a.period), note: a.note })),
          ),
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
      {
        label: t('about.currency'),
        value:
          currency === 'USD'
            ? t('about.currencyUsd', { code: currency, name: tCurrency(currency) })
            : t('about.currencyConverted', {
                code: currency,
                name: tCurrency(currency),
                rate: format.number(USD_RATES[currency], 'rate'),
                date: format.dateTime(new Date(`${RATES_DATE}T00:00:00Z`), 'day'),
              }),
      },
      { label: t('about.view'), value: join([place, span]) },
      ...(product ? [{ label: t('about.product'), value: product }] : []),
      {
        label: t('about.selection'),
        value:
          selected.length > 0
            ? format.list(
                selected.map((id) => getMarket(ds, id)?.name ?? id),
                { type: 'conjunction' },
              )
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
