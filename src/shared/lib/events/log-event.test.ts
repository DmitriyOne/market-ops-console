import { afterEach, describe, expect, it, vi } from 'vitest';

const sentry = vi.hoisted(() => ({ addBreadcrumb: vi.fn() }));
vi.mock('@sentry/nextjs', () => sentry);

const { logEvent } = await import('./log-event');

describe('logEvent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sentry.addBreadcrumb.mockReset();
  });

  it('logs a named product event with its data to the console', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    logEvent('answer_feedback', { rating: 'down', reason: 'wrongNumbers' });
    expect(info).toHaveBeenCalledWith('[event] answer_feedback', {
      rating: 'down',
      reason: 'wrongNumbers',
    });
  });

  it('leaves a Sentry breadcrumb for the next error', () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    logEvent('url_fixed', { params: ['market'] });
    expect(sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: 'event',
      level: 'info',
      message: 'url_fixed',
      data: { params: ['market'] },
    });
  });
});
