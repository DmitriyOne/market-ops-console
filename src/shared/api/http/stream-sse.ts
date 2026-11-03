import { createParser } from 'eventsource-parser';

import { HttpError, toApiError } from './errors';
import { timeoutReason } from './request-signal';
import { STREAM_FIRST_EVENT_TIMEOUT_MS, STREAM_IDLE_TIMEOUT_MS } from './timeouts';

export type StreamSseOptions = {
  signal?: AbortSignal;
  firstEventTimeoutMs?: number;
  idleTimeoutMs?: number;
  onData: (data: string) => void;
};

/**
 * POSTs `body` as JSON and reads the response as Server-Sent Events,
 * calling `onData` with each event's data. Resolves when the stream ends.
 * Fails with TimeoutError if the first event is late or a gap between
 * events is too long; the gap timer restarts on every event.
 */
export async function streamSse(
  url: string,
  body: unknown,
  options: StreamSseOptions,
): Promise<void> {
  const {
    signal: callerSignal,
    firstEventTimeoutMs = STREAM_FIRST_EVENT_TIMEOUT_MS,
    idleTimeoutMs = STREAM_IDLE_TIMEOUT_MS,
    onData,
  } = options;

  const timeout = new AbortController();
  const signal = callerSignal ? AbortSignal.any([callerSignal, timeout.signal]) : timeout.signal;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const arm = (ms: number) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timeout.abort(timeoutReason());
    }, ms);
  };

  const parser = createParser({
    onEvent(event) {
      arm(idleTimeoutMs);
      onData(event.data);
    },
  });

  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  const cancelRead = () => {
    void reader?.cancel(signal.reason);
  };
  signal.addEventListener('abort', cancelRead, { once: true });
  arm(firstEventTimeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body),
      signal,
    });
    if (!response.ok || !response.body) throw new HttpError(response.status);

    reader = response.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (signal.aborted) throw signal.reason;
      if (done) break;
      parser.feed(decoder.decode(value, { stream: true }));
    }
    parser.feed(decoder.decode());
  } catch (error) {
    throw toApiError(error, signal);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', cancelRead);
  }
}
