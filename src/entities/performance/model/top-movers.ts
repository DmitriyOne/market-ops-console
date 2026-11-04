import type { Dataset, Period } from '@/shared/api';

import { computeKpis, type KpiValue } from './kpis';
import type { Range, Scope } from './scope';

export type Mover = { id: string; name: string; growthPct: KpiValue; selected: boolean };
export type TopMovers = { risers: Mover[]; fallers: Mover[] };

const MAX = 3;

/**
 * The biggest risers and fallers by growth YoY over the window (brief:
 * "top movers"; spec §8). Markets of the scope's region (a chosen market is
 * compared with its neighbours and marked); a chosen product narrows each
 * market to that product. Small regions are split so no market is listed twice.
 */
export function topMovers(ds: Dataset, scope: Scope, period: Period, range: Range): TopMovers {
  const ranked = ds.markets
    .filter((m) => !scope.regionId || m.regionId === scope.regionId)
    .map((m) => ({
      id: m.id,
      name: m.name,
      growthPct: computeKpis(
        ds,
        { regionId: m.regionId, marketId: m.id, productId: scope.productId },
        period,
        range,
      ).growthPct,
      selected: m.id === scope.marketId,
    }))
    .filter((m): m is Mover & { growthPct: { value: number } } => m.growthPct.value !== null)
    .sort((a, b) => b.growthPct.value - a.growthPct.value);

  const risers = Math.min(MAX, Math.ceil(ranked.length / 2));
  const fallers = Math.min(MAX, Math.floor(ranked.length / 2));
  return {
    risers: ranked.slice(0, risers),
    fallers: ranked.slice(ranked.length - fallers).reverse(),
  };
}
