'use client';

import { CalendarIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { periodToDate, RANGES, useDashboard } from '@/entities/performance';
import { cn } from '@/shared/lib';
import {
  Button,
  MonthPicker,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ToggleGroup,
  ToggleGroupItem,
} from '@/shared/ui';

import { useOverflows } from '../model/use-overflows';
import { useSelectPeriod } from '../model/use-select-period';

const isRange = (v: string): v is (typeof RANGES)[number] => RANGES.some((r) => r === v);

/** "May 2026 · 1 month": the month and the window that ends in it. */
export function PeriodPicker({ className }: { className?: string }) {
  const t = useTranslations('period');
  const format = useFormatter();
  const { ds, state } = useDashboard();
  const { setPeriod, setRange } = useSelectPeriod();
  const [open, setOpen] = useState(false);

  const period = format.dateTime(periodToDate(state.period), 'period');
  const range = t(`range.${state.range}`);
  const rangeShort = t(`rangeShort.${state.range}`);
  const label = t('label', { period, range });
  // Phones: the full label when it fits next to the mode switch, else the
  // month over "12 mo" (owner, 2026-11-06). Desktop always has the room.
  const room = useRef<HTMLSpanElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const compact = useOverflows(room, probe, label);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className={cn('min-h-11 justify-start', className)}>
          {/* The name is the full sentence; what shows may be its short form
              ("12 mo"), which a screen reader would read badly. Text, not
              aria-label: a visible label must be part of an aria-label. */}
          <span className="sr-only">{t('trigger', { period, range })}</span>
          <CalendarIcon aria-hidden className="max-sm:hidden" />
          <span ref={room} aria-hidden className="relative min-w-0 flex-1 text-left">
            <span
              ref={probe}
              className="invisible absolute font-mono whitespace-nowrap tabular-nums"
            >
              {label}
            </span>
            <span
              className={cn('block truncate font-mono tabular-nums', compact && 'max-sm:hidden')}
            >
              {label}
            </span>
            <span
              className={cn(
                'flex-col items-start font-mono text-xs leading-tight tabular-nums',
                compact ? 'flex sm:hidden' : 'hidden',
              )}
            >
              <span className="max-w-full truncate">{period}</span>
              <span className="max-w-full truncate text-muted-foreground">{rangeShort}</span>
            </span>
          </span>
        </Button>
      </PopoverTrigger>
      {/* Phone: the button is narrow now (it shares a row with the mode
          switch); the card keeps its own width, kept on screen by the padding. */}
      <PopoverContent align="end" collisionPadding={15} className="w-80 gap-3">
        <MonthPicker
          value={state.period}
          periods={ds.meta.periods}
          onChange={(next) => {
            setPeriod(next);
            setOpen(false);
          }}
        />
        <ToggleGroup
          type="single"
          value={state.range}
          onValueChange={(next) => {
            if (isRange(next) && next !== state.range) setRange(next);
          }}
          aria-label={t('rangeLabel', { period })}
          spacing={1}
          className="w-full rounded-xl bg-muted p-1"
        >
          {RANGES.map((r) => (
            <ToggleGroupItem
              key={r}
              value={r}
              className="min-h-11 flex-1 px-4 hover:bg-card/60 data-[state=on]:bg-card data-[state=on]:shadow-sm"
            >
              {t(`range.${r}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </PopoverContent>
    </Popover>
  );
}
