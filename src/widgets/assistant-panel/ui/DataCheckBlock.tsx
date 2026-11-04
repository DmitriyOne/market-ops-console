'use client';

import { ChevronDownIcon, SquareSquareIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { type ReactNode, useState } from 'react';

import { getRegion, type KpiValue } from '@/entities/performance';
import type { Dataset, Market, MarketStatus } from '@/shared/api';
import { cn } from '@/shared/lib';
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui';

import type { CheckRow, DataCheck } from '../model/data-check';
import { StatusChip } from './StatusChip';
import { useKpiFormat } from './use-kpi-format';

type Line = {
  key: string;
  name: string;
  attainment: KpiValue;
  growth: KpiValue;
  /** A status chip, or why there is none. */
  status: MarketStatus | 'none' | 'latestOnly';
  notMentioned?: boolean;
  reason?: CheckRow['reason'];
  portfolio?: boolean;
};

const fromData = (value: number): KpiValue => ({ value, source: 'data' });

function marketLine(market: Market, reason: CheckRow['reason']): Line {
  return {
    key: market.id,
    name: market.name,
    attainment: fromData(market.kpis.forecastAttainmentPct),
    growth: fromData(market.kpis.growthPct),
    status: market.kpis.status,
    notMentioned: true,
    reason,
  };
}

function LineRow({ line }: { line: Line }) {
  const t = useTranslations('dataCheck');
  const f = useKpiFormat();
  let status: ReactNode;
  if (line.status === 'none') status = <span className="text-muted-foreground">—</span>;
  else if (line.status === 'latestOnly')
    status = <span className="text-muted-foreground">{t('latestOnly')}</span>;
  else status = <StatusChip status={line.status} />;

  return (
    <tr className={cn('border-t border-border align-middle', line.portfolio && 'bg-muted')}>
      <td className="py-2 pr-2 pl-3">
        <span className="font-semibold">{line.name}</span>
        {line.notMentioned ? (
          <span className="block font-medium text-status-off-track">{t('notMentioned')}</span>
        ) : null}
        {line.reason?.kind === 'growth' ? (
          <span className="block text-muted-foreground">
            {t('reasonGrowth', { value: f.signedPercent(line.reason.value) })}
          </span>
        ) : null}
      </td>
      <td className="px-2 py-2 text-right font-mono tabular-nums">
        {f.value(line.attainment, 'percent')}
      </td>
      <td className="px-2 py-2 text-right font-mono tabular-nums">
        {f.value(line.growth, 'signedPercent')}
      </td>
      <td className="py-2 pr-3 pl-2">{status}</td>
    </tr>
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
  // Closed by default (owner, 2026-11-03); the header notes any gap found.
  const [open, setOpen] = useState(false);
  const latest = ds.meta.latestPeriod;
  // A date-only ISO string parses as UTC midnight; a full timestamp as itself.
  const updated = format.dateTime(new Date(ds.meta.generatedAt), 'day');
  const regionName = (id: string) => getRegion(ds, id)?.name ?? id;

  const cited: Line[] = check.rows.map((row) => ({
    key: row.key,
    name: f.scopeName(row.resolved, latest),
    attainment: row.kpis.attainmentPct,
    growth: row.kpis.growthPct,
    status: row.status ?? (row.resolved.period === latest ? 'none' : 'latestOnly'),
    reason: row.reason,
  }));

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="overflow-hidden rounded-xl border border-border bg-surface-data"
    >
      <div className="px-3 pt-2 pb-2">
        <CollapsibleTrigger className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-md text-left text-sm font-semibold focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
          <SquareSquareIcon aria-hidden className="size-4" />
          <span className="flex-1">{t('title')}</span>
          {check.gaps > 0 ? (
            <span className="rounded-full bg-status-at-risk-muted px-2 py-0.5 text-xs font-semibold text-status-at-risk">
              {t('gapNote', { count: check.gaps })}
            </span>
          ) : null}
          <ChevronDownIcon
            aria-hidden
            className="size-4 transition-transform in-data-[state=open]:rotate-180 motion-reduce:transition-none"
          />
        </CollapsibleTrigger>
        <p className="text-xs text-muted-foreground">
          {t('header', { period: f.period(latest), updated })}
        </p>
      </div>
      <CollapsibleContent className="flex flex-col text-xs">
        <table className="w-full border-collapse">
          <caption className="sr-only">{t('title')}</caption>
          <thead>
            <tr className="text-left text-muted-foreground uppercase">
              <th scope="col" className="py-2 pr-2 pl-3 font-medium tracking-wide">
                {t('name')}
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium tracking-wide">
                {t('attainment')}
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium tracking-wide">
                {t('growth')}
              </th>
              <th scope="col" className="py-2 pr-3 pl-2 font-medium tracking-wide">
                {t('status')}
              </th>
            </tr>
          </thead>
          <tbody>
            <LineRow
              line={{
                key: 'portfolio',
                name: t('portfolio'),
                attainment: check.portfolio.attainmentPct,
                growth: check.portfolio.growthPct,
                status: 'none',
                portfolio: true,
              }}
            />
            {cited.map((line) => (
              <LineRow key={line.key} line={line} />
            ))}
            {check.notMentioned.map((m) => (
              <LineRow key={m.id} line={marketLine(m, check.reasons[m.id] ?? null)} />
            ))}
          </tbody>
          {check.regionGaps.map((gap) => (
            <tbody key={gap.regionId}>
              <tr className="border-t border-border">
                <th scope="rowgroup" colSpan={4} className="py-2 pl-3 text-left font-semibold">
                  {regionName(gap.regionId)}
                </th>
              </tr>
              {gap.markets.map((m) => (
                <LineRow
                  key={`${gap.regionId}-${m.id}`}
                  line={marketLine(m, check.reasons[m.id] ?? null)}
                />
              ))}
            </tbody>
          ))}
        </table>
        <div className="flex flex-col items-start gap-3 border-t border-border p-3">
          {check.attention.map((a) => (
            <p key={a.regionId ?? 'all'} className="text-muted-foreground">
              {a.regionId
                ? t('attentionRegion', {
                    needAttention: a.needAttention,
                    markets: a.markets,
                    named: a.named,
                    region: regionName(a.regionId),
                  })
                : t('attention', {
                    needAttention: a.needAttention,
                    markets: a.markets,
                    named: a.named,
                  })}
            </p>
          ))}
          {check.highlightIds.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => {
                onHighlight(check.highlightIds);
              }}
            >
              {t('showOnDashboard')}
            </Button>
          ) : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
