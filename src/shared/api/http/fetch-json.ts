import type { z } from 'zod';

import { HttpError, ParseError, toApiError } from './errors';
import { createRequestSignal } from './request-signal';
import { REQUEST_TIMEOUT_MS } from './timeouts';

export type FetchJsonInit = RequestInit & { timeoutMs?: number };

async function readErrorCode(response: Response): Promise<string | undefined> {
  try {
    const body: unknown = await response.json();
    if (typeof body === 'object' && body !== null && 'error' in body) {
      const { error } = body;
      if (typeof error === 'object' && error !== null && 'code' in error) {
        return typeof error.code === 'string' ? error.code : undefined;
      }
    }
  } catch {
    // Body is not JSON; the status alone describes the failure.
  }
  return undefined;
}

/** A request whose success has no body (204), with the same errors as fetchJson. */
export async function fetchEmpty(url: string, init: FetchJsonInit = {}): Promise<void> {
  const { timeoutMs = REQUEST_TIMEOUT_MS, signal: callerSignal, ...rest } = init;
  const signal = createRequestSignal(timeoutMs, callerSignal ?? undefined);
  try {
    const response = await fetch(url, { ...rest, signal });
    if (!response.ok) throw new HttpError(response.status, await readErrorCode(response));
  } catch (error) {
    throw toApiError(error, signal);
  }
}

export async function fetchJson<T>(
  url: string,
  schema: z.ZodType<T>,
  init: FetchJsonInit = {},
): Promise<T> {
  const { timeoutMs = REQUEST_TIMEOUT_MS, signal: callerSignal, ...rest } = init;
  const signal = createRequestSignal(timeoutMs, callerSignal ?? undefined);

  let body: unknown;
  try {
    const response = await fetch(url, { ...rest, signal });
    if (!response.ok) throw new HttpError(response.status, await readErrorCode(response));
    body = await response.json();
  } catch (error) {
    if (error instanceof SyntaxError) throw new ParseError([]);
    throw toApiError(error, signal);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new ParseError(parsed.error.issues);
  return parsed.data;
}
