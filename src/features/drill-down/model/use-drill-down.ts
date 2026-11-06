'use client';

import { useQueryStates } from 'nuqs';
import { useMemo } from 'react';

import { dashboardSearchParams, getMarket, useDashboard } from '@/entities/performance';
import type { Period } from '@/shared/api';

export type DrillDown = {
  toPortfolio: () => void;
  toRegion: (regionId: string) => void;
  /**
   * Also sets the market's own region (spec §6) and keeps the product:
   * every product is sold in every market, so one product can be compared.
   * With `period` (a heat-map cell) it also opens that month; the range stays.
   */
  toMarket: (marketId: string, options?: { period?: Period }) => void;
  /** Back up from the product to its market (breadcrumbs only). */
  clearProduct: () => void;
  /** The last step, under the current market. */
  toProduct: (productId: string) => void;
};

/**
 * Moves through portfolio → region → market → product. Each move is a
 * history entry; period and range stay, so the context is kept. A new
 * drill clears the selected markets.
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
      toMarket: (marketId, options) => {
        const regionId = getMarket(ds, marketId)?.regionId ?? null;
        const period = options?.period;
        void setParams({
          region: regionId,
          market: marketId,
          markets: null,
          // The latest month is the default and is not written (spec §6).
          ...(period ? { period: period === ds.meta.latestPeriod ? null : period } : {}),
        });
      },
      clearProduct: () => {
        void setParams({ product: null, markets: null });
      },
      toProduct: (productId) => {
        void setParams({ product: productId, markets: null });
      },
    }),
    [ds, setParams],
  );
}
