'use client';

import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, TriangleAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useId, useMemo, useRef } from 'react';

import { AlertMark, type MarketFlag, useAlertFlags, useFlagLabel } from '@/entities/alert-rule';
import {
  isLatestSnapshot,
  marketsTable,
  scopeLabel,
  StatusChip,
  type TableColumn,
  type TableRow as Row,
  type TableSort,
  type TableTotals,
  useDashboard,
  useKpiFormat,
} from '@/entities/performance';
import { useDrillDown } from '@/features/drill-down';
import { ExportMenu } from '@/features/export-markets';
import { MarketFilter, SelectionChips } from '@/features/select-markets';
import { cn } from '@/shared/lib';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Skeleton,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui';

import { useTableSort } from '../model/use-table-sort';

const CARD = 'gap-3 border border-border ring-0';
// The first column stays in view while the table scrolls sideways on a phone.
const STICKY = 'sticky left-0 z-10 bg-card';
const NUM = 'text-right font-mono tabular-nums';

type NumberColumn = Exclude<TableColumn, 'market' | 'region' | 'status'>;
type Kind = 'currency' | 'signedCurrency' | 'percent' | 'signedPercent' | 'integer';
const NUMBERS: { column: NumberColumn; key: keyof TableTotals; kind: Kind }[] = [
  { column: 'revenue', key: 'revenue', kind: 'currency' },
  { column: 'forecast', key: 'forecast', kind: 'currency' },
  { column: 'gap', key: 'gap', kind: 'signedCurrency' },
  { column: 'attainment', key: 'attainmentPct', kind: 'percent' },
  { column: 'priorYear', key: 'priorYear', kind: 'currency' },
  { column: 'growth', key: 'growthPct', kind: 'signedPercent' },
  { column: 'share', key: 'sharePct', kind: 'percent' },
  { column: 'units', key: 'units', kind: 'integer' },
];

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const;

/** A column header that sorts; `aria-sort` sits on the header cell, the button names the column. */
function SortHead({
  column,
  sort,
  onSort,
  className,
}: {
  column: TableColumn;
  sort: TableSort;
  onSort: (column: TableColumn) => void;
  className?: string;
}) {
  const t = useTranslations('marketsTable');
  const dir = sort?.column === column ? sort.dir : null;
  const Icon = dir === 'asc' ? ArrowUpIcon : dir === 'desc' ? ArrowDownIcon : ArrowUpDownIcon;
  const numeric = column !== 'market' && column !== 'region' && column !== 'status';
  return (
    <TableHead aria-sort={dir ? ARIA_SORT[dir] : undefined} className={cn('px-0', className)}>
      <Button
        type="button"
        variant="ghost"
        className={cn(
          'min-h-11 w-full gap-1 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase',
          numeric ? 'justify-end' : 'justify-start',
        )}
        onClick={() => {
          onSort(column);
        }}
      >
        {t(`column.${column}`)}
        <Icon aria-hidden className={cn(!dir && 'opacity-40')} />
      </Button>
    </TableHead>
  );
}

/**
 * The Analyst markets table (spec §8): every KPI per market of the scope,
 * sortable, narrowed by the selected markets, with a total of the rows
 * shown. A market name opens that market.
 */
