'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';

import { datasetQueryOptions } from '@/entities/performance';
import { LocaleSwitch } from '@/features/switch-locale';
import { ThemeSwitch } from '@/features/switch-theme';

// Placeholder proving the prefetched dataset hydrates; replaced in Plan 3.
function MarketCount() {
  const t = useTranslations('dashboard');
  const { data } = useSuspenseQuery(datasetQueryOptions);
  return <p>{t('marketCount', { count: data.markets.length })}</p>;
}

export function DashboardPage() {
  return (
    <>
      {/* Temporary header until the design pass. */}
      <header className="flex justify-end gap-1 p-2">
        {/* Reads search params, which static HTML does not have. */}
        <Suspense>
          <LocaleSwitch />
        </Suspense>
        <ThemeSwitch />
      </header>
      <main id="main">
        <Suspense>
          <MarketCount />
        </Suspense>
      </main>
    </>
  );
}
