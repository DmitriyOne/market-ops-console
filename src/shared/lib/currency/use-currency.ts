'use client';

import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { useCallback } from 'react';

import { CURRENCIES, type Currency, CURRENCY_PARAM, DEFAULT_CURRENCY } from '@/shared/config';

// A switch of currency is cosmetic, like the map metric: it replaces the
// history entry. USD, the default, is not written.
const currencyParam = parseAsStringLiteral(CURRENCIES)
  .withDefault(DEFAULT_CURRENCY)
  .withOptions({ history: 'replace' });

/**
 * The currency amounts are shown in, from the URL (`?currency=GBP`), so a
 * shared link shows the sender's amounts (owner, 2026-11-06; ADR 0017). USD
 * when the URL has none or an unknown one. Reads the URL: render it inside
 * Suspense on a static page.
 */
export function useCurrencyChoice(): [Currency, (currency: Currency) => void] {
  const [currency, setCurrency] = useQueryState(CURRENCY_PARAM, currencyParam);
  const choose = useCallback(
    (next: Currency) => {
      void setCurrency(next);
    },
    [setCurrency],
  );
  return [currency, choose];
}

/** The currency to show amounts in now. */
export function useCurrency(): Currency {
  return useCurrencyChoice()[0];
}
