// @vitest-environment node
import { deflateRawSync } from 'node:zlib';

import { describe, expect, it } from 'vitest';

import { decodeRules, encodeRules } from './cookie';
import { exampleRules } from './examples';

describe('alerts cookie', () => {
  it('round-trips a list', () => {
    const rules = exampleRules('en-GB');
    expect(decodeRules(encodeRules(rules))).toEqual(rules);
  });

  it('reads a missing, broken or invalid value as no list', () => {
    expect(decodeRules(undefined)).toBeNull();
    expect(decodeRules('%%%')).toBeNull();
    expect(decodeRules(deflateRawSync('{"rules":1}').toString('base64url'))).toBeNull();
  });

  it('ten full rules with long Cyrillic names fit in one cookie (under 4 KB)', () => {
    const marketIds = [
      'us',
      'ca',
      'de',
      'gb',
      'fr',
      'it',
      'es',
      'jp',
      'cn',
      'in',
      'au',
      'br',
      'mx',
    ];
    const [example] = exampleRules('en-GB');
    if (!example) throw new Error('no example rule');
    const rules = Array.from({ length: 10 }, (_, i) => ({
      ...example,
      id: crypto.randomUUID(),
      // Distinct two-byte names compress the least.
      name: `${String(i)} Правило с длинным названием на кириллице ${'жщфыв'.repeat(i + 1)}`.slice(
        0,
        60,
      ),
      scope: { kind: 'markets' as const, marketIds },
    }));
    expect(encodeRules(rules).length).toBeLessThan(4000);
  });
});
