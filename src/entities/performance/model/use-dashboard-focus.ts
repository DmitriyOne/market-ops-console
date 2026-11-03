'use client';

import { useQueryStates } from 'nuqs';
import { useCallback } from 'react';

import type { ResolvedCitation } from './citation';
import { dashboardSearchParams } from './search-params';

export type DashboardFocus = {
  /** Show what a citation points at: its scope and month, nothing highlighted. */
  focus: (r: ResolvedCitation) => void;
  /** Highlight markets on the dashboard. */
  highlight: (marketIds: string[]) => void;
};

/** Moves the dashboard from the assistant; each move is a history entry. */
export function useDashboardFocus(): DashboardFocus {
  const [, setParams] = useQueryStates(dashboardSearchParams, { history: 'push' });

  const focus = useCallback(
    (r: ResolvedCitation) => {
      void setParams({
        region: r.scope.regionId ?? null,
        market: r.scope.marketId ?? null,
        product: r.scope.productId ?? null,
        period: r.period,
        // A cited month is shown as that month alone.
        range: null,
        markets: null,
      });
    },
    [setParams],
  );

  const highlight = useCallback(
    (marketIds: string[]) => {
      void setParams({ markets: marketIds });
    },
    [setParams],
  );

  return { focus, highlight };
}
