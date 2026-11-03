import { afterEach, describe, expect, it, vi } from 'vitest';

import { NotFoundError } from './app-error';
import { logError } from './log-error';

describe('logError', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs one structured entry with context and the error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new NotFoundError('alert', 'a1');
    logError(error, { scope: 'api', route: '/api/v1/alerts' });
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith('[api]', {
      route: '/api/v1/alerts',
      code: 'not_found',
      message: 'alert not found',
      error,
    });
  });

  it('logs an error that is not an AppError with its name as code', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new Error('timed out');
    error.name = 'TimeoutError';
    logError(error, { scope: 'query' });
    expect(spy).toHaveBeenCalledWith('[query]', expect.objectContaining({ code: 'TimeoutError' }));
  });

  it('logs non-Error values too', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    logError('boom', { scope: 'ui' });
    expect(spy).toHaveBeenCalledWith('[ui]', { code: 'unknown', message: 'boom', error: 'boom' });
  });

  it('logs the same error object only once, wherever it is caught', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const error = new Error('query failed');
    logError(error, { scope: 'query' });
    logError(error, { scope: 'ui' });
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith('[query]', expect.objectContaining({ error }));
  });
});
