import { AppError } from './app-error';

export type LogContext = { scope: 'api' | 'ui' | 'query' | 'mutation'; [key: string]: unknown };

/**
 * The single place errors are logged, so a reporting service (e.g. Sentry)
 * can be plugged in here later. Log once, where the error is handled.
 */
export function logError(error: unknown, { scope, ...context }: LogContext): void {
  console.error(`[${scope}]`, {
    ...context,
    code: error instanceof AppError ? error.code : 'unknown',
    message: error instanceof Error ? error.message : String(error),
    error,
  });
}
