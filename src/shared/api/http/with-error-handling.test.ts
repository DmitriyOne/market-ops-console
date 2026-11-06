// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DataIntegrityError, NotFoundError, ValidationError } from '@/shared/lib';

import { withErrorHandling } from './with-error-handling';

describe('withErrorHandling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the handler response untouched', async () => {
    const handler = withErrorHandling('/api/v1/x', () => Response.json({ ok: true }));
    const response = await handler();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it.each([
    [new ValidationError('question is required'), 400, 'invalid_request', 'question is required'],
    [new NotFoundError('alert', 'a1'), 404, 'not_found', 'alert not found'],
  ])('maps %o to its status and message without logging', async (error, status, code, message) => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const response = await withErrorHandling('/api/v1/x', () => {
      throw error;
    })();
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: { code, message } });
    expect(log).not.toHaveBeenCalled();
  });

  it('hides internal details of server faults and logs them', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const response = await withErrorHandling('/api/v1/x', () =>
      Promise.reject(new DataIntegrityError('series[3].marketId: Unknown market')),
    )();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: 'data_integrity', message: 'The server data is invalid.' },
    });
    expect(log).toHaveBeenCalledOnce();
  });

  it('turns an unexpected throw into 500 internal and logs it', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const response = await withErrorHandling('/api/v1/x', () => {
      throw new TypeError('x is undefined');
    })();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: 'internal', message: 'Something went wrong.' },
    });
    expect(log).toHaveBeenCalledOnce();
  });
});
