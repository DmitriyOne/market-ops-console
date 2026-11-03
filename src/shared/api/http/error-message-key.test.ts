import { describe, expect, it } from 'vitest';

import { errorMessageKey } from './error-message-key';
import { AbortedError, HttpError, NetworkError, ParseError, TimeoutError } from './errors';

describe('errorMessageKey', () => {
  it('maps each API error to its message key', () => {
    expect(errorMessageKey(new TimeoutError())).toBe('errors.timeout');
    expect(errorMessageKey(new NetworkError())).toBe('errors.network');
    expect(errorMessageKey(new HttpError(404))).toBe('errors.server');
    expect(errorMessageKey(new HttpError(500))).toBe('errors.server');
    expect(errorMessageKey(new ParseError([]))).toBe('errors.invalidData');
    expect(errorMessageKey(new AbortedError())).toBe('errors.unknown');
  });

  it('falls back to errors.unknown for anything else', () => {
    expect(errorMessageKey(new Error('boom'))).toBe('errors.unknown');
    expect(errorMessageKey('boom')).toBe('errors.unknown');
  });
});
