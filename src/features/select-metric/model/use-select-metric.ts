'use client';

import { useQueryStates } from 'nuqs';
import { useCallback } from 'react';

import { dashboardSearchParams, type MapMetric } from '@/entities/performance';

/** Writes the map metric. Cosmetic, so it replaces history (spec §6); the default is removed. */
export function useSelectMetric(): (kpi: MapMetric) => void {
  const [, setParams] = useQueryStates(dashboardSearchParams, { history: 'replace' });
  return useCallback(
    (kpi: MapMetric) => {
      void setParams({ kpi: kpi === 'status' ? null : kpi });
    },
    [setParams],
  );
}
