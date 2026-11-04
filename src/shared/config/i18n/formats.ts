import type { Formats } from 'next-intl';

/** The only number and date formats the UI uses (ADR 0010). Currency is always USD. */
export const formats = {
  number: {
    currency: { style: 'currency', currency: 'USD' },
    /** Whole dollars, for tables that stand in for a chart. */
    wholeCurrency: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
    compactCurrency: {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    },
    /** A gap to plan: "−$80K", "+$1.2M". */
    signedCompactCurrency: {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
      signDisplay: 'exceptZero',
    },
    compact: { notation: 'compact', maximumFractionDigits: 1 },
    integer: { maximumFractionDigits: 0 },
    percent: { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 },
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
