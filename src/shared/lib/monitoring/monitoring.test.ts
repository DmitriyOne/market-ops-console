import { afterEach, describe, expect, it, vi } from 'vitest';

const span = vi.hoisted(() => ({ setAttributes: vi.fn(), setStatus: vi.fn(), end: vi.fn() }));
const sentry = vi.hoisted(() => ({
  setTags: vi.fn(),
  startInactiveSpan: vi.fn(() => span),
  startSpan: vi.fn((_options: unknown, work: () => unknown) => work()),
}));
vi.mock('@sentry/nextjs', () => sentry);

const { setMonitoringContext, startMonitoredSpan, traceSpan } = await import('./monitoring');

describe('monitoring helpers', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('sets the screen settings as tags', () => {
    const context = { locale: 'de-DE', mode: 'analyst', currency: 'EUR', section: 'overview' };
    setMonitoringContext(context);
    expect(sentry.setTags).toHaveBeenCalledWith(context);
  });

  it('starts a span, takes attributes and ends it with its outcome', () => {
    const monitored = startMonitoredSpan('chat.answer', 'ui.chat');
    expect(sentry.startInactiveSpan).toHaveBeenCalledWith({
      name: 'chat.answer',
      op: 'ui.chat',
    });
    monitored.set({ kind: 'answer' });
    expect(span.setAttributes).toHaveBeenCalledWith({ kind: 'answer' });
    expect(monitored.elapsed()).toBeGreaterThanOrEqual(0);
    monitored.end('error');
    expect(span.setStatus).toHaveBeenCalledWith({ code: 2 });
    expect(span.end).toHaveBeenCalledOnce();
  });

  it('runs work inside a span and returns its result', () => {
    expect(traceSpan('export.xlsx', 'ui.export', () => 42)).toBe(42);
    expect(sentry.startSpan).toHaveBeenCalledWith(
      { name: 'export.xlsx', op: 'ui.export' },
      expect.any(Function),
    );
  });
});
