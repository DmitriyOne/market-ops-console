import { queryOptions } from '@tanstack/react-query';

import { alertsResponseSchema, fetchJson } from '@/shared/api';
import { API_ROUTES } from '@/shared/config';

export const ALERTS_QUERY_KEY = ['alerts', 'v1'] as const;

/**
 * The user's rules as the API stores them: the same in every language (an
 * example's name in the page's language is `useAlertRules`'s job).
 */
export const alertsQueryOptions = () =>
  queryOptions({
    queryKey: ALERTS_QUERY_KEY,
    queryFn: async ({ signal }) =>
      (await fetchJson(API_ROUTES.alerts, alertsResponseSchema, { signal })).rules,
    // Only our own writes change the list, and they refetch it.
    staleTime: Infinity,
  });
