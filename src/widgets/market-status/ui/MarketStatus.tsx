'use client';

import { GlobeIcon, LayoutGridIcon, TableIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useId, useMemo } from 'react';

import {
  getProduct,
  type MapItem,
  marketMap,
  type MarketMapView,
  marketTiles,
  StatusChip,
  StatusIcon,
  type TileGroup,
  useDashboard,
  useKpiFormat,
  useStatusLabel,
} from '@/entities/performance';
import { useDrillDown } from '@/features/drill-down';
import { MetricPicker } from '@/features/select-metric';
import { LatestOnlyNotice } from '@/features/select-period';
import type { MarketStatus as Status } from '@/shared/api';
import { cn, useMediaQuery, useStoredChoice, useStoredFlag } from '@/shared/lib';
import {
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
  ToggleGroup,
  ToggleGroupItem,
} from '@/shared/ui';

import { MapLegend } from './MapLegend';
import { StatusTile } from './StatusTile';
import { useMapFormat } from './use-map-format';

const MarketMap = dynamic(() => import('./MarketMap').then((m) => m.MarketMap), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

const STATUSES: Status[] = ['on_track', 'at_risk', 'off_track'];
const VIEWS = ['map', 'tiles', 'table'] as const;
type View = (typeof VIEWS)[number];
const ICON = { map: GlobeIcon, tiles: LayoutGridIcon, table: TableIcon } as const;
const CARD = 'gap-3 border border-border ring-0';
const isView = (v: string): v is View => VIEWS.some((view) => view === v);

/** The map's own frame (800 × 356, phones 800 × 428), so nothing moves when the chunk arrives. */
function MapSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[800/428] w-full rounded-md md:aspect-[800/356]" />
      <Skeleton className="mt-2 ml-auto h-9 w-44 rounded-lg md:h-11 md:w-48" />
    </div>
  );
}

/**
 * Markets on a world map, as tiles grouped by region, or as a table, behind
 * one switch remembered per browser (map from the md width, tiles on a
 * phone). All three show the same facts; Analyst picks the map's metric.
 */
