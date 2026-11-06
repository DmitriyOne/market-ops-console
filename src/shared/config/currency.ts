/** The currencies the UI can show amounts in (owner, 2026-11-05). The data is USD. */
export const CURRENCIES = ['USD', 'EUR', 'GBP'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = 'USD';

/** The URL parameter that holds the currency (`?currency=GBP`); USD is not written. */
export const CURRENCY_PARAM = 'currency';

export const isCurrency = (v: string): v is Currency => CURRENCIES.some((c) => c === v);

/** The symbol each prints with (`narrowSymbol`): "$", never "US$". */
export const CURRENCY_SYMBOLS: Record<Currency, string> = { USD: '$', EUR: '€', GBP: '£' };

/**
 * Units of each currency per US dollar: ECB reference rates of `RATES_DATE`
 * (Frankfurter API; open.er-api.com within 0.15 %). One rate for every
 * month, so growth, attainment and share never change. Fixed for the demo;
 * a real app would get rates from the backend API.
 */
export const USD_RATES: Record<Currency, number> = { USD: 1, EUR: 0.89095, GBP: 0.74299 };

/** The day the rates were checked. */
export const RATES_DATE = '2026-11-05';
