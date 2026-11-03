import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { AbortedError, HttpError, NetworkError, ParseError, TimeoutError } from './errors';
import { fetchJson } from './fetch-json';

const schema = z.object({ count: z.number() });

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** A fetch that never answers but rejects with the signal's reason, like the real one. */
function hangingFetch() {
  return vi.fn(
    (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const reason: unknown = init.signal?.reason;
          reject(reason instanceof Error ? reason : new Error(String(reason)));
        });
      }),
  );
}

describe('fetchJson', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('returns the parsed body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ count: 13 })));
    await expect(fetchJson('/x', schema)).resolves.toEqual({ count: 13 });
  });

  it('turns a non-2xx response into HttpError with the API error code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'internal', message: 'x' } }, 500)),
    );
    const error: unknown = await fetchJson('/x', schema).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ kind: 'http', status: 500, code: 'internal' });
  });

  it('rejects a body that does not match the schema with ParseError and its issues', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ count: 'many' })));
    const error: unknown = await fetchJson('/x', schema).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ParseError);
    expect((error as ParseError).issues.length).toBeGreaterThan(0);
  });

  it('times out after 8000 ms when the server never answers', async () => {
    vi.stubGlobal('fetch', hangingFetch());
    let settled = false;
    const result = fetchJson('/x', schema).catch((e: unknown) => {
      settled = true;
      return e;
    });
    await vi.advanceTimersByTimeAsync(7999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await result).toBeInstanceOf(TimeoutError);
  });

  it('reports a caller abort as AbortedError, not TimeoutError', async () => {
    vi.stubGlobal('fetch', hangingFetch());
    const controller = new AbortController();
    const result = fetchJson('/x', schema, { signal: controller.signal }).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(100);
    controller.abort();
    expect(await result).toBeInstanceOf(AbortedError);
  });

  it('turns a fetch TypeError into NetworkError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchJson('/x', schema)).rejects.toBeInstanceOf(NetworkError);
  });
});
