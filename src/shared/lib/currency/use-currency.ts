'use client';

import { CURRENCIES, type Currency, DEFAULT_CURRENCY } from '@/shared/config';

import { useStoredChoice } from '../storage';

const KEY = 'mo:currency';

/**
 * The currency amounts are shown in, remembered per browser (ADR 0017).
 * `null` on the server and while hydrating; USD until the user picks.
 */
export function useCurrencyChoice(): [Currency | null, (currency: Currency) => void] {
  return useStoredChoice(KEY, CURRENCIES, DEFAULT_CURRENCY);
}

/** The currency to show amounts in now: USD until the browser is read. */
export function useCurrency(): Currency {
  return useCurrencyChoice()[0] ?? DEFAULT_CURRENCY;
}
