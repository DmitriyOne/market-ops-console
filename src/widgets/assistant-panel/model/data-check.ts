import {
  computeKpis,
  type Kpis,
  nonOnTrackMarkets,
  resolveCitation,
  type ResolvedCitation,
  statusFor,
} from '@/entities/performance';
import type { Citation, Dataset, Market, MarketStatus } from '@/shared/api';

export type CheckRow = {
  key: string;
  resolved: ResolvedCitation;
  kpis: Kpis;
  status: MarketStatus | null;
  /** Why a market is not on track: below plan, or above plan but shrinking. */
  reason: { kind: 'attainment' | 'growth'; value: number } | null;
};

export type DataCheck = {
  /** Whole portfolio, latest month. */
  portfolio: Kpis;
  rows: CheckRow[];
  /** Non-on-track markets the answer did not cite (market-list rule). */
  notMentioned: Market[];
  /** Per cited region, its non-on-track markets the answer did not cite. */
  regionGaps: { regionId: string; markets: Market[] }[];
  /** Every market the block lists, non-on-track first: what "Show on dashboard" highlights. */
  highlightIds: string[];
  expanded: boolean;
};

function rowFor(ds: Dataset, resolved: ResolvedCitation): CheckRow {
  const { regionId, marketId, productId } = resolved.scope;
  const kpis = computeKpis(ds, resolved.scope, resolved.period, '1m');
  const status = marketId && !productId ? statusFor(ds, marketId, resolved.period, '1m') : null;
  let reason: CheckRow['reason'] = null;
  const attainment = kpis.attainmentPct.value;
  const growth = kpis.growthPct.value;
  if (status && status !== 'on_track' && attainment !== null) {
    reason =
      attainment >= 100 && growth !== null
        ? { kind: 'growth', value: growth }
        : { kind: 'attainment', value: attainment };
  }
  return {
    key: [regionId, marketId, productId, resolved.period].join('|'),
    resolved,
    kpis,
    status,
    reason,
  };
}

/**
 * The "What the data shows" block (spec §7): real numbers for every cited
 * entity and two deterministic gap rules. "Mentioned" means cited; the
 * answer text is never read. Null when the answer cites nothing.
 */
export function buildDataCheck(ds: Dataset, citations: Citation[]): DataCheck | null {
  if (citations.length === 0) return null;
  const latest = ds.meta.latestPeriod;
  const known = citations.map((c) => resolveCitation(ds, c)).filter((r) => r.known);

  const rows = new Map<string, CheckRow>();
  for (const resolved of known) {
    const row = rowFor(ds, resolved);
    if (!rows.has(row.key)) rows.set(row.key, row);
  }

  const citedMarkets = new Set(known.flatMap((r) => (r.scope.marketId ? [r.scope.marketId] : [])));
  const citedRegions = new Set(
    known.flatMap((r) => (r.scope.regionId && !r.scope.marketId ? [r.scope.regionId] : [])),
  );
  const notCited = (markets: Market[] | null) =>
    (markets ?? []).filter((m) => !citedMarkets.has(m.id));

  const allNonOnTrack = nonOnTrackMarkets(ds, latest, '1m') ?? [];
  const nonOnTrackIds = new Set(allNonOnTrack.map((m) => m.id));
  const marketListApplies =
    citedMarkets.size >= 2 && [...citedMarkets].every((id) => nonOnTrackIds.has(id));
  const notMentioned = marketListApplies ? notCited(allNonOnTrack) : [];

  const regionGaps = [...citedRegions]
    .map((regionId) => ({
      regionId,
      markets: notCited(nonOnTrackMarkets(ds, latest, '1m', { regionId })),
    }))
    .filter((gap) => gap.markets.length > 0);

  const listed = new Set([
    ...citedMarkets,
    ...notMentioned.map((m) => m.id),
    ...regionGaps.flatMap((g) => g.markets.map((m) => m.id)),
  ]);
  const highlightIds = [
    ...allNonOnTrack.map((m) => m.id).filter((id) => listed.has(id)),
    ...[...listed].filter((id) => !nonOnTrackIds.has(id)),
  ];

  return {
    portfolio: computeKpis(ds, {}, latest, '1m'),
    rows: [...rows.values()],
    notMentioned,
    regionGaps,
    highlightIds,
    expanded: notMentioned.length > 0 || regionGaps.length > 0,
  };
}
