import { AppError } from './app-error';

export type LogContext = { scope: 'api' | 'ui' | 'query' | 'mutation'; [key: string]: unknown };

// The same error can surface twice: a failed query is logged by the query
// cache and then thrown into an error boundary. Remember what was logged.
const logged = new WeakSet<object>();

/**
 * The single place errors are logged, so a reporting service (e.g. Sentry)
 * can be plugged in here later. Each error object is logged once.
 */
export function logError(error: unknown, { scope, ...context }: LogContext): void {
  if (typeof error === 'object' && error !== null) {
    if (logged.has(error)) return;
    logged.add(error);
  }
  console.error(`[${scope}]`, {
    ...context,
    code: error instanceof AppError ? error.code : 'unknown',
    message: error instanceof Error ? error.message : String(error),
    error,
  });
}
