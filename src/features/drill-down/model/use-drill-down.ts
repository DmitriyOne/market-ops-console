'use client';

import { useQueryStates } from 'nuqs';
import { useMemo } from 'react';

import { dashboardSearchParams, getMarket, useDashboard } from '@/entities/performance';

export type DrillDown = {
  toPortfolio: () => void;
  toRegion: (regionId: string) => void;
  /** Also sets the market's own region (spec §6). */
  toMarket: (marketId: string) => void;
  /** The last step, under the current market. */
  toProduct: (productId: string) => void;
};

/**
 * Moves through portfolio → region → market → product. Each move is a
 * history entry; period and range stay, so the context is kept. A new
 * drill clears the highlighted markets from the assistant.
 */
export function useDrillDown(): DrillDown {
  const { ds } = useDashboard();
  const [, setParams] = useQueryStates(dashboardSearchParams, { history: 'push' });

  return useMemo(
    () => ({
      toPortfolio: () => {
        void setParams({ region: null, market: null, product: null, markets: null });
      },
      toRegion: (regionId) => {
        void setParams({ region: regionId, market: null, product: null, markets: null });
      },
      toMarket: (marketId) => {
        const regionId = getMarket(ds, marketId)?.regionId ?? null;
        void setParams({ region: regionId, market: marketId, product: null, markets: null });
      },
      toProduct: (productId) => {
        void setParams({ product: productId, markets: null });
      },
    }),
    [ds, setParams],
  );
}
