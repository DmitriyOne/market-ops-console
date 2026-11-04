'use client';

import { SigmaIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useId } from 'react';

import type { KpiValue } from '@/entities/performance';
import { Popover, PopoverContent, PopoverTrigger, Sparkline } from '@/shared/ui';

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
      className="@container flex min-w-0 flex-col gap-1 rounded-xl border border-border bg-card p-3"
    >
      {/* No wrapping: the badge keeps its corner, a long label takes two lines. */}
      <div className="flex min-h-6 items-start justify-between gap-2">
        <p
          id={labelId}
          className="min-w-0 py-0.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
        >
          {label}
        </p>
        {source === 'calculated' && formula ? (
          // Popover, not a tooltip: a tap opens it, so phones can read the formula too.
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="group/calc -my-2.5 flex min-h-11 shrink-0 items-center outline-none"
                aria-label={t('calculatedLabel', { formula })}
              >
                <span className="flex h-6 items-center rounded-md border border-dashed border-input px-1.5 text-xs text-muted-foreground transition-colors group-hover/calc:border-foreground/40 group-hover/calc:text-foreground group-focus-visible/calc:ring-3 group-focus-visible/calc:ring-ring/50 group-aria-expanded/calc:border-foreground/40 group-aria-expanded/calc:text-foreground">
                  {/* A narrow card gets the sign, a wide one the word. */}
                  <SigmaIcon aria-hidden className="size-3.5 @min-[11rem]:hidden" />
                  <span className="hidden @min-[11rem]:inline">{t('calculated')}</span>
                </span>
              </button>
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
