import { http, type HttpHandler } from 'msw';

import raw from '@/data/fixtures.json';
import { type ChatEvent, fixturesSchema } from '@/shared/api';

export type ChatStreamOptions = {
  /** Pause before each event, in ms. */
  delayMs?: number;
  /** Answer with this HTTP status and no stream. */
  status?: number;
  /** Send this many events, then keep the stream open without sending more. */
  stallAfter?: number;
};

const encoder = new TextEncoder();

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/** Chat route handler (any origin) answering with `events` as SSE frames. */
export function chatStream(events: ChatEvent[], options: ChatStreamOptions = {}): HttpHandler {
  const { delayMs = 0, status, stallAfter } = options;
  return http.post('*/api/v1/chat', ({ request }) => {
    if (status !== undefined && status >= 400) {
      return Response.json(
        { error: { code: 'server_error', message: 'Mock failure.' } },
        { status },
      );
    }
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        for (const [index, event] of events.entries()) {
          if (stallAfter !== undefined && index >= stallAfter) return;
          if (delayMs > 0) await sleep(delayMs);
          if (request.signal.aborted) return;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
        controller.close();
      },
    });
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
  });
}

const fixtures = fixturesSchema.parse(raw);

/** The events the real route sends for fixture `id` (`default` included). */
export function fixtureEvents(id: string): ChatEvent[] {
  const fixture =
    id === fixtures.default.id ? fixtures.default : fixtures.fixtures.find((f) => f.id === id);
  if (!fixture) throw new Error(`Unknown fixture: ${id}`);
  if (fixture.kind === 'error') {
    return [{ type: 'error', message: fixture.error ?? 'Something went wrong.' }];
  }
  const tokens = (fixture.answer.text.match(/\S+\s*/g) ?? []).map((value): ChatEvent => ({
    type: 'token',
    value,
  }));
  return [
    ...tokens,
    {
      type: 'done',
      kind: fixture.kind,
      citations: fixture.answer.citations,
      confidence: fixture.answer.confidence,
    },
  ];
}

/** `chatStream` with the events of fixture `id`, whatever the question. */
export function chatFromFixture(id: string, options?: ChatStreamOptions): HttpHandler {
  return chatStream(fixtureEvents(id), options);
}
