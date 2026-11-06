import * as Sentry from '@sentry/nextjs';

/**
 * Tags every later Sentry event carries (ADR 0019). Settings only, never
 * personal data: they tell which screen a fault happened on.
 */
export type MonitoringContext = {
  locale: string;
  mode: string;
  currency: string;
  section: string;
};

export function setMonitoringContext(context: MonitoringContext): void {
  Sentry.setTags(context);
}

type SpanValue = string | number | boolean;

// Sentry's span status codes (OpenTelemetry's), not exported by @sentry/nextjs.
const SPAN_OK = 1;
const SPAN_ERROR = 2;

/** A timed step a user feels (a chat answer, an Excel export), ended by the caller. */
export type MonitoredSpan = {
  set(attributes: Record<string, SpanValue>): void;
  /** Milliseconds since the span started. */
  elapsed(): number;
  end(outcome?: 'ok' | 'error'): void;
};

/**
 * Starts a span that is not tied to one function: the caller sets
 * attributes as things happen (first token, kind) and ends it. A no-op
 * when Sentry is off.
 */
export function startMonitoredSpan(name: string, op: string): MonitoredSpan {
  const started = performance.now();
  const span = Sentry.startInactiveSpan({ name, op });
  return {
    set(attributes) {
      span.setAttributes(attributes);
    },
    elapsed: () => Math.round(performance.now() - started),
    end(outcome = 'ok') {
      span.setStatus({ code: outcome === 'ok' ? SPAN_OK : SPAN_ERROR });
      span.end();
    },
  };
}

/** Runs `work` inside a span (the test page's tracing check, the export). */
export function traceSpan<T>(name: string, op: string, work: () => T): T {
  return Sentry.startSpan({ name, op }, work);
}
