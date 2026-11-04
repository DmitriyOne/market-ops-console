'use client';

import { TableIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import {
  marketTiles,
  StatusChip,
  StatusIcon,
  useDashboard,
  useKpiFormat,
  useStatusLabel,
} from '@/entities/performance';
import { useDrillDown } from '@/features/drill-down';
import { LatestOnlyNotice } from '@/features/select-period';
import type { MarketStatus as Status } from '@/shared/api';
import { cn } from '@/shared/lib';
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

import { StatusTile } from './StatusTile';

const STATUSES: Status[] = ['on_track', 'at_risk', 'off_track'];

/**
 * Markets as tiles grouped by region (variant A): status by shape, word and
 * colour, off-track hatched; attainment follows the period. A table gives
 * the same facts.
 */
export function MarketStatus() {
  const t = useTranslations('marketStatus');
  const f = useKpiFormat();
  const statusLabel = useStatusLabel();
  const titleId = useId();
  const { ds, state } = useDashboard();
  const { toMarket } = useDrillDown();
  const [asTable, setAsTable] = useState(false);

  const groups = marketTiles(ds, state.scope, state.period, state.range, state.highlighted);
  const tiles = groups.flatMap((g) => g.tiles);
  const hasStatus = tiles.some((tile) => tile.status !== null);
  // A drill into one region gives it the whole width.
  const single = groups.length === 1;

  return (
    <Card aria-labelledby={titleId} role="region" className="gap-3 border border-border ring-0">
      <CardHeader>
        <CardTitle>
          <h2 id={titleId} className="text-base font-semibold">
            {t('title')}
          </h2>
        </CardTitle>
        <CardAction>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            aria-pressed={asTable}
            onClick={() => {
              setAsTable((v) => !v);
            }}
          >
            <TableIcon aria-hidden />
            {t('showTable')}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {asTable ? (
          <Table>
            <TableCaption className="sr-only">
              {t('caption', { period: f.period(state.period) })}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>{t('market')}</TableHead>
                <TableHead>{t('region')}</TableHead>
                <TableHead className="text-right">{t('attainment')}</TableHead>
                <TableHead>{t('status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.flatMap((g) =>
                g.tiles.map((tile) => (
                  <TableRow key={tile.id}>
                    <TableCell className="font-medium">{tile.name}</TableCell>
                    <TableCell>{g.region.name}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {f.value(tile.attainmentPct, 'percent')}
                    </TableCell>
                    <TableCell>
                      {tile.status ? <StatusChip status={tile.status} /> : t('latestOnly')}
                    </TableCell>
                  </TableRow>
                )),
              )}
            </TableBody>
          </Table>
        ) : (
          <div className={cn('grid gap-4', single ? '' : 'sm:grid-cols-2 xl:grid-cols-4')}>
            {groups.map((g) => (
              <div key={g.region.id} className="flex flex-col gap-1.5">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {g.region.name}
                </p>
                <div
                  className={cn(
                    'grid gap-1.5',
                    single ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-2',
                  )}
                >
                  {g.tiles.map((tile) => (
                    <StatusTile
                      key={tile.id}
                      tile={tile}
                      onSelect={() => {
                        toMarket(tile.id);
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {hasStatus ? (
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
        ) : (
          <LatestOnlyNotice text={t('latestOnly')} />
        )}
      </CardContent>
    </Card>
  );
}

export function MarketStatusSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <Skeleton className="h-5 w-32" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="grid grid-cols-2 gap-1.5">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ))}
      </div>
    </div>
  );
}
