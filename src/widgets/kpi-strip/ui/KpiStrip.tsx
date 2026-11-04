'use client';

import { useTranslations } from 'next-intl';

import { overviewKpis, useDashboard, useKpiFormat } from '@/entities/performance';
import { useSelectPeriod } from '@/features/select-period';
import { Button, Skeleton } from '@/shared/ui';

import { KpiCard, KpiCardSkeletonFrame } from './KpiCard';

const GRID = 'grid grid-cols-2 gap-3 lg:grid-cols-4';

/** Revenue, forecast attainment, growth and markets at risk for the current view (brief: health at a glance). */
export function KpiStrip() {
  const t = useTranslations('kpi');
  const f = useKpiFormat();
  const { ds, state } = useDashboard();
  const { toLatest } = useSelectPeriod();
  const { kpis, totals, spark, risk } = overviewKpis(ds, state.scope, state.period, state.range);
  const money = (n: number) => f.value({ value: n, source: 'calculated' }, 'currency');

  const growth = f.value(kpis.growthPct, 'signedPercent');

  let riskValue = t('unavailable');
  let riskDetail = null;
  if (risk.kind === 'count') {
    riskValue = t('riskValue', { count: risk.atRisk + risk.offTrack, total: risk.total });
    riskDetail =
      risk.atRisk + risk.offTrack === 0
        ? t('riskNone')
        : t('riskSplit', { offTrack: risk.offTrack, atRisk: risk.atRisk });
  } else if (risk.kind === 'latestOnly') {
    riskDetail = (
      <span className="flex flex-col items-start">
        {t('latestOnly')}
        <Button
          type="button"
          variant="link"
          className="h-auto min-h-11 p-0 text-xs"
          onClick={toLatest}
        >
          {t('goLatest', { period: f.period(ds.meta.latestPeriod) })}
        </Button>
      </span>
    );
  } else {
    riskDetail = t('perProduct');
  }

  return (
    <section aria-label={t('title')} className={GRID}>
      <KpiCard
        label={t('revenue')}
        value={f.value(kpis.revenue, 'currency')}
        detail={kpis.growthPct.value === null ? null : t('vsPriorYear', { value: growth })}
        source={kpis.revenue.source}
        formula={t('formula.revenue')}
        spark={spark.revenue}
      />
      <KpiCard
        label={t('attainment')}
        value={f.value(kpis.attainmentPct, 'percent')}
        detail={t('forecast', { value: money(totals.forecast) })}
        source={kpis.attainmentPct.source}
        formula={t('formula.attainment')}
        spark={spark.attainmentPct}
      />
      <KpiCard
        label={t('growth')}
        value={growth}
        detail={t('priorYear', { value: money(totals.priorYear) })}
        source={kpis.growthPct.source}
        formula={t('formula.growth')}
        spark={spark.growthPct}
      />
      <KpiCard label={t('atRisk')} value={riskValue} detail={riskDetail} />
    </section>
  );
}

export function KpiStripSkeleton() {
  return (
    <div aria-hidden className={GRID}>
      {[0, 1, 2, 3].map((i) => (
        <KpiCardSkeletonFrame key={i}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-full" />
        </KpiCardSkeletonFrame>
      ))}
    </div>
  );
}
