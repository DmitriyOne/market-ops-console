import { afterEach, describe, expect, it, vi } from 'vitest';

import { logEvent } from './log-event';

describe('logEvent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs a named product event with its data to the console', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    logEvent('answer_feedback', { rating: 'down', reason: 'wrongNumbers' });
    expect(info).toHaveBeenCalledWith('[event] answer_feedback', {
      rating: 'down',
      reason: 'wrongNumbers',
    });
  });
});
