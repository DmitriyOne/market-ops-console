'use client';

import { useTranslations } from 'next-intl';
import { type ReactNode, Suspense } from 'react';

import { DatasetGate, useDashboard } from '@/entities/performance';
import { useModeAttribute } from '@/features/switch-mode';
import { WidgetBoundary } from '@/shared/ui';
import { ScopeTitle, ScopeTitleSkeleton } from '@/widgets/dashboard-header';
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

/** The table's skeleton, only where the URL says Analyst (the <html> mark). */
function AnalystTableSkeleton() {
  return (
    <div className="hidden mode-analyst:block">
      <MarketsTableSkeleton />
    </div>
  );
}

/**
 * Variant A (ADR 0014 checkpoint). Analyst adds the markets table under
 * the map, so a pick on the map narrows the table in view.
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
          <div className={WIDE}>
            <Slot name={t('marketStatus.title')} fallback={<MarketStatusSkeleton />}>
              <MarketStatus />
            </Slot>
          </div>
          <Slot name={t('topRisks.title')} fallback={<TopRisksSkeleton />}>
            <TopRisks />
          </Slot>
        </div>
        {/* The mode check is inside the slot: its error and its skeleton apply too. */}
        <Slot name={t('marketsTable.title')} fallback={<AnalystTableSkeleton />}>
          <AnalystOnly>
            <MarketsTable />
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
        <TopRisksSkeleton />
      </div>
      <AnalystTableSkeleton />
      <div className={ROW}>
        <div className={WIDE}>
          <RevenueTrendSkeleton />
        </div>
        <TopMoversSkeleton />
      </div>
    </div>
  );
}