export function MarketsTable() {
  const t = useTranslations('marketsTable');
  const tDrill = useTranslations('drill');
  const tPeriod = useTranslations('period');
  const titleId = useId();
  const f = useKpiFormat();
  const { ds, state } = useDashboard();
  const { toMarket } = useDrillDown();
  const flags = useAlertFlags(ds);
  const { sort, sortBy } = useTableSort();
  const { scope, period, range, selected } = state;

  const view = useMemo(
    () => marketsTable(ds, scope, period, range, selected, sort),
    [ds, scope, period, range, selected, sort],
  );
  const latest = isLatestSnapshot(ds, period, range);
  const title = useRef<HTMLHeadingElement>(null);
  const focusTitle = useCallback(() => {
    title.current?.focus();
  }, []);
  const window =
    range === '1m'
      ? f.period(period)
      : tPeriod('label', { period: f.period(period), range: tPeriod(`range.${range}`) });

  return (
    <Card aria-labelledby={titleId} role="region" className={CARD}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>
          {/* Focus lands here when the last chip is removed. */}
          <h2
            id={titleId}
            ref={title}
            tabIndex={-1}
            className="text-base font-semibold outline-none"
          >
            {t('title')}
          </h2>
        </CardTitle>
        <ExportMenu />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <MarketFilter />
          <SelectionChips onEmptied={focusTitle} />
        </div>
        {view.rows.length === 0 ? (
          // The filter's own Clear above is the way back.
          <p className="rounded-md border border-dashed border-border p-4 text-sm">{t('empty')}</p>
        ) : (
          <Table>
            <TableCaption className="sr-only">
              {t('caption', { scope: scopeLabel(ds, scope) ?? tDrill('portfolio'), window })}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <SortHead column="market" sort={sort} onSort={sortBy} className={STICKY} />
                <SortHead column="region" sort={sort} onSort={sortBy} />
                {NUMBERS.map((n) => (
                  <SortHead key={n.column} column={n.column} sort={sort} onSort={sortBy} />
                ))}
                <SortHead column="status" sort={sort} onSort={sortBy} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {view.rows.map((row) => (
                <MarketRow
                  key={row.id}
                  row={row}
                  flag={flags.byMarket.get(row.id)}
                  onOpen={toMarket}
                />
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className={cn(STICKY, 'bg-muted font-semibold')}>
                  <span aria-hidden>{t('total')}</span>
                  <span className="sr-only">{t('totalCalculated')}</span>
                </TableCell>
                <TableCell />
                {NUMBERS.map((n) => (
                  <TableCell key={n.column} className={NUM}>
                    {f.value(view.totals[n.key], n.kind)}
                  </TableCell>
                ))}
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        )}
        <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground">
          {latest ? null : <li>{t('noteLatest')}</li>}
          {scope.productId ? <li>{t('notePerProduct')}</li> : null}
          <li>{t('noteCalculated')}</li>
        </ul>
      </CardContent>
    </Card>
  );
}

function MarketRow({
  row,
  flag,
  onOpen,
}: {
  row: Row;
  /** What the alert rules say about this market now, if anything. */
  flag: MarketFlag | undefined;
  onOpen: (id: string) => void;
}) {
  const t = useTranslations('marketsTable');
  const f = useKpiFormat();
  const flagLabel = useFlagLabel();
  return (
    <TableRow aria-current={row.current ? 'true' : undefined}>
      <TableCell className={cn(STICKY, 'p-0 font-medium')}>
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            className={cn('min-h-11 flex-1 justify-start px-2', row.current && 'font-semibold')}
            onClick={() => {
              onOpen(row.id);
            }}
          >
            {/* The code as on the tiles; part of the name (label in name, WCAG 2.5.3). */}
            <span className="font-mono text-xs text-muted-foreground">{row.code}</span> {row.name}
          </Button>
          {flag ? (
            // A popover, not a tooltip: a tap shows the rule names on touch too.
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="size-11"
                  aria-label={flagLabel(flag)}
                >
                  <AlertMark flag={flag} labelled={false} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-64 text-sm">{flagLabel(flag)}</PopoverContent>
            </Popover>
          ) : null}
          {row.anomalies.map((a) => {
            const label = t('anomaly', { period: f.period(a.period), note: a.note });
            return (
              // A popover like the bell's: a tap shows the note on touch too.
              <Popover key={`${a.period}:${a.note}`}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={label}
                    className="size-11 text-status-off-track"
                  >
                    <TriangleAlertIcon aria-hidden />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto max-w-64 text-sm">{label}</PopoverContent>
              </Popover>
            );
          })}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{row.regionName}</TableCell>
      {NUMBERS.map((n) => (
        <TableCell key={n.column} className={NUM}>
          {f.value(row[n.key], n.kind)}
        </TableCell>
      ))}
      <TableCell>
        {row.status ? (
          <StatusChip status={row.status} />
        ) : (
          f.value({ value: null, source: 'unavailable' }, 'integer')
        )}
      </TableCell>
    </TableRow>
  );
}

/** The card's own frame: title, filter, a block of rows. */
// Header, the portfolio's 13 markets and the total, each a 44 px row (the
// common Analyst link). A region or a selection has fewer rows; the table
// then ends sooner, below the skeleton's top.
const SKELETON_ROWS = 15;

export function MarketsTableSkeleton() {
  return (
    <Card aria-hidden className={CARD}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>
          <Skeleton className="h-6 w-24" />
        </CardTitle>
        <Skeleton className="h-11 w-28 rounded-lg" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-11 w-32 rounded-lg" />
        <div className="flex flex-col gap-px">
          {Array.from({ length: SKELETON_ROWS }, (_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-sm" />
          ))}
        </div>
        <Skeleton className="h-8 w-full max-w-xl" />
      </CardContent>
    </Card>
  );
}
