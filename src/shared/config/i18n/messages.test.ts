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
});
