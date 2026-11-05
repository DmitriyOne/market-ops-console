'use client';

import { ChartPieIcon, TableIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useId, useMemo } from 'react';

import {
  comparisonRadar,
  getMarket,
  getProduct,
  getRegion,
  RADAR_LIMIT,
  type RadarView,
  useDashboard,
  useKpiFormat,
} from '@/entities/performance';
import { useStoredFlag } from '@/shared/lib';
import {
  Button,
  Card,
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

import { ComparisonRadarSkeleton } from './ComparisonRadarSkeleton';
import { LegendSample } from './LegendSample';
import { REFERENCE, seriesStyle } from './series';
import { useRadarFormat } from './use-radar-format';

const RadarChart = dynamic(() => import('./RadarChart').then((m) => m.RadarChart), {
  ssr: false,
  loading: () => <Skeleton className="h-70 w-full" />,
});

const CARD = 'gap-3 border border-border ring-0';
/** A radar needs three axes to be a shape. */
const MIN_AXES = 3;

/**
 * The comparison radar (spec §8): the selection, else the open market and
 * its neighbours, else the open region's markets, else the regions (up to
 * four lines), against the portfolio average. Follows the period and the
 * window; ignores a product (it compares markets).
 */
export function ComparisonRadar() {
  const t = useTranslations('radar');
  const tPeriod = useTranslations('period');
  const titleId = useId();
  const k = useKpiFormat();
  const f = useRadarFormat();
  const { ds, state } = useDashboard();
  const { scope, period, range, selected } = state;
  const [asTableStored, setAsTable] = useStoredFlag('mo:radar-table');

  const view = useMemo(
    () => comparisonRadar(ds, scope, period, range, selected),
    [ds, scope, period, range, selected],
  );
  if (asTableStored === null) return <ComparisonRadarSkeleton />;

  const chartable = view.axes.length >= MIN_AXES;
  const asTable = asTableStored || !chartable;
  const names = view.series.map((s) => s.name).join(', ');
  const window =
    range === '1m'
      ? k.period(period)
      : tPeriod('label', { period: k.period(period), range: tPeriod(`range.${range}`) });
  const product = scope.productId ? getProduct(ds, scope.productId)?.name : undefined;
  const openMarket = scope.marketId ? getMarket(ds, scope.marketId) : undefined;
  const regionId = openMarket?.regionId ?? scope.regionId;
  const region = (regionId ? getRegion(ds, regionId)?.name : undefined) ?? '';
  const subtitle =
    view.basis === 'market'
      ? t('basis.market', { market: openMarket?.name ?? '', region })
      : view.basis === 'region'
        ? t('basis.region', { region })
        : t(`basis.${view.basis}`);
  const total = RADAR_LIMIT + view.hidden;
  const items = [
    ...view.series.map((s, i) => ({ s, style: seriesStyle(i) })),
    { s: view.reference, style: REFERENCE },
  ];

  return (
    <Card aria-labelledby={titleId} role="region" className={CARD}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="flex flex-col gap-0.5">
          <h2 id={titleId} className="text-base font-semibold">
            {t('title')}
          </h2>
          <p className="text-sm font-normal text-muted-foreground">{subtitle}</p>
        </CardTitle>
        {chartable ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 gap-1"
            onClick={() => {
              setAsTable(!asTableStored);
            }}
          >
            {asTable ? <ChartPieIcon aria-hidden /> : <TableIcon aria-hidden />}
            {asTable ? t('showChart') : t('showTable')}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ul aria-label={t('legend')} className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {items.map(({ s, style }) => (
            <li key={s.id} className="flex items-center gap-1.5">
              <LegendSample style={style} />
              {f.name(s)}
            </li>
          ))}
        </ul>
        {asTable ? (
          <RadarTable view={view} caption={t('caption', { names, window })} />
        ) : (
          <RadarChart view={view} title={t('chartLabel', { names })} />
        )}
        <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          {view.hidden > 0 ? (
            <li>
              {view.basis === 'selection'
                ? t('hidden.selection', { shown: RADAR_LIMIT, total })
                : t('hidden.neighbours', { shown: RADAR_LIMIT, total, region })}
            </li>
          ) : null}
          {product && view.productIgnored ? <li>{t('productIgnored', { product })}</li> : null}
          {view.removed.map((r) => (
            <li key={r.axis}>{t(`removed.${r.notice}`)}</li>
          ))}
          {chartable ? null : <li>{t('tooFewAxes')}</li>}
          <li>{view.compared === 'markets' ? t('scaleMarkets') : t('scaleRegions')}</li>
          {view.axes.includes('momentum') ? <li>{t('momentumNote')}</li> : null}
          {view.basis === 'selection' ? null : <li>{t('pickHint')}</li>}
        </ul>
      </CardContent>
    </Card>
  );
}

function RadarTable({ view, caption }: { view: RadarView; caption: string }) {
  const t = useTranslations('radar');
  const f = useRadarFormat();
  return (
    <Table>
      <TableCaption className="sr-only">{caption}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>{t('compared')}</TableHead>
          {view.axes.map((a) => (
            <TableHead key={a} className="text-right">
              {f.axisName(a)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...view.series, view.reference].map((s) => (
          <TableRow key={s.id}>
            <TableHead scope="row" className="font-medium">
              {f.name(s)}
            </TableHead>
            {view.axes.map((a) => (
              <TableCell key={a} className="text-right font-mono tabular-nums">
                {f.value(a, s.values[a]?.raw)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
