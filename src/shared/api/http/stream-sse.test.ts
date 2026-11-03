import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AbortedError, HttpError, TimeoutError } from './errors';
import { streamSse } from './stream-sse';

const encoder = new TextEncoder();

type Chunk = string | Uint8Array;

/** A controllable SSE body: push chunks at will, close when done. */
function controllableBody() {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });
  return {
    stream,
    push(chunk: Chunk) {
      controller.enqueue(typeof chunk === 'string' ? encoder.encode(chunk) : chunk);
    },
    close() {
      controller.close();
    },
  };
}

function bodyOf(chunks: Chunk[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(c) {
      for (const chunk of chunks)
        c.enqueue(typeof chunk === 'string' ? encoder.encode(chunk) : chunk);
      c.close();
    },
  });
}

function stubFetchWith(body: ReadableStream<Uint8Array>, status = 200) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(body, { status, headers: { 'Content-Type': 'text/event-stream' } }),
    );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('streamSse', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('POSTs the body as JSON', async () => {
    const fetchMock = stubFetchWith(bodyOf([]));
    await streamSse('/api/v1/chat', { question: 'q' }, { onData: vi.fn() });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/chat',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ question: 'q' }) }),
    );
  });

  it('delivers several events from one chunk in order', async () => {
    stubFetchWith(bodyOf(['data: a\n\ndata: b\n\ndata: c\n\n']));
    const onData = vi.fn();
    await streamSse('/x', {}, { onData });
    expect(onData.mock.calls.map(([d]) => d as string)).toEqual(['a', 'b', 'c']);
  });

  it('reassembles events split mid-JSON, mid-character and mid-CRLF', async () => {
    const json = '{"type":"token","value":"Price €5"}';
    const bytes = encoder.encode(`data: ${json}\r\n\r\ndata: next\r\n\r\n`);
    const euro = bytes.indexOf(0xe2); // first byte of "€" (E2 82 AC)
    const firstBlankLine = bytes.indexOf(0x0d); // first "\r"
    const chunks = [
      bytes.slice(0, 12), // mid-JSON
      bytes.slice(12, euro + 1), // ends inside "€"
      bytes.slice(euro + 1, firstBlankLine + 1), // ends on "\r"
      bytes.slice(firstBlankLine + 1), // "\n\r\n" + next event
    ];
    stubFetchWith(bodyOf(chunks));
    const onData = vi.fn();
    await streamSse('/x', {}, { onData });
    expect(onData.mock.calls.map(([d]) => d as string)).toEqual([json, 'next']);
  });

  it('times out when no event arrives within 10000 ms', async () => {
    const body = controllableBody();
    stubFetchWith(body.stream);
    const result = streamSse('/x', {}, { onData: vi.fn() }).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(10000);
    expect(await result).toBeInstanceOf(TimeoutError);
  });

  it('times out after 15000 ms of silence following an event', async () => {
    const body = controllableBody();
    stubFetchWith(body.stream);
    const onData = vi.fn();
    let settled = false;
    const result = streamSse('/x', {}, { onData }).catch((e: unknown) => {
      settled = true;
      return e;
    });
    await vi.advanceTimersByTimeAsync(9000);
    body.push('data: first\n\n');
    await vi.advanceTimersByTimeAsync(14999);
    expect(onData).toHaveBeenCalledWith('first');
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await result).toBeInstanceOf(TimeoutError);
  });

  it('reports a caller abort mid-stream as AbortedError', async () => {
    const body = controllableBody();
    stubFetchWith(body.stream);
    const controller = new AbortController();
    const result = streamSse('/x', {}, { signal: controller.signal, onData: vi.fn() }).catch(
      (e: unknown) => e,
    );
    body.push('data: first\n\n');
    await vi.advanceTimersByTimeAsync(10);
    controller.abort();
    expect(await result).toBeInstanceOf(AbortedError);
  });

  it('passes a consumer error through unchanged and closes the body', async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(encoder.encode('data: bad\n\n'));
      },
      cancel() {
        cancelled = true;
      },
    });
    stubFetchWith(body);
    const consumerError = new Error('invalid event');
    const error: unknown = await streamSse(
      '/x',
      {},
      {
        onData: () => {
          throw consumerError;
        },
      },
    ).catch((e: unknown) => e);
    expect(error).toBe(consumerError);
    expect(cancelled).toBe(true);
  });

  it('turns a 503 into HttpError', async () => {
    stubFetchWith(bodyOf([]), 503);
    const error: unknown = await streamSse('/x', {}, { onData: vi.fn() }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ status: 503 });
  });
});
