import { afterEach, describe, expect, it, vi } from 'vitest';

import { AbortedError, HttpError, NetworkError, ParseError, TimeoutError } from '@/shared/api';

import { makeQueryClient } from './query-client';

function retryPredicate() {
  const retry = makeQueryClient().getDefaultOptions().queries?.retry;
  if (typeof retry !== 'function') throw new Error('queries.retry must be a function');
  return retry;
}

describe('makeQueryClient', () => {
  it('retries a first timeout or network failure once', () => {
    const retry = retryPredicate();
    expect(retry(0, new TimeoutError())).toBe(true);
    expect(retry(0, new NetworkError())).toBe(true);
  });

  it('does not retry HTTP or parse errors', () => {
    const retry = retryPredicate();
    expect(retry(0, new HttpError(404))).toBe(false);
    expect(retry(0, new ParseError([]))).toBe(false);
  });

  it('does not retry a second failure', () => {
    expect(retryPredicate()(1, new TimeoutError())).toBe(false);
  });

  it('never retries mutations', () => {
    expect(makeQueryClient().getDefaultOptions().mutations?.retry).toBe(false);
  });
});

describe('error logging', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // TanStack reverts a cancelled fetch without calling the cache's onError
  // (5.105); this pins it, since optimistic writes cancel the alerts query.
  it('does not log a query cancelled before an optimistic write', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const client = makeQueryClient();
    const pending = client
      .query({
        queryKey: ['alerts', 'v1'],
        queryFn: ({ signal }) =>
          new Promise((_, reject) => {
            signal.addEventListener('abort', () => {
              reject(new Error('aborted'));
            });
          }),
      })
      .catch(() => undefined);
    await client.cancelQueries({ queryKey: ['alerts', 'v1'] });
    await pending;
    expect(log).not.toHaveBeenCalled();
  });

  it('logs a failed query once, with its key', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new HttpError(500);
    await makeQueryClient()
      .query({
        queryKey: ['dataset', 'v1'],
        queryFn: () => Promise.reject(error),
        retry: false,
      })
      .catch(() => undefined);
    expect(log).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledWith(
      '[query]',
      expect.objectContaining({ queryKey: ['dataset', 'v1'], error }),
    );
  });

  it('logs a failed mutation', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const client = makeQueryClient();
    await client
      .getMutationCache()
      .build(client, {
        mutationKey: ['alerts'],
        mutationFn: () => Promise.reject(new NetworkError()),
      })
      .execute(undefined)
      .catch(() => undefined);
    expect(log).toHaveBeenCalledWith(
      '[mutation]',
      expect.objectContaining({ mutationKey: ['alerts'] }),
    );
  });

  it('does not log a request the user cancelled', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await makeQueryClient()
      .query({
        queryKey: ['x'],
        queryFn: () => Promise.reject(new AbortedError()),
        retry: false,
      })
      .catch(() => undefined);
    expect(log).not.toHaveBeenCalled();
  });
});
