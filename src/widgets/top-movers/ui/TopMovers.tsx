'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { type Mover, topMovers, useDashboard, useKpiFormat } from '@/entities/performance';
import { useDrillDown } from '@/features/drill-down';
import { cn } from '@/shared/lib';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/shared/ui';

/** One list of movers; bar length is |growth| relative to the largest move shown. */
function MoverList({
  label,
  items,
  max,
  onSelect,
}: {
  label: string;
  items: Mover[];
  max: number;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations('marketStatus');
  const f = useKpiFormat();
  const labelId = useId();
  return (
    <div className="flex flex-col gap-1">
      <p
        id={labelId}
        className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      >
        {label}
      </p>
      <ul aria-labelledby={labelId} className="flex flex-col">
        {items.map((m) => {
          const value = m.growthPct.value ?? 0;
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(m.id);
                }}
                className="grid min-h-11 w-full grid-cols-2 items-center gap-x-3 rounded-md px-1 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className={cn('truncate', m.selected && 'font-semibold')}>{m.name}</span>{' '}
                <span className="flex items-center justify-end gap-2">
                  <span aria-hidden className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className={cn(
                        'block h-full rounded-full',
                        // Chart tokens, not status ones: this is growth sign, not on/off track.
                        // The signed number next to it carries the meaning.
                        value < 0 ? 'bg-chart-4' : 'bg-chart-5',
                      )}
                      // Data-driven length: the share of the largest move in this card.
                      style={{ width: `${String(max === 0 ? 0 : (Math.abs(value) / max) * 100)}%` }}
                    />
                  </span>
                  <span className="w-14 text-right font-mono text-xs tabular-nums">
                    {f.value(m.growthPct, 'signedPercent')}
                  </span>
                </span>
                {m.selected ? <span className="sr-only">{` · ${t('selected')}`}</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Biggest risers and fallers by growth YoY in the window (brief: health at a glance). */
export function TopMovers() {
  const t = useTranslations('topMovers');
  const tPeriod = useTranslations('period');
  const f = useKpiFormat();
  const titleId = useId();
  const { ds, state } = useDashboard();
  const { toMarket } = useDrillDown();
  const { risers, fallers } = topMovers(ds, state.scope, state.period, state.range);
  const max = Math.max(...[...risers, ...fallers].map((m) => Math.abs(m.growthPct.value ?? 0)), 0);

  return (
    <Card aria-labelledby={titleId} role="region" className="gap-3 border border-border ring-0">
      <CardHeader>
        <CardTitle>
          <h2 id={titleId} className="text-base font-semibold">
            {t('title')}
          </h2>
        </CardTitle>
        <CardDescription className="text-xs">
          {t('basis', { range: tPeriod(`range.${state.range}`), period: f.period(state.period) })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {risers.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <>
            <MoverList label={t('risers')} items={risers} max={max} onSelect={toMarket} />
            {fallers.length > 0 ? (
              <MoverList label={t('fallers')} items={fallers} max={max} onSelect={toMarket} />
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function TopMoversSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <Skeleton className="h-5 w-28" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-8" />
      ))}
    </div>
  );
}
