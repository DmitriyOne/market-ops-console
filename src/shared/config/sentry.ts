import type { BrowserOptions } from '@sentry/nextjs';

import { env } from './env';

type SentryInput = { dsn: string | undefined; environment: string };

export type SharedSentryOptions = Pick<
  BrowserOptions,
  'dsn' | 'enabled' | 'environment' | 'tracesSampleRate' | 'dataCollection' | 'ignoreErrors'
>;

/**
 * The options every Sentry runtime starts with (client, server, edge), so the
 * three init files cannot drift apart (ADR 0019).
 *
 * Off without a DSN (tests, E2E, CI). Errors and 10 % of traces in
 * production, every trace in development. Personal data is not collected:
 * no IP or user id, no cookies, no headers (`X-Forwarded-For`,
 * `Accept-Language`), no request or response bodies (a chat question is a
 * body), no local variables. Query parameters stay: they hold the dashboard
 * state (market ids, period, mode), which a bug report needs.
 */
export function sentryOptionsFor({ dsn, environment }: SentryInput): SharedSentryOptions {
  return {
    dsn,
    enabled: Boolean(dsn),
    environment,
    tracesSampleRate: environment === 'production' ? 0.1 : 1,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: true,
      stackFrameVariables: false,
      genAI: { inputs: false, outputs: false },
      mcp: { inputs: false, outputs: false },
    },
    // Browser noise, not a fault of the app.
    ignoreErrors: [/ResizeObserver loop/],
  };
}

export function sentryOptions(): SharedSentryOptions {
  return sentryOptionsFor({ dsn: env.NEXT_PUBLIC_SENTRY_DSN, environment: env.NODE_ENV });
}
