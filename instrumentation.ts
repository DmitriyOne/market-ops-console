import * as Sentry from '@sentry/nextjs';

// Next runs this once per server runtime (ADR 0019). `process.env.NEXT_RUNTIME`
// is read directly, not through env.ts: Next replaces it at build time, so
// each runtime's bundle keeps only its own config.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') await import('./sentry.server.config');
  if (process.env.NEXT_RUNTIME === 'edge') await import('./sentry.edge.config');
}

// Errors in Server Components, route handlers and the proxy.
export const onRequestError = Sentry.captureRequestError;
