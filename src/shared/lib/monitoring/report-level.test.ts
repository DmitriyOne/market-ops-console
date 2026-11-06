import { describe, expect, it } from 'vitest';

import { NotFoundError, ValidationError } from '../errors/app-error';
import { reportLevel } from './report-level';

function named(name: string, extra: Record<string, unknown> = {}): Error {
  return Object.assign(new Error(name), { name }, extra);
}

describe('reportLevel', () => {
  it('skips expected 4xx answers of our API', () => {
    expect(reportLevel(new ValidationError('bad'))).toBe('skip');
    expect(reportLevel(new NotFoundError('alert', 'a1'))).toBe('skip');
  });

  it('skips a server error the browser only holds a copy of (digest)', () => {
    expect(reportLevel(Object.assign(new Error('render'), { digest: '123' }))).toBe('skip');
  });

  it('skips a user abort and the codes the user caused', () => {
    expect(reportLevel(named('AbortedError'))).toBe('skip');
    expect(reportLevel(named('HttpError', { status: 409, code: 'duplicate_name' }))).toBe('skip');
    expect(reportLevel(named('HttpError', { status: 422, code: 'too_many' }))).toBe('skip');
    expect(reportLevel(named('HttpError', { status: 404, code: 'not_found' }))).toBe('skip');
  });

  it('reports offline and timeouts as warnings', () => {
    expect(reportLevel(named('NetworkError'))).toBe('warning');
    expect(reportLevel(named('TimeoutError'))).toBe('warning');
  });

  it('reports a 400 our own form caused, a 5xx and anything unexpected as errors', () => {
    expect(reportLevel(named('HttpError', { status: 400, code: 'invalid_request' }))).toBe('error');
    expect(reportLevel(named('HttpError', { status: 500 }))).toBe('error');
    expect(reportLevel(named('ParseError'))).toBe('error');
    expect(reportLevel(new TypeError('x is undefined'))).toBe('error');
    expect(reportLevel('boom')).toBe('error');
  });
});
