'use client';

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { type KeyboardEvent, useState } from 'react';

import { cn } from '@/shared/lib';

import { Button } from './button';

const COLUMNS = 4;
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const toPeriod = (year: number, month: number) =>
  `${String(year)}-${String(month).padStart(2, '0')}`;
const yearOf = (period: string) => Number(period.slice(0, 4));
const toDate = (year: number, month: number) => new Date(Date.UTC(year, month - 1, 1));

// Grid moves: left/right by one month, up/down by one row.
const STEP: Partial<Record<string, number>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -COLUMNS,
  ArrowDown: COLUMNS,
};

type MonthPickerProps = {
  /** Selected month, `YYYY-MM`. */
  value: string;
  /** Months that have data, `YYYY-MM`, ascending; others are disabled. */
  periods: readonly string[];
  onChange: (period: string) => void;
};

/**
 * A month grid with a year switch, for data that exists per month only
 * (no day grid). Arrow keys move between months that can be picked.
 */
export function MonthPicker({ value, periods, onChange }: MonthPickerProps) {
  const t = useTranslations('monthPicker');
  const format = useFormatter();
  const [year, setYear] = useState(() => yearOf(value));

  const available = new Set(periods);
  const firstYear = yearOf(periods[0] ?? value);
  const lastYear = yearOf(periods.at(-1) ?? value);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = STEP[event.key];
    if (step === undefined || !(event.target instanceof HTMLElement)) return;
    const from = Number(event.target.dataset.month);
    if (!from) return;
    event.preventDefault();
    for (let month = from + step; month >= 1 && month <= 12; month += step) {
      if (available.has(toPeriod(year, month))) {
        event.currentTarget.querySelector<HTMLElement>(`[data-month="${String(month)}"]`)?.focus();
        return;
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          className="size-11"
          aria-label={t('previousYear')}
          disabled={year <= firstYear}
          onClick={() => {
            setYear((y) => y - 1);
          }}
        >
          <ChevronLeftIcon aria-hidden />
        </Button>
        <span aria-hidden className="font-mono text-sm font-semibold tabular-nums">
          {format.dateTime(toDate(year, 1), 'year')}
        </span>
        <Button
          type="button"
          variant="ghost"
          className="size-11"
          aria-label={t('nextYear')}
          disabled={year >= lastYear}
          onClick={() => {
            setYear((y) => y + 1);
          }}
        >
          <ChevronRightIcon aria-hidden />
        </Button>
      </div>
      <div
        role="group"
        aria-label={t('months', { year: format.dateTime(toDate(year, 1), 'year') })}
        className="grid grid-cols-4 gap-1"
        onKeyDown={onKeyDown}
      >
        {MONTHS.map((month) => {
          const period = toPeriod(year, month);
          const selected = period === value;
          return (
            <Button
              key={period}
              type="button"
              variant={selected ? 'default' : 'ghost'}
              data-month={month}
              className={cn('min-h-11', !selected && 'font-normal')}
              aria-label={format.dateTime(toDate(year, month), 'period')}
              aria-pressed={selected}
              disabled={!available.has(period)}
              onClick={() => {
                onChange(period);
              }}
            >
              {format.dateTime(toDate(year, month), 'month')}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
