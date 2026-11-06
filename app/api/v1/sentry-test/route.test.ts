// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const flags = vi.hoisted(() => ({ open: false }));
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  connection: () => Promise.resolve(),
}));
vi.mock('@/shared/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/config')>();
  return {
    ...actual,
    env: new Proxy(actual.env, {
      get: (target, key) => {
        if (key === 'ENABLE_SENTRY_TEST_PAGE') return flags.open;
        const value: unknown = Reflect.get(target, key);
        return value;
      },
    }),
  };
});

const { GET } = await import('./route');

describe('GET /api/v1/sentry-test', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is a bare 404 while the test page is closed', async () => {
    flags.open = false;
    const response = await GET();
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('');
  });

  it('throws on the server and answers 500 when it is open', async () => {
    flags.open = true;
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const response = await GET();
    expect(response.status).toBe(500);
    expect(error).toHaveBeenCalledWith(
      '[api]',
      expect.objectContaining({ route: '/api/v1/sentry-test', message: 'Sentry test: API error' }),
    );
  });
});
