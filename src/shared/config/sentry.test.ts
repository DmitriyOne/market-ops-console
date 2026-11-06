import { describe, expect, it } from 'vitest';

import { CONSOLE_LOG_LEVELS, LOCAL_ENVIRONMENT, sentryOptionsFor } from './sentry';

const DSN = 'https://key@o1.ingest.us.sentry.io/2';

describe('sentryOptionsFor', () => {
  it('stays off without a DSN', () => {
    expect(
      sentryOptionsFor({ dsn: undefined, deployment: 'production', local: true }).enabled,
    ).toBe(false);
    expect(sentryOptionsFor({ dsn: DSN, deployment: 'production', local: false }).enabled).toBe(
      true,
    );
  });

  it('on Vercel, tells production from preview', () => {
    expect(sentryOptionsFor({ dsn: DSN, deployment: 'production', local: false }).environment).toBe(
      'production',
    );
    const preview = sentryOptionsFor({ dsn: DSN, deployment: 'preview', local: false });
    expect(preview).toMatchObject({ enabled: true, environment: 'preview' });
  });

  it('on this machine, a DSN alone sends nothing; asked to, it sends as local, never production', () => {
    expect(sentryOptionsFor({ dsn: DSN, deployment: undefined, local: false }).enabled).toBe(false);
    expect(sentryOptionsFor({ dsn: DSN, deployment: undefined, local: true })).toMatchObject({
      enabled: true,
      environment: LOCAL_ENVIRONMENT,
    });
  });

  it('samples 10 % of traces in production and all elsewhere', () => {
    const rate = (deployment: 'production' | 'preview' | undefined) =>
      sentryOptionsFor({ dsn: DSN, deployment, local: true }).tracesSampleRate;
    expect(rate('production')).toBe(0.1);
    expect(rate('preview')).toBe(1);
    expect(rate(undefined)).toBe(1);
  });

  it('collects no personal data, only the query parameters', () => {
    expect(
      sentryOptionsFor({ dsn: DSN, deployment: 'production', local: false }).dataCollection,
    ).toEqual({
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
    const { integrations } = sentryOptionsFor({ dsn: DSN, deployment: 'production', local: false });
    expect(Array.isArray(integrations) ? integrations.map((i) => i.name) : []).toEqual([
      'ConsoleLogs',
    ]);
    expect(CONSOLE_LOG_LEVELS).toEqual(['log', 'warn', 'error']);
  });
});
