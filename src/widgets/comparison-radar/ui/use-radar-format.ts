'use client';

import { useFormatter, useTranslations } from 'next-intl';

import type { RadarAxis, RadarSeries } from '@/entities/performance';

/** Real values per axis (never the 0–1 positions) and series names. */
export function useRadarFormat() {
  const t = useTranslations('radar');
  const tData = useTranslations('dataCheck');
  const format = useFormatter();

  const value = (axis: RadarAxis, raw: number | undefined) => {
    if (raw === undefined) return tData('noStatus');
    switch (axis) {
      case 'growth':
        return format.number(raw / 100, 'signedPercent');
      case 'attainment':
      case 'share':
        return format.number(raw / 100, 'percent');
      case 'revenue':
        return format.number(raw, 'compactCurrency');
      case 'momentum':
        return t('pp', { value: format.number(raw, 'signedDecimal') });
    }
  };
  const axisName = (axis: RadarAxis) => t(`axis.${axis}`);
  const name = (s: RadarSeries) => (s.kind === 'portfolio' ? t('portfolio') : s.name);
  return { value, axisName, name };
}
