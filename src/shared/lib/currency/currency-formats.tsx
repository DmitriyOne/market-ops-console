'use client';

import { NextIntlClientProvider, useLocale, useMessages, useTimeZone } from 'next-intl';
import { type ReactNode, useMemo } from 'react';

import { formatsFor } from '@/shared/config';

import { useCurrency } from './use-currency';

/**
 * Re-provides next-intl with the formats of the chosen currency, so every
 * `format.number(v, 'compactCurrency')` prints its symbol (ADR 0017). It
 * reads the URL, so it sits inside the dashboard's Suspense, not app-wide.
 */
export function CurrencyFormats({ children }: { children: ReactNode }) {
  const currency = useCurrency();
  const formats = useMemo(() => formatsFor(currency), [currency]);
  return (
    <NextIntlClientProvider
      locale={useLocale()}
      messages={useMessages()}
      timeZone={useTimeZone()}
      formats={formats}
    >
      {children}
    </NextIntlClientProvider>
  );
}
