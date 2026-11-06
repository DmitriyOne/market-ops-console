import { queryOptions } from '@tanstack/react-query';

import { datasetSchema, fetchJson } from '@/shared/api';
import { API_ROUTES } from '@/shared/config';

export const datasetQueryOptions = queryOptions({
  queryKey: ['dataset', 'v1'],
  queryFn: ({ signal }) => fetchJson(API_ROUTES.data, datasetSchema, { signal }),
  staleTime: Infinity,
});
