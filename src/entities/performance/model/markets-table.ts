import type { Dataset, MarketStatus, Period } from '@/shared/api';

import { computeKpis, type KpiValue } from './kpis';
import { getRegion } from './reference';
import { rowsInScope, sumRows } from './rows';
import { isLatestSnapshot, marketsInOrder, periodsInRange, type Range, type Scope } from './scope';
import { statusFor } from './status';

export const TABLE_COLUMNS = [
  'market',
  'region',
  'revenue',
  'gap',
  'attainment',
  'growth',
  'share',
  'units',
  'status',
] as const;
export type TableColumn = (typeof TABLE_COLUMNS)[number];
/** Null = the default order (the map's Tab order). */
export type TableSort = { column: TableColumn; dir: 'asc' | 'desc' } | null;

export type TableTotals = {
  revenue: KpiValue;
  /** Actual − forecast in the window, always from series. */
  gap: KpiValue;
  attainmentPct: KpiValue;
  growthPct: KpiValue;
  sharePct: KpiValue;
  units: KpiValue;
};

export type TableRow = TableTotals & {
  id: string;
  name: string;
  regionId: string;
  regionName: string;
  /** Null off the latest month: the stored status describes that month only. */
  status: MarketStatus | null;
  /** The market the dashboard is drilled into. */
  current: boolean;
};

export type MarketsTableView = {
  rows: TableRow[];
  /** Over the rows shown; ratios from series, so they are calculated. */
  totals: TableTotals;
  /** Rows in the scope before the selection filter. */
  inScope: number;
  /** A selection narrows the rows. */
  filtered: boolean;
};

const UNAVAILABLE: KpiValue = { value: null, source: 'unavailable' };
const calculated = (value: number | null): KpiValue =>
  value === null ? UNAVAILABLE : { value, source: 'calculated' };
const ratioPct = (a: number, b: number) => (b === 0 ? null : (a / b) * 100);

const STATUS_ORDER: Record<MarketStatus, number> = { off_track: 0, at_risk: 1, on_track: 2 };
const isColumn = (v: string): v is TableColumn => TABLE_COLUMNS.some((c) => c === v);

/** `growth` = ascending, `-growth` = descending; anything else is invalid (undefined). */
export function parseSort(raw: string): TableSort | undefined {
  const desc = raw.startsWith('-');
  const column = desc ? raw.slice(1) : raw;
  return isColumn(column) ? { column, dir: desc ? 'desc' : 'asc' } : undefined;
}

export function sortParam(sort: TableSort): string | null {
  if (!sort) return null;
  return sort.dir === 'desc' ? `-${sort.column}` : sort.column;
}

/** The value a column sorts by; null sorts last in both directions. */
function sortKey(row: TableRow, column: TableColumn): number | string | null {
  switch (column) {
    case 'market':
      return row.name;
    case 'region':
      return row.regionName;
    case 'status':
      return row.status === null ? null : STATUS_ORDER[row.status];
    case 'revenue':
      return row.revenue.value;
    case 'gap':
      return row.gap.value;
    case 'attainment':
      return row.attainmentPct.value;
    case 'growth':
      return row.growthPct.value;
    case 'share':
      return row.sharePct.value;
    case 'units':
      return row.units.value;
  }
}

function compare(a: number | string, b: number | string): number {
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b, 'en');
  return Number(a) - Number(b);
}

function sortRows(rows: TableRow[], sort: TableSort): TableRow[] {
  if (!sort) return rows;
  const sign = sort.dir === 'asc' ? 1 : -1;
  // `toSorted` is stable: ties and missing values keep the default order.
  return rows.toSorted((a, b) => {
    const x = sortKey(a, sort.column);
    const y = sortKey(b, sort.column);
    if (x === null || y === null) return Number(x === null) - Number(y === null);
    return sign * compare(x, y);
  });
}

/** Sums and series ratios over the given markets; share only where every row has one. */
function totalsOf(
  ds: Dataset,
  rows: readonly TableRow[],
  productId: string | undefined,
  periods: readonly Period[],
  latest: boolean,
): TableTotals {
  const ids = new Set(rows.map((r) => r.id));
  const series = rowsInScope(ds, productId ? { productId } : {}, periods).filter((r) =>
    ids.has(r.marketId),
  );
  if (series.length === 0) {
    return {
      revenue: UNAVAILABLE,
      gap: UNAVAILABLE,
      attainmentPct: UNAVAILABLE,
      growthPct: UNAVAILABLE,
      sharePct: UNAVAILABLE,
      units: UNAVAILABLE,
    };
  }
  const t = sumRows(series);
  const growth = ratioPct(t.actual, t.priorYear);
  let share: number | null = null;
  if (latest && !productId) {
    let weighted = 0;
    let revenue = 0;
    for (const m of ds.markets.filter((market) => ids.has(market.id))) {
      weighted += m.kpis.sharePct * m.kpis.revenue;
      revenue += m.kpis.revenue;
    }
    share = revenue === 0 ? null : weighted / revenue;
  }
  return {
    revenue: calculated(t.actual),
    gap: calculated(t.actual - t.forecast),
    attainmentPct: calculated(ratioPct(t.actual, t.forecast)),
    growthPct: calculated(growth === null ? null : growth - 100),
    sharePct: calculated(share),
    units: calculated(t.units),
  };
}

/**
 * The Analyst markets table (spec §8): the scope's markets like the tiles
 * (a market drill shows its region, that row current), a product narrows
 * every market to it, the selection narrows the rows, `sort` orders them.
 */
export function marketsTable(
  ds: Dataset,
  scope: Scope,
  period: Period,
  range: Range,
  selected: readonly string[],
  sort: TableSort,
): MarketsTableView {
  const periods = periodsInRange(ds.meta.periods, period, range);
  const latest = isLatestSnapshot(ds, period, range);
  const inScope = marketsInOrder(ds).filter(
    (m) => !scope.regionId || m.regionId === scope.regionId,
  );
  const chosen = new Set(selected);
  const filtered = chosen.size > 0;
  const shown = filtered ? inScope.filter((m) => chosen.has(m.id)) : inScope;

  const rows = shown.map((m): TableRow => {
    const kpis = computeKpis(
      ds,
      {
        regionId: m.regionId,
        marketId: m.id,
        ...(scope.productId ? { productId: scope.productId } : {}),
      },
      period,
      range,
    );
    const totals = sumRows(
      rowsInScope(
        ds,
        { marketId: m.id, ...(scope.productId ? { productId: scope.productId } : {}) },
        periods,
      ),
    );
    return {
      id: m.id,
      name: m.name,
      regionId: m.regionId,
      regionName: getRegion(ds, m.regionId)?.name ?? m.regionId,
      revenue: kpis.revenue,
      gap: periods.length === 0 ? UNAVAILABLE : calculated(totals.actual - totals.forecast),
      attainmentPct: kpis.attainmentPct,
      growthPct: kpis.growthPct,
      sharePct: kpis.sharePct,
      units: kpis.units,
      status: statusFor(ds, m.id, period, range),
      current: m.id === scope.marketId,
    };
  });

  return {
    rows: sortRows(rows, sort),
    totals: totalsOf(ds, rows, scope.productId, periods, latest),
    inScope: inScope.length,
    filtered,
  };
}
