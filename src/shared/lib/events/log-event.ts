import * as Sentry from '@sentry/nextjs';

/**
 * The single place product events (answer feedback, a repaired link, a 404)
 * are recorded: the console, and a Sentry breadcrumb, so an error that
 * follows shows the steps before it (ADR 0019). Never personal data or the
 * question text.
 */
export function logEvent(name: string, data: Record<string, unknown>): void {
  console.info(`[event] ${name}`, data);
  Sentry.addBreadcrumb({ category: 'event', level: 'info', message: name, data });
}
