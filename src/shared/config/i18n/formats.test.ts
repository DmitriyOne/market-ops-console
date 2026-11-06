import { createFormatter } from 'next-intl';
import { describe, expect, it } from 'vitest';

import type { Currency } from '../currency';
import { formats, formatsFor } from './formats';
import type { AppLocale } from './routing';

const normalise = (s: string) => s.replace(/\s/g, ' ');
const formatterFor = (locale: AppLocale) => createFormatter({ locale, formats });

describe('formats', () => {
  it.each<[AppLocale, string]>([
    ['en-GB', '$22.9m'],
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

  it.each<[AppLocale, string, number, string]>([
    ['en-GB', 'percent', 0.92, '92.0%'],
    ['en-GB', 'signedPercent', 0.02, '+2.0%'],
    ['de-DE', 'percent', 0.92, '92,0 %'],
  ])('%s %s keeps one decimal', (locale, format, value, expected) => {
    expect(
      normalise(
        formatterFor(locale).number(value, format === 'percent' ? 'percent' : 'signedPercent'),
      ),
    ).toBe(expected);
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

  it.each<[AppLocale, Currency, string]>([
    ['en-GB', 'USD', '$22.9m'],
    ['en-GB', 'EUR', '€22.9m'],
    ['en-GB', 'GBP', '£22.9m'],
    ['en-US', 'GBP', '£22.9M'],
    ['de-DE', 'EUR', '22,9 Mio. €'],
    ['de-DE', 'USD', '22,9 Mio. $'],
    ['ru-RU', 'GBP', '22,9 млн £'],
    ['ru-RU', 'USD', '22,9 млн $'],
  ])('compactCurrency in %s, %s: a bare symbol', (locale, currency, expected) => {
    const f = createFormatter({ locale, formats: formatsFor(currency) });
    expect(normalise(f.number(22850419, 'compactCurrency'))).toBe(expected);
  });

  it.each<[Currency, string]>([
    ['USD', '$1,234.50'],
    ['EUR', '€1,234.50'],
    ['GBP', '£1,234.50'],
  ])('currency in en-GB, %s', (currency, expected) => {
    const f = createFormatter({ locale: 'en-GB', formats: formatsFor(currency) });
    expect(f.number(1234.5, 'currency')).toBe(expected);
  });
});
