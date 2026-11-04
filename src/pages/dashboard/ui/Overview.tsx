'use client';

import { ScopeTitle, ScopeTitleSkeleton } from '@/widgets/dashboard-header';

const PAGE = 'flex flex-col gap-4 p-4';

/** Executive layout, variant A (ADR 0014 checkpoint). */
export function Overview() {
  return (
    <div className={PAGE}>
      <ScopeTitle />
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <div className={PAGE}>
      <ScopeTitleSkeleton />
    </div>
  );
}
