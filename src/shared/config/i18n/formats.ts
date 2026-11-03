import type { Formats } from 'next-intl';

/** The only number and date formats the UI uses (ADR 0010). Currency is always USD. */
export const formats = {
  number: {
    currency: { style: 'currency', currency: 'USD' },
    compactCurrency: {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    },
    compact: { notation: 'compact', maximumFractionDigits: 1 },
    percent: { style: 'percent', maximumFractionDigits: 1 },
    signedPercent: { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' },
  },
  dateTime: {
    period: { month: 'short', year: 'numeric', timeZone: 'UTC' },
  },
} satisfies Formats;
