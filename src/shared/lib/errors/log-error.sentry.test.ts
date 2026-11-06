import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sentry = vi.hoisted(() => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));
vi.mock('@sentry/nextjs', () => sentry);

const { ValidationError } = await import('./app-error');
const { logError, logWarning } = await import('./log-error');

describe('logError and logWarning → Sentry', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    Object.values(sentry).forEach((fn) => fn.mockReset());
  });

  it('sends a fault with its scope and code as tags and the context as extra', () => {
    const error = new TypeError('x is undefined');
    logError(error, { scope: 'ui', componentStack: 'at Chart' });
    expect(sentry.captureException).toHaveBeenCalledWith(error, {
      level: 'error',
      tags: { scope: 'ui', code: 'TypeError' },
      extra: { componentStack: 'at Chart' },
    });
  });

  it('sends offline as a warning', () => {
    const error = Object.assign(new Error('offline'), { name: 'NetworkError' });
    logError(error, { scope: 'query' });
    expect(sentry.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ level: 'warning' }),
    );
  });

  it('keeps an expected answer as a breadcrumb only', () => {
    logError(new ValidationError('The rule is not valid.'), { scope: 'api' });
    expect(sentry.captureException).not.toHaveBeenCalled();
    expect(sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: 'api',
      level: 'info',
      message: 'The rule is not valid.',
      data: { code: 'invalid_request' },
    });
  });

  it('sends one error object once, wherever it is caught', () => {
    const error = new Error('query failed');
    logError(error, { scope: 'query' });
    logError(error, { scope: 'ui' });
    expect(sentry.captureException).toHaveBeenCalledOnce();
  });

  it('sends a warning message with its scope', () => {
    logWarning('alerts_cookie_unreadable', { scope: 'api', length: 12 });
    expect(sentry.captureMessage).toHaveBeenCalledWith('alerts_cookie_unreadable', {
      level: 'warning',
      tags: { scope: 'api' },
      extra: { length: 12 },
    });
  });
});
