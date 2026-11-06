import { describe, expect, it } from 'vitest';

import { CONSOLE_LOG_LEVELS, sentryOptionsFor } from './sentry';

const DSN = 'https://key@o1.ingest.us.sentry.io/2';

describe('sentryOptionsFor', () => {
  it('stays off without a DSN', () => {
    expect(sentryOptionsFor({ dsn: undefined, environment: 'production' }).enabled).toBe(false);
    expect(sentryOptionsFor({ dsn: DSN, environment: 'production' }).enabled).toBe(true);
  });

  it('samples 10 % of traces in production and all in development', () => {
    expect(sentryOptionsFor({ dsn: DSN, environment: 'production' }).tracesSampleRate).toBe(0.1);
    expect(sentryOptionsFor({ dsn: DSN, environment: 'development' }).tracesSampleRate).toBe(1);
  });

  it('collects no personal data, only the query parameters', () => {
    expect(sentryOptionsFor({ dsn: DSN, environment: 'production' }).dataCollection).toEqual({
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: true,
      stackFrameVariables: false,
      genAI: { inputs: false, outputs: false },
      mcp: { inputs: false, outputs: false },
    });
  });

  it('sends console.log, console.warn and console.error to Sentry Logs', () => {
    const { integrations } = sentryOptionsFor({ dsn: DSN, environment: 'production' });
    expect(Array.isArray(integrations) ? integrations.map((i) => i.name) : []).toEqual([
      'ConsoleLogs',
    ]);
    expect(CONSOLE_LOG_LEVELS).toEqual(['log', 'warn', 'error']);
  });
});
