'use client';

import { Suspense } from 'react';

import { WidgetBoundary } from '@/shared/ui';
import { ScopeTitle, ScopeTitleSkeleton } from '@/widgets/dashboard-header';
import { KpiStrip, KpiStripSkeleton } from '@/widgets/kpi-strip';

const PAGE = 'flex flex-col gap-4 p-4';

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
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <div className={PAGE}>
      <ScopeTitleSkeleton />
      <KpiStripSkeleton />
    </div>
  );
}
