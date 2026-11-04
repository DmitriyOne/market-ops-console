'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { StatusChip, topRisks, useDashboard, useKpiFormat } from '@/entities/performance';
import { useDrillDown } from '@/features/drill-down';
import { LatestOnlyNotice } from '@/features/select-period';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/shared/ui';

/** Markets that need attention, worst first; a row drills in (brief: top risks). */
export function TopRisks() {
  const t = useTranslations('topRisks');
  const tKpi = useTranslations('kpi');
  const f = useKpiFormat();
  const titleId = useId();
  const { ds, state } = useDashboard();
  const { toMarket } = useDrillDown();
  const risks = topRisks(ds, state.scope, state.period, state.range);

  return (
    <Card aria-labelledby={titleId} role="region" className="gap-3 border border-border ring-0">
      <CardHeader>
        <CardTitle>
          <h2 id={titleId} className="text-base font-semibold">
            {t('title')}
          </h2>
        </CardTitle>
        {risks.kind === 'list' && risks.items.length > 0 ? (
          <CardDescription className="text-xs">{t('order')}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        {risks.kind === 'latestOnly' ? <LatestOnlyNotice /> : null}
        {risks.kind === 'perProduct' ? (
          <p className="text-xs text-muted-foreground">{tKpi('perProduct')}</p>
        ) : null}
        {risks.kind === 'list' && risks.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : null}
        {risks.kind === 'list' && risks.items.length > 0 ? (
          <ul className="flex flex-col">
            {risks.items.map((r) => (
              <li key={r.id} className="border-t border-border first:border-t-0">
                <button
                  type="button"
                  onClick={() => {
                    toMarket(r.id);
                  }}
                  className="flex min-h-12 w-full items-center gap-3 rounded-md px-1 py-1.5 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold">{r.name}</span>{' '}
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      {t('reason', {
                        attainment: f.percent(r.attainmentPct),
                        growth: f.signedPercent(r.growthPct),
                      })}
                    </span>
                  </span>{' '}
                  <StatusChip status={r.status} />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function TopRisksSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <Skeleton className="h-5 w-24" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-10" />
      ))}
    </div>
  );
}
