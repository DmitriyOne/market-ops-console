// Mock assistant: streams a canned fixture as SSE (docs/CONTRACT.md).
// Ported from reference/chat-route.ts, plus request validation, JSON errors
// (ADR 0013) and a stop when the client aborts (the reference keeps
// enqueuing into a closed stream).
import { type ChatEvent, chatRequestSchema, pickFixture, withErrorHandling } from '@/shared/api';
import { loadFixtures } from '@/shared/api/server';
import { env } from '@/shared/config';
import { logError, ValidationError } from '@/shared/lib';

export const runtime = 'nodejs';

const ROUTE = '/api/v1/chat';
const encoder = new TextEncoder();

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

async function readQuestion(request: Request): Promise<string> {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    throw new ValidationError('Body must be JSON.', { cause: error });
  }
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('question must be a string of 1–500 characters.', {
      cause: parsed.error,
    });
  }
  return parsed.data.question;
}

export const POST = withErrorHandling(ROUTE, async (request: Request) => {
  const fixture = pickFixture(loadFixtures(), await readQuestion(request));
  let cancelled = false;
  const stopped = () => cancelled || request.signal.aborted;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      // Headers are already sent, so a failure mid-stream becomes the
      // contract's `error` event instead of an HTTP status.
      try {
        if (fixture.kind === 'error') {
          send({ type: 'error', message: fixture.error ?? 'Something went wrong.' });
        } else {
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
        }
      } catch (error) {
        logError(error, { scope: 'api', route: ROUTE, phase: 'stream' });
        if (!stopped()) send({ type: 'error', message: 'Something went wrong.' });
      } finally {
        if (!cancelled) controller.close();
      }
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
});
