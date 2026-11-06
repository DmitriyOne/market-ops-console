// @vitest-environment node
import * as Sentry from '@sentry/nextjs';
import { afterAll, describe, expect, it } from 'vitest';

import { sentryOptionsFor } from './sentry';

type Captured = { request?: Record<string, unknown>; user?: unknown };
const events: Captured[] = [];

Sentry.init({
  ...sentryOptionsFor({ dsn: 'https://key@o1.ingest.us.sentry.io/2', environment: 'production' }),
  tracesSampleRate: 0,
  beforeSend(event) {
    events.push({ request: event.request ? { ...event.request } : undefined, user: event.user });
    return null;
  },
});

const PERSONAL = {
  cookie: 'mo-alerts=abc; NEXT_LOCALE=de-DE',
  'x-forwarded-for': '203.0.113.7',
  'user-agent': 'Visitor/1.0',
  referer: 'https://example.com/dashboard',
};

describe('server events with our options (ADR 0019)', () => {
  afterAll(async () => {
    await Sentry.close();
  });

  it('a request error carries the method and address only: no IP, cookies or headers', async () => {
    Sentry.captureRequestError(
      new Error('render failed'),
      { path: '/de-DE/dashboard?market=de', method: 'GET', headers: PERSONAL },
      {
        routerKind: 'App Router',
        routePath: '/[locale]/dashboard',
        routeType: 'render',
      },
    );
    await Sentry.flush(2000);
    const [event] = events;
    expect(event).toBeDefined();
    expect(event?.user).toBeUndefined();
    const text = JSON.stringify(event?.request ?? {});
    for (const value of Object.values(PERSONAL)) expect(text).not.toContain(value);
    expect(event?.request?.headers ?? {}).toEqual({});
    expect(event?.request?.cookies).toBeUndefined();
  });
});
