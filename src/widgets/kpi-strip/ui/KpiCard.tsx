'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useId } from 'react';

import type { KpiValue } from '@/entities/performance';
import { Button, Popover, PopoverContent, PopoverTrigger, Sparkline } from '@/shared/ui';

type KpiCardProps = {
  label: string;
  value: string;
  /** The supporting line under the value. */
  detail: ReactNode;
  /** Shown as "Calculated" with this formula when the value is computed from series. */
  formula?: string;
  source?: KpiValue['source'];
  spark?: (number | null)[];
};

/** One figure in the A card style: label, value, supporting line, 12-month line. */
export function KpiCard({ label, value, detail, formula, source, spark }: KpiCardProps) {
  const t = useTranslations('kpi');
  const labelId = useId();
  const points = (spark ?? []).flatMap((v) => (v === null ? [] : [{ value: v }]));

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className="flex min-w-0 flex-col gap-1 rounded-xl border border-border bg-card p-3"
    >
      <div className="flex min-h-6 flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <p
          id={labelId}
          className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
        >
          {label}
        </p>
        {source === 'calculated' && formula ? (
          // Popover, not a tooltip: a tap opens it, so phones can read the formula too.
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="-my-2.5 min-h-11 px-0 hover:bg-transparent"
                aria-label={t('calculatedLabel', { formula })}
              >
                <span className="rounded-md border border-dashed border-input px-1.5 py-0.5 text-xs text-muted-foreground">
                  {t('calculated')}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent collisionPadding={15} className="w-64 text-xs">
              {t('calculatedLabel', { formula })}
            </PopoverContent>
          </Popover>
        ) : null}
      </div>
      <p className="font-mono text-2xl font-semibold tabular-nums">{value}</p>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0 text-xs text-muted-foreground">{detail}</div>
        {points.length > 1 ? (
          <Sparkline
            points={points}
            width={88}
            height={24}
            area={false}
            className="h-6 w-22 shrink-0 text-primary"
          />
        ) : null}
      </div>
    </div>
  );
}

export function KpiCardSkeletonFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
      {children}
    </div>
  );
}
