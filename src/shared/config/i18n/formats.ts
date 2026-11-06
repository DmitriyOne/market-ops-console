import type { Formats } from 'next-intl';

import { type Currency, DEFAULT_CURRENCY } from '../currency';

/**
 * The only number and date formats the UI uses (ADR 0010), with amounts in
 * `currency` (ADR 0017). The symbol is bare everywhere: "$", "€", "£", never
 * "US$" (owner, 2026-11-05).
 */
export const formatsFor = (currency: Currency) => {
  const money = { style: 'currency', currency, currencyDisplay: 'narrowSymbol' } as const;
  return {
    number: {
      currency: money,
      /** Whole units, for tables that stand in for a chart. */
      wholeCurrency: { ...money, maximumFractionDigits: 0 },
      compactCurrency: { ...money, notation: 'compact', maximumFractionDigits: 1 },
      /** A gap to plan: "−$80K", "+$1.2M". */
      signedCompactCurrency: {
        ...money,
        notation: 'compact',
        maximumFractionDigits: 1,
        signDisplay: 'exceptZero',
      },
      compact: { notation: 'compact', maximumFractionDigits: 1 },
      integer: { maximumFractionDigits: 0 },
      percent: { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 },
      /** A change in percentage points (radar momentum): "+1.2". */
      signedDecimal: {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
        signDisplay: 'exceptZero',
      },
      /** Heat-map cells: whole percent, the decimal shows on focus. */
      wholePercent: { style: 'percent', maximumFractionDigits: 0 },
      signedWholePercent: { style: 'percent', maximumFractionDigits: 0, signDisplay: 'exceptZero' },
      /** An alert threshold as typed: "$1.25M" (two decimals, not the dashboard's one). */
      thresholdCurrency: { ...money, notation: 'compact', maximumFractionDigits: 2 },
      /** A currency rate: "0.89095". */
      rate: { minimumFractionDigits: 2, maximumFractionDigits: 5 },
      /** An alert threshold as typed: "95%", "95.5%", "+2%". */
      thresholdPercent: { style: 'percent', maximumFractionDigits: 2 },
      signedThresholdPercent: {
        style: 'percent',
        maximumFractionDigits: 2,
        signDisplay: 'exceptZero',
      },
      signedPercent: {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
        signDisplay: 'exceptZero',
      },
    },
    dateTime: {
      period: { month: 'short', year: 'numeric', timeZone: 'UTC' },
      /** Chart axis on narrow screens: "Jun 24". */
      periodShort: { month: 'short', year: '2-digit', timeZone: 'UTC' },
      day: { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' },
      month: { month: 'short', timeZone: 'UTC' },
      year: { year: 'numeric', timeZone: 'UTC' },
    },
  } satisfies Formats;
};

/** The formats in the default currency: the server's HTML and the message types. */
export const formats = formatsFor(DEFAULT_CURRENCY);
