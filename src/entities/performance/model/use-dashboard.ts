'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useQueryStates } from 'nuqs';
import { useEffect, useMemo } from 'react';

import type { Dataset } from '@/shared/api';

import { datasetQueryOptions } from '../api/dataset-query';
import { type DashboardState, normalizeDashboardState } from './dashboard-state';
import { dashboardSearchParams } from './search-params';

/**
 * The dataset and the current view from the URL, checked against it. A bad
 * or stale link is corrected in place (no history entry), so Back never
 * returns to it. Suspends until the dataset is there.
 */
export function useDashboard(): { ds: Dataset; state: DashboardState } {
  const { data: ds } = useSuspenseQuery(datasetQueryOptions);
  const [raw, setParams] = useQueryStates(dashboardSearchParams);
  const { state, fix } = useMemo(() => normalizeDashboardState(ds, raw), [ds, raw]);

  useEffect(() => {
    if (fix) void setParams(fix, { history: 'replace' });
  }, [fix, setParams]);

  return { ds, state };
}
