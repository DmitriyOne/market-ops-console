import { afterEach, describe, expect, it } from 'vitest';

import { applyMode, MODE_SCRIPT } from './mode-script';

const mode = () => document.documentElement.getAttribute('data-mode');

describe('applyMode (runs in <head> before the first paint)', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-mode');
    window.history.replaceState(null, '', '/');
  });

  it('marks <html> for an Analyst link, so the skeletons take its shape', () => {
    window.history.replaceState(null, '', '/dashboard?region=eu&mode=analyst');
    applyMode();
    expect(mode()).toBe('analyst');
  });

  it('leaves Executive (default or written) and unknown values alone', () => {
    for (const search of ['', '?mode=executive', '?mode=boss']) {
      window.history.replaceState(null, '', `/dashboard${search}`);
      applyMode();
      expect(mode()).toBeNull();
    }
  });

  it('the inlined text is the same function, called', () => {
    expect(MODE_SCRIPT).toContain('data-mode');
    expect(MODE_SCRIPT.endsWith(')()')).toBe(true);
  });
});
