'use client';

import { ChartLineIcon, TableIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useFormatter, useTranslations } from 'next-intl';
import { useId } from 'react';

import { periodToDate, scopeLabel, trendView, useDashboard } from '@/entities/performance';
import { useStoredFlag } from '@/shared/lib';
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';

import { LegendLine } from './LegendLine';
import { SERIES_KEYS as KEYS } from './series';

const TrendChart = dynamic(() => import('./TrendChart').then((m) => m.TrendChart), {
  ssr: false,
  loading: () => <Skeleton className="h-56 w-full" />,
});

const CARD = 'gap-3 border border-border ring-0';

/**
 * Actual vs forecast vs prior year for the selected scope (brief: time
 * series for the selected entity); the selected months are shaded and
 * anomalies marked. Words and a table carry the same facts.
 */
export function RevenueTrend() {
  const t = useTranslations('trend');
  const tDrill = useTranslations('drill');
  const format = useFormatter();
  const titleId = useId();
  const { ds, state } = useDashboard();
  const [asTable, setAsTable] = useStoredFlag('mo:revenue-trend-table');
  // The remembered view is read after hydration: keep the skeleton until then.
  if (asTable === null) return <RevenueTrendSkeleton />;

  const view = trendView(ds, state.scope, state.period, state.range);
  // Analyst reads volume too; units have their own scale, so no second line (one axis).
  const units = state.mode === 'analyst';
  const period = (p: string) => format.dateTime(periodToDate(p), 'period');
  const money = (n: number) => format.number(n, 'compactCurrency');
  const scope = scopeLabel(ds, state.scope) ?? tDrill('portfolio');
  const first = view.points[0];
  const last = view.points.at(-1);
  const selected = view.points.find((p) => p.period === state.period);
  const windowSet = new Set(
    view.points.map((p) => p.period).filter((p) => p >= view.window.from && p <= view.window.to),
  );
  const anomalyAt = new Set(view.anomalies.map((a) => a.period));

  const title = t('title', {
    from: first ? period(first.period) : '',
    to: last ? period(last.period) : '',
  });
  const summary = selected
    ? t('summary', {
        scope,
        from: first ? period(first.period) : '',
        to: last ? period(last.period) : '',
        period: period(selected.period),
        actual: money(selected.actual),
        forecast: money(selected.forecast),
        priorYear: money(selected.priorYear),
      })
    : '';

  return (
    <Card aria-labelledby={titleId} role="region" className={CARD}>
      <CardHeader>
        <CardTitle>
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
        </CardTitle>
        <CardAction>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => {
              setAsTable(!asTable);
            }}
          >
            {asTable ? <ChartLineIcon aria-hidden /> : <TableIcon aria-hidden />}
            {asTable ? t('showChart') : t('showTable')}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ul
          aria-label={t('legend')}
          className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
        >
          {KEYS.map((key) => (
            <li key={key} className="flex items-center gap-1.5">
              <LegendLine series={key} />
              {t(key)}
            </li>
          ))}
        </ul>
        <p className="sr-only">{summary}</p>
        {asTable ? (
          <div className="max-h-80 overflow-y-auto">
            <Table>
              <TableCaption className="sr-only">{t('caption', { scope })}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('month')}</TableHead>
                  {KEYS.map((key) => (
                    <TableHead key={key} className="text-right">
                      {t(key)}
                    </TableHead>
                  ))}
                  {units ? <TableHead className="text-right">{t('units')}</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {view.points.map((p) => (
                  <TableRow
                    key={p.period}
                    data-state={windowSet.has(p.period) ? 'selected' : undefined}
                  >
                    <TableCell>
                      {period(p.period)}
                      {windowSet.has(p.period) ? (
                        <span className="text-muted-foreground"> · {t('window')}</span>
                      ) : null}
                      {anomalyAt.has(p.period) ? (
                        <span className="text-status-off-track"> · {t('anomalyMark')}</span>
                      ) : null}
                    </TableCell>
                    {KEYS.map((key) => (
                      <TableCell key={key} className="text-right font-mono tabular-nums">
                        {format.number(p[key], 'wholeCurrency')}
                      </TableCell>
                    ))}
                    {units ? (
                      <TableCell className="text-right font-mono tabular-nums">
                        {format.number(p.units, 'integer')}
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <TrendChart view={view} title={summary} units={units} />
        )}
        {view.anomalies.length > 0 ? (
          <ul className="flex flex-col gap-1 text-xs">
            {view.anomalies.map((a) => (
              <li key={`${a.marketId}-${a.period}`} className="flex items-start gap-1.5">
                <span aria-hidden className="mt-1 size-2 shrink-0 rotate-45 bg-status-off-track" />
                {t('anomaly', { period: period(a.period), market: a.marketName, note: a.note })}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** The card's own frame: title (two lines on a phone), the table button, legend, chart. */
export function RevenueTrendSkeleton() {
  return (
    <Card aria-hidden className={CARD}>
      <CardHeader>
        <CardTitle className="flex flex-col gap-1.5">
          <Skeleton className="h-6 w-56 max-w-full" />
          <Skeleton className="h-6 w-28 sm:hidden" />
        </CardTitle>
        <CardAction>
          <Skeleton className="h-11 w-36 rounded-lg" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-4 w-60 max-w-full" />
        <Skeleton className="h-56 w-full" />
      </CardContent>
    </Card>
  );
}
