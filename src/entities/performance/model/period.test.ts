import { describe, expect, it } from 'vitest';

import { periodToDate } from './period';

describe('periodToDate', () => {
  it('is the first day of the month at UTC midnight', () => {
    expect(periodToDate('2026-05').toISOString()).toBe('2026-05-01T00:00:00.000Z');
  });
});
