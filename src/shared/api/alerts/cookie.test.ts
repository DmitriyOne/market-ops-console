// @vitest-environment node
import { deflateRawSync } from 'node:zlib';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { decodeRules, encodeRules } from './cookie';
import { exampleRules } from './examples';

describe('alerts cookie', () => {
  it('round-trips a list', () => {
    const rules = exampleRules('en-GB');
    expect(decodeRules(encodeRules(rules))).toEqual(rules);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads a missing, broken or invalid value as no list', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(decodeRules(undefined)).toBeNull();
    expect(decodeRules('%%%')).toBeNull();
    expect(decodeRules(deflateRawSync('{"rules":1}').toString('base64url'))).toBeNull();
  });

  it('warns when a cookie is there but unreadable (the rules are lost), not when it is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    decodeRules(undefined);
    expect(warn).not.toHaveBeenCalled();
    decodeRules('%%%');
    expect(warn).toHaveBeenCalledWith('[api]', 'alerts_cookie_unreadable', {
      reason: 'format',
      length: 3,
    });
    decodeRules(deflateRawSync('{"rules":1}').toString('base64url'));
    expect(warn).toHaveBeenLastCalledWith(
      '[api]',
      expect.any(String),
      expect.objectContaining({ reason: 'schema' }),
    );
    decodeRules('a'.repeat(5000));
    expect(warn).toHaveBeenLastCalledWith(
      '[api]',
      expect.any(String),
      expect.objectContaining({ reason: 'too_long' }),
    );
  });

  it('refuses a crafted value: too long, or inflating past the cap', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(decodeRules('a'.repeat(5000))).toBeNull();
    const bomb = deflateRawSync(`[${' '.repeat(1_000_000)}]`).toString('base64url');
    expect(bomb.length).toBeLessThan(4096);
    expect(decodeRules(bomb)).toBeNull();
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
