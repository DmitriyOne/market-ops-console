'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';

import { datasetQueryOptions } from '@/entities/performance';

// Placeholder proving the prefetched dataset hydrates; replaced in Plan 3.
function MarketCount() {
  const t = useTranslations('dashboard');
  const { data } = useSuspenseQuery(datasetQueryOptions);
  return <p>{t('marketCount', { count: data.markets.length })}</p>;
}

export function DashboardPage() {
  return (
    <main id="main">
      <Suspense>
        <MarketCount />
      </Suspense>
    </main>
  );
}
