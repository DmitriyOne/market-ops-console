'use client';

import { useQueryStates } from 'nuqs';
import { useMemo } from 'react';

import { dashboardSearchParams, type Range, useDashboard } from '@/entities/performance';
import type { Period } from '@/shared/api';

/** Writes the month and the window length; defaults are removed from the URL. */
export function useSelectPeriod() {
  const { ds } = useDashboard();
  const [, setParams] = useQueryStates(dashboardSearchParams, { history: 'push' });

  return useMemo(
    () => ({
      setPeriod: (period: Period) => {
        void setParams({ period: period === ds.meta.latestPeriod ? null : period });
      },
      setRange: (range: Range) => {
        void setParams({ range: range === '1m' ? null : range });
      },
    }),
    [ds, setParams],
  );
}
