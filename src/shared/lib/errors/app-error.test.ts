import { describe, expect, it } from 'vitest';

import { AppError, DataIntegrityError, NotFoundError, ValidationError } from './app-error';

describe('AppError family', () => {
  it('gives each error a stable code and HTTP status', () => {
    expect(new ValidationError('bad')).toMatchObject({ code: 'invalid_request', status: 400 });
    expect(new NotFoundError('alert', 'a1')).toMatchObject({
      code: 'not_found',
      status: 404,
      details: { resource: 'alert', id: 'a1' },
    });
    expect(new DataIntegrityError('broken')).toMatchObject({ code: 'data_integrity', status: 500 });
  });

  it('keeps the original error as cause', () => {
    const cause = new Error('zod said no');
    const error = new DataIntegrityError('data.json is invalid', { cause });
    expect(error.cause).toBe(cause);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('DataIntegrityError');
  });
});
