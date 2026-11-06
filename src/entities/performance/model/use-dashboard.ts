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
 * The last repair told to the log. Every widget reads the view through this
 * hook, so each sees the same broken link and asks for the same fix; the
 * log gets it once (the URL write is the same from each, and harmless).
 */
let lastLoggedFix: string | null = null;

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
    const key = JSON.stringify([raw, fix]);
    if (key !== lastLoggedFix) {
      lastLoggedFix = key;
      // A breadcrumb, not an issue: an old or hand-edited link is normal (ADR 0019).
      logEvent('url_fixed', { params: Object.keys(fix) });
    }
    void setParams(fix, { history: 'replace' });
  }, [raw, fix, setParams]);

  return { ds, state };
}
