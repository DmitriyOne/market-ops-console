import { describe, expect, it } from 'vitest';

import { HttpError, NetworkError, ParseError, TimeoutError } from '@/shared/api';

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
