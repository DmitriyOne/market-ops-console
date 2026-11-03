import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { datasetQueryOptions } from '@/entities/performance';
import { DashboardPage } from '@/pages/dashboard';
import { loadDataset } from '@/shared/api/server';

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
