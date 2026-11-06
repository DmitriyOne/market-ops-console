'use client';

import { parseAsString, useQueryStates } from 'nuqs';
import { useCallback } from 'react';

import { dashboardSearchParams } from '@/entities/performance';

const params = { ...dashboardSearchParams, tab: parseAsString };

/**
 * Back to the default view: portfolio, latest month, 1 month, Executive,
 * no highlights. One history step, so Back returns to where you were.
 */
export function useResetView(): () => void {
  const [values, setParams] = useQueryStates(params, { history: 'push' });
  // Already clean: pushing the same URL would make the next Back do nothing.
  const clean = Object.values(values).every(
    (v) => v === null || (Array.isArray(v) && v.length === 0),
  );
  return useCallback(() => {
    if (!clean) void setParams(null);
  }, [clean, setParams]);
}
