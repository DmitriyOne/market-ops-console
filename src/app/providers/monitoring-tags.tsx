'use client';

import { useLocale } from 'next-intl';
import { useQueryStates } from 'nuqs';
import { useEffect } from 'react';

import { dashboardSearchParams } from '@/entities/performance';
import { useSection } from '@/features/switch-section';
import { setMonitoringContext, useCurrency } from '@/shared/lib';

const MODE = { mode: dashboardSearchParams.mode };

/**
 * Keeps the screen's settings on every Sentry event (ADR 0019): language,
 * mode, currency and the phone tab. Settings only, no personal data.
 * Renders nothing.
 */
export function MonitoringTags() {
  const locale = useLocale();
  const currency = useCurrency();
  const [{ mode }] = useQueryStates(MODE);
  const [section] = useSection();
  useEffect(() => {
    setMonitoringContext({
      locale,
      mode: mode === 'analyst' ? 'analyst' : 'executive',
      currency,
      section,
    });
  }, [locale, mode, currency, section]);
  return null;
}
