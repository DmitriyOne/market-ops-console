'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useQueryStates } from 'nuqs';
import { useEffect, useMemo } from 'react';

import type { Dataset } from '@/shared/api';
import { logEvent } from '@/shared/lib';

import { datasetQueryOptions } from '../api/dataset-query';
import { type DashboardState, normalizeDashboardState } from './dashboard-state';
import { dashboardSearchParams } from './search-params';
import { useDatasetSelect } from './use-dataset';

/**
 * The dataset and the current view from the URL, checked against it. A bad
 * or stale link is corrected in place (no history entry), so Back never
 * returns to it. Suspends until the dataset is there. Amounts are in the
 * chosen currency (ADR 0017), places named in the page's language.
 */
export function useDashboard(): { ds: Dataset; state: DashboardState } {
  const { data: ds } = useSuspenseQuery({ ...datasetQueryOptions, select: useDatasetSelect() });
  const [raw, setParams] = useQueryStates(dashboardSearchParams);
  const { state, fix } = useMemo(() => normalizeDashboardState(ds, raw), [ds, raw]);

  useEffect(() => {
    if (!fix) return;
    // A breadcrumb, not an issue: an old or hand-edited link is normal (ADR 0019).
    logEvent('url_fixed', { params: Object.keys(fix) });
    void setParams(fix, { history: 'replace' });
  }, [fix, setParams]);

  return { ds, state };
}
