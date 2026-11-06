// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

const flags = vi.hoisted(() => ({ open: false }));
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  connection: () => Promise.resolve(),
}));
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
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

const { default: TestPage } = await import('./page');
const { default: ServerErrorPage } = await import('./server/page');

describe('/sentry-test routes', () => {
  it('are a 404 while the test page is closed', async () => {
    flags.open = false;
    await expect(TestPage()).rejects.toThrow('NOT_FOUND');
    await expect(ServerErrorPage()).rejects.toThrow('NOT_FOUND');
  });

  it('render the page, and the server page throws, when it is open', async () => {
    flags.open = true;
    await expect(TestPage()).resolves.toBeTruthy();
    await expect(ServerErrorPage()).rejects.toThrow('Sentry test: server render error');
  });
});
