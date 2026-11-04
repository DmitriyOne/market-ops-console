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
      toggle: (id) => {
        write(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
      },
      set: write,
      clear: () => {
        write([]);
      },
    };
  }, [selected, setParams]);
}
