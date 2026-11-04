'use client';

import { ChevronDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { MAP_METRICS, type MapMetric, useDashboard } from '@/entities/performance';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/shared/ui';

import { useSelectMetric } from '../model/use-select-metric';

const isMetric = (v: string): v is MapMetric => MAP_METRICS.some((m) => m === v);

/** What the map is coloured by (Analyst). Five options do not fit a toggle row on a phone. */
export function MetricPicker() {
  const t = useTranslations('marketStatus');
  const { state } = useDashboard();
  const select = useSelectMetric();
  const current = t(`metric.${state.kpi}`);
  return (
    // Not modal: no scroll lock on the page, which made the card flash on open and close.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          // One width for every metric, so the header does not reflow on a change.
          className="min-h-11 min-w-40 justify-between gap-1"
          aria-label={t('metricTrigger', { metric: current })}
        >
          {current}
          <ChevronDownIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" collisionPadding={15} className="min-w-48">
        <DropdownMenuLabel>{t('metricTitle')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={state.kpi}
          onValueChange={(next) => {
            if (isMetric(next)) select(next);
          }}
        >
          {MAP_METRICS.map((metric) => (
            <DropdownMenuRadioItem key={metric} value={metric} className="min-h-11">
              {t(`metric.${metric}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
