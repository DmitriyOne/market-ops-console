'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { Dataset } from '@/shared/api';
import { useCurrency } from '@/shared/lib';

import { datasetQueryOptions } from '../api/dataset-query';
import { inCurrency } from './in-currency';

/** React Query's `select` that turns the cached USD dataset into the chosen currency. */
export function useCurrencySelect(): (ds: Dataset) => Dataset {
  const currency = useCurrency();
  return useCallback((ds: Dataset) => inCurrency(ds, currency), [currency]);
}

/** The dataset in the chosen currency, without suspending (`data` is undefined until loaded). */
export function useDataset() {
  return useQuery({ ...datasetQueryOptions, select: useCurrencySelect() });
}
