'use client';

import { useTranslations } from 'next-intl';

import {
  evidenceFor,
  type ResolvedCitation,
  StatusChip,
  useKpiFormat,
} from '@/entities/performance';
import type { Dataset } from '@/shared/api';
import { Sparkline } from '@/shared/ui';

/** The real numbers behind one citation (spec §7, message anatomy 3). */
export function EvidenceCard({
  resolved,
  ds,
}: {
  resolved: ResolvedCitation;
  ds: Dataset | undefined;
}) {
  const t = useTranslations('assistant.evidence');
  const f = useKpiFormat();

  if (!ds) return <p className="text-sm text-muted-foreground">{t('loading')}</p>;
  const evidence = evidenceFor(ds, resolved);
  if (!evidence) return <p className="text-sm font-medium">{t('notInDataset')}</p>;

  const { kpis, status, latestStatus, anomaly, trend } = evidence;
  const anomalyPeriods = new Set(
    resolved.scope.marketId && !resolved.scope.productId
      ? ds.markets
          .find((m) => m.id === resolved.scope.marketId)
          ?.kpis.anomalies.map((a) => a.period)
      : [],
  );
  const name = f.scopeName(resolved);
  const calculated = Object.values(kpis).some((k) => k.source === 'calculated');
  const rows = [
    [t('revenue'), f.value(kpis.revenue, 'currency')],
    [t('attainment'), f.value(kpis.attainmentPct, 'percent')],
    [t('growth'), f.value(kpis.growthPct, 'signedPercent')],
    [t('units'), f.value(kpis.units, 'integer')],
  ] as const;

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{name}</span>
        {status ? <StatusChip status={status} /> : null}
      </div>
      {!status && latestStatus ? (
        <p className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          {t('latestStatus', { period: f.period(ds.meta.latestPeriod) })}
          <StatusChip status={latestStatus} />
        </p>
      ) : null}
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono tabular-nums">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="font-sans text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <div>
        <Sparkline
          points={trend.map((p) => ({ value: p.actual, marked: anomalyPeriods.has(p.period) }))}
          label={t('trend', { name })}
          className="h-14"
        />
        <div className="flex justify-between font-mono text-xs text-muted-foreground">
          <span>{trend[0] ? f.period(trend[0].period) : null}</span>
          <span>{f.period(resolved.period)}</span>
        </div>
      </div>
      {anomaly ? (
        <p className="flex items-start gap-1.5 text-xs">
          <span aria-hidden className="mt-1 size-2 shrink-0 rotate-45 bg-status-off-track" />
          {anomaly.note}
        </p>
      ) : null}
      {calculated ? <p className="text-xs text-muted-foreground">{t('calculated')}</p> : null}
    </div>
  );
}
