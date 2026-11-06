'use client';

import { useQuery } from '@tanstack/react-query';
import { useMessages } from 'next-intl';
import { useCallback } from 'react';

import type { Dataset } from '@/shared/api';
import { useCurrency } from '@/shared/lib';

import { datasetQueryOptions } from '../api/dataset-query';
import { inCurrency } from './in-currency';
import { inLanguage } from './in-language';

/**
 * React Query's `select` that turns the cached dataset (USD, English names)
 * into the one the page shows: the chosen currency, region and market names
 * in the page's language.
 */
export function useDatasetSelect(): (ds: Dataset) => Dataset {
  const currency = useCurrency();
  const { places } = useMessages();
  return useCallback(
    (ds: Dataset) => inLanguage(inCurrency(ds, currency), places),
    [currency, places],
  );
}

/** The dataset as the page shows it, without suspending (`data` is undefined until loaded). */
export function useDataset() {
  return useQuery({ ...datasetQueryOptions, select: useDatasetSelect() });
}
