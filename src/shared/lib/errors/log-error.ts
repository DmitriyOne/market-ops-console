import * as Sentry from '@sentry/nextjs';

import { reportLevel } from '../monitoring/report-level';
import { AppError } from './app-error';

export type LogContext = {
  scope: 'api' | 'ui' | 'query' | 'mutation' | 'chat';
  [key: string]: unknown;
};

// The same error can surface twice: a failed query is logged by the query
// cache and then thrown into an error boundary. Remember what was logged.
const logged = new WeakSet<object>();

function codeOf(error: unknown): string {
  if (error instanceof AppError) return error.code;
  return error instanceof Error ? error.name : 'unknown';
}

/**
 * The single place errors are logged (ADR 0013, 0019): the console, and
 * Sentry when it is on. `reportLevel` decides whether it is an issue
 * (`error`, `warning`) or only a breadcrumb for the next one (`skip`).
 * Each error object is logged once.
 */
export function logError(error: unknown, { scope, ...context }: LogContext): void {
  if (typeof error === 'object' && error !== null) {
    if (logged.has(error)) return;
    logged.add(error);
  }
  const code = codeOf(error);
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${scope}]`, { ...context, code, message, error });

  const level = reportLevel(error);
  if (level === 'skip') {
    Sentry.addBreadcrumb({ category: scope, level: 'info', message, data: { code } });
    return;
  }
  Sentry.captureException(error, { level, tags: { scope, code }, extra: context });
}

/**
 * Something went wrong without an exception to throw: data was dropped or
 * could not be kept (an unreadable cookie, a stored chat that fails its
 * schema). A Sentry message at level `warning`, and `console.warn`.
 * `message` is a stable snake_case code (`chat_dropped`), not a sentence:
 * Sentry groups issues by it, and the details go in the context.
 */
export function logWarning(message: string, { scope, ...context }: LogContext): void {
  console.warn(`[${scope}]`, message, context);
  Sentry.captureMessage(message, { level: 'warning', tags: { scope }, extra: context });
}
