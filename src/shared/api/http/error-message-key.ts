import { ApiError } from './errors';

export type ErrorMessageKey =
  'errors.timeout' | 'errors.network' | 'errors.server' | 'errors.invalidData' | 'errors.unknown';

const KEY_BY_KIND = {
  timeout: 'errors.timeout',
  network: 'errors.network',
  http: 'errors.server',
  parse: 'errors.invalidData',
  // A stop the user asked for is not an error to explain.
  aborted: 'errors.unknown',
} as const satisfies Record<ApiError['kind'], ErrorMessageKey>;

export function errorMessageKey(error: unknown): ErrorMessageKey {
  return error instanceof ApiError ? KEY_BY_KIND[error.kind] : 'errors.unknown';
}
