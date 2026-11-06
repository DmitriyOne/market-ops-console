import { describe, expect, it } from 'vitest';

import { dashboardPath, localeFromPath } from './locale-from-path';

describe('localeFromPath', () => {
  it.each([
    ['/ru-RU/dashboard', 'ru-RU'],
    ['/en-US/x', 'en-US'],
    ['/dashboard', 'en-GB'],
    ['/xx-YY/nope', 'en-GB'],
    ['/', 'en-GB'],
    [null, 'en-GB'],
  ] as const)('%s → %s', (path, locale) => {
    expect(localeFromPath(path)).toBe(locale);
  });
});

describe('dashboardPath', () => {
  it('leaves out the default locale, as the proxy does', () => {
    expect(dashboardPath('en-GB')).toBe('/dashboard');
    expect(dashboardPath('de-DE')).toBe('/de-DE/dashboard');
  });
});
