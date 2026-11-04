import { afterEach, describe, expect, it } from 'vitest';

import { applySection, SECTION_SCRIPT } from './section-script';

const section = () => document.documentElement.getAttribute('data-section');

describe('applySection (runs in <head> before the first paint)', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-section');
    window.history.replaceState(null, '', '/');
  });

  it('marks <html> when the link opens the assistant tab', () => {
    window.history.replaceState(null, '', '/dashboard?market=de&tab=assistant');
    applySection();
    expect(section()).toBe('assistant');
  });

  it('leaves Overview links alone', () => {
    window.history.replaceState(null, '', '/dashboard?tab=overview');
    applySection();
    expect(section()).toBeNull();
  });

  it('the inlined text is the same function, called', () => {
    expect(SECTION_SCRIPT).toContain('data-section');
    expect(SECTION_SCRIPT.endsWith(')()')).toBe(true);
  });
});
