import type { z } from 'zod';

export type ApiErrorKind = 'timeout' | 'network' | 'http' | 'parse' | 'aborted';

export abstract class ApiError extends Error {
  abstract readonly kind: ApiErrorKind;
}

export class TimeoutError extends ApiError {
  readonly kind = 'timeout';
  override readonly name = 'TimeoutError';
}

export class NetworkError extends ApiError {
  readonly kind = 'network';
  override readonly name = 'NetworkError';
}

export class AbortedError extends ApiError {
  readonly kind = 'aborted';
  override readonly name = 'AbortedError';
}

export class HttpError extends ApiError {
  readonly kind = 'http';
  override readonly name = 'HttpError';

  constructor(
    readonly status: number,
    readonly code?: string,
  ) {
    super(`HTTP ${String(status)}${code ? ` (${code})` : ''}`);
  }
}

export class ParseError extends ApiError {
  readonly kind = 'parse';
  override readonly name = 'ParseError';

  constructor(readonly issues: z.core.$ZodIssue[]) {
    super('Response does not match the expected schema');
  }
}

/** DOMException name used for aborts caused by our own timers. */
export const TIMEOUT_REASON_NAME = 'TimeoutError';

/**
 * Maps whatever a fetch/read threw into an ApiError. If our signal is
 * aborted, its reason tells a timeout (ours) from a caller abort.
 */
export function toApiError(error: unknown, signal: AbortSignal): ApiError {
  if (error instanceof ApiError) return error;
  if (signal.aborted) {
    const reason: unknown = signal.reason;
    return reason instanceof DOMException && reason.name === TIMEOUT_REASON_NAME
      ? new TimeoutError()
      : new AbortedError();
  }
  if (error instanceof TypeError) return new NetworkError(error.message);
  return new NetworkError(error instanceof Error ? error.message : undefined);
}
