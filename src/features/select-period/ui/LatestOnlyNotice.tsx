'use client';

import { useTranslations } from 'next-intl';

import { useDashboard, useKpiFormat } from '@/entities/performance';
import { cn } from '@/shared/lib';
import { Button } from '@/shared/ui';

import { useSelectPeriod } from '../model/use-select-period';

/**
 * Why a status is missing (it is stored for the latest month only, spec §5)
 * and the one move that shows it.
 */
export function LatestOnlyNotice({ text, className }: { text?: string; className?: string }) {
  const t = useTranslations('kpi');
  const f = useKpiFormat();
  const { ds } = useDashboard();
  const { toLatest } = useSelectPeriod();
  return (
    <p className={cn('flex flex-col items-start text-xs text-muted-foreground', className)}>
      {text ?? t('latestOnly')}
      <Button
        type="button"
        variant="link"
        className="h-auto min-h-11 p-0 text-xs"
        onClick={toLatest}
      >
        {t('goLatest', { period: f.period(ds.meta.latestPeriod) })}
      </Button>
    </p>
  );
}
