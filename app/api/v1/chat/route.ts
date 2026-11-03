// Mock assistant: streams a canned fixture as SSE (docs/CONTRACT.md).
// Ported from reference/chat-route.ts, plus request validation and a stop
// when the client aborts (the reference keeps enqueuing into a closed stream).
import rawFixtures from '@/data/fixtures.json';
import {
  type ChatEvent,
  chatRequestSchema,
  fixturesSchema,
  jsonError,
  pickFixture,
} from '@/shared/api';
import { env } from '@/shared/config';

export const runtime = 'nodejs';

const fixtures = fixturesSchema.parse(rawFixtures);
const encoder = new TextEncoder();

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'invalid_request', 'Body must be JSON.');
  }
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, 'invalid_request', 'question must be a string of 1–500 characters.');
  }

  const fixture = pickFixture(fixtures, parsed.data.question);
  let cancelled = false;
  const stopped = () => cancelled || request.signal.aborted;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      const finish = () => {
        if (!cancelled) controller.close();
      };

      if (fixture.kind === 'error') {
        send({ type: 'error', message: fixture.error ?? 'Something went wrong.' });
        finish();
        return;
      }

      for (const value of fixture.answer.text.match(/\S+\s*/g) ?? []) {
        if (stopped()) break;
        send({ type: 'token', value });
        await sleep(env.MOCK_TOKEN_DELAY_MS);
      }
      if (!stopped()) {
        send({
          type: 'done',
          kind: fixture.kind,
          citations: fixture.answer.citations,
          confidence: fixture.answer.confidence,
        });
      }
      finish();
    },
    cancel() {
      cancelled = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
