'use client';

import { useTranslations } from 'next-intl';
import { type ReactNode, Suspense } from 'react';

import { DatasetGate, useDashboard } from '@/entities/performance';
import { useModeAttribute } from '@/features/switch-mode';
import { cn } from '@/shared/lib';
import { WidgetBoundary } from '@/shared/ui';
import { ComparisonRadar, ComparisonRadarSkeleton } from '@/widgets/comparison-radar';
import { ScopeTitle, ScopeTitleSkeleton } from '@/widgets/dashboard-header';
import { HeatMap, HeatMapSkeleton } from '@/widgets/heat-map';
import { KpiStrip, KpiStripSkeleton } from '@/widgets/kpi-strip';
import { MarketStatus, MarketStatusSkeleton } from '@/widgets/market-status';
import { MarketsTable, MarketsTableSkeleton } from '@/widgets/markets-table';
import { RevenueTrend, RevenueTrendSkeleton } from '@/widgets/revenue-trend';
import { TopMovers, TopMoversSkeleton } from '@/widgets/top-movers';
import { TopRisks, TopRisksSkeleton } from '@/widgets/top-risks';

const PAGE = 'flex flex-col gap-4 p-4';
// Wide screens: the main widget takes two thirds, its companion one third.
// `min-w-0` on every cell: a wide table scrolls inside its card instead of widening the page.
const ROW = 'grid gap-4 xl:grid-cols-3 *:min-w-0';
const WIDE = 'xl:col-span-2';
// The map stays in view while its column is shorter than the one next to
// it (Analyst: Top risks and the radar), so a pick on the map and the radar
// it changes are seen together (owner, 2026-11-06).
const STICKY = 'xl:sticky xl:top-4 xl:self-start';
// The companion column: Top risks, and in Analyst the radar under it.
const STACK = 'flex flex-col gap-4';

/** One widget: its own error (named) and its own skeleton. */
function Slot({
  name,
  fallback,
  children,
}: {
  name: string;
  fallback: ReactNode;
  children: ReactNode;
}) {
  return (
    <WidgetBoundary name={name}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </WidgetBoundary>
  );
}

/** Widgets of the Analyst deep-dive; Executive leaves them out. */
function AnalystOnly({ children }: { children: ReactNode }) {
  const { state } = useDashboard();
  return state.mode === 'analyst' ? children : null;
}

/** A skeleton only where the URL says Analyst (the <html> mark set before paint). */
function AnalystSkeleton({ children }: { children: ReactNode }) {
  return <div className="hidden mode-analyst:block">{children}</div>;
}
const tableSkeleton = (
  <AnalystSkeleton>
    <MarketsTableSkeleton />
  </AnalystSkeleton>
);
const heatMapSkeleton = (
  <AnalystSkeleton>
    <HeatMapSkeleton />
  </AnalystSkeleton>
);
const radarSkeleton = (
  <AnalystSkeleton>
    <ComparisonRadarSkeleton />
  </AnalystSkeleton>
);

/**
 * Variant A (ADR 0014 checkpoint). Analyst adds the radar under Top risks
 * (next to the map, so a pick there changes it in view), the markets table
 * under the map and the heat map under the table (owner, 2026-11-05).
 */
export function Overview() {
  const t = useTranslations();
  useModeAttribute();
  return (
    <div className={PAGE}>
      <DatasetGate>
        <Suspense fallback={<ScopeTitleSkeleton />}>
          <ScopeTitle />
        </Suspense>
        <Slot name={t('kpi.title')} fallback={<KpiStripSkeleton />}>
          <KpiStrip />
        </Slot>
        <div className={ROW}>
          <div className={cn(WIDE, STICKY)}>
            <Slot name={t('marketStatus.title')} fallback={<MarketStatusSkeleton />}>
              <MarketStatus />
            </Slot>
          </div>
          <div className={STACK}>
            <Slot name={t('topRisks.title')} fallback={<TopRisksSkeleton />}>
              <TopRisks />
            </Slot>
            <Slot name={t('radar.title')} fallback={radarSkeleton}>
              <AnalystOnly>
                <ComparisonRadar />
              </AnalystOnly>
            </Slot>
          </div>
        </div>
        {/* The mode check is inside the slot: its error and its skeleton apply too. */}
        <Slot name={t('marketsTable.title')} fallback={tableSkeleton}>
          <AnalystOnly>
            <MarketsTable />
          </AnalystOnly>
        </Slot>
        <Slot name={t('heatMap.title')} fallback={heatMapSkeleton}>
          <AnalystOnly>
            <HeatMap />
          </AnalystOnly>
        </Slot>
        <div className={ROW}>
          <div className={WIDE}>
            <Slot name={t('trend.name')} fallback={<RevenueTrendSkeleton />}>
              <RevenueTrend />
            </Slot>
          </div>
          <Slot name={t('topMovers.title')} fallback={<TopMoversSkeleton />}>
            <TopMovers />
          </Slot>
        </div>
      </DatasetGate>
    </div>
  );
}

/** The static page's skeleton: Analyst parts show from the <html> mark set before paint. */
export function OverviewSkeleton() {
  return (
    <div className={PAGE}>
      <ScopeTitleSkeleton />
      <KpiStripSkeleton />
      <div className={ROW}>
        <div className={WIDE}>
          <MarketStatusSkeleton />
        </div>
        <div className={STACK}>
          <TopRisksSkeleton />
          {radarSkeleton}
        </div>
      </div>
      {tableSkeleton}
      {heatMapSkeleton}
      <div className={ROW}>
        <div className={WIDE}>
          <RevenueTrendSkeleton />
        </div>
        <TopMoversSkeleton />
      </div>
    </div>
  );
}
