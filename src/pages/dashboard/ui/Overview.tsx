'use client';

import { Suspense } from 'react';

import { WidgetBoundary } from '@/shared/ui';
import { ScopeTitle, ScopeTitleSkeleton } from '@/widgets/dashboard-header';
import { KpiStrip, KpiStripSkeleton } from '@/widgets/kpi-strip';
import { MarketStatus, MarketStatusSkeleton } from '@/widgets/market-status';
import { TopRisks, TopRisksSkeleton } from '@/widgets/top-risks';

const PAGE = 'flex flex-col gap-4 p-4';
// Market status takes two thirds, Top risks one third on wide screens.
const ROW = 'grid gap-4 xl:grid-cols-3';
const WIDE = 'xl:col-span-2';

/** Executive layout, variant A (ADR 0014 checkpoint). */
export function Overview() {
  return (
    <div className={PAGE}>
      <ScopeTitle />
      <WidgetBoundary>
        <Suspense fallback={<KpiStripSkeleton />}>
          <KpiStrip />
        </Suspense>
      </WidgetBoundary>
      <div className={ROW}>
        <div className={WIDE}>
          <WidgetBoundary>
            <Suspense fallback={<MarketStatusSkeleton />}>
              <MarketStatus />
            </Suspense>
          </WidgetBoundary>
        </div>
        <WidgetBoundary>
          <Suspense fallback={<TopRisksSkeleton />}>
            <TopRisks />
          </Suspense>
        </WidgetBoundary>
      </div>
    </div>
  );
}

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
    </div>
  );
}
