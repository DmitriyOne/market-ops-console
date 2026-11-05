import type { Anomaly, Dataset, MarketStatus, Period } from '@/shared/api';

import type { KpiValue } from './kpis';
import { getRegion } from './reference';
import { rowsInScope, sumRows } from './rows';
import { isLatestSnapshot, marketsInOrder, periodsInRange, type Range, type Scope } from './scope';
import { statusFor } from './status';

export const TABLE_COLUMNS = [
  'market',
  'region',
  'revenue',
  'forecast',
  'gap',
  'attainment',
  'priorYear',
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
  /** Σ forecast in the window, from series. */
  forecast: KpiValue;
  /** Σ prior-year actual in the window, from series. */
  priorYear: KpiValue;
  /** Actual − forecast in the window, always from series. */
  gap: KpiValue;
  attainmentPct: KpiValue;
  growthPct: KpiValue;
  sharePct: KpiValue;
  units: KpiValue;
};

export type TableRow = TableTotals & {
  id: string;
  /** ISO 3166 alpha-2, as on the tiles. */
  code: string;
  name: string;
  regionId: string;
  regionName: string;
  /** Null off the latest month: the stored status describes that month only. */
  status: MarketStatus | null;
  /** The market the dashboard is drilled into. */
  current: boolean;
  /** Anomaly markers from the data whose month is in the window. */
  anomalies: Anomaly[];
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
    case 'forecast':
      return row.forecast.value;
    case 'gap':
      return row.gap.value;
    case 'priorYear':
      return row.priorYear.value;
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
      forecast: UNAVAILABLE,
      priorYear: UNAVAILABLE,
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
    forecast: calculated(t.forecast),
    priorYear: calculated(t.priorYear),
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

  const inWindow = new Set(periods);
  const rows = shown.map((m): TableRow => {
    // Every figure from series, so a row agrees with itself and the total is
    // the sum of the rows. Share is not in series: the stored figure, latest
    // month and all products only. The tiles keep the stored KPIs (spec §5).
    const series = rowsInScope(
      ds,
      { marketId: m.id, ...(scope.productId ? { productId: scope.productId } : {}) },
      periods,
    );
    const none = series.length === 0;
    const t = sumRows(series);
    const growth = ratioPct(t.actual, t.priorYear);
    const of = (value: number | null) => (none ? UNAVAILABLE : calculated(value));
    return {
      id: m.id,
      code: m.iso2,
      name: m.name,
      regionId: m.regionId,
      regionName: getRegion(ds, m.regionId)?.name ?? m.regionId,
      revenue: of(t.actual),
      forecast: of(t.forecast),
      priorYear: of(t.priorYear),
      gap: of(t.actual - t.forecast),
      attainmentPct: of(ratioPct(t.actual, t.forecast)),
      growthPct: of(growth === null ? null : growth - 100),
      sharePct:
        latest && !scope.productId ? { value: m.kpis.sharePct, source: 'data' } : UNAVAILABLE,
      units: of(t.units),
      status: statusFor(ds, m.id, period, range),
      current: m.id === scope.marketId,
      anomalies: m.kpis.anomalies.filter((a) => inWindow.has(a.period)),
    };
  });

  return {
    rows: sortRows(rows, sort),
    totals: totalsOf(ds, rows, scope.productId, periods, latest),
    inScope: inScope.length,
    filtered,
  };
}

export type MonthlyRow = {
  id: string;
  code: string;
  name: string;
  regionName: string;
  period: Period;
  actual: number;
  forecast: number;
  priorYear: number;
  units: number;
};

/**
 * The months behind the table: one row per market shown (table order) and
 * month of the window, summed over products or for the chosen product.
 */
export function marketsMonthly(
  ds: Dataset,
  view: MarketsTableView,
  scope: Scope,
  period: Period,
  range: Range,
): MonthlyRow[] {
  const periods = periodsInRange(ds.meta.periods, period, range);
  return view.rows.flatMap((row) =>
    periods.map((p) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      regionName: row.regionName,
      period: p,
      ...sumRows(
        rowsInScope(
          ds,
          { marketId: row.id, ...(scope.productId ? { productId: scope.productId } : {}) },
          [p],
        ),
      ),
    })),
  );
}
