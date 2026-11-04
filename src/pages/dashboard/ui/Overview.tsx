'use client';

import { useTranslations } from 'next-intl';
import { type ReactNode, Suspense } from 'react';

import { DatasetGate } from '@/entities/performance';
import { WidgetBoundary } from '@/shared/ui';
import { ScopeTitle, ScopeTitleSkeleton } from '@/widgets/dashboard-header';
import { KpiStrip, KpiStripSkeleton } from '@/widgets/kpi-strip';
import { MarketStatus, MarketStatusSkeleton } from '@/widgets/market-status';
import { RevenueTrend, RevenueTrendSkeleton } from '@/widgets/revenue-trend';
import { TopRisks, TopRisksSkeleton } from '@/widgets/top-risks';

const PAGE = 'flex flex-col gap-4 p-4';
// Market status takes two thirds, Top risks one third on wide screens.
const ROW = 'grid gap-4 xl:grid-cols-3';
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

/** Executive layout, variant A (ADR 0014 checkpoint). */
export function Overview() {
  const t = useTranslations();
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
        <Slot name={t('trend.name')} fallback={<RevenueTrendSkeleton />}>
          <RevenueTrend />
        </Slot>
      </DatasetGate>
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
      <RevenueTrendSkeleton />
    </div>
  );
}
