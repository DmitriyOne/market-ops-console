import { queryOptions } from '@tanstack/react-query';

import { alertsResponseSchema, fetchJson } from '@/shared/api';
import { API_ROUTES } from '@/shared/config';

export const ALERTS_QUERY_KEY = ['alerts', 'v1'] as const;

/**
 * The user's rules. `locale` only names the first visit's examples; the
 * list itself does not depend on it, so it is not part of the key.
 */
export const alertsQueryOptions = (locale: string) =>
  queryOptions({
    queryKey: ALERTS_QUERY_KEY,
    queryFn: async ({ signal }) =>
      (
        await fetchJson(
          `${API_ROUTES.alerts}?${new URLSearchParams({ locale }).toString()}`,
          alertsResponseSchema,
          {
            signal,
          },
        )
      ).rules,
    // Only our own writes change the list, and they refetch it.
    staleTime: Infinity,
  });
