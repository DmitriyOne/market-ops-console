import { environmentManager, QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/shared/api';

/** Retry a query once, and only when the failure may be transient (ADR 0012). */
function retryTransientOnce(failureCount: number, error: unknown): boolean {
  return (
    failureCount < 1 &&
    error instanceof ApiError &&
    (error.kind === 'network' || error.kind === 'timeout')
  );
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
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
