import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { datasetQueryOptions } from '@/entities/performance';
import { DashboardPage } from '@/pages/dashboard';
import { loadDataset } from '@/shared/api/server';
import { routing } from '@/shared/config';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: 'meta' });
  return { title: t('dashboard') };
}

// The dataset is read at build time and shipped inside the static HTML.
export default async function Page() {
  const queryClient = new QueryClient();
  await queryClient.query({ ...datasetQueryOptions, queryFn: () => loadDataset() });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardPage />
    </HydrationBoundary>
  );
}
