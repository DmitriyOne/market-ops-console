import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';

import de from './messages/de.json';
import en from './messages/en.json';
import ru from './messages/ru.json';

function flatten(value: unknown, prefix = ''): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return { [prefix]: value };
  return Object.entries(value).reduce<Record<string, unknown>>(
    (acc, [key, child]) => ({ ...acc, ...flatten(child, prefix ? `${prefix}.${key}` : key) }),
    {},
  );
}

describe('messages', () => {
  const enKeys = Object.keys(flatten(en)).sort();

  it.each([
    ['de', de],
    ['ru', ru],
  ])('%s has exactly the keys of en', (_name, messages) => {
    expect(Object.keys(flatten(messages)).sort()).toEqual(enKeys);
  });

  it.each([
    ['en', en],
    ['de', de],
    ['ru', ru],
  ])('%s has no empty strings', (_name, messages) => {
    for (const [key, value] of Object.entries(flatten(messages))) {
      expect(typeof value === 'string' && value.trim().length > 0, key).toBe(true);
    }
  });

  it.each([
    ['en-GB' as const, en, '1 of 2 markets needs attention', '1 of 2 markets in X needs attention'],
    ['de-DE' as const, de, '1 von 2 Märkten braucht', '1 von 2 Märkten in X braucht'],
    ['ru-RU' as const, ru, 'Внимания требует 1 из 2 рынков', 'Внимания требует 1 из 2 рынков региона X'],
  ])('%s: the attention lines agree with one market', (locale, messages, all, region) => {
    const t = createTranslator({ locale, messages, namespace: 'dataCheck' });
    expect(t('attention', { needAttention: 1, markets: 2, named: 0 })).toContain(all);
    expect(t('attentionRegion', { needAttention: 1, markets: 2, named: 0, region: 'X' })).toContain(
      region,
    );
  });
});
