// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const DSN = 'https://key@o1.ingest.us.sentry.io/2';
const flags = vi.hoisted(() => ({ dsn: undefined as string | undefined }));
vi.mock('@/shared/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/config')>();
  return {
    ...actual,
    env: new Proxy(actual.env, {
      get: (target, key) => {
        if (key === 'NEXT_PUBLIC_SENTRY_DSN') return flags.dsn;
        const value: unknown = Reflect.get(target, key);
        return value;
      },
    }),
  };
});

async function post(body: string, extra: Record<string, string> = {}) {
  vi.resetModules();
  const { POST } = await import('./route');
  const headers = { 'Content-Length': String(new TextEncoder().encode(body).length), ...extra };
  return POST(new Request('http://localhost/sentry-tunnel', { method: 'POST', body, headers }));
}

const envelope = (dsn: string) => `${JSON.stringify({ dsn })}\n{"type":"event"}\n{}`;

describe('POST /sentry-tunnel', () => {
  afterEach(() => {
    flags.dsn = undefined;
    vi.unstubAllGlobals();
  });

  it('is a 404 without a DSN (Sentry off)', async () => {
    expect((await post(envelope(DSN))).status).toBe(404);
  });

  it('refuses an envelope for another DSN, so it is no open relay', async () => {
    flags.dsn = DSN;
    expect((await post(envelope('https://other@o9.ingest.sentry.io/9'))).status).toBe(403);
  });

  it('forwards the event body only: no IP, user agent, client hints, origin or referer', async () => {
    flags.dsn = DSN;
    const fetchMock = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response('{}', { status: 200 })),
    );
    vi.stubGlobal('fetch', fetchMock);
    const response = await post(envelope(DSN), {
      'X-Forwarded-For': '203.0.113.7',
      'X-Vercel-Forwarded-For': '203.0.113.7',
      'User-Agent': 'Visitor/1.0',
      'Sec-CH-UA-Platform': '"macOS"',
      Origin: 'https://example.com',
      Referer: 'https://example.com/dashboard?market=de',
    });
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    const sent = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect([...sent.keys()]).toEqual(['content-type']);
  });

  it('refuses a body over 1 MiB', async () => {
    flags.dsn = DSN;
    vi.resetModules();
    const { POST } = await import('./route');
    const request = new Request('http://localhost/sentry-tunnel', {
      method: 'POST',
      body: 'x',
      headers: { 'Content-Length': String(2 * 1024 * 1024) },
    });
    expect((await POST(request)).status).toBe(413);
  });

  it('counts the bytes that arrive: a chunked body with no length over 1 MiB gets 413', async () => {
    flags.dsn = DSN;
    const fetchMock = vi.fn<typeof fetch>(() => Promise.resolve(new Response('{}')));
    vi.stubGlobal('fetch', fetchMock);
    vi.resetModules();
    const { POST } = await import('./route');
    const chunk = new Uint8Array(256 * 1024);
    let sent = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (sent >= 5) {
          controller.close();
          return;
        }
        sent += 1;
        controller.enqueue(chunk);
      },
    });
    // `duplex` is required by Node for a stream body; TypeScript's RequestInit lacks it.
    const init: RequestInit & { duplex: 'half' } = { method: 'POST', body, duplex: 'half' };
    const request = new Request('http://localhost/sentry-tunnel', init);
    expect((await POST(request)).status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
