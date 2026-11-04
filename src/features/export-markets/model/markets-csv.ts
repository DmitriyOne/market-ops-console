import type { MarketsTableView, Range } from '@/entities/performance';
import type { Period } from '@/shared/api';
import { toCsv } from '@/shared/lib';

/** Machine names, the same in every locale, so a sheet built on the file keeps working. */
export const MARKETS_CSV_HEADER = [
  'market_id',
  'market',
  'region',
  'revenue_usd',
  'gap_to_forecast_usd',
  'attainment_pct',
  'growth_pct',
  'share_pct',
  'units',
  'status',
] as const;

const money = (n: number | null) => (n === null ? null : Math.round(n));
const pct = (n: number | null) => (n === null ? null : Math.round(n * 100) / 100);

/** The rows as shown (filter, sort, window), raw USD; the total is left to the spreadsheet. */
export function marketsCsv(view: MarketsTableView): string {
  return toCsv(
    MARKETS_CSV_HEADER,
    view.rows.map((r) => [
      r.id,
      r.name,
      r.regionName,
      money(r.revenue.value),
      money(r.gap.value),
      pct(r.attainmentPct.value),
      pct(r.growthPct.value),
      pct(r.sharePct.value),
      money(r.units.value),
      r.status,
    ]),
  );
}

export function marketsCsvName(period: Period, range: Range, productId?: string): string {
  return `${['markets', period, range, productId].filter(Boolean).join('-')}.csv`;
}
