'use client';

import { ChevronDownIcon, SquareSquareIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';

import { getRegion, type Kpis } from '@/entities/performance';
import type { Dataset, Market, MarketStatus } from '@/shared/api';
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui';

import type { CheckRow, DataCheck } from '../model/data-check';
import { StatusChip } from './StatusChip';
import { useKpiFormat } from './use-kpi-format';

type Line = { key: string; name: string; kpis: Kpis; status: MarketStatus | null; note?: string };

function marketLine(market: Market, note: string): Line {
  const { revenue, growthPct, forecastAttainmentPct, sharePct, status } = market.kpis;
  return {
    key: market.id,
    name: market.name,
    status,
    note,
    kpis: {
      revenue: { value: revenue, source: 'data' },
      growthPct: { value: growthPct, source: 'data' },
      attainmentPct: { value: forecastAttainmentPct, source: 'data' },
      sharePct: { value: sharePct, source: 'data' },
      units: { value: null, source: 'unavailable' },
    },
  };
}

function LineRow({ line, reason }: { line: Line; reason?: CheckRow['reason'] }) {
  const t = useTranslations('dataCheck');
  const f = useKpiFormat();
  return (
    <div className="grid grid-cols-4 items-center gap-2 border-t border-border py-1.5 text-xs">
      <span className="min-w-0">
        <span className="font-semibold">{line.name}</span>
        {line.note ? <span className="block text-muted-foreground">{line.note}</span> : null}
      </span>
      <span className="text-right font-mono tabular-nums">
        {f.value(line.kpis.attainmentPct, 'percent')}
      </span>
      <span className="text-right font-mono tabular-nums">
        {f.value(line.kpis.growthPct, 'signedPercent')}
      </span>
      <span className="flex flex-col items-end gap-0.5">
        {line.status ? <StatusChip status={line.status} /> : <span>{t('noStatus')}</span>}
        {reason ? (
          <span className="text-muted-foreground">
            {reason.kind === 'growth'
              ? t('reasonGrowth', { value: f.signedPercent(reason.value) })
              : t('reasonAttainment', { value: f.percent(reason.value) })}
          </span>
        ) : null}
      </span>
    </div>
  );
}

type DataCheckBlockProps = {
  check: DataCheck;
  ds: Dataset;
  onHighlight: (marketIds: string[]) => void;
};

/** "What the data shows": the authoritative numbers next to an AI answer (spec §7). */
export function DataCheckBlock({ check, ds, onHighlight }: DataCheckBlockProps) {
  const t = useTranslations('dataCheck');
  const format = useFormatter();
  const f = useKpiFormat();
  const [open, setOpen] = useState(check.expanded);
  const latest = ds.meta.latestPeriod;
  const updated = format.dateTime(new Date(`${ds.meta.generatedAt}T00:00:00Z`), 'day');

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-xl border border-border bg-surface-data p-3"
    >
      <CollapsibleTrigger className="flex min-h-11 w-full items-center gap-2 rounded-md text-left text-sm font-semibold focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
        <SquareSquareIcon aria-hidden className="size-4" />
        <span className="flex-1">{t('title')}</span>
        <ChevronDownIcon
          aria-hidden
          className="size-4 transition-transform in-data-[state=open]:rotate-180 motion-reduce:transition-none"
        />
      </CollapsibleTrigger>
      <p className="text-xs text-muted-foreground">
        {t('header', { period: f.period(latest), updated })}
      </p>
      <CollapsibleContent className="mt-2 flex flex-col">
        <div className="grid grid-cols-4 gap-2 pb-1 text-xs text-muted-foreground">
          <span>{t('name')}</span>
          <span className="text-right">{t('attainment')}</span>
          <span className="text-right">{t('growth')}</span>
          <span className="text-right">{t('status')}</span>
        </div>
        <LineRow
          line={{ key: 'portfolio', name: t('portfolio'), kpis: check.portfolio, status: null }}
        />
        {check.rows.map((row) => (
          <LineRow
            key={row.key}
            line={{
              key: row.key,
              name: f.scopeName(row.resolved, latest),
              kpis: row.kpis,
              status: row.status,
            }}
            reason={row.reason}
          />
        ))}
        {check.notMentioned.length > 0 ? (
          <ul aria-label={t('notMentioned')} className="flex flex-col">
            {check.notMentioned.map((m) => (
              <li key={m.id}>
                <LineRow line={marketLine(m, t('notMentioned'))} />
              </li>
            ))}
          </ul>
        ) : null}
        {check.regionGaps.map((gap) => {
          const label = t('regionGap', {
            region: getRegion(ds, gap.regionId)?.name ?? gap.regionId,
          });
          return (
            <div key={gap.regionId} className="flex flex-col">
              <p className="pt-2 text-xs font-medium">{label}</p>
              <ul aria-label={label} className="flex flex-col">
                {gap.markets.map((m) => (
                  <li key={m.id}>
                    <LineRow line={marketLine(m, t('notMentioned'))} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {check.highlightIds.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            className="mt-3 min-h-11 self-start"
            onClick={() => {
              onHighlight(check.highlightIds);
            }}
          >
            {t('showOnDashboard')}
          </Button>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}
