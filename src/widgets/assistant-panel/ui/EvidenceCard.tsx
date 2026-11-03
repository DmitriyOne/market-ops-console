'use client';

import { useTranslations } from 'next-intl';

import { evidenceFor, type ResolvedCitation } from '@/entities/performance';
import type { Dataset } from '@/shared/api';

import { StatusChip } from './StatusChip';
import { useKpiFormat } from './use-kpi-format';

const SPARK_W = 240;
const SPARK_H = 48;

function Sparkline({ values, label }: { values: number[]; label: string }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = values.length > 1 ? SPARK_W / (values.length - 1) : 0;
  const points = values
    .map(
      (v, i) => `${String(i * step)},${String(SPARK_H - ((v - min) / span) * (SPARK_H - 4) - 2)}`,
    )
    .join(' ');
  return (
    <svg
      viewBox={`0 0 ${String(SPARK_W)} ${String(SPARK_H)}`}
      role="img"
      aria-label={label}
      className="h-12 w-full"
    >
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

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

  const { kpis, status, trend } = evidence;
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
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono tabular-nums">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="font-sans text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <Sparkline values={trend.map((p) => p.actual)} label={t('trend', { name })} />
      {calculated ? <p className="text-xs text-muted-foreground">{t('calculated')}</p> : null}
    </div>
  );
}
