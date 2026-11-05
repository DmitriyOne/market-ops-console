'use client';

import { useQueryStates } from 'nuqs';
import { useMemo } from 'react';

import { dashboardSearchParams, useDashboard } from '@/entities/performance';

export type MarketSelection = {
  /** In the order chosen. */
  selected: readonly string[];
  toggle: (marketId: string) => void;
  set: (marketIds: readonly string[]) => void;
  clear: () => void;
};

/**
 * The selected markets (`markets`): one list for the assistant, the map,
 * the tiles and the table filter. A change is a history entry (spec §6).
 */
export function useMarketSelection(): MarketSelection {
  const { state } = useDashboard();
  const [, setParams] = useQueryStates(dashboardSearchParams, { history: 'push' });
  const { selected } = state;

  return useMemo(() => {
    const write = (ids: readonly string[]) => {
      void setParams({ markets: ids.length > 0 ? [...ids] : null });
    };
    return {
      selected,
      // From the URL as it is now, not as rendered: two quick toggles both count.
      toggle: (id) => {
        void setParams((prev) => {
          const now = prev.markets;
          const next = now.includes(id) ? now.filter((s) => s !== id) : [...now, id];
          return { markets: next.length > 0 ? next : null };
        });
      },
      set: write,
      clear: () => {
        write([]);
      },
    };
  }, [selected, setParams]);
}
