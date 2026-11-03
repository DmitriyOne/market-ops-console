import { environmentManager, MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/shared/api';
import { logError } from '@/shared/lib';

/** Retry a query once, and only when the failure may be transient (ADR 0012). */
function retryTransientOnce(failureCount: number, error: unknown): boolean {
  return (
    failureCount < 1 &&
    error instanceof ApiError &&
    (error.kind === 'network' || error.kind === 'timeout')
  );
}

/** A request the user cancelled (Stop, navigation) is not a failure to report. */
const isUserAbort = (error: unknown) => error instanceof ApiError && error.kind === 'aborted';

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    // One central log for every failed query and mutation (ADR 0013);
    // components only decide what to show.
    queryCache: new QueryCache({
      onError(error, query) {
        if (!isUserAbort(error)) logError(error, { scope: 'query', queryKey: query.queryKey });
      },
    }),
    mutationCache: new MutationCache({
      onError(error, _variables, _context, mutation) {
        if (!isUserAbort(error)) {
          logError(error, { scope: 'mutation', mutationKey: mutation.options.mutationKey });
        }
      },
    }),
    defaultOptions: {
      queries: { retry: retryTransientOnce },
      // Mutations roll back instead of retrying.
      mutations: { retry: false },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/** A new client per server render; one shared client in the browser. */
export function getQueryClient(): QueryClient {
  if (environmentManager.isServer()) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
