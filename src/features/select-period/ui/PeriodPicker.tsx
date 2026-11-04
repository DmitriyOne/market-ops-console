'use client';

import { CalendarIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('min-h-11 justify-start', className)}
          aria-label={t('trigger', { period, range })}
        >
          <CalendarIcon aria-hidden />
          <span className="font-mono tabular-nums">{t('label', { period, range })}</span>
        </Button>
      </PopoverTrigger>
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
          spacing={0}
          className="w-full rounded-lg bg-muted p-0.5"
        >
          {RANGES.map((r) => (
            <ToggleGroupItem
              key={r}
              value={r}
              className="min-h-11 flex-1 data-[state=on]:bg-card data-[state=on]:shadow-sm"
            >
              {t(`range.${r}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </PopoverContent>
    </Popover>
  );
}
