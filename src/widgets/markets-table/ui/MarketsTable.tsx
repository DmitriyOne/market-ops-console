'use client';

import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useMemo } from 'react';

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
import { ExportMarketsButton } from '@/features/export-markets';
import { MarketFilter } from '@/features/select-markets';
import { cn } from '@/shared/lib';
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
  { column: 'gap', key: 'gap', kind: 'signedCurrency' },
  { column: 'attainment', key: 'attainmentPct', kind: 'percent' },
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
  const { sort, sortBy } = useTableSort();
  const { scope, period, range, selected } = state;

  const view = useMemo(
    () => marketsTable(ds, scope, period, range, selected, sort),
    [ds, scope, period, range, selected, sort],
  );
  const latest = isLatestSnapshot(ds, period, range);
  const window =
    range === '1m'
      ? f.period(period)
      : tPeriod('label', { period: f.period(period), range: tPeriod(`range.${range}`) });

  return (
    <Card aria-labelledby={titleId} role="region" className={CARD}>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>
          <h2 id={titleId} className="text-base font-semibold">
            {t('title')}
          </h2>
        </CardTitle>
        <ExportMarketsButton />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <MarketFilter />
          {view.filtered && view.rows.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {t('shown', { shown: view.rows.length, total: view.inScope })}
            </p>
          ) : null}
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
                <MarketRow key={row.id} row={row} onOpen={toMarket} />
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

function MarketRow({ row, onOpen }: { row: Row; onOpen: (id: string) => void }) {
  const f = useKpiFormat();
  return (
    <TableRow aria-current={row.current ? 'true' : undefined}>
      <TableCell className={cn(STICKY, 'p-0 font-medium')}>
        <Button
          type="button"
          variant="ghost"
          className={cn('min-h-11 w-full justify-start px-2', row.current && 'font-semibold')}
          onClick={() => {
            onOpen(row.id);
          }}
        >
          {row.name}
        </Button>
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
export function MarketsTableSkeleton() {
  return (
    <Card aria-hidden className={CARD}>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-24" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-11 w-32 rounded-lg" />
        <Skeleton className="h-96 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}
