import { type BrowserOptions, consoleLoggingIntegration } from '@sentry/nextjs';

import { env } from './env';

type SentryInput = {
  dsn: string | undefined;
  /** Vercel's environment; undefined on this machine. */
  deployment: 'production' | 'preview' | 'development' | undefined;
  /** Send from this machine too (`NEXT_PUBLIC_SENTRY_LOCAL`). */
  local: boolean;
};

/** Where an event came from: Vercel's environment, or `local` for this machine (dev or a local build). */
export const LOCAL_ENVIRONMENT = 'local';

export type SharedSentryOptions = Pick<
  BrowserOptions,
  | 'dsn'
  | 'enabled'
  | 'environment'
  | 'tracesSampleRate'
  | 'dataCollection'
  | 'ignoreErrors'
  | 'integrations'
>;

/**
 * Sentry Logs (owner, 2026-11-06): every `console.log`, `console.warn` and
 * `console.error`, ours and libraries', as Sentry's own instructions set it
 * up. Anything printed to the console reaches Sentry: never print personal
 * data or the question text (ADR 0019).
 */
export const CONSOLE_LOG_LEVELS = ['log', 'warn', 'error'] as const;

/**
 * The options every Sentry runtime starts with (client, server, edge), so the
 * three init files cannot drift apart (ADR 0019).
 *
 * Off without a DSN (tests, CI), and on this machine unless
 * `NEXT_PUBLIC_SENTRY_LOCAL` is true (the test page, E2E). Errors and 10 % of
 * traces in production, every trace elsewhere. Personal data is not collected:
 * no IP or user id, no cookies, no headers (`X-Forwarded-For`,
 * `Accept-Language`), no request or response bodies (a chat question is a
 * body), no local variables. Query parameters stay: they hold the dashboard
 * state (market ids, period, mode), which a bug report needs. Console output
 * goes to Sentry Logs (`CONSOLE_LOG_LEVELS`).
 */
export function sentryOptionsFor({ dsn, deployment, local }: SentryInput): SharedSentryOptions {
  const environment = deployment ?? LOCAL_ENVIRONMENT;
  return {
    dsn,
    // On a Vercel deployment; on this machine only when asked: a DSN in
    // `.env.local` alone must not send `next dev` noise or a local build's
    // clicks, and a local build is never reported as production (owner, 2026-11-06).
    enabled: Boolean(dsn) && (deployment !== undefined || local),
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
    integrations: [consoleLoggingIntegration({ levels: [...CONSOLE_LOG_LEVELS] })],
  };
}

export function sentryOptions(): SharedSentryOptions {
  return sentryOptionsFor({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    deployment: env.NEXT_PUBLIC_VERCEL_ENV,
    local: env.NEXT_PUBLIC_SENTRY_LOCAL,
  });
}
