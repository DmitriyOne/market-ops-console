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
  const [, setParams] = useQueryStates(params, { history: 'push' });
  return useCallback(() => {
    void setParams(null);
  }, [setParams]);
}
