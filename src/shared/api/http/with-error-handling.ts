import { AppError, logError } from '@/shared/lib';

import { jsonError } from './json-error';

const SERVER_FAULT_MESSAGE: Record<string, string> = {
  data_integrity: 'The server data is invalid.',
};

/**
 * Wraps a route handler: expected errors (validation, not found) become
 * their JSON response; server faults are logged and answered with a
 * generic 500 that leaks no internals.
 */
export function withErrorHandling<Args extends unknown[]>(
  route: string,
  handler: (...args: Args) => Response | Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof AppError && error.expose) {
        return jsonError(error.status, error.code, error.message);
      }
      logError(error, { scope: 'api', route });
      if (error instanceof AppError) {
        return jsonError(
          error.status,
          error.code,
          SERVER_FAULT_MESSAGE[error.code] ?? 'Something went wrong.',
        );
      }
      return jsonError(500, 'internal', 'Something went wrong.');
    }
  };
}
