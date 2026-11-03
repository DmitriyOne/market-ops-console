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

  it('logs non-Error values too', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    logError('boom', { scope: 'ui' });
    expect(spy).toHaveBeenCalledWith('[ui]', { code: 'unknown', message: 'boom', error: 'boom' });
  });
});
