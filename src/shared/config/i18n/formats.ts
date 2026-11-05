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
    /** A change in percentage points (radar momentum): "+1.2". */
    signedDecimal: {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      signDisplay: 'exceptZero',
    },
    /** Heat-map cells: whole percent, the decimal shows on focus. */
    wholePercent: { style: 'percent', maximumFractionDigits: 0 },
    signedWholePercent: { style: 'percent', maximumFractionDigits: 0, signDisplay: 'exceptZero' },
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
