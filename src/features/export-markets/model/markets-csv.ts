import type { MarketsTableView, Range } from '@/entities/performance';
import type { Anomaly, Period } from '@/shared/api';
import { toCsv } from '@/shared/lib';

/** Machine names, the same in every locale, so a sheet built on the file keeps working. */
export const MARKETS_CSV_HEADER = [
  'market_id',
  'iso2',
  'market',
  'region',
  'revenue_usd',
  'forecast_usd',
  'gap_to_forecast_usd',
  'attainment_pct',
  'prior_year_usd',
  'growth_pct',
  'share_pct',
  'units',
  'status',
  'anomaly',
] as const;

const money = (n: number | null) => (n === null ? null : Math.round(n));
const pct = (n: number | null) => (n === null ? null : Math.round(n * 100) / 100);

/** A machine format like the header: the same in every locale, not UI text. */
const CSV_LIST_SEPARATOR = '; ';

/** "2026-03: Revenue fell 27% …" (the data's own words); several are joined. */
export const anomalyText = (anomalies: readonly Anomaly[]) =>
  anomalies.length === 0
    ? null
    : anomalies.map((a) => `${a.period}: ${a.note}`).join(CSV_LIST_SEPARATOR);

/** The rows as shown (filter, sort, window), raw USD; the total is left to the spreadsheet. */
export function marketsCsv(view: MarketsTableView): string {
  return toCsv(
    MARKETS_CSV_HEADER,
    view.rows.map((r) => [
      r.id,
      r.code,
      r.name,
      r.regionName,
      money(r.revenue.value),
      money(r.forecast.value),
      money(r.gap.value),
      pct(r.attainmentPct.value),
      money(r.priorYear.value),
      pct(r.growthPct.value),
      pct(r.sharePct.value),
      money(r.units.value),
      r.status,
      anomalyText(r.anomalies),
    ]),
  );
}

export function marketsCsvName(period: Period, range: Range, productId?: string): string {
  return `${['markets', period, range, productId].filter(Boolean).join('-')}.csv`;
}
