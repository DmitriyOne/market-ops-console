// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import raw from '@/data/fixtures.json';
import { type ChatEvent, chatEventSchema, fixturesSchema } from '@/shared/api';

const fixtures = fixturesSchema.parse(raw);

async function loadRoute() {
  vi.resetModules();
  vi.stubEnv('MOCK_TOKEN_DELAY_MS', '0');
  return import('./route');
}

function chatRequest(body: unknown, signal?: AbortSignal): Request {
  return new Request('http://localhost/api/v1/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
    signal,
  });
}

function parseEvents(text: string): ChatEvent[] {
  return text
    .split('\n\n')
    .filter((block) => block.startsWith('data: '))
    .map((block) => chatEventSchema.parse(JSON.parse(block.slice('data: '.length))));
}

describe('POST /api/v1/chat', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('streams the fixture text token by token, then done', async () => {
    const { POST } = await loadRoute();
    const response = await POST(chatRequest({ question: 'germany' }));
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');

    const events = parseEvents(await response.text());
    const fixture = fixtures.fixtures.find((f) => f.id === 'germany-dip');
    const tokens = events.flatMap((e) => (e.type === 'token' ? [e.value] : []));
    expect(tokens.length).toBeGreaterThan(1);
    expect(tokens.join('')).toBe(fixture?.answer.text);
    expect(events.at(-1)).toEqual({
      type: 'done',
      kind: fixture?.kind,
      citations: fixture?.answer.citations,
      confidence: fixture?.answer.confidence,
    });
  });

  it('sends a single error event for the error fixture', async () => {
    const { POST } = await loadRoute();
    const events = parseEvents(await (await POST(chatRequest({ question: 'force error' }))).text());
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe('error');
  });

  it.each([[{}], [{ question: '' }], ['not json']])(
    'rejects an invalid body %j with 400 invalid_request',
    async (body) => {
      const { POST } = await loadRoute();
      const response = await POST(chatRequest(body));
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ error: { code: 'invalid_request' } });
    },
  );

  it('turns a failure mid-stream into an error event and logs it once', async () => {
    const { POST } = await loadRoute();
    const log = vi.mocked(console.error).mockImplementation(() => undefined);
    const request = chatRequest({ question: 'germany' });
    // Fail the second write (the second token), as a broken stream would.
    let writes = 0;
    vi.spyOn(TextEncoder.prototype, 'encode').mockImplementation((input?: string) => {
      writes += 1;
      if (writes === 2) throw new Error('socket hang up');
      // Not TextEncoder itself: its prototype is the one being spied on.
      return new Uint8Array(Buffer.from(input ?? '', 'utf8'));
    });

    const events = parseEvents(await (await POST(request)).text());
    expect(events.map((e) => e.type)).toEqual(['token', 'error']);
    expect(log).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledWith(
      '[api]',
      expect.objectContaining({ route: '/api/v1/chat', phase: 'stream' }),
    );
  });

  it('stops streaming when the client aborts', async () => {
    const { POST } = await loadRoute();
    const controller = new AbortController();
    const response = await POST(chatRequest({ question: 'germany' }, controller.signal));
    const body = response.body;
    if (!body) throw new Error('no body');
    const reader = body.getReader();

    const first = await reader.read();
    expect(first.done).toBe(false);
    controller.abort();

    const decoder = new TextDecoder();
    let rest = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      rest += decoder.decode(value, { stream: true });
    }
    expect(parseEvents(rest).some((e) => e.type === 'done')).toBe(false);
    expect(console.error).not.toHaveBeenCalled();
  });
});
