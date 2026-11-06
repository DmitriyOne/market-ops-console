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

async function post(body: string) {
  vi.resetModules();
  const { POST } = await import('./route');
  const headers = { 'Content-Length': String(new TextEncoder().encode(body).length) };
  return POST(new Request('http://localhost/sentry-tunnel', { method: 'POST', body, headers }));
}

const envelope = (dsn: string) => `${JSON.stringify({ dsn })}\n{"type":"event"}\n{}`;

describe('POST /sentry-tunnel', () => {
  afterEach(() => {
    flags.dsn = undefined;
  });

  it('is a 404 without a DSN (Sentry off)', async () => {
    expect((await post(envelope(DSN))).status).toBe(404);
  });

  it('refuses an envelope for another DSN, so it is no open relay', async () => {
    flags.dsn = DSN;
    expect((await post(envelope('https://other@o9.ingest.sentry.io/9'))).status).toBe(403);
  });
});
