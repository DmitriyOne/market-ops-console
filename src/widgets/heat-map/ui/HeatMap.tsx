'use client';

import { ChartColumnIcon, CircleDotIcon, TableIcon, TriangleAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useMemo } from 'react';

import {
  getProduct,
  heatMap,
  type HeatMapView,
  MAP_SCALES,
  scaleSteps,
  toneFill,
  useDashboard,
  useScopeLabel,
} from '@/entities/performance';
import { useDrillDown } from '@/features/drill-down';
import { useMarketSelection } from '@/features/select-markets';
import { MetricPicker } from '@/features/select-metric';
import { cn, useCurrency, useStoredFlag } from '@/shared/lib';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';

import { HeatGrid } from './HeatGrid';
import { HeatMapSkeleton } from './HeatMapSkeleton';
import { useHeatFormat } from './use-heat-format';

const CARD = 'gap-3 border border-border ring-0';

/**
 * The heat map (spec §8): the scope's markets × 24 months, coloured by the
 * map's metric and steps (status and share have no months: growth then).
 * A cell opens that market at that month; Shift selects the market.
 */
export function HeatMap() {
  const t = useTranslations('heatMap');
  const tDrill = useTranslations('drill');
  const scopeLabel = useScopeLabel();
  const currency = useCurrency();
  const titleId = useId();
  const { ds, state } = useDashboard();
  const { scope, period, range, kpi, selected } = state;
  const { toMarket } = useDrillDown();
  const { toggle } = useMarketSelection();
  const [asTable, setAsTable] = useStoredFlag('mo:heat-map-table');

  const view = useMemo(
    () => heatMap(ds, scope, period, range, kpi, selected),
    [ds, scope, period, range, kpi, selected],
  );
  const h = useHeatFormat(view.metric);
  if (asTable === null) return <HeatMapSkeleton />;

  const place = scopeLabel(ds, scope) ?? tDrill('portfolio');
  const product = scope.productId ? getProduct(ds, scope.productId)?.name : undefined;

  return (
    <Card aria-labelledby={titleId} role="region" className={CARD}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="flex flex-col gap-0.5">
          <h2 id={titleId} className="text-base font-semibold">
            {t('title')}
          </h2>
          <p className="text-sm font-normal text-muted-foreground">
            {t('subtitle', { metric: h.metricName })}
          </p>
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <MetricPicker />
          <Button
            type="button"
            variant="outline"
            className="min-h-11 gap-1"
            onClick={() => {
              setAsTable(!asTable);
            }}
          >
            {asTable ? <ChartColumnIcon aria-hidden /> : <TableIcon aria-hidden />}
            {asTable ? t('showChart') : t('showTable')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {view.notice ? <p className="text-sm">{t(`notice.${view.notice}`)}</p> : null}
        {asTable ? (
          <HeatTable view={view} caption={t('caption', { metric: h.metricName, scope: place })} />
        ) : (
          <>
            <Legend view={view} />
            <HeatGrid
              view={view}
              period={period}
              label={t('gridLabel', { metric: h.metricName })}
              onOpen={(id, at) => {
                toMarket(id, { period: at });
              }}
              onToggle={toggle}
            />
            <p className="text-xs text-muted-foreground">{t('hint')}</p>
          </>
        )}
        <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          {product ? <li>{t('perProduct', { product })}</li> : null}
          {view.metric === 'revenue' ? <li>{t('revenueUnit', { currency })}</li> : null}
          <li>{t('noteCalculated')}</li>
        </ul>
      </CardContent>
    </Card>
  );
}

function Legend({ view }: { view: HeatMapView }) {
  const t = useTranslations('heatMap');
  const h = useHeatFormat(view.metric);
  const scale = MAP_SCALES[view.metric];
  return (
    <ul
      aria-label={t('legend')}
      className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"
    >
      {scaleSteps(view.metric, 1).map((step) => (
        <li key={step.tone} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-3.5 shrink-0 rounded-xs"
            style={{ backgroundColor: toneFill(scale.kind, step.tone) }}
          />
          {step.from === null
            ? t('stepBelow', { to: h.long(step.to) })
            : step.to === null
              ? t('stepAbove', { from: h.long(step.from) })
              : t('stepBetween', { from: h.long(step.from), to: h.long(step.to) })}
        </li>
      ))}
    </ul>
  );
}

function HeatTable({ view, caption }: { view: HeatMapView; caption: string }) {
  const t = useTranslations('heatMap');
  const h = useHeatFormat(view.metric, view.marketNotes);
  const anomalies = view.rows.flatMap((row) =>
    row.cells.flatMap((c) => (c.anomaly ? [{ row, cell: c, note: c.anomaly.note }] : [])),
  );
  return (
    <div className="flex flex-col gap-2">
      <Table>
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 bg-card">{t('market')}</TableHead>
            {view.periods.map((p) => (
              <TableHead key={p} className="text-right whitespace-nowrap">
                {h.monthShort(p)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {view.rows.map((row) => (
            <TableRow key={row.id} aria-current={row.current ? 'true' : undefined}>
              <TableHead
                scope="row"
                className={cn(
                  'sticky left-0 z-10 bg-card font-medium whitespace-nowrap',
                  (row.current || row.selected) && 'font-semibold',
                )}
              >
                <span className="flex items-center gap-1">
                  {row.selected ? <CircleDotIcon aria-hidden className="size-3.5" /> : null}
                  {row.name}
                  {row.selected ? <span className="sr-only">{`, ${t('selected')}`}</span> : null}
                  {row.current ? (
                    <span className="text-muted-foreground">{`· ${t('current')}`}</span>
                  ) : null}
                </span>
              </TableHead>
              {row.cells.map((c) => (
                <TableCell key={c.period} className="text-right font-mono tabular-nums">
                  {h.long(c.value)}
                  {c.anomaly ? (
                    <>
                      <TriangleAlertIcon aria-hidden className="ml-1 inline size-3.5" />
                      <span className="sr-only">{`, ${t('anomalyMark')}`}</span>
                    </>
                  ) : null}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {anomalies.length > 0 ? (
        <div className="text-xs">
          <p className="font-medium">{t('anomalies')}</p>
          <ul>
            {anomalies.map((a) => (
              <li key={`${a.row.id}:${a.cell.period}`}>
                {`${a.row.name} · ${h.month(a.cell.period)}: ${h.note(a.note)}`}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
