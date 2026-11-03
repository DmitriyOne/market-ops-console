import { createFormatter } from 'next-intl';
import { describe, expect, it } from 'vitest';

import { formats } from './formats';
import type { AppLocale } from './routing';

const normalise = (s: string) => s.replace(/\s/g, ' ');
const formatterFor = (locale: AppLocale) => createFormatter({ locale, formats });

describe('formats', () => {
  it.each<[AppLocale, string]>([
    ['en-GB', 'US$22.9m'],
    ['en-US', '$22.9M'],
    ['de-DE', '22,9 Mio. $'],
    ['ru-RU', '22,9 млн $'],
  ])('compactCurrency in %s', (locale, expected) => {
    expect(normalise(formatterFor(locale).number(22850419, 'compactCurrency'))).toBe(expected);
  });

  it.each<[AppLocale, string]>([
    ['en-GB', '+7.3%'],
    ['de-DE', '+7,3 %'],
  ])('signedPercent in %s', (locale, expected) => {
    expect(normalise(formatterFor(locale).number(0.073, 'signedPercent'))).toBe(expected);
  });

  it.each<[AppLocale, string]>([
    ['en-GB', 'May 2026'],
    ['de-DE', 'Mai 2026'],
    ['ru-RU', 'май 2026 г.'],
  ])('period in %s', (locale, expected) => {
    expect(
      normalise(formatterFor(locale).dateTime(new Date('2026-05-01T00:00:00Z'), 'period')),
    ).toBe(expected);
  });
});
