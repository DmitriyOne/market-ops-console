import type { Dataset } from '@/shared/api';
import { type Currency, USD_RATES } from '@/shared/config';

// One copy per dataset and currency: the same object on every render, so
// memoised views and React Query's `select` keep their results.
const copies = new WeakMap<Dataset, Map<Currency, Dataset>>();

/**
 * The dataset with every amount (market revenue; actual, forecast and prior
 * year per row) in `currency` at its fixed rate (ADR 0017). Growth,
 * attainment, share and units are not amounts and stay as they are.
 */
export function inCurrency(ds: Dataset, currency: Currency): Dataset {
  const rate = USD_RATES[currency];
  if (rate === 1) return ds;
  const own = copies.get(ds) ?? new Map<Currency, Dataset>();
  copies.set(ds, own);
  const cached = own.get(currency);
  if (cached) return cached;

  const converted: Dataset = {
    ...ds,
    meta: { ...ds.meta, currency },
    markets: ds.markets.map((m) => ({ ...m, kpis: { ...m.kpis, revenue: m.kpis.revenue * rate } })),
    series: ds.series.map((r) => ({
      ...r,
      actual: r.actual * rate,
      forecast: r.forecast * rate,
      priorYear: r.priorYear * rate,
    })),
  };
  own.set(currency, converted);
  return converted;
}