export function MarketStatus() {
  const t = useTranslations('marketStatus');
  const titleId = useId();
  const { ds, state } = useDashboard();
  const { toMarket } = useDrillDown();
  const wide = useMediaQuery('(min-width: 48rem)');
  // The view used to be an on/off table flag; a stored "table" still counts.
  const [legacyTable] = useStoredFlag('mo:market-status-table');
  const [view, setView] = useStoredChoice(
    'mo:market-status-view',
    VIEWS,
    legacyTable ? 'table' : wide ? 'map' : 'tiles',
  );

  const { scope, period, range, kpi, selected } = state;
  const map = useMemo(
    () => marketMap(ds, scope, period, range, kpi, selected),
    [ds, scope, period, range, kpi, selected],
  );
  // A drill fits its region (a market: its region, outlined); the assistant's markets win.
  const fitIds = useMemo(
    () =>
      selected.length > 0
        ? selected
        : scope.regionId
          ? map.items.filter((i) => i.regionId === scope.regionId).map((i) => i.id)
          : [],
    [selected, map.items, scope.regionId],
  );

  // The remembered view is read after hydration: keep the skeleton until then.
  if (view === null || legacyTable === null) return <MarketStatusSkeleton />;

  const groups = marketTiles(ds, scope, period, range, selected);
  const product = scope.productId ? getProduct(ds, scope.productId) : undefined;

  return (
    <Card aria-labelledby={titleId} role="region" className={CARD}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>
          <h2 id={titleId} className="text-base font-semibold">
            {t('title')}
          </h2>
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          {state.mode === 'analyst' && view !== 'tiles' ? <MetricPicker /> : null}
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(next) => {
              if (isView(next)) setView(next);
            }}
            aria-label={t('view')}
            spacing={1}
            className="rounded-xl bg-muted p-1"
          >
            {VIEWS.map((v) => {
              const Icon = ICON[v];
              return (
                <ToggleGroupItem
                  key={v}
                  value={v}
                  className="min-h-11 px-3 hover:bg-card/60 data-[state=on]:bg-card data-[state=on]:shadow-sm"
                >
                  <Icon aria-hidden />
                  {t(`views.${v}`)}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {view === 'map' ? (
          <MapView map={map} tall={!wide} fitIds={fitIds} onOpen={toMarket} />
        ) : view === 'table' ? (
          <MarketTable groups={groups} map={map} />
        ) : (
          <Tiles groups={groups} onOpen={toMarket} />
        )}
        {product ? (
          <p className="text-xs text-muted-foreground">
            {t('perProduct', { product: product.name })}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Notice({ map }: { map: MarketMapView }) {
  const t = useTranslations('marketStatus');
  if (!map.notice) return null;
  // A past month is one move away; a product never has a share.
  return map.notice === 'sharePerProduct' ? (
    <p className="text-xs text-muted-foreground">{t('notice.sharePerProduct')}</p>
  ) : (
    <LatestOnlyNotice text={t(`notice.${map.notice}`)} />
  );
}

function MapView({
  map,
  tall,
  fitIds,
  onOpen,
}: {
  map: MarketMapView;
  tall: boolean;
  fitIds: readonly string[];
  onOpen: (id: string) => void;
}) {
  return (
    <>
      <Notice map={map} />
      <MarketMap view={map} tall={tall} fitIds={fitIds} onOpen={onOpen} />
      <MapLegend view={map} />
    </>
  );
}

function StatusLegend({ groups }: { groups: TileGroup[] }) {
  const t = useTranslations('marketStatus');
  const statusLabel = useStatusLabel();
  const tiles = groups.flatMap((g) => g.tiles);
  if (!tiles.some((tile) => tile.status !== null)) {
    return <LatestOnlyNotice text={t('latestOnly')} />;
  }
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {STATUSES.map((status) => (
        <li key={status} className="flex items-center gap-1.5">
          <StatusIcon status={status} />
          {statusLabel(status)}
          <span className="font-mono tabular-nums">
            {tiles.filter((tile) => tile.status === status).length}
          </span>
          {status === 'off_track' ? `· ${t('hatched')}` : null}
        </li>
      ))}
    </ul>
  );
}

function Tiles({ groups, onOpen }: { groups: TileGroup[]; onOpen: (id: string) => void }) {
  // A drill into one region gives it the whole width.
  const single = groups.length === 1;
  return (
    <>
      <div className={cn('grid gap-4', single ? '' : 'sm:grid-cols-2 xl:grid-cols-4')}>
        {groups.map((g) => (
          <div key={g.region.id} className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {g.region.name}
            </p>
            <div
              className={cn('grid gap-1.5', single ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-2')}
            >
              {g.tiles.map((tile) => (
                <StatusTile
                  key={tile.id}
                  tile={tile}
                  onSelect={() => {
                    onOpen(tile.id);
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <StatusLegend groups={groups} />
    </>
  );
}

/** The table alternative: attainment and status, plus the map's metric when it is another one. */
function MarketTable({ groups, map }: { groups: TileGroup[]; map: MarketMapView }) {
  const t = useTranslations('marketStatus');
  const tPeriod = useTranslations('period');
  const f = useKpiFormat();
  const m = useMapFormat();
  const { state } = useDashboard();
  const extra = map.metric !== 'status' && map.metric !== 'attainment' ? map.metric : null;
  const byId = new Map<string, MapItem>(map.items.map((i) => [i.id, i]));

  return (
    <>
      <Table>
        <TableCaption className="sr-only">
          {t('caption', {
            window:
              state.range === '1m'
                ? f.period(state.period)
                : tPeriod('label', {
                    period: f.period(state.period),
                    range: tPeriod(`range.${state.range}`),
                  }),
          })}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>{t('market')}</TableHead>
            <TableHead>{t('region')}</TableHead>
            <TableHead className="text-right">{t('attainment')}</TableHead>
            {extra ? <TableHead className="text-right">{m.metricLabel(extra)}</TableHead> : null}
            <TableHead>{t('status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.flatMap((g) =>
            g.tiles.map((tile) => {
              const item = byId.get(tile.id);
              return (
                <TableRow key={tile.id}>
                  <TableCell className="font-medium">{tile.name}</TableCell>
                  <TableCell>{g.region.name}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {f.value(tile.attainmentPct, 'percent')}
                  </TableCell>
                  {extra && item ? (
                    <TableCell className="text-right font-mono tabular-nums">
                      {m.value(extra, item.value)}
                    </TableCell>
                  ) : null}
                  <TableCell>
                    {tile.status ? <StatusChip status={tile.status} /> : t('latestOnly')}
                  </TableCell>
                </TableRow>
              );
            }),
          )}
        </TableBody>
      </Table>
      {map.notice === 'sharePerProduct' || map.notice === 'shareLatestOnly' ? (
        <Notice map={map} />
      ) : null}
      <StatusLegend groups={groups} />
    </>
  );
}

/** The card's own frame: title, the view switch, a map-sized block on wide screens, tiles on a phone. */
export function MarketStatusSkeleton() {
  return (
    <Card aria-hidden className={CARD}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>
          <Skeleton className="h-6 w-32" />
        </CardTitle>
        <Skeleton className="h-13 w-64 rounded-xl" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="hidden md:block">
          <MapSkeleton />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:hidden">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-24" />
              <div className="grid grid-cols-2 gap-1.5">
                <Skeleton className="h-14 rounded-lg" />
                <Skeleton className="h-14 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-4 w-64 max-w-full" />
      </CardContent>
    </Card>
  );
}
